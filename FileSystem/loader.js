import { MaterialBuilder, MaterialStorage } from "../Core/DataStores/materialStore.js";
import { MeshStorage } from "../Core/DataStores/meshStore.js";
import { ModelStorage } from "../Core/DataStores/modelStore.js";
import { ShaderStorage } from "../Core/DataStores/shaderStore.js";
import { TextureStorage } from "../Core/DataStores/textureStore.js";
import { ShaderGenerator } from "../Core/GECore/shader.js";
import GLBLoader from "./FileLoader/glbLoader.js";
import ImageLoader from "./FileLoader/imageLoader.js";
import ScriptLoader from "./FileLoader/scriptLoader.js";
import ShaderLoader from "./FileLoader/shaderLoader.js";

export default class Loader {
    #imageLoader = new ImageLoader();
    #glbLoader = new GLBLoader();
    #shaderLoader = new ShaderLoader();
    #scriptLoader = new ScriptLoader();

    #fileFormatMapper = new Map();

    constructor() {
        this.#fileFormatMapper.set("jpg", this.#unpackTexture);
        this.#fileFormatMapper.set("png", this.#unpackTexture);
        this.#fileFormatMapper.set("image/png", this.#unpackTexture);
        this.#fileFormatMapper.set("jpeg", this.#unpackTexture);
        this.#fileFormatMapper.set("image/jpeg", this.#unpackTexture);
        this.#fileFormatMapper.set("jfif", this.#unpackTexture);
        this.#fileFormatMapper.set("webp", this.#unpackTexture);

        this.#fileFormatMapper.set("glb", this.#unpackFile_GLB);

        this.#fileFormatMapper.set("glsl", this.#unpackShader);
        this.#fileFormatMapper.set("ts", this.#unpackScript);
    }

    #unpackTexture = (file) => {
        return this.#imageLoader.extract(file)
            .then((imgData) => { TextureStorage.Add(file.name, imgData); return imgData; })
    }

    #unpackScript = (file) => {
        return this.#scriptLoader.extract(file)
        //.then((scriptDefinition) => { ScriptStorage.Add(file.name, scriptDefinition); return scriptDefinition; });
    }

    #unpackShader = (file) => {
        return this.#shaderLoader.extract(file)
            .then((shaderAsString) => { ShaderStorage.Add(file.name, true, shaderAsString); return shaderAsString; });
    }

    #unpackFile_GLB = (file) => {
        return this.#glbLoader.extract(file).then((glb) => {
            if (glb.meshes != null) {
                const armature = {};
                if (glb.armatures) {
                    armature.root = glb.armatures[0].root;
                    armature.joints = glb.armatures[0].joints;
                    armature.inverseBindMatrices = glb.armatures[0].inverseBindMatrices;
                } else {
                    armature.root = null;
                    armature.joints = [];
                    armature.inverseBindMatrices = [];
                }
                for (const mesh of glb.meshes) {
                    if (mesh.wvd.length > 0 && !ShaderStorage.Exists("defaultArmatureVS")) {
                        const vs = ShaderGenerator.vertex().useLightDirectional().useArmature().generate();
                        ShaderStorage.Add("defaultArmatureVS", false, vs);
                    }
                    MeshStorage.Add(file.name, mesh, armature);
                }
            }
            if (glb.textures != null) {
                for (const tex of glb.textures) {
                    this.#unpackTexture(tex);
                }

                // const mat = MaterialBuilder.create()
                //     .shader("Shaders/fragment.glsl")
                //     .addTexture(glb.textures[1].name)
                //     .build();
                // MaterialStorage.Add("Vanguard", mat);
            }
        })
    }

    unpackFile(file) {
        // Get file format from name extension
        // Some file types are not conveyed properly, so we use the name as the first pass
        let fileFormat = file.name.substring(file.name.lastIndexOf('.') + 1);
        if (this.#fileFormatMapper.has(fileFormat)) return this.#fileFormatMapper.get(fileFormat)(file);

        // If the parsed format is not supported, get file format from the file type
        // (Parsed format may not be available, for example, if it is loaded from a URL)
        fileFormat = file.type;
        if (this.#fileFormatMapper.has(fileFormat)) return this.#fileFormatMapper.get(fileFormat)(file);

        console.log(file.name, "(", fileFormat, ")");
        return Promise.reject(`Unknown file format (${fileFormat})`);
    }
}

class MeshLoader {
    // https://docs.fileformat.com/3d/

    Extract = (file) => {
        return new Promise((resolve) => {
            const fileReader = new FileReader();
            fileReader.onloadend = (e) => { resolve(e.target.result); }
            fileReader.readAsArrayBuffer(file);
        });
    }
}