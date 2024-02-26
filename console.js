import Resources from "./FileSystem/resources.js";
import { AppSettings } from "./settings.js";

class NineEngineConsole {
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
}
globalThis.nine = new NineEngineConsole();