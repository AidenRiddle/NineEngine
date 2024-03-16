import { Address } from "../../FileSystem/address.js";
import GEInstanceDB from "../../FileSystem/geInstanceDB.js";
import Resources from "../../FileSystem/resources.js";
import { AssetType, Stash } from "../../settings.js";
import { MaterialBuilder, MaterialStorage } from "../DataStores/materialStore.js";
import { MeshStorage } from "../DataStores/meshStore.js";
import { ModelStorage } from "../DataStores/modelStore.js";
import { ProgramStorage } from "../DataStores/programStore.js";
import { SceneStorage } from "../DataStores/sceneStore.js";
import { ScriptStorage } from "../DataStores/scriptStore.js";
import { ShaderStorage } from "../DataStores/shaderStore.js";
import { TextureStorage } from "../DataStores/textureStore.js";
import { ShaderGenerator } from "../GECore/shader.js";
import { Scene } from "./Scene/scene.js";
import SceneUtils from "./Scene/sceneUtils.js";

export class RunningInstance {
    static #name;
    static #activeScene;
    static #core;
    static #materials;
    static #models;
    static #resources;
    static #scenes;

    /** @type {GEInstanceDB} */
    static #idb;

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

    static #solveResource(path) {
        return Resources.load(path)
            .then(() => this.addResource(path, path));
    }

    static #solveMaterialDependencies(materialPackage) {
        return this.#solveResource(materialPackage.shaderId)
            .then(() => Promise.all(materialPackage.textures.map(e => this.#solveResource(e))));
    }

    static #solveModelDependencies(modelPackage) {
        const promises = modelPackage.materials.map((matName) => {
            const matAddress = new Address(matName);
            if (this.#materials[matAddress.internal] == null) {
                return this.putMaterial(matAddress);
            }
        });
        return this.#solveResource(modelPackage.meshId)
            .then(() => Promise.all(promises));
    }

    static #emptyStorages() {
        MaterialStorage.clear();
        MeshStorage.clear();
        ModelStorage.clear();
        ProgramStorage.clear();
        ScriptStorage.clear();
        ShaderStorage.clear();
        TextureStorage.clear();
    }

    static async initialize(idb) {
        this.#idb = idb;

        try {
            const { value: lastOpenedInstance } = await this.#idb.get("userConfiguration", "lastOpenedInstance");
            await this.openSavedInstance(lastOpenedInstance)
                .catch((e) => console.error(e));
        } catch (e) {
            console.log("No running instance found.");
            const name = "The one running instance to rule them all";
            await this.createNewDefaultInstance(name);
            await this.openSavedInstance(name);
        }
    }

    static async createNewDefaultInstance(name) {
        console.groupCollapsed(`Creating new running instance (${name}). Cloning the default one ...`);
        const json = await Resources.fetchAsJson(Stash.default_running_instance, { cacheResult: false, hardFetch: true });
        json.name = name;

        this.#from(json);
        this.saveAssets();
        console.groupEnd();
    }

    static async openSavedInstance(name) {
        const jsonFile = await this.#idb.get("runningInstances", name);

        console.groupCollapsed(`Opening Instance (${name}). Unpacking ...`);

        const jsonString = await jsonFile.text();
        this.#from(JSON.parse(jsonString));
        await this.#idb.store("userConfiguration", { name: "lastOpenedInstance", value: name });
        await this.openScene(this.#activeScene);

        console.groupEnd();
    }

    static async openScene(sceneName) {
        this.#emptyStorages();
        const dependencies = this.#getListOfDependencies(sceneName);
        await Resources.loadAll(dependencies, { hardFetch: true });

        const defaultVS = ShaderGenerator.vertex().useLightDirectional().generate();
        ShaderStorage.Add("default_vertex_shader.glsl", false, defaultVS);

        const requiredMaterials = Array.from(this.#scenes[sceneName].dependencies.materials)
            .reduce((map, matName) => map.set(matName, this.#materials[matName]), new Map());

        const requiredPrograms = new Map();
        const requiredModels = new Map();
        for (const modelName of this.#scenes[sceneName].dependencies.models) {
            const model = this.#models[modelName];
            requiredModels.set(modelName, model);
            if (!requiredPrograms.has(model.vertexShaderId)) { requiredPrograms.set(model.vertexShaderId, new Set()); }
            for (const materialId of model.materials) {
                const mat = this.#materials[materialId];
                requiredPrograms.get(model.vertexShaderId).add(mat.shaderId);
            }
        }

        MaterialStorage.unpack(Object.fromEntries(requiredMaterials));
        ModelStorage.unpack(Object.fromEntries(requiredModels));
        ProgramStorage.unpack(Object.fromEntries(requiredPrograms));

        this.#activeScene = sceneName;
        SceneStorage.unpack({ [this.#activeScene]: this.#scenes[this.#activeScene] });
        Scene.changeScene(sceneName);
    }

    static getUrlOf(localPath) {
        return this.#core.get(localPath) ?? this.#resources.get(localPath);
    }

    static getScriptDependencies() {
        const fileMap = new Map();
        for (const [fileRelativePath, fetchPath] of this.#core.entries()) {
            if (!AssetType.isScript(fileRelativePath)) continue;
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
    /** @param {Address} materialAddress */
    static async putMaterial(materialAddress) {
        const materialProperties = await Resources.fetchAsJson(materialAddress.raw, { hardFetch: true });
        await this.#solveMaterialDependencies(materialProperties);

        const materialName = materialAddress.internal;
        const mat = MaterialBuilder.buildFromParams(materialProperties);
        MaterialStorage.Add(materialName, mat);

        Object.assign(this.#materials, {
            [materialName]: {
                shaderId: mat.shaderId,
                uniformValueMap: mat.uniformValueMap,
                textures: mat.textures,
            }
        });

        this.#scenes[this.#activeScene].dependencies.materials.add(materialName);
        await this.saveAssets();

        return this.#materials[materialName];
    }

    static deleteMaterial(materialName) {
        delete this.#materials[materialName];
    }

    //
    //  Model functions
    //
    static async putModel(modelAddress) {
        const modelProperties = await Resources.fetchAsJson(materialAddress.raw, { hardFetch: true });
        await this.#solveModelDependencies(modelProperties);

        const modelName = modelAddress.internal;
        ModelStorage.Add(modelName, modelProperties.meshId, modelProperties.vertexShaderId, modelProperties.materials);

        const model = ModelStorage.Get(modelName);
        for (const materialName of model.materials) {
            const material = MaterialStorage.Get(materialName);
            ProgramStorage.Add(model.vertexShaderId, material.shaderId);
        }

        Object.assign(this.#models, {
            [modelName]: {
                vertexShaderId: model.vertexShaderId,
                meshId: model.meshId,
                materials: model.materials,
            }
        });

        this.#scenes[this.#activeScene].dependencies.models.add(modelName);
        await this.saveAssets()

        return this.#models[modelName];
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

    static putScene(sceneName, sceneProperties) {
        this.#scenes[sceneName] = sceneProperties;
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
        return this.#idb.store("runningInstances", data);
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