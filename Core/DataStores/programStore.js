import { Webgl } from "../../settings.js";
import Gpu from "../GECore/Gpu/gpu.js";
import { WebGLConstants } from "../GECore/Gpu/webGLConstants.js";
import { DataStorage } from "./Base/baseStore.js";
import { ShaderStorage } from "./shaderStore.js";

const attribSize = {
    [WebGLConstants.UNSIGNED_INT_VEC4]: 4,
    [WebGLConstants.FLOAT_VEC4]: 4,
    [WebGLConstants.FLOAT_VEC3]: 3,
    [WebGLConstants.FLOAT_VEC2]: 2,
}

const attribType = {}

class Program {
    constructor(glProgram, attributes, uniforms) {
        this.program = glProgram;
        this.attributes = attributes;
        this.uniforms = uniforms;
    }

    getAttributeInformation(attributeName) {
        return this.attributes.get(attributeName);
    }
}

export class ProgramStorage extends DataStorage {
    static storage = new Map();

    /** @type {Gpu} */
    static #gpu;
    static #reservedUniformNames = Object.values(Webgl.uniform);

    constructor(gpu) {
        super();
        ProgramStorage.#gpu = gpu;

        attribType[WebGLConstants.UNSIGNED_INT_VEC4] = Gpu.UVEC4;
        attribType[WebGLConstants.FLOAT_VEC4] = Gpu.FLOAT;
        attribType[WebGLConstants.FLOAT_VEC4] = Gpu.FLOAT;
        attribType[WebGLConstants.FLOAT_VEC3] = Gpu.FLOAT;
        attribType[WebGLConstants.FLOAT_VEC2] = Gpu.FLOAT;
    }

    static #createProgram(vsName, fsName) {
        const vs = ShaderStorage.Get(vsName);
        const fs = ShaderStorage.Get(fsName);

        if (vs == null) { throw new Error(`Undeclared Vertex Shader (${vsName}).`) }
        if (fs == null) { throw new Error(`Undeclared Fragment Shader (${fsName}).`) }

        return this.#gpu.createProgram(vs, fs);
    }

    static #mapAttributes(program) {
        const numAttr = this.#gpu.getTotalActiveAttributes(program);
        const attr = new Map();
        for (let i = 0; i < numAttr; i++) {
            const a = this.#gpu.getActiveAttributeInfo(program, i);
            const info = {
                location: i,
                size: attribSize[a.type],
                type: attribType[a.type],
                normalized: false,
                stride: 0,
                offset: 0
            }
            attr.set(a.name, info);
        }
        return attr;
    }

    static #mapUniforms(program) {
        const ruk = this.#reservedUniformNames;
        const numUni = this.#gpu.getTotalUniforms(program);
        const uni = new Map();
        for (let i = 0; i < numUni; i++) {
            const u = this.#gpu.getActiveUniformInfo(program, i);
            if (ruk.includes(u.name)) continue;
            uni.set(u.name, {
                location: this.#gpu.getUniformLocation(program, u.name),
                size: u.size,
                type: u.type
            });
        }
        return uni;
    }

    static Add(vsName, fsName) {
        if (this.storage.has(vsName)) {
            const fsMap = this.storage.get(vsName);
            if (fsMap.has(fsName)) return;

            const program = this.#createProgram(vsName, fsName);
            fsMap.set(fsName, new Program(program, this.#mapAttributes(program), this.#mapUniforms(program)));
        } else {
            const fsMap = new Map();

            const program = this.#createProgram(vsName, fsName);
            this.storage.set(vsName, fsMap);
            fsMap.set(fsName, new Program(program, this.#mapAttributes(program), this.#mapUniforms(program)));
        }
    }

    /** @returns {Program} */
    static Get(vsName, fsName) { return super.Get(vsName)?.get(fsName); }

    static unpack(payload) {
        /*payload = {
            "vertexShader.glsl": [
                "fragment1.glsl",
                "fragment2.glsl",
                "fragment3.glsl",
            ],
            "vertexShader2.glsl": [
                "fragment1.glsl",
                "fragment2.glsl",
                "fragment7.glsl",
            ]
        }*/

        for (const [vsName, fsList] of Object.entries(payload)) {
            for (const fsName of fsList) {
                this.Add(vsName, fsName);
            }
        }
    }
}