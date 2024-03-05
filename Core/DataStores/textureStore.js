import { TextureBuilder } from "../GECore/Gpu/Builders/textureBuilder.js";
import Gpu from "../GECore/Gpu/gpu.js";
import { DataStorage } from "./Base/baseStore.js";

class Texture {
    /** @type {WebGLTexture} */
    webGl;
    width;
    height;
    colorSpace;

    constructor(webGl, width, height, colorSpace) {
        this.webGl = webGl;
        this.width = width;
        this.height = height;
        this.colorSpace = colorSpace;

        Object.freeze(this);
    }
}

export class TextureStorage extends DataStorage {
    static storage = new Map();

    /** @type {TextureStorage} */
    static #instance;

    /** @type {Gpu} */
    #gpu;

    constructor(gpu) {
        if (TextureStorage.#instance) throw new Error("Only one instance can be created.");
        super();
        TextureStorage.#instance = this;
        this.#gpu = gpu;
    }

    static Add(name, textureData) {
        // if (this.Exists(name)) { console.log("Duplicate Texture:", name); return; }

        const gpuTexture = TextureBuilder.with(this.#instance.#gpu)
            .colorTexture()
            .build(textureData.width, textureData.height, textureData.data);

        const tex = new Texture(gpuTexture, textureData.width, textureData.height, textureData.colorSpace);
        super.Add(name, tex);
    }

    static pack() {
        const keys = [];
        for (const key of super.keys()) { keys.push(key); }
        return keys;
    }
}