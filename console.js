import { GuiStateStorage, GuiStorage } from "./Core/DataStores/guiStore.js";
import { MaterialStorage } from "./Core/DataStores/materialStore.js";
import { MeshStorage } from "./Core/DataStores/meshStore.js";
import { ModelStorage } from "./Core/DataStores/modelStore.js";
import { ProgramStorage } from "./Core/DataStores/programStore.js";
import { SceneStorage } from "./Core/DataStores/sceneStore.js";
import { ScriptStorage } from "./Core/DataStores/scriptStore.js";
import { ShaderStorage } from "./Core/DataStores/shaderStore.js";
import { TextureStorage } from "./Core/DataStores/textureStore.js";
import Gpu from "./Core/GECore/Gpu/gpu.js";
import TexturePainter from "./Core/GECore/Util/texturePainter.js";
import { ScriptManager } from "./Core/GameCore/WebAssembly/scriptManager.js";
import { RunningInstance } from "./Core/GameCore/runningInstance.js";
import { NavFS } from "./FileSystem/FileNavigator/navigatorFileSystem.js";
import Resources from "./FileSystem/resources.js";
import { AppSettings, Stash } from "./settings.js";

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

    async imageToJsonString(path, width, height) {
        const file = await Resources.fetchRaw(path, { hardFetch: true, cacheResult: false });
        const dataURL = await TexturePainter.imageToThumbnailDataURL(file, width, height);
        return dataURL;
    }

    async runCoreFixtures() {
        const fixtures = await Resources.fetchAsJson(Stash.coreFixtures, { hardFetch: true, cacheResult: false });

        function recur(path, dir) {
            const promises = [];
            for (const [key, value] of Object.entries(dir)) {
                const newPath = path + "/" + key;
                if (typeof value == 'object') {
                    promises.push(NavFS.mkdir(newPath).then(() => recur(newPath, value)));
                } else {
                    let data;

                    // Depending on file format (.jpg, .glb, etc), file data could be Base64 encoded
                    try { data = Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
                    // If not, write the data as is.
                    catch (e) { data = value; }
                    promises.push(NavFS.put(newPath, data).then((file) => console.log(newPath, URL.createObjectURL(file))));
                }
            }
            return Promise.all(promises);
        }
        recur(".NineEngine", fixtures);
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
        console.log(
            "Gpu:", gpuLog,
            "\n",
            "\nGuiStates:", GuiStateStorage.debug(),
            // "\nGuiNodes:", GuiStorage.debug(),
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

    getSceneObject(id) {
        return Scene.getObject(id);
    }

    saveRunningInstance = () => {
        console.log("Saving...");
        return RunningInstance.saveProject();
    }
}
globalThis.nine = new NineEngineConsole();