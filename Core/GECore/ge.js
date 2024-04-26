import { AppSettings, Webgl } from "../../settings.js";
import { MaterialStorage } from "../DataStores/materialStore.js";
import { Armature, MeshStorage } from "../DataStores/meshStore.js";
import { ModelStorage } from "../DataStores/modelStore.js";
import { ProgramStorage } from "../DataStores/programStore.js";
import { SceneStorage } from "../DataStores/sceneStore.js";
import { ShaderStorage } from "../DataStores/shaderStore.js";
import { TextureStorage } from "../DataStores/textureStore.js";
import { LightDirectional } from "../GameCore/Components/lightDirectional.js";
import { ScriptGlobals } from "../GameCore/WebAssembly/scriptGlobals.js";
import SceneObject from "../GameCore/sceneObject.js";
import { TextureBuilder } from "./Gpu/Builders/textureBuilder.js";
import Gpu from "./Gpu/gpu.js";
import Debug from "./Util/debug.js";
import { depthFS, depthVS, pickFS } from "./geShaders.js";
import { PostProcessor } from "./postProcessor.js";

export default class GraphicsEngine {
    /** @type {Gpu} */
    #gpu;
    /** @type {PostProcessor} */
    #post;

    #buffers = {
        a_position: null,
        a_normal: null,
        a_texcoord: null,
        a_weights: null,
        a_joints: null,
    }
    #indexBuffer;

    #depthTextureSize;
    #depthTexture;
    #depthProgram;
    #depthFrameBuffer;

    #pickProgram;

    #renderFrameBuffer;

    #uniformPackage = new Map();

    #pixelData = new Uint8Array(4);

    constructor(gpu) {
        this.#gpu = gpu;
        this.#post = new PostProcessor(this.#gpu);
        this.#InitializeGLBuffers();
        this.#InitializeStoragePointers(this.#gpu);
        this.#InitializeDepthSystem();
        this.#InitializePickSystem();
    }

    #InitializeGLBuffers() {
        this.#buffers["a_position"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#buffers["a_normal"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#buffers["a_texcoord"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#buffers["a_weights"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#buffers["a_joints"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#indexBuffer = this.#gpu.createVertexBuffer(Gpu.ELEMENT_ARRAY_BUFFER, AppSettings.maximum_index_buffer_allocation_per_draw_call);
    }

    /** @param {Gpu} gpu */
    #InitializeStoragePointers(gpu) {
        // Bind static references
        new TextureStorage(gpu);
        new ShaderStorage(gpu);
        new ProgramStorage(gpu);
        new SceneStorage(this);
        new ProgramStorage(gpu);
        Armature.bind(gpu);
    }

    #InitializeDepthSystem() {
        const vs = "depthVS";
        const fs = "depthFS";
        ShaderStorage.Add(vs, false, depthVS);
        ShaderStorage.Add(fs, true, depthFS);
        ProgramStorage.Add(vs, fs);
        this.#depthProgram = ProgramStorage.Get(vs, fs);
        this.#depthTextureSize = AppSettings.shadow_map_resolution;

        this.#depthTexture = TextureBuilder.with(this.#gpu)
            .depthTexture()
            .build(this.#depthTextureSize, this.#depthTextureSize, null);
        this.#depthFrameBuffer = this.#gpu.createDepthFrameBuffer(this.#depthTexture);
    }

    #InitializePickSystem() {
        const vs = "depthVS";
        const fs = "pickFS";
        ShaderStorage.Add(vs, false, depthVS);
        ShaderStorage.Add(fs, true, pickFS);
        ProgramStorage.Add(vs, fs);
        this.#pickProgram = ProgramStorage.Get(vs, fs);
    }

    #writeMeshData(mesh) {
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_position"], mesh.geometryVertexData);
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_normal"], mesh.normalVertexData);
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_texcoord"], mesh.textureVertexData);
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_weights"], mesh.weightVertexData);
        this.#gpu.rewriteBuffer(Gpu.ELEMENT_ARRAY_BUFFER, this.#indexBuffer, mesh.indexVertexData);
    }

    #depthDraw(sceneObjectArray, viewMatrix) {
        this.#gpu.useFrameBuffer(this.#depthFrameBuffer);
        this.#gpu.setViewPort(this.#depthTextureSize, this.#depthTextureSize);
        this.#gpu.clearDepthBuffer();

        this.#uniformPackage.set(Webgl.uniform.viewMatrix, viewMatrix);

        for (const sceneObj of sceneObjectArray) {
            const model = ModelStorage.Get(sceneObj.modelId);
            const mesh = MeshStorage.Get(model.meshId);

            this.#uniformPackage.set(Webgl.uniform.objectMatrix, sceneObj.transform.worldMatrix);

            this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_position"], mesh.geometryVertexData);
            this.#gpu.rewriteBuffer(Gpu.ELEMENT_ARRAY_BUFFER, this.#indexBuffer, mesh.indexVertexData);
            this.#gpu.useDepthProgram(this.#depthProgram.glProgram, this.#buffers["a_position"], this.#uniformPackage);
            this.#gpu.drawFill(mesh.indexVertexData.length, 0);
        }
    }

    #pickDraw(sceneObjectArray, viewMatrix) {
        this.#gpu.useFrameBuffer(null);
        this.#gpu.setViewPort(this.#gpu.canvas.width, this.#gpu.canvas.height);
        this.#gpu.clearColorBuffer();

        this.#uniformPackage.set(Webgl.uniform.viewMatrix, viewMatrix);

        for (const sceneObj of sceneObjectArray) {
            const model = ModelStorage.Get(sceneObj.modelId);
            const mesh = MeshStorage.Get(model.meshId);
            const id = parseInt(sceneObj.id, 36);
            const idAsVec4 = [
                ((id >> 0) & 0xFF) / 0xFF,
                ((id >> 8) & 0xFF) / 0xFF,
                ((id >> 16) & 0xFF) / 0xFF,
                ((id >> 24) & 0xFF) / 0xFF,
            ];

            this.#uniformPackage.set(Webgl.uniform.objectMatrix, sceneObj.transform.worldMatrix);
            this.#uniformPackage.set("u_id", idAsVec4);

            this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_position"], mesh.geometryVertexData);
            this.#gpu.rewriteBuffer(Gpu.ELEMENT_ARRAY_BUFFER, this.#indexBuffer, mesh.indexVertexData);
            this.#gpu.useProgram(this.#pickProgram, this.#buffers, this.#uniformPackage);
            this.#gpu.drawFill(mesh.indexVertexData.length, 0);
        }
    }

    /**
     * @param {SceneObject[]} sceneObjectArray
     * @param {Float32Array} viewMatrix
     */
    #drawScene(sceneObjectArray, viewMatrix) {
        Debug.StartCounter("Draw Calls Last Frame: ");
        Debug.Log("Viewport: ", this.#gpu.canvas.width, this.#gpu.canvas.height);

        this.#gpu.useFrameBuffer(null);
        this.#gpu.setViewPort(this.#gpu.canvas.width, this.#gpu.canvas.height);
        this.#gpu.clearAllBuffers();

        const activeLight = LightDirectional.activeLight;
        this.#uniformPackage.set(Webgl.uniform.viewMatrix, viewMatrix)
            .set(Webgl.uniform.lightDirectional, activeLight.textureProjection)
            .set(Webgl.uniform.lightDirectionalIntensity, activeLight.intensity)
            .set(Webgl.uniform.lightDirectionalReverse, activeLight.transform.back.values())
            .set(Webgl.uniform.depthTexture, Webgl.engineTexture.depthTexture)
            .set(Webgl.uniform.timeSinceStart, ScriptGlobals.timeSinceStartup.value)
            .set(Webgl.uniform.shadowHalfSamples, AppSettings.shadow_halfSamples)
            .set(Webgl.uniform.shadowBiasMin, AppSettings.shadow_biasMin)
            .set(Webgl.uniform.shadowBiasMax, AppSettings.shadow_biasMax);

        for (const sceneObj of sceneObjectArray) {
            const model = ModelStorage.Get(sceneObj.modelId);
            const vsId = model.vertexShaderId;
            const mesh = MeshStorage.Get(model.meshId);
            const armature = sceneObj.armature;

            this.#uniformPackage.set(Webgl.uniform.objectMatrix, sceneObj.transform.worldMatrix);

            this.#writeMeshData(mesh);
            if (armature != null) {
                this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_joints"], armature.jointIndices);
            }

            let primitiveCount = 0;
            for (let i = 0; i < mesh.requiredMaterialCount; i++) {
                const mat = MaterialStorage.Get(model.materials[i]);
                const fsId = mat.shaderId;
                const program = ProgramStorage.Get(vsId, fsId);

                Object.keys(mat.uniformValueMap)
                    .reduce((uniPkg, key) => uniPkg.set(key, mat.uniformValueMap[key]), this.#uniformPackage);

                this.#gpu.useProgram(
                    program,
                    this.#buffers,
                    this.#uniformPackage);

                const jointTexture = program.uniforms.get("u_jointTexture");
                if (jointTexture != null) {
                    const uniformLocation = jointTexture.location;
                    this.#gpu.gl.activeTexture(this.#gpu.gl.TEXTURE0 + Webgl.engineTexture.jointTexture);
                    this.#gpu.gl.bindTexture(this.#gpu.gl.TEXTURE_2D, armature.jointTexture);
                    this.#gpu.gl.uniform1i(uniformLocation, Webgl.engineTexture.jointTexture);
                }
                this.#gpu.useTextures(mat.textures);
                this.#gpu.drawFill(mesh.primitiveIndex[i], primitiveCount * 2);
                primitiveCount += mesh.primitiveIndex[i];
                Debug.Count("Draw Calls Last Frame: ");
            }
        }
    }

    QueueSceneRender = (meshArray, cameraMatrix) => {
        this.#naiveRender(meshArray, cameraMatrix);
    }

    #naiveRender = (meshArray, cameraMatrix) => {
        this.#depthDraw(meshArray, LightDirectional.activeLight.getViewProjection());
        // this.#post.blur(this.#depthTextureSize, this.#depthTextureSize, Webgl.engineTexture.depthTexture);
        this.#drawScene(meshArray, cameraMatrix);
    }

    readPixel = (x, y, sceneObjs, viewMatrix) => {
        this.#pickDraw(sceneObjs, viewMatrix);

        const gl = this.#gpu.gl;
        const pixelX = x * gl.canvas.width / gl.canvas.clientWidth;
        const pixelY = gl.canvas.height - y * gl.canvas.height / gl.canvas.clientHeight - 1;
        gl.readPixels(pixelX, pixelY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.#pixelData);

        return this.#pixelData;
    }

    resizeViewport(newWidth, newHeight) {
        this.#gpu.resizeViewport(newWidth, newHeight);
    }
}