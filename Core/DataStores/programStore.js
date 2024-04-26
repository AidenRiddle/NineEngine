import { Address } from "../../FileSystem/address.js";
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
    constructor(glProgram, attributes, uniforms, reservedUniforms) {
        this.program = glProgram;
        this.attributes = attributes;
        this.uniforms = uniforms;
        this.reservedUniforms = reservedUniforms;
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
        const numUni = this.#gpu.getTotalUniforms(program);
        const ruk = new Map();
        const uni = new Map();
        for (let i = 0; i < numUni; i++) {
            const uniformMeta = this.#gpu.getActiveUniformInfo(program, i);
            const uniform = {
                location: this.#gpu.getUniformLocation(program, uniformMeta.name),
                size: uniformMeta.size,
                type: uniformMeta.type
            };
            if (this.#reservedUniformNames.includes(uniformMeta.name)) {
                ruk.set(uniformMeta.name, uniform);
            } else {
                uni.set(uniformMeta.name, uniform);
            }
        }
        return { reservedUniforms: ruk, uniforms: uni };
    }

    static Add(vsName, fsName) {
        vsName = Address.asInternal(vsName);
        fsName = Address.asInternal(fsName);
        let fsMap = super.Get(vsName);

        if (fsMap == null) {
            fsMap = new Map();
            super.Add(vsName, fsMap);
        }

        if (!fsMap.has(fsName)) {
            const program = this.#createProgram(vsName, fsName);
            const { uniforms, reservedUniforms } = this.#mapUniforms(program);
            fsMap.set(fsName, new Program(program, this.#mapAttributes(program), uniforms, reservedUniforms));
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