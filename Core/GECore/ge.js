import { AppSettings, Webgl } from "../../settings.js";
import { MaterialStorage } from "../DataStores/materialStore.js";
import { Armature, MeshStorage } from "../DataStores/meshStore.js";
import { ModelStorage } from "../DataStores/modelStore.js";
import { ProgramStorage } from "../DataStores/programStore.js";
import { SceneStorage } from "../DataStores/sceneStore.js";
import { ShaderStorage } from "../DataStores/shaderStore.js";
import { TextureStorage } from "../DataStores/textureStore.js";
import { LightDirectional } from "../GameCore/Components/lightDirectional.js";
import Debug from "./Util/debug.js";
import { depthFS, depthVS, vertexShader } from "./geShaders.js";
import Gpu from "./Gpu/gpu.js";
import { PostProcessor } from "./postProcessor.js";
import { TextureBuilder } from "./Gpu/Builders/textureBuilder.js";
import { ScriptGlobals } from "../GameCore/WebAssembly/scriptGlobals.js";

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
    #glIndexBuffer;

    #depthTextureSize;
    #depthTexture;
    #depthProgram;
    #depthFrameBuffer;

    #renderFrameBuffer;

    #uniformPackage = new Map();

    get reservedUniformNames() { return Object.values(Webgl.uniform); }

    constructor(gpu) {
        this.#gpu = gpu;
        this.#post = new PostProcessor(this.#gpu);
        this.#InitializeGLBuffers();
        this.#InitializeStoragePointers(this.#gpu);
        this.#InitializeDepthSystem();
    }

    #InitializeGLBuffers() {
        this.#buffers["a_position"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#buffers["a_normal"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#buffers["a_texcoord"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#buffers["a_weights"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#buffers["a_joints"] = this.#gpu.createVertexBuffer(Gpu.ARRAY_BUFFER, AppSettings.maximum_vertex_buffer_allocation_per_draw_call);
        this.#glIndexBuffer = this.#gpu.createVertexBuffer(Gpu.ELEMENT_ARRAY_BUFFER, AppSettings.maximum_index_buffer_allocation_per_draw_call);
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
        const vs = this.#gpu.compileShader(Gpu.VERTEX_SHADER, depthVS);
        const fs = this.#gpu.compileShader(Gpu.FRAGMENT_SHADER, depthFS);
        this.#depthProgram = this.#gpu.createProgram(vs, fs);
        this.#depthTextureSize = AppSettings.shadow_map_resolution;

        this.#depthTexture = TextureBuilder.with(this.#gpu)
            .depthTexture()
            .build(this.#depthTextureSize, this.#depthTextureSize, null);
        this.#depthFrameBuffer = this.#gpu.createDepthFrameBuffer(this.#depthTexture);
    }

    #writeMeshData(mesh) {
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_position"], mesh.geometryVertexData);
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_normal"], mesh.normalVertexData);
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_texcoord"], mesh.textureVertexData);
        this.#gpu.rewriteBuffer(Gpu.ARRAY_BUFFER, this.#buffers["a_weights"], mesh.weightVertexData);
        this.#gpu.rewriteBuffer(Gpu.ELEMENT_ARRAY_BUFFER, this.#glIndexBuffer, mesh.indexVertexData);
    }

    #depthDraw(sceneObjectArray) {
        this.#gpu.useFrameBuffer(this.#depthFrameBuffer);
        this.#gpu.setViewPort(this.#depthTextureSize, this.#depthTextureSize);
        this.#gpu.clearDepthBuffer();

        for (const sceneObj of sceneObjectArray) {
            const model = ModelStorage.Get(sceneObj.modelId);
            const mesh = MeshStorage.Get(model.meshId);

            this.#writeMeshData(mesh);
            this.#gpu.useDepthShader(this.#depthProgram, this.#buffers["a_position"], LightDirectional.activeLight.getViewProjection(), sceneObj.transform.worldMatrix);
            this.#gpu.drawFill(mesh.indexVertexData.length, 0);
        }
    }

    /**
     * @param {SceneObject[]} sceneObjectArray
     * @param {Float32Array} cameraMatrix
     */
    #drawScene(sceneObjectArray, cameraMatrix) {
        Debug.StartCounter("Draw Calls Last Frame: ");
        Debug.Log("Viewport: ", this.#gpu.canvas.width, this.#gpu.canvas.height);

        this.#gpu.useFrameBuffer(null);
        this.#gpu.setViewPort(this.#gpu.canvas.width, this.#gpu.canvas.height);
        this.#gpu.clearAllBuffers();

        this.#uniformPackage.set(Webgl.uniform.viewMatrix, cameraMatrix)
            .set(Webgl.uniform.lightDirectional, LightDirectional.activeLight.textureProjection)
            .set(Webgl.uniform.lightDirectionalIntensity, LightDirectional.activeLight.intensity)
            .set(Webgl.uniform.lightDirectionalReverse, LightDirectional.activeLight.transform.back.values())
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

                this.#gpu.useShader(
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
        this.#depthDraw(meshArray);
        // this.#post.blur(this.#depthTextureSize, this.#depthTextureSize, Webgl.engineTexture.depthTexture);
        this.#drawScene(meshArray, cameraMatrix);
    }

    #batchRender = (meshArray, cameraMatrix) => {
        this.#depthDraw(meshArray, cameraMatrix);
        //this.#BlurDepthBuffer();
        this.#drawScene(meshArray, cameraMatrix);
    }

    resizeViewport(newWidth, newHeight) {
        this.#gpu.resizeViewport(newWidth, newHeight);
    }
}