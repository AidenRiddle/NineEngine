import { Address } from "../../FileSystem/address.js";
import { Webgl } from "../../settings.js";
import { DataStorage } from "./Base/baseStore.js";
import { ShaderStorage } from "./shaderStore.js";

export class Material {
    shaderId;
    uniformValueMap;
    textures;

    constructor(shaderId, uniformValueMap, textures) {
        this.shaderId = shaderId;
        this.uniformValueMap = uniformValueMap;
        this.textures = textures;

        Object.freeze(this);
    }
}

export class MaterialStorage extends DataStorage {
    static storage = new Map();

    /**
     * @param {string} name
     * @param {Material} material
     */
    static Add(name, material) {
        if (!(material instanceof Material)) { console.error("Parameter not of type Material", material); throw new Error(); };
        super.Add(name, material);
    }

    static pack() {
        const payload = {};
        for (const key of super.keys()) {
            const mat = super.Get(key);
            payload[key] = {
                shaderId: mat.shaderId,
                uniformValueMap: mat.uniformValueMap,
                textures: mat.textures
            }
        }
        return payload;
    }

    static unpack(payload) {
        /*payload = {
            "defaultMaterial": {
                shaderId: "Shaders/fragment.glsl",
                uniformValueMap: {
                    u_texture: 0
                },
                textures: [
                    "Textures/if1.jpg"
                ]
            }
        }*/
        for (const matName in payload) {
            this.Add(matName, MaterialBuilder.buildFromParams(payload[matName]));
        }
    }

    static isValid(json) {
        const k1 = Object.keys(Material.prototype).sort();
        const k2 = Object.keys(JSON.parse(json)).sort();

        for (let i = 0; i < k1.length; i++) {
            if (k1[i] != k2[i]) return false;
        }

        return true;
    }
}

export class MaterialBuilder {
    #shaderId;
    /** @type {Map} */
    #uniformValueMap;
    #textures;
    #expectedNumberOfTextures;

    #errorCheck() {
        if (!this.#shaderId) throw new Error("Error building Material: No shader given.");
        if (this.#textures.length != this.#expectedNumberOfTextures)
            throw new Error(`Error building Material: Expected (${this.#expectedNumberOfTextures}) textures, found (${this.#textures.length})`);
    }

    getRequiredUniforms() { return ShaderStorage.Get(this.#shaderId).uniforms; }

    static create() { return new MaterialBuilder(); }

    shader(shaderId) {
        shaderId = Address.asInternal(shaderId);

        let numOfTextures = 0;
        const uniformTypes = {
            "sampler2D": () => { numOfTextures++; return numOfTextures - 1; },
            "int": () => { return 0; },
            "float": () => { return 0; },
            "vec3": () => { return [0, 0, 0]; },
            "mat4": () => { return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; },
        }
        const shader = ShaderStorage.Get(shaderId);
        const uniformValueMap = new Map();

        for (const [key, value] of shader.uniforms.entries()) {
            const handler = uniformTypes[value];
            if (!handler) throw new Error("Unknown Type: " + value);
            uniformValueMap.set(key, handler());
        }

        this.#shaderId = shaderId;
        this.#uniformValueMap = uniformValueMap;
        this.#expectedNumberOfTextures = numOfTextures;
        this.#textures = [];
        return this;
    }

    uniform(uniformName, uniformValue) {
        if (!this.#uniformValueMap.has(uniformName)) return // throw new Error(`Invalid parameters: Uniform (${uniformName}) doesn't exist.`);
        if (typeof uniformValue == "string") {    // Lazy way to identify if uniform value is pointing to a texture
            this.#uniformValueMap.set(uniformName, this.#textures.length);
            this.addTexture(uniformValue);
        } else {
            this.#uniformValueMap.set(uniformName, uniformValue);
        }
        return this;
    }

    addTexture(textureAddress) {
        const cleansed = Address.asInternal(textureAddress);
        this.#textures.push(cleansed);
        return this;
    }

    useDepthTexture() {
        this.#textures.push("__depthTexture__");
    }

    build() {
        for (let i = this.#textures.length; i < this.#expectedNumberOfTextures; i++) { this.#textures.push("error_cors.png"); }
        if (this.#textures.length > this.#expectedNumberOfTextures) this.#textures.length = this.#expectedNumberOfTextures;
        this.#errorCheck();
        return new Material(
            this.#shaderId,
            Object.fromEntries(this.#uniformValueMap),
            Array.from(this.#textures)
        )
    }

    static buildDefault() {
        const defaultShader = "Shaders/fragment.glsl";
        const defaultTexture = "Textures/if1.jpg";
        return this.create()
            .shader(defaultShader)
            .addTexture(defaultTexture)
            .build();
    }

    static buildFromParams(params) {
        console.log(params);
        const mb = this.create();
        const builderParams = {
            "shaderId": (shaderId) => { mb.shader(shaderId); },
            "uniformValueMap": (uniformValueMap) => {
                for (const key in uniformValueMap) { mb.uniform(key, uniformValueMap[key]) };
            },
            "textures": (textureList) => {
                if (!Array.isArray(textureList)) throw new Error(`Invalid parameters: Invalid list of textures`);
                for (const tex of textureList) { mb.addTexture(tex); };
            },
        }

        for (const key in params) {
            if (!builderParams[key]) throw new Error(`Invalid parameters: Unknown parameter (${key})`);
            builderParams[key](params[key]);
        }
        return mb.build();
    }
}