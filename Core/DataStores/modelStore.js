import { MeshStorage } from "./meshStore.js";
import { DataStorage } from "./Base/baseStore.js";
import { Address } from "../../FileSystem/address.js";

class Model {
    #meshId;
    #vertexShaderId;
    #materials;

    get meshId() { return this.#meshId; }
    get vertexShaderId() { return this.#vertexShaderId; }
    get materials() { return this.#materials; }

    setMeshId(value) {
        this.#meshId = value;
        const targetLength = MeshStorage.Get(value).requiredMaterialCount;
        if (this.#materials.length > targetLength) this.#materials.length = targetLength;
        else {
            while (this.#materials.length < targetLength) {
                this.#materials.push("defaultMaterial.mat");
            }
        }
    }
    setVertexShaderId(value) { this.#vertexShaderId = value; }
    setMaterials(value) { this.#materials = value; }

    constructor(meshId, vertexShaderId, listOfMaterials) {
        this.#meshId = meshId;
        this.#vertexShaderId = vertexShaderId;
        this.#materials = listOfMaterials;
    }
}

export class ModelStorage extends DataStorage {
    static storage = new Map();

    static Add(name, meshId, vertexShaderId, listOfMaterials) {
        meshId = Address.asInternal(meshId);
        listOfMaterials = listOfMaterials.map((matAddress) => Address.asInternal(matAddress));
        if (super.Exists(name)) {
            const model = super.Get(name);
            super.Add(name, new Model(
                meshId ?? model.meshId,
                vertexShaderId ?? model.vertexShaderId,
                listOfMaterials ?? model.listOfMaterials
            ));
        } else {
            if (meshId == null) { console.warn(`Model (${name}) declared without mesh. Aborting.`); return; }
            if (vertexShaderId == null) { console.warn(`Model (${name}) declared without vertex shader. Aborting.`); return; }
            if (listOfMaterials.length == 0) { console.warn(`Model (${name}) declared without materials. Aborting.`); return; }
            super.Add(name, new Model(meshId, vertexShaderId, listOfMaterials));
        }
    }

    static pack() {
        const payload = {}
        for (const key of super.keys()) {
            const model = super.Get(key);
            payload[key] = {
                meshId: model.meshId,
                materials: model.materials,
                vertexShaderId: model.vertexShaderId
            }
        }
        return payload;
    }

    static unpack(payload) {
        /*payload = {
            "Primitive_Cube_Textures/if1.jpg": {
                meshId: "3DModels/cube.glb",
                vertexShaderId: "Shaders/vertex.glsl",
                materials: [
                    "defaultMaterial"
                ]
            }
        }*/
        for (const modelName in payload) {
            const modelData = payload[modelName];
            this.Add(modelName, modelData.meshId, modelData.vertexShaderId, modelData.materials);
        }
    }
}