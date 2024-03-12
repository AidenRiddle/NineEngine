import { AppSettings, Webgl } from "../../../settings.js";
import { ScriptGlobals } from "../../GameCore/WebAssembly/scriptGlobals.js";
import { TextureStorage } from "../../DataStores/textureStore.js";
import { WebGLConstants } from "./webGLConstants.js";

const glUniform = {
    [WebGLConstants.SAMPLER_2D]: "uniform1i",
    [WebGLConstants.INT]: "uniform1i",
    [WebGLConstants.FLOAT]: "uniform1f",
    [WebGLConstants.FLOAT_VEC3]: "uniform3fv",
    [WebGLConstants.FLOAT_MAT4]: "uniformMatrix4fv"
}

export default class Gpu {
    /** @type {Gpu} */
    static instance;

    static #bufferAllocation = 0;
    static get bufferAllocation() { return this.#bufferAllocation; }

    static get reservedUniformNames() { return Object.values(Webgl.uniform); }
    static get ARRAY_BUFFER() { return WebGLConstants.ARRAY_BUFFER; }
    static get ELEMENT_ARRAY_BUFFER() { return WebGLConstants.ELEMENT_ARRAY_BUFFER; }
    static get DYNAMIC_DRAW() { return WebGLConstants.DYNAMIC_DRAW; }
    static get STATIC_DRAW() { return WebGLConstants.STATIC_DRAW; }
    static get VERTEX_SHADER() { return WebGLConstants.VERTEX_SHADER; }
    static get FRAGMENT_SHADER() { return WebGLConstants.FRAGMENT_SHADER; }
    static get FLOAT() { return WebGLConstants.FLOAT; }
    static get UINT() { return WebGLConstants.UNSIGNED_INT; }
    static get USHORT() { return WebGLConstants.UNSIGNED_SHORT; }
    static get UVEC4() { return WebGLConstants.UNSIGNED_INT_VEC4; }

    /** @type {WebGL2RenderingContext} */
    gl;
    canvas;

    get api() { return "webgl"; }

    constructor(canvas) {
        Gpu.instance = this;
        this.#initializeGLContext(canvas);
        this.#initializeGLSettings();
    }

    #initializeGLContext(canvas) {
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        this.gl = canvas.getContext("webgl2", Webgl.contextAttribute);
        canvas.ownerDocument.body.onresize = (event) => {
            console.log("In GPU", event);

            const newWidth = event.target.innerWidth;
            const newHeight = event.target.innerHeight;

            AppSettings.display_width = newWidth;
            AppSettings.display_height = newHeight;

            canvas.width = newWidth;
            canvas.height = newHeight;
            this.gl.canvas.width = newWidth;
            this.gl.canvas.height = newHeight;
            this.gl.viewport(0, 0, newWidth, newHeight);
        };
        this.gl.canvas.width = canvas.width;
        this.gl.canvas.height = canvas.height;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        this.canvas = this.gl.canvas;
    }

    #initializeGLSettings(col = [0.15, 0.15, 0.15, 1]) {
        this.gl.clearColor(col[0], col[1], col[2], col[3]);
        this.gl.enable(this.gl.BLEND);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);

        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    #configureActiveFrameBuffer(framebuffer, attachmentPoint, texture) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,            // target
            attachmentPoint,                // attachment point
            this.gl.TEXTURE_2D,             // texture target
            texture,                        // texture
            0);                             // mip level
    }

    getTotalActiveAttributes(glProgram) { return this.gl.getProgramParameter(glProgram, this.gl.ACTIVE_ATTRIBUTES); }
    getActiveAttributeInfo(glProgram, index) { return this.gl.getActiveAttrib(glProgram, index); }
    getTotalUniforms(glProgram) { return this.gl.getProgramParameter(glProgram, this.gl.ACTIVE_UNIFORMS); }
    getActiveUniformInfo(glProgram, index) { return this.gl.getActiveUniform(glProgram, index); }
    getUniformLocation(glProgram, name) { return this.gl.getUniformLocation(glProgram, name); }

    createDepthFrameBuffer(glTexture) {
        const fb = this.gl.createFramebuffer();
        this.#configureActiveFrameBuffer(
            fb,
            this.gl.DEPTH_ATTACHMENT,
            glTexture
        );
        return fb;
    }

    createFramebuffer(glTexture) {
        const fb = this.gl.createFramebuffer();
        this.#configureActiveFrameBuffer(
            fb,
            this.gl.COLOR_ATTACHMENT0,
            glTexture
        );
        return fb;
    }

    createTexture(address, target, mipLevel, internalFormat, width, height, border,
        format, type, data, magFilter, minFilter, wrapS, wrapT) {
        const tex = this.gl.createTexture();
        this.gl.activeTexture(address);
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.texImage2D(target, mipLevel, internalFormat, width, height, border, format, type, data);
        this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter);
        this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter);
        this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrapS);
        this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrapT);
        return tex;
    }

    createVertexBuffer(bufferType, sizeInBytes, drawType = this.gl.DYNAMIC_DRAW) {
        Gpu.#bufferAllocation += sizeInBytes;

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(bufferType, buffer);
        this.gl.bufferData(bufferType, sizeInBytes, drawType);
        return buffer;
    }

    rewriteBuffer(bufferType, webglBuffer, data) {
        this.gl.bindBuffer(bufferType, webglBuffer);
        this.gl.bufferSubData(bufferType, 0, data);
    }

    useTextures(textureArray) {
        //const tex = TextureStorage.Get("Textures/tk3.jpg");
        for (let j = 0; j < textureArray.length; j++) {
            this.gl.activeTexture(this.gl.TEXTURE0 + j);
            this.gl.bindTexture(this.gl.TEXTURE_2D, TextureStorage.Get(textureArray[j]).webGl);
            //this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        }
    }

    useFrameBuffer(frameBuffer) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
    }

    clearDepthBuffer() { this.gl.clear(this.gl.DEPTH_BUFFER_BIT); }
    clearColorBuffer() { this.gl.clear(this.gl.COLOR_BUFFER_BIT); }
    clearAllBuffers() { this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); }

    setViewPort(width, height) {
        this.gl.viewport(0, 0, width, height);
    }

    useDepthShader(depthProgram, vertexBuffer, viewMatrix, objectMatrix) {
        const attrLoc = this.gl.getAttribLocation(depthProgram, "a_position");

        this.gl.useProgram(depthProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.enableVertexAttribArray(attrLoc);
        this.gl.vertexAttribPointer(attrLoc, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(depthProgram, Webgl.uniform.viewMatrix), false, viewMatrix);
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(depthProgram, Webgl.uniform.objectMatrix), false, objectMatrix);
    }

    useShader(shader, bufferMap, uniformValueMap, viewMatrix, objectMatrix, lightObject) {

        const program = shader.program;
        this.gl.useProgram(program);
        this.#enableShaderDefaultAttributes(shader, bufferMap);
        this.#assignShaderUniforms(shader, uniformValueMap);

        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(program, Webgl.uniform.viewMatrix), false, viewMatrix);
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(program, Webgl.uniform.objectMatrix), false, objectMatrix);
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(program, Webgl.uniform.lightDirectional), false, lightObject.textureProjection);

        this.gl.uniform1i(this.gl.getUniformLocation(program, Webgl.uniform.depthTexture), Webgl.engineTexture.depthTexture);
        this.gl.uniform1f(this.gl.getUniformLocation(program, Webgl.uniform.timeSinceStart), ScriptGlobals.timeSinceStartup.value);
        this.gl.uniform1i(this.gl.getUniformLocation(program, Webgl.uniform.shadowHalfSamples), AppSettings.shadow_halfSamples);
        this.gl.uniform1f(this.gl.getUniformLocation(program, Webgl.uniform.shadowBiasMin), AppSettings.shadow_biasMin);
        this.gl.uniform1f(this.gl.getUniformLocation(program, Webgl.uniform.shadowBiasMax), AppSettings.shadow_biasMax);
        this.gl.uniform1f(shader.uniforms.get("u_intensity")?.location, lightObject.intensity);
        this.gl.uniform3fv(shader.uniforms.get("u_reverseLightDirection")?.location, lightObject.transform.back.values());
    }

    #assignShaderUniforms(shader, uniformValueMap) {
        const uniformMap = shader.uniforms;
        for (const uniName of Object.keys(uniformValueMap)) {
            const uniValue = uniformValueMap[uniName];
            if (!uniformMap.get(uniName)) throw new Error("Invalid uniform pointer: " + uniName);
            const handler = glUniform[uniformMap.get(uniName).type];

            if (!handler) throw new Error("Uniform type not implemented: " + uniformMap.get(uniName).type);
            if (handler.includes("Matrix")) {
                this.gl[handler](uniformMap.get(uniName).location, false, uniValue);
                continue;
            }

            this.gl[handler](uniformMap.get(uniName).location, uniValue);
        }
    }

    #enableShaderDefaultAttributes(shader, bufferMap) {
        for (const key of shader.attributes.keys()) {
            if (bufferMap[key] == null) console.log(key, bufferMap[key]);
            this.#bindAttributeToBuffer(shader.getAttributeInformation(key), bufferMap[key]);
        }
    }

    #bindAttributeToBuffer(attributeInfo, buffer) {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.enableVertexAttribArray(attributeInfo.location);
        this.gl.vertexAttribPointer(
            attributeInfo.location,
            attributeInfo.size,
            attributeInfo.type,
            attributeInfo.normalized,
            attributeInfo.stride,
            attributeInfo.offset
        );
    }

    drawFill(count, offset) {
        this.gl.drawElements(this.gl.TRIANGLES, count, this.gl.UNSIGNED_SHORT, offset);
    }

    drawArraysFill(count) {
        this.gl.drawArrays(this.gl.TRIANGLES, 0, count);
    }

    resizeViewport(newWidth, newHeight) {
        this.gl.canvas.width = newWidth;
        this.gl.canvas.height = newHeight;
        this.gl.viewport(0, 0, newWidth, newHeight);
    }

    compileShader(shaderType, shaderSrc) {
        const shader = this.gl.createShader(shaderType);
        this.gl.shaderSource(shader, shaderSrc);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    createProgram(glVertexShader, glFragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, glVertexShader);
        this.gl.attachShader(program, glFragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Link failed: ' + this.gl.getProgramInfoLog(program));
            console.error('vs info-log: ' + this.gl.getShaderInfoLog(glVertexShader));
            console.error('fs info-log: ' + this.gl.getShaderInfoLog(glFragmentShader));
        }
        return program;
    }
}