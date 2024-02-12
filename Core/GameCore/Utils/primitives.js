import { MaterialBuilder, MaterialStorage } from "../../DataStores/materialStore.js";
import { ModelStorage } from "../../DataStores/modelStore.js";

export default class Primitive {
    static #assembleDefaultModel(modelName, meshName){
        try {
            if (ModelStorage.Get(modelName)) return modelName;
        } catch (e) {
            const matName = "Shaders/fragment.glsl" + texture;
            try {
                MaterialStorage.Get(matName);
            } catch (e) {
                MaterialStorage.Add(
                    matName,
                    MaterialBuilder.buildFromParams({
                        shaderId: "Shaders/fragment.glsl",
                        uniformValueMap: {
                            u_texture: texture
                        }
                    })
                )
            }
            ModelStorage.Add(
                modelName,
                meshName,
                [matName]
            )
            return modelName;
        }
    }

    static Cube(texture = "Textures/if1.jpg") {
        const modelName = "Primitive_Cube_" + texture;
        const meshName = "3DModels/cube.glb";
        return this.#assembleDefaultModel(modelName, meshName);
    }

    static Tesseract(texture = "Textures/if1.jpg") {
        const modelName = "Primitive_Tesseract_" + texture;
        const meshName = "3DModels/tesseract.glb";
        return this.#assembleDefaultModel(modelName, meshName);
    }
}