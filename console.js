import { MaterialStorage } from "./Core/DataStores/materialStore.js";
import { MeshStorage } from "./Core/DataStores/meshStore.js";
import { ModelStorage } from "./Core/DataStores/modelStore.js";
import { ProgramStorage } from "./Core/DataStores/programStore.js";
import { SceneStorage } from "./Core/DataStores/sceneStore.js";
import { ScriptStorage } from "./Core/DataStores/scriptStore.js";
import { ShaderStorage } from "./Core/DataStores/shaderStore.js";
import { TextureStorage } from "./Core/DataStores/textureStore.js";
import Gpu from "./Core/GECore/Gpu/gpu.js";
import { ScriptManager } from "./Core/GameCore/WebAssembly/scriptManager.js";
import { RunningInstance } from "./Core/GameCore/runningInstance.js";
import Resources from "./FileSystem/resources.js";
import { AppSettings } from "./settings.js";

class NineEngineConsole {

    Resources = Resources;
    ri = RunningInstance;
    scriptManager = ScriptManager;

    async assetToValidJsonString(path) {
        const file = await Resources.fetchRaw(path, { hardFetch: true, cacheResult: false });
        const fileReader = new FileReader();
        return new Promise((resolve, reject) => {
            fileReader.onloadend = (e) => {
                if (e.target.error != null) { reject(e.target.error); }
                else { resolve(e.target.result); }
            }
            fileReader.readAsDataURL(file);
        })
    }

    shadowBias(min, max) {
        AppSettings.shadow_biasMin = min;
        AppSettings.shadow_biasMax = max;
    }

    shadowHalfSamples(n) {
        AppSettings.shadow_halfSamples = n;
    }

    logDataStores() {
        const gpuLog = {
            "TotalBufferAllocationSize": Gpu.bufferAllocation
        }
        console.log("Gpu:", gpuLog,
            "\n",
            "\nMaterials:", MaterialStorage.debug(),
            "\nMeshes:", MeshStorage.debug(),
            "\nModels:", ModelStorage.debug(),
            "\nPrograms:", ProgramStorage.debug(),
            "\nScenes:", SceneStorage.debug(),
            "\nScripts:", ScriptStorage.debug(),
            "\nShaders:", ShaderStorage.debug(),
            "\nTextures:", TextureStorage.debug()
        );
    }
}
globalThis.nine = new NineEngineConsole();