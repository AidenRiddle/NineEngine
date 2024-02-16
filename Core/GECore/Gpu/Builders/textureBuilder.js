import { Webgl } from "../../../../settings.js";
import Gpu from "../gpu.js";
import { WebGLConstants } from "../webGLConstants.js";

// https://www.khronos.org/files/webgl20-reference-guide.pdf

export class TextureBuilder {
    /** @param {Gpu} gpu */
    static with(gpu) {
        if (gpu.api == "webgl") return new WebGlTextureBuilder(gpu);
        // else return new WebGpuTextureBuilder(gpu);
    }
}

export class WebGlTextureBuilder {
    /** @type {Gpu} */
    #gpu;

    #address;
    #target = WebGLConstants.TEXTURE_2D;
    #mipLevel = 0;
    #internalFormat;
    #border = 0;
    #format;
    #texelType;
    #magFilter = WebGLConstants.LINEAR;
    #minFilter = WebGLConstants.LINEAR;
    #wrapS = WebGLConstants.CLAMP_TO_EDGE;
    #wrapT = WebGLConstants.CLAMP_TO_EDGE;

    constructor(gpu) {
        this.#gpu = gpu;
    }

    #errorCheck() {
        if (this.#internalFormat == null
            || this.#format == null
            || this.#texelType == null
        ) throw new Error("Texture is lacking parameters.");
    }

    mipLevel(value) { this.#mipLevel = value; return this; };
    internalFormat(value) { this.#internalFormat = value; return this; };
    format(value) { this.#format = value; return this; };
    texelType(value) { this.#texelType = value; return this; };
    magFilter(value) { this.#magFilter = value; return this; };
    minFilter(value) { this.#minFilter = value; return this; };
    wrapS(value) { this.#wrapS = value; return this; };
    wrapT(value) { this.#wrapT = value; return this; };

    colorTexture() {
        this.#address = WebGLConstants.TEXTURE0 + Webgl.engineTexture.length;
        this.#internalFormat = WebGLConstants.RGBA;
        this.#format = WebGLConstants.RGBA;
        this.#texelType = WebGLConstants.UNSIGNED_BYTE;
        return this;
    }

    effectTexture() {
        this.#address = WebGLConstants.TEXTURE0 + Webgl.engineTexture.effectsTexture;
        this.#internalFormat = WebGLConstants.RGBA;
        this.#format = WebGLConstants.RGBA;
        this.#texelType = WebGLConstants.UNSIGNED_BYTE;
        return this;
    }

    depthTexture() {
        this.#address = WebGLConstants.TEXTURE0 + Webgl.engineTexture.depthTexture;
        this.#internalFormat = WebGLConstants.DEPTH_COMPONENT32F;
        this.#format = WebGLConstants.DEPTH_COMPONENT;
        this.#texelType = WebGLConstants.FLOAT;
        this.useMagFilterNearest();
        this.useMinFilterNearest();
        return this;
    }

    useMagFilterNearest() { this.#magFilter = WebGLConstants.NEAREST; return this; }
    useMagFilterLinear() { this.#magFilter = WebGLConstants.LINEAR; return this; }
    useMinFilterNearest() { this.#minFilter = WebGLConstants.NEAREST; return this; }
    useMinFilterLinear() { this.#minFilter = WebGLConstants.LINEAR; return this; }

    useWrapSClamp() { this.#wrapS = WebGLConstants.CLAMP_TO_EDGE; return this; }
    useWrapTClamp() { this.#wrapT = WebGLConstants.CLAMP_TO_EDGE; return this; }

    build(width, height, textureData) {
        this.#errorCheck();
        return this.#gpu.createTexture(
            this.#address,
            this.#target,
            this.#mipLevel,
            this.#internalFormat,
            width,
            height,
            this.#border,
            this.#format,
            this.#texelType,
            textureData,
            this.#magFilter,
            this.#minFilter,
            this.#wrapS,
            this.#wrapT
        );
    }
}

class WebGpuTextureBuilder { }