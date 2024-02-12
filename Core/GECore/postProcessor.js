import { AppSettings, Webgl } from "../../settings.js";
import { TextureBuilder } from "./Gpu/Builders/textureBuilder.js";
import Gpu from "./Gpu/gpu.js";
import { blurFS, blurVS, copyFS } from "./geShaders.js";

export class PostProcessor {
    /** @type {Gpu} */
    #gpu;

    #effectsVertexBuffer;
    #effectsTextureBuffer;
    #effectsTextureSize;
    #effectsTexture;
    #effectsFrameBuffer;

    #blurredDepthProgram;

    #copyDepthProgram;

    constructor(gpu) {
        this.#gpu = gpu;
        this.#InitializeEffectsSystem();
        this.#InitializeBlurSystem();
        this.#InitializeCopySystem();
    }

    #InitializeEffectsSystem() {
        let x1 = -1, x2 = 1;
        let y1 = -1, y2 = 1;
        const vertData = new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]);
        x1 = 0, x2 = 1;
        y1 = 0, y2 = 1;
        const texData = new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]);
        this.#effectsVertexBuffer = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, texData.byteLength, Gpu.STATIC_DRAW);
        this.#effectsTextureBuffer = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, texData.byteLength, Gpu.STATIC_DRAW);
        this.#effectsTextureSize = AppSettings.shadow_map_resolution;

        this.#effectsTexture = TextureBuilder.with(this.#gpu)
            .effectTexture()
            .build(this.#effectsTextureSize, this.#effectsTextureSize, null);
        this.#effectsFrameBuffer = this.#gpu.createFramebuffer(this.#effectsTexture);

        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#effectsVertexBuffer, vertData);
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#effectsTextureBuffer, texData);
    }

    #InitializeBlurSystem() {
        const vs = this.#gpu.compileShader(Gpu.VERTEX_SHADER, blurVS);
        const fs = this.#gpu.compileShader(Gpu.FRAGMENT_SHADER, blurFS);
        this.#blurredDepthProgram = this.#gpu.createProgram(vs, fs); 
    }

    #InitializeCopySystem() {
        const vs = this.#gpu.compileShader(Gpu.VERTEX_SHADER, blurVS);
        const fs = this.#gpu.compileShader(Gpu.FRAGMENT_SHADER, copyFS);
        this.#copyDepthProgram = this.#gpu.createProgram(vs, fs);
    }

    #enableFxAttributes() {
        this.#gpu.gl.bindBuffer(Gpu.ARRAY_BUFFER, this.#effectsVertexBuffer);
        const attrLoc = this.#gpu.gl.getAttribLocation(this.#blurredDepthProgram, "a_position");
        this.#gpu.gl.enableVertexAttribArray(attrLoc);
        this.#gpu.gl.vertexAttribPointer(attrLoc, 2, Gpu.FLOAT, false, 0, 0);

        this.#gpu.gl.bindBuffer(Gpu.ARRAY_BUFFER, this.#effectsTextureBuffer);
        const attrLoc2 = this.#gpu.gl.getAttribLocation(this.#blurredDepthProgram, "a_texCoord");
        this.#gpu.gl.enableVertexAttribArray(attrLoc2);
        this.#gpu.gl.vertexAttribPointer(attrLoc2, 2, Gpu.FLOAT, false, 0, 0);
    }

    blur(width, height, textureLocation) {
        this.#gpu.useFrameBuffer(this.#effectsFrameBuffer);
        this.#gpu.setViewPort(width, height);
        this.#gpu.clearColorBuffer();

        this.#gpu.gl.useProgram(this.#blurredDepthProgram);
        this.#enableFxAttributes();
        this.#gpu.gl.uniform1i(this.#gpu.gl.getUniformLocation(this.#blurredDepthProgram, Webgl.uniform.depthTexture), textureLocation);
        this.#gpu.gl.uniform1f(this.#gpu.gl.getUniformLocation(this.#blurredDepthProgram, "u_textureSize"), width, height);

        this.#gpu.drawArraysFill(this.#effectsVertexBuffer / 2);
    }

    nofx(width, height, textureLocation) {
        this.#gpu.useFrameBuffer(this.#effectsFrameBuffer);
        this.#gpu.setViewPort(width, height);
        this.#gpu.clearColorBuffer();

        this.#gpu.gl.useProgram(this.#copyDepthProgram);
        this.#enableFxAttributes();
        this.#gpu.gl.uniform1i(this.#gpu.gl.getUniformLocation(this.#copyDepthProgram, Webgl.uniform.depthTexture), textureLocation);

        this.#gpu.drawArraysFill(this.#effectsVertexBuffer / 2);
    }
}