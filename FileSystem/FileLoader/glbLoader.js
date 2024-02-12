import Quaternion from "../../Core/Math/quaternion.js";
import Vector3 from "../../Core/Math/vector3.js";

const supportedGlbVersion = 2;
const defaultOptions = { meshes: true, materials: true, textures: true, armatures: true, animations: true, scenes: false };

export default class GLBLoader {

    #parseGLBHeader(byteData) {
        const dataView = new DataView(byteData);
        const version = dataView.getUint32(4, true);

        const magic = String.fromCharCode(dataView.getUint8(0), dataView.getUint8(1), dataView.getUint8(2), dataView.getUint8(3));
        const totalLength = dataView.getUint32(8, true);

        return { magic, version, totalLength }
    }

    #parseGLBBody(byteData) {
        const dataView = new DataView(byteData);
        const chunk0Start = 12;
        const chunk0Type = String.fromCharCode(
            dataView.getUint8(chunk0Start + 4),
            dataView.getUint8(chunk0Start + 5),
            dataView.getUint8(chunk0Start + 6),
            dataView.getUint8(chunk0Start + 7));
        if (chunk0Type != "JSON") throw new Error("First chunk is not a JSON schema");

        const schemaLength = dataView.getUint32(chunk0Start, true);
        const schemaData = new Uint8Array(byteData, chunk0Start + 8, schemaLength);

        const td = new TextDecoder();
        const decoded = td.decode(schemaData);

        const chunk1Start = chunk0Start + 8 + schemaLength;
        const chunk1Type = String.fromCharCode(
            dataView.getUint8(chunk1Start + 4),
            dataView.getUint8(chunk1Start + 5),
            dataView.getUint8(chunk1Start + 6));
        if (chunk1Type != "BIN") throw new Error("Second chunk is not a Binary buffer");

        const bufferStart = chunk1Start + 8;

        return {
            schema: JSON.parse(decoded),
            buffer: byteData.slice(bufferStart)
        }
    }

    #extractBufferData(schema, buffer, attributeIndex) {
        if (attributeIndex == null) return new Uint8Array(0);

        const byteOffset = schema.bufferViews[schema.accessors[attributeIndex].bufferView].byteOffset;
        const accessor = schema.accessors[attributeIndex];
        const type = accessor.type;
        const componentType = accessor.componentType;
        const count = accessor.count;

        let numOfElements = 1;
        if (type == "VEC2") numOfElements = 2;
        else if (type == "VEC3") numOfElements = 3;
        else if (type == "VEC4") numOfElements = 4;
        else if (type == "MAT2") numOfElements = 4;
        else if (type == "MAT3") numOfElements = 9;
        else if (type == "MAT4") numOfElements = 16;

        if (componentType == "5120") return new Int8Array(buffer, byteOffset, count * numOfElements);
        if (componentType == "5121") return new Uint8Array(buffer, byteOffset, count * numOfElements);
        if (componentType == "5122") return new Int16Array(buffer, byteOffset, count * numOfElements);
        if (componentType == "5123") return new Uint16Array(buffer, byteOffset, count * numOfElements);
        if (componentType == "5124") return new Int32Array(buffer, byteOffset, count * numOfElements);
        if (componentType == "5125") return new Uint32Array(buffer, byteOffset, count * numOfElements);
        if (componentType == "5126") return new Float32Array(buffer, byteOffset, count * numOfElements);
        throw new Error("Type " + info.accessor.componentType + " unrecognized.");
    }

    #extractMeshes(schema, buffer) {
        if (schema.meshes == null) return;

        const meshes = [];
        for (const mesh of schema.meshes) {
            const geometryVertexBuffer = [];
            const normalVertexBuffer = [];
            const textureVertexBuffer = [];
            const weightVertexBuffer = [];
            const jointIndices = [];
            const indexVertexBuffer = [];
            const primitiveIndices = [];

            for (const primitive of mesh.primitives) {
                const currentIndexBufferLength = geometryVertexBuffer.length / 3;
                const g = this.#extractBufferData(schema, buffer, primitive.attributes.POSITION);
                const n = this.#extractBufferData(schema, buffer, primitive.attributes.NORMAL);
                const t = this.#extractBufferData(schema, buffer, primitive.attributes.TEXCOORD_0);
                const w = this.#extractBufferData(schema, buffer, primitive.attributes.WEIGHTS_0);
                const j = this.#extractBufferData(schema, buffer, primitive.attributes.JOINTS_0);
                const i = this.#extractBufferData(schema, buffer, primitive.indices);

                g.forEach(el => geometryVertexBuffer.push(el));
                n.forEach(el => normalVertexBuffer.push(el));
                t.forEach(el => textureVertexBuffer.push(el));
                w.forEach(el => weightVertexBuffer.push(el));
                j.forEach(el => jointIndices.push(el));
                i.forEach(el => indexVertexBuffer.push(el + currentIndexBufferLength));

                primitiveIndices.push(i.length);
            }
            meshes.push({
                name: mesh.name,
                gvd: geometryVertexBuffer,
                nvd: normalVertexBuffer,
                tvd: textureVertexBuffer,
                wvd: weightVertexBuffer,
                jid: jointIndices,
                ivd: indexVertexBuffer,
                pi: primitiveIndices,
            });
        }
        return meshes;
    }

    #extractTextures(schema, buffer) {
        if (schema.textures == null) return;

        const images = [];
        for (const image of schema.images) {
            const fileExtension = image.mimeType.split('/').at(-1);
            const fileName = "Textures/" + image.name + "." + fileExtension;

            const viewInfo = schema.bufferViews[image.bufferView];
            const view = new Uint8Array(buffer, viewInfo.byteOffset, viewInfo.byteLength);
            const file = new File([view], fileName, { type: image.mimeType });
            images.push(file);
        }

        return images;
    }

    #extractArmature(schema, buffer) {
        if (schema.skins == null) return;

        const armatures = [];
        for (const skin of schema.skins) {
            const joints = skin.joints.map(ndx => {
                const node = schema.nodes[ndx];

                node.translation[1] = -node.translation[1];

                const [px, pz, py] = node.translation ?? [0, 0, 0];
                const [rx, rz, ry, rw] = node.rotation ?? [0, 0, 0, 1];     // quat.w is packaged as the last value
                const [sx, sz, sy] = node.scale ?? [1, 1, 1];

                const name = node.name;
                const children = node.children
                    ? node.children.map(i => schema.nodes[i].name)
                    : [];
                const position = new Vector3(px, py, pz);
                const rotation = new Quaternion(rw, rx, ry, rz);    // quat.w is the first value for the constructor
                const scale = new Vector3(sx, sy, sz);

                return { name, children, position, rotation, scale };
            });

            const accessorIndex = skin.inverseBindMatrices;
            const bufferViewIndex = schema.accessors[accessorIndex].bufferView;
            const bufferView = schema.bufferViews[bufferViewIndex];
            const inverseBindMatrices = new Float32Array(buffer, bufferView.byteOffset, bufferView.length);

            const armature = {
                joints,
                inverseBindMatrices
            };
            armatures.push(armature);
        }

        return armatures;
    }

    #extractJoint(schema, node) {
        const [px, py, pz] = node.translation ?? [0, 0, 0];
        const [rx, ry, rz, rw] = node.rotation ?? [0, 0, 0, 1];     // quat.w is packaged as the last value
        const [sx, sy, sz] = node.scale ?? [1, 1, 1];

        const name = node.name;
        const children = node.children
            ? node.children.map(i => schema.nodes[i].name)
            : [];
        const position = new Vector3(px, py, pz);
        const rotation = new Quaternion(rw, rx, ry, rz);    // quat.w is the first value for the constructor
        const scale = new Vector3(sx, sy, sz);

        return { name, children, position, rotation, scale };
    }

    #extractJointsToArray(schema, skin) {
        return skin.joints.map(ndx => {
            const node = schema.nodes[ndx];
            return this.#extractJoint(schema, node);
        });
    }

    #extractArmatureByReference(schema, buffer) {
        if (schema.skins == null) return;

        const armatures = [];
        for (const skin of schema.skins) {
            const skinName = skin.name;

            const rootNode = schema.nodes.find(el => el.name == skinName);
            const root = this.#extractJoint(schema, rootNode);

            const joints = this.#extractJointsToArray(schema, skin);
            const accessorIndex = skin.inverseBindMatrices;
            const bufferViewIndex = schema.accessors[accessorIndex].bufferView;
            const bufferView = schema.bufferViews[bufferViewIndex];
            const inverseBindMatrices = new Float32Array(buffer, bufferView.byteOffset, bufferView.length);

            const armature = {
                root,
                joints,
                inverseBindMatrices
            };
            armatures.push(armature);
        }

        return armatures;
    }

    extract(file) {
        return new Promise((resolve) => {
            const fileReader = new FileReader();
            fileReader.onloadend = (e) => { resolve(e.target.result); }
            fileReader.readAsArrayBuffer(file);
        }).then((byteData) => this.load(byteData)) // Default options
    }

    /**
     * @param {*} byteData 
     * @param {defaultOptions} options 
     * @returns 
     */
    load(byteData, options = {}) {
        console.groupCollapsed("GLTF Import Log");

        const header = this.#parseGLBHeader(byteData);
        if (header.version != supportedGlbVersion) { console.error("Failed to import. GLB version (", version, ") not supported.") }

        options = Object.assign({}, defaultOptions, options);

        const { schema, buffer } = this.#parseGLBBody(byteData);
        console.log("Schema:", schema);

        const result = {};

        if (options.meshes) result.meshes = this.#extractMeshes(schema, buffer);
        if (options.textures) result.textures = this.#extractTextures(schema, buffer);
        if (options.armatures) result.armatures = this.#extractArmatureByReference(schema, buffer);

        console.log("GLB result:", result);
        console.groupEnd();
        return result;
    }
}