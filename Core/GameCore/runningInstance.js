import Resources from "../../FileSystem/resources.js";
import { Stash } from "../../settings.js";
import { MaterialBuilder, MaterialStorage } from "../DataStores/materialStore.js";
import { ModelStorage } from "../DataStores/modelStore.js";
import { ProgramStorage } from "../DataStores/programStore.js";
import { SceneStorage } from "../DataStores/sceneStore.js";
import { ScriptStorage } from "../DataStores/scriptStore.js";
import { ShaderStorage } from "../DataStores/shaderStore.js";
import { ShaderGenerator } from "../GECore/shader.js";

export class RunningInstance {
    static #name;
    static #activeScene;
    static #core;
    static #materials;
    static #models;
    static #resources;
    static #scenes;

    static #getLastSavedRI = function () { };
    static #saveInDB = function () { };
    static #savePromise = null;

    static get activeScene() { return this.#activeScene; }

    static #from(jsonString) {
        const savedRunningInstance = JSON.parse(jsonString);
        console.log(savedRunningInstance);

        this.#name = savedRunningInstance.name;
        this.#activeScene = savedRunningInstance.activeScene;
        this.#core = new Map(Object.entries(savedRunningInstance.core));
        this.#materials = savedRunningInstance.materials;
        this.#models = savedRunningInstance.models;
        this.#resources = new Map(Object.entries(savedRunningInstance.resources));
        this.#scenes = savedRunningInstance.scenes;
    }

    static #getListOfDependencies(sceneName) {
        // We use a Set here so we can filter out duplicates.
        const dependencies = new Set();
        for (const modelId of this.#scenes[sceneName].dependencies.models) {
            dependencies.add(this.#models[modelId].meshId);
        }
        for (const matId of this.#scenes[sceneName].dependencies.materials) {
            dependencies.add(this.#materials[matId].shaderId);
            for (const value of Object.values(this.#materials[matId].textures)) {
                if (typeof value != 'string') continue;
                dependencies.add(value);
            }
        }

        const fileMap = new Map(this.#core);
        for (const fileName of dependencies) {
            if (fileMap.has(fileName)) continue;
            if (!this.#resources.has(fileName)) throw new Error("Undeclared resource (" + fileName + ") found.");
            fileMap.set(fileName, this.#resources.get(fileName));
        }
        return fileMap;
    }

    static #solveMaterialDependencies(materialPackage) {
        const promises = [];
        console.log(materialPackage);
        promises.push(
            Resources.load(materialPackage.shaderId)
                .then(() => this.addResource(materialPackage.shaderId, materialPackage.shaderId))
        );
        materialPackage.textures.forEach(element => {
            promises.push(
                Resources.load(element)
                    .then(() => this.addResource(element, element))
            );
        });
        //if (Array.isArray(materialPackage.textures)) promises.push(Resources.loadAll(materialPackage.textures));
        return Promise.all(promises);
    }

    static #solveModelDependencies(modelPackage) {
        const promises = [];
                promises.push(
            Resources.load(modelPackage.meshId)
                .then(() => this.addResource(modelPackage.meshId, modelPackage.meshId))
        );
        if (Array.isArray(modelPackage.materials)) {
            for (const matName of modelPackage.materials) {
                if (this.#materials[matName]) continue;
                let promise = Resources.fetchAsText(matName, { hardFetch: true })
                                        .then((jsonString) => this.putMaterial(matName, JSON.parse(jsonString)));
                promises.push(promise);
            }
        }
        return Promise.all(promises);
    }

    static initialize(getFromDB, storeToDB) {
        this.#getLastSavedRI = getFromDB;
        this.#saveInDB = storeToDB;

        return this.#getLastSavedRI()
            .then(
                (jsonFile) => {     // If a running instance is found
                    console.groupCollapsed("Found a running instance. Unpacking ...");
                    return new Promise((resolve) => {
                        const fileReader = new FileReader();
                        fileReader.onloadend = (e) => { resolve(e.target.result); }
                        fileReader.readAsText(jsonFile);
                    }).then((jsonString) => this.#from(jsonString));
                },
                () => {             // else
                    console.groupCollapsed("No running instance found. Cloning the default one ...");
                    return Resources.fetchAsText(Stash.default_running_instance, { cacheResult: false, hardFetch: true })
                        .then((jsonString) => this.#from(jsonString));
                }
            )
            .then(() => Resources.loadAll(this.#getListOfDependencies(this.#activeScene)))
            .then(() => {
                console.groupEnd();

                const defaultVS = ShaderGenerator.vertex().useLightDirectional().generate();
                ShaderStorage.Add("defaultVS", false, defaultVS);

                const sceneName = this.#activeScene;
                const programs = new Map();

                const requiredMaterials = {};
                for (const matName of this.#scenes[sceneName].dependencies.materials) {
                    requiredMaterials[matName] = this.#materials[matName];
                }
                const requiredModels = {};
                for (const modelName of this.#scenes[sceneName].dependencies.models) {
                    const model = this.#models[modelName];
                    requiredModels[modelName] = model;
                    if (!programs.has(model.vertexShaderId)) { programs.set(model.vertexShaderId, new Set()); }
                    for (const materialId of model.materials) {
                        const mat = this.#materials[materialId];
                        programs.get(model.vertexShaderId).add(mat.shaderId);
                    }
                }
                const requiredScenes = {};
                requiredScenes[sceneName] = this.#scenes[sceneName];

                const requiredPrograms = Object.fromEntries(programs);

                return Promise.all([
                    MaterialStorage.unpack(requiredMaterials),
                    ModelStorage.unpack(requiredModels),
                    ProgramStorage.unpack(requiredPrograms),
                    SceneStorage.unpack(requiredScenes),
                ])
            })
    }

    static getUrlOf(localPath) {
        return this.#core.get(localPath) ?? this.#resources.get(localPath);
    }

    static getScriptDependencies() {
        const fileMap = new Map();
        for (const [fileRelativePath, fetchPath] of this.#core.entries()) {
            if (!fileRelativePath.endsWith(".ts")) continue;
            fileMap.set(fileRelativePath, fetchPath);
        }
        for (const scriptFileName of this.#scenes[this.#activeScene].dependencies.scripts) {
            fileMap.set(scriptFileName, this.#resources.get(scriptFileName) ?? this.#core.get(scriptFileName));
        }
        return fileMap;
    }

    static setName(value) {
        this.#name = value;
    }

    static setActiveScene(value) {
        this.#activeScene = value;
    }

    //
    //  Material functions
    //
    static putMaterial(materialName, materialProperties) {
        return this.#solveMaterialDependencies(materialProperties)
            .then(() => {
                const mat = MaterialBuilder.buildFromParams(materialProperties);
                MaterialStorage.Add(materialName, mat);

                if (this.#materials[materialName] == null) this.#materials[materialName] = {};
                this.#materials[materialName].shaderId = mat.shaderId;
                this.#materials[materialName].uniformValueMap = mat.uniformValueMap;
                this.#materials[materialName].textures = mat.textures;
                return this.quietSave().then(() => this.#materials[materialName]);
            });
    }

    static deleteMaterial(materialName) {
        delete this.#materials[materialName];
    }

    //
    //  Model functions
    //
    static putModel(modelName, modelProperties) {
        return this.#solveModelDependencies(modelProperties)
            .then(() => {
                ModelStorage.Add(modelName, modelProperties.meshId, modelProperties.vertexShaderId, modelProperties.materials);
                const model = ModelStorage.Get(modelName);

                if (this.#models[modelName] == null) this.#models[modelName] = {};
                this.#models[modelName].vertexShaderId = model.vertexShaderId;
                this.#models[modelName].meshId = model.meshId;
                this.#models[modelName].materials = model.materials;
                return this.quietSave().then(() => this.#models[modelName]);
            });
    }

    static deleteModel(modelName) {
        delete this.#models[modelName];
    }

    //
    //  Script functions
    //
    static putScript(scriptName) {
        return Promise.resolve()
            .then(() => {
                const scripts = this.#scenes[this.#activeScene].dependencies.scripts;
                if (!scripts.includes(scriptName)) scripts.push(scriptName);
                this.addResource(scriptName, scriptName);
            });
    }

    static deleteScript(scriptName) {
        delete this.#models[scriptName];
    }

    //
    //  Resource functions
    //
    static addResource(name, url) {
        this.#resources.set(name, url);
    }

    static deleteResource(name) {
        this.#resources.delete(name);
    }

    //
    //  Scene functions
    //
    static addScene(sceneName, sceneProperties) {
        if (this.#scenes[sceneName]) throw new Error("Scene (" + sceneName + ") already in use.");
        this.#scenes[sceneName] = sceneProperties;
    }

    static updateScene(sceneName, sceneProperties) {
        if (!this.#scenes[sceneName]) throw new Error("Scene (" + sceneName + ") does not exist.");
        this.#scenes[sceneName].assets = sceneProperties;
    }

    static deleteScene(sceneName) {
        delete this.#scenes[sceneName];
    }

    static updateSceneObject(id, posX, posY, posZ, rotX, rotY, rotZ, scaleX, scaleY, scaleZ) {
        const so = this.#scenes[this.#activeScene].assets.sceneObjects.find(el => el.id == id);

        const pos = so.transform.position;
        pos.x = posX;
        pos.y = posY;
        pos.z = posZ;

        const rot = so.transform.rotation;
        rot.x = rotX;
        rot.y = rotY;
        rot.z = rotZ;

        const scale = so.transform.scale;
        scale.x = scaleX;
        scale.y = scaleY;
        scale.z = scaleZ;

        console.log(this.pack());
    }

    static pack() {
        return {
            name: this.#name,
            activeScene: this.#activeScene,
            core: Object.fromEntries(this.#core),
            materials: this.#materials,
            models: this.#models,
            resources: Object.fromEntries(this.#resources),
            scenes: this.#scenes,
        }
    }

    static quietSave = () => {
        const pack = this.pack();
        const data = new File([JSON.stringify(pack)], this.#name);
        return Promise.resolve();
        // return this.#saveInDB(data);
    }

    static updateVersioning() {         // For dev work only.
        const materialStoragePack = MaterialStorage.pack();
        const modelStoragePack = ModelStorage.pack();

        Object.assign(this.#materials, materialStoragePack);
        Object.assign(this.#models, modelStoragePack);

        this.quietSave();
    }

    static save() {
        this.#scenes[this.#activeScene] = {
            assets: SceneStorage.Get(this.#activeScene).pack(),
            dependencies: {
                materials: Object.keys(MaterialStorage.pack()),
                models: Object.keys(ModelStorage.pack()),
                scripts: ScriptStorage.pack()
            }
        }
        return this.quietSave();
    }
}