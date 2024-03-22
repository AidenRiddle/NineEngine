import { DataStorage } from "./Base/baseStore.js";

export class GuiStorage extends DataStorage {
    /** @type {WeakMap<GuiHandle, HTMLElement>} */
    static storage = new WeakMap();

    static Add(guiHandle, htmlNode) {
        this.storage.set(guiHandle, htmlNode);
    }
}

export class GuiStateStorage extends DataStorage {
    /** @type {WeakMap<GuiHandle, Map<string, any>>} */
    static storage = new WeakMap();

    static Add(guiHandle, stateMap) {
        this.storage.set(guiHandle, stateMap);
    }
}