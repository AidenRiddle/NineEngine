import { Address } from "../../FileSystem/address.js";
import Resources from "../../FileSystem/resources.js";
import { Stash } from "../../settings.js";
import { MaterialBuilder, MaterialStorage } from "../DataStores/materialStore.js";
import { MeshStorage } from "../DataStores/meshStore.js";
import { ModelStorage } from "../DataStores/modelStore.js";
import { ProgramStorage } from "../DataStores/programStore.js";
import { SceneStorage } from "../DataStores/sceneStore.js";
import { ScriptStorage } from "../DataStores/scriptStore.js";
import { ShaderStorage } from "../DataStores/shaderStore.js";
import { ShaderGenerator } from "../GECore/shader.js";
import SceneUtils from "./Scene/sceneUtils.js";

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

    static get activeScene() { return this.#activeScene; }

    static #from(savedRunningInstance) {
        console.log(savedRunningInstance);

        this.#name = savedRunningInstance.name;
        this.#activeScene = savedRunningInstance.activeScene;
        this.#core = new Map(Object.entries(savedRunningInstance.core));
        this.#materials = savedRunningInstance.materials;
        this.#models = savedRunningInstance.models;
        this.#resources = new Map(Object.entries(savedRunningInstance.resources));

        this.#scenes = savedRunningInstance.scenes;
        for (const scene of Object.values(this.#scenes)) {
            for (const dependencyKey of Object.keys(scene.dependencies)) {
                scene.dependencies[dependencyKey] = new Set(scene.dependencies[dependencyKey]);
            }
        }
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
        if (!MeshStorage.Exists(modelPackage.meshId)) {
            promises.push(
                Resources.load(modelPackage.meshId)
                    .then(() => this.addResource(modelPackage.meshId, modelPackage.meshId))
            );
        }
        if (Array.isArray(modelPackage.materials)) {
            for (const matName of modelPackage.materials) {
                const matAddress = new Address(matName);
                if (this.#materials[matAddress.internal]) continue;
                let promise = Resources.fetchAsJson(matAddress.raw, { hardFetch: true })
                    .then((json) => this.putMaterial(matAddress, json));
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
                    return jsonFile.text().then((jsonString) => this.#from(JSON.parse(jsonString)));
                },
                () => {             // else
                    console.groupCollapsed("No running instance found. Cloning the default one ...");
                    return Resources.fetchAsJson(Stash.default_running_instance, { cacheResult: false, hardFetch: true })
                        .then((json) => {
                            this.#from(json);

                            this.#name = "The one running instance to rule them all";
                            this.saveAssets();
                        });
                }
            )
            .then(() => Resources.loadAll(this.#getListOfDependencies(this.#activeScene), { hardFetch: true }))
            .then(() => {
                console.groupEnd();

                const defaultVS = ShaderGenerator.vertex().useLightDirectional().generate();
                ShaderStorage.Add("defaultVS", false, defaultVS);

                const sceneName = this.#activeScene;
                const requiredPrograms = new Map();
                const requiredMaterials = new Map();
                const requiredModels = new Map();
                const requiredScenes = new Map();

                for (const matName of this.#scenes[sceneName].dependencies.materials) {
                    requiredMaterials.set(matName, this.#materials[matName]);
                }

                for (const modelName of this.#scenes[sceneName].dependencies.models) {
                    const model = this.#models[modelName];
                    requiredModels.set(modelName, model);
                    if (!requiredPrograms.has(model.vertexShaderId)) { requiredPrograms.set(model.vertexShaderId, new Set()); }
                    for (const materialId of model.materials) {
                        const mat = this.#materials[materialId];
                        requiredPrograms.get(model.vertexShaderId).add(mat.shaderId);
                    }
                }

                for (const [sceneName, scene] of Object.entries(this.#scenes)) {
                    requiredScenes.set(sceneName, scene);
                }

                return Promise.all([
                    MaterialStorage.unpack(Object.fromEntries(requiredMaterials)),
                    ModelStorage.unpack(Object.fromEntries(requiredModels)),
                    ProgramStorage.unpack(Object.fromEntries(requiredPrograms)),
                    SceneStorage.unpack(Object.fromEntries(requiredScenes)),
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
    static putMaterial(materialAddress, materialProperties) {
        return this.#solveMaterialDependencies(materialProperties)
            .then(() => {
                const materialName = materialAddress.internal;
                const mat = MaterialBuilder.buildFromParams(materialProperties);
                MaterialStorage.Add(materialName, mat);

                if (this.#materials[materialName] == null) this.#materials[materialName] = {};
                this.#materials[materialName].shaderId = mat.shaderId;
                this.#materials[materialName].uniformValueMap = mat.uniformValueMap;
                this.#materials[materialName].textures = mat.textures;

                this.#scenes[this.#activeScene].dependencies.materials.add(materialName);
                return this.saveAssets().then(() => this.#materials[materialName]);
            });
    }

    static deleteMaterial(materialName) {
        delete this.#materials[materialName];
    }

    //
    //  Model functions
    //
    static putModel(modelAddress, modelProperties) {
        return this.#solveModelDependencies(modelProperties)
            .then(() => {
                const modelName = modelAddress.internal;
                ModelStorage.Add(modelName, modelProperties.meshId, modelProperties.vertexShaderId, modelProperties.materials);

                const model = ModelStorage.Get(modelName);
                const vsId = model.vertexShaderId;

                for (const materialName of model.materials) {
                    const material = MaterialStorage.Get(materialName);
                    ProgramStorage.Add(vsId, material.shaderId);
                }

                if (this.#models[modelName] == null) this.#models[modelName] = {};
                this.#models[modelName].vertexShaderId = vsId;
                this.#models[modelName].meshId = model.meshId;
                this.#models[modelName].materials = model.materials;

                this.#scenes[this.#activeScene].dependencies.models.add(modelName);
                return this.saveAssets().then(() => this.#models[modelName]);
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
                this.#scenes[this.#activeScene].dependencies.scripts.add(scriptName);
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
    }

    static pack() {
        const packedScenes = structuredClone(this.#scenes);
        for (const scene of Object.values(packedScenes)) {
            for (const dependencyKey of Object.keys(scene.dependencies)) {
                scene.dependencies[dependencyKey] = Array.from(scene.dependencies[dependencyKey]);
            }
        }
        return {
            name: this.#name,
            activeScene: this.#activeScene,
            core: Object.fromEntries(this.#core),
            materials: this.#materials,
            models: this.#models,
            resources: Object.fromEntries(this.#resources),
            scenes: packedScenes,
        }
    }

    static saveAssets = () => {
        const pack = this.pack();
        const data = new File([JSON.stringify(pack)], this.#name);
        return this.#saveInDB(data);
    }

    static updateVersioning() {         // For dev work only.
        const materialStoragePack = MaterialStorage.pack();
        const modelStoragePack = ModelStorage.pack();

        Object.assign(this.#materials, materialStoragePack);
        Object.assign(this.#models, modelStoragePack);

        this.saveAssets();
    }

    static saveProject() {
        const scripts = Object.keys(ScriptStorage.pack());
        if (scripts.length == 0) this.#scenes[this.#activeScene].dependencies.scripts;

        this.#scenes[this.#activeScene] = {
            assets: SceneUtils.pack(SceneStorage.Get(this.#activeScene)),
            dependencies: {
                materials: Object.keys(MaterialStorage.pack()),
                models: Object.keys(ModelStorage.pack()),
                scripts: Object.keys(ScriptStorage.pack())
            }
        }
        return this.saveAssets();
    }
}