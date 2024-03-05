import { Address } from "../../FileSystem/address.js";
import { Armature, MeshStorage } from "../DataStores/meshStore.js";
import { ModelStorage } from "../DataStores/modelStore.js";
import { Transform } from "./Components/transform.js";

export default class SceneObject {
    static #idList = new Set();
    static #generateId() {
        const base = 36;    // 10 digits + 26 letters
        const idLength = 4;
        const maxRange = Math.pow(base, idLength) - 1;
        const prefix = 's';
        function randomizer() { return prefix + (~~(Math.random() * maxRange)).toString(base); };
        let id = randomizer();
        while (SceneObject.#idList.has(id)) {
            console.warn("LOL got a duplicate id. NAH LIL BRO AIN'T NO WAY :", id);
            id = randomizer();
        }
        SceneObject.#idList.add(id);
        return id;
    }

    #id;
    #name;
    #transform = new Transform(this);
    #modelId;
    #armature;
    #components = [];

    isDynamic = true;

    get id() { return this.#id; }
    get name() { return this.#name; }
    get transform() { return this.#transform; }
    get modelId() { return this.#modelId; }
    get components() { return this.#components; }
    get armature() { return this.#armature; }

    set name(value) { this.#name = value; }
    set modelId(value) { this.#modelId = value; }

    constructor(modelId, name, id = undefined) {
        if (id) {
            // if (SceneObject.#idList.has(id)) { console.log(id, SceneObject.#idList); throw new Error("SceneObject ID already in use"); }
            this.#id = id;
            SceneObject.#idList.add(id);
        }
        else this.#id = SceneObject.#generateId();

        modelId = Address.asInternal(modelId);

        this.#modelId = modelId;
        this.#name = name;

        const mesh = MeshStorage.Get(ModelStorage.Get(modelId).meshId);
        if (mesh.requiredJointCount > 0) {
            this.#armature = new Armature(this, mesh.jointRoot, mesh.joints, mesh.jointIndices, mesh.inverseBindMatrices);
        }
    }

    addComponent(component) {
        this.#components.push(component);
    }
}