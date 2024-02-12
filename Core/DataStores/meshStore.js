import { AppSettings } from "../../settings.js";
import { TextureBuilder } from "../GECore/Gpu/Builders/textureBuilder.js";
import Gpu from "../GECore/Gpu/gpu.js";
import { WebGLConstants } from "../GECore/Gpu/webGLConstants.js";
import Component from "../GameCore/Components/component.js";
import { Transform } from "../GameCore/Components/transform.js";
import Matrix4 from "../Math/matrix4.js";
import { DataStorage } from "./Base/baseStore.js";

function arrayCopy(dst, src) {
    for (let i = 0; i < dst.length; i++) dst[i] = src[i];
}

export class Armature extends Component {
    /** @type {Gpu} */
    static gpu;

    root;
    joints;
    jointIndices;
    jointMatrices;
    jointTexture;
    jointTextureData;
    inverseBindMatrices;

    static bind(gpu) { this.gpu = gpu; }

    constructor(sceneObject, jointRoot, joints, jointIndices, inverseBindMatrices) {
        super(sceneObject);
        this.jointMatrices = [];
        this.jointTextureData = new Float32Array(joints.length * 16);
        this.jointIndices = jointIndices;
        this.inverseBindMatrices = inverseBindMatrices;

        const jointTransformMap = new Map();

        for (let i = 0; i < joints.length; ++i) {
            this.jointMatrices.push(new Float32Array(
                this.jointTextureData.buffer,
                Float32Array.BYTES_PER_ELEMENT * 16 * i,
                16));

            const joint = joints[i];
            const transform = Transform.from(sceneObject, joint.position, joint.rotation, joint.scale);
            jointTransformMap.set(joint.name, transform);
        }

        this.#applyHierarchy(jointTransformMap, joints);

        this.root = Transform.from(sceneObject, jointRoot.position, jointRoot.rotation, jointRoot.scale);

        const anyJoint = jointTransformMap.get(joints[0].name);
        this.#findRoot(anyJoint).parent = this.root;

        this.joints = Object.values(Object.fromEntries(jointTransformMap));

        this.update();
    }

    #findRoot(joint) {
        while (joint.parent != null) { joint = joint.parent; }
        return joint;
    }

    #applyHierarchy(jointTransformMap, joints) {
        for (const joint of joints) {
            const parent = jointTransformMap.get(joint.name);
            for (const childName of joint.children) {
                const child = jointTransformMap.get(childName);
                parent.addChild(child);
            }
        }
    }

    update() {
        this.root.updateWorldMatrix();

        const globalWorldInverse = Matrix4.identity;
        Matrix4.inverse(globalWorldInverse, this.sceneObject.transform.worldMatrix);
        for (let j = 0; j < this.joints.length; ++j) {
            const joint = this.joints[j];
            const dst = this.jointMatrices[j];
            Matrix4.multiply(dst, globalWorldInverse, joint.worldMatrix);
            Matrix4.multiply(dst, this.inverseBindMatrices[j], dst);
        }

        this.jointTexture = TextureBuilder.with(Armature.gpu)
            .colorTexture()
            .useMagFilterNearest()
            .useMinFilterNearest()
            .internalFormat(WebGLConstants.RGBA32F)
            .format(WebGLConstants.RGBA)
            .texelType(WebGLConstants.FLOAT)
            .build(4, this.joints.length, this.jointTextureData);
    }
}

export class Skin {
    constructor(gvd, nvd, tvd, wvd, jid, ivd, pi, jointRoot, joints, inverseBindMatrices) {
        this.geometryVertexData = gvd;
        this.normalVertexData = nvd;
        this.textureVertexData = tvd;
        this.weightVertexData = wvd;
        this.indexVertexData = ivd;
        this.primitiveIndex = pi;
        this.jointIndices = jid;
        this.jointRoot = jointRoot;
        this.joints = joints;
        this.inverseBindMatrices = inverseBindMatrices;

        this.requiredJointCount = joints.length;
        this.requiredMaterialCount = pi.length;

        Object.freeze(this);
    }
}

export class MeshStorage extends DataStorage {
    static storage = new Map();
    static #dataBuffer = new ArrayBuffer(AppSettings.vertex_buffer_size);
    static #dataBufferHead = 0;     //In Bytes

    static #cacheArray(TypedArray, buffer, bufferHead, data) {
        const view = new TypedArray(buffer, bufferHead, data.length);
        arrayCopy(view, data);
        return view;
    }

    static Add(name, mesh, armature) {
        if (this.Exists(name)) return;

        const spaceNeeded = this.#dataBufferHead
            + (mesh.gvd.length * Float32Array.BYTES_PER_ELEMENT)
            + (mesh.nvd.length * Float32Array.BYTES_PER_ELEMENT)
            + (mesh.tvd.length * Float32Array.BYTES_PER_ELEMENT)
            + (mesh.wvd.length * Float32Array.BYTES_PER_ELEMENT)
            + (mesh.jid.length * Float32Array.BYTES_PER_ELEMENT)
            + (mesh.ivd.length * Float32Array.BYTES_PER_ELEMENT)
            + (mesh.pi.length * Uint16Array.BYTES_PER_ELEMENT);

        if (spaceNeeded > this.#dataBuffer.byteLength) {
            throw new Error(`Vertex Buffer overflow. Space needed (${spaceNeeded}) - space allocated (${this.#dataBuffer.byteLength})`);
        }

        const gvd = this.#cacheArray(Float32Array, this.#dataBuffer, this.#dataBufferHead, mesh.gvd);
        this.#dataBufferHead += gvd.byteLength;

        const nvd = this.#cacheArray(Float32Array, this.#dataBuffer, this.#dataBufferHead, mesh.nvd);
        this.#dataBufferHead += nvd.byteLength;

        const tvd = this.#cacheArray(Float32Array, this.#dataBuffer, this.#dataBufferHead, mesh.tvd);
        this.#dataBufferHead += tvd.byteLength;

        const wvd = this.#cacheArray(Float32Array, this.#dataBuffer, this.#dataBufferHead, mesh.wvd);
        this.#dataBufferHead += wvd.byteLength;

        const jid = this.#cacheArray(Float32Array, this.#dataBuffer, this.#dataBufferHead, mesh.jid);
        this.#dataBufferHead += jid.byteLength;

        const ivd = this.#cacheArray(Uint16Array, this.#dataBuffer, this.#dataBufferHead, mesh.ivd);
        this.#dataBufferHead += ivd.byteLength;

        const inverseBindMat = [];
        if (armature.root != null) {
            const ibmd = this.#cacheArray(Float32Array, this.#dataBuffer, this.#dataBufferHead, armature.inverseBindMatrices);
            this.#dataBufferHead += ibmd.byteLength;

            for (let i = 0; i < armature.joints.length; ++i) {
                inverseBindMat.push(new Float32Array(
                    ibmd.buffer,
                    ibmd.byteOffset + Float32Array.BYTES_PER_ELEMENT * 16 * i,
                    16));
            }
        }

        console.log("Mesh Storage used:", this.#dataBufferHead, "/", this.#dataBuffer.byteLength, `(${(~~(this.#dataBufferHead * 100 / this.#dataBuffer.byteLength))}%)`, "-", name);

        super.Add(name, new Skin(gvd, nvd, tvd, wvd, jid, ivd, mesh.pi, armature.root, armature.joints, inverseBindMat));
    }

    static pack() {
        const keys = [];
        for (const key of super.keys()) { keys.push(key); }
        return keys;
    }
}