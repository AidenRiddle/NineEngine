import EditorScene from "../GameCore/Scene/editorScene.js";
import SceneUtils from "../GameCore/Scene/sceneUtils.js";
import { DataStorage } from "./Base/baseStore.js";

export class SceneStorage extends DataStorage {
    static storage = new Map();
    static #instance;

    /** @type {GraphicsEngine} */
    #ge;

    constructor(ge) {
        if (SceneStorage.#instance) throw new Error("Only one instance can be created.");
        super();
        SceneStorage.#instance = this;
        this.#ge = ge;
    }

    /**
     * @param {string} name
     * @param {EditorScene} scene
     */
    static Add(name, scene) {
        if (!(scene instanceof EditorScene)) { console.error("Parameter not of type EditorScene", scene); throw new Error(); };
        super.Add(name, scene);
    }

    static pack() {
        const payload = {}
        for (const key of super.keys()) {
            const scene = this.Get(key);
            payload[key] = scene.pack();
        }
        return payload;
    }

    static unpack = (payload) => {
        const promises = []
        for (const sceneName in payload) {
            const assets = SceneUtils.unpack(payload[sceneName].assets);
            this.Add(sceneName, new EditorScene(this.#instance.#ge, assets));
        }
        return Promise.all(promises);
    }
}