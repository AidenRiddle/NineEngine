import { Webgl } from "../../settings.js";
import { AscScriptUtil } from "../GECore/Util/ascScriptUtil.js";
import Gpu from "../GECore/Gpu/gpu.js";
import { DataStorage } from "./Base/baseStore.js";

export class ShaderStorage extends DataStorage {
    static storage = new Map();

    /** @type {Gpu} */
    static #gpu;
    static #reservedUniformNames = Object.values(Webgl.uniform);

    constructor(gpu) {
        super();
        ShaderStorage.#gpu = gpu;
    }

    static #getUniforms(shaderAsString) {
        const result = new Map();
        const iterable = AscScriptUtil.textToTokenStream(shaderAsString);
        for (const token of iterable) {
            if (token == "uniform") {
                const type = iterable.next().value;
                const name = iterable.next().value;
                if (this.#reservedUniformNames.includes(name)) continue;
                result.set(name, type);
            }
        }
        return result;
    }

    static Add(name, isFragment, shaderAsString) {
        if (this.Exists(name)) return;

        const shaderType = isFragment ? Gpu.FRAGMENT_SHADER : Gpu.VERTEX_SHADER;
        const shader = this.#gpu.compileShader(shaderType, shaderAsString);
        shader.uniforms = this.#getUniforms(shaderAsString);
        super.Add(name, shader);
    }

    static pack() {
        return super.keys();
    }
}