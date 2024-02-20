import { DataStorage } from "./Base/baseStore.js";

export class GuiStorage extends DataStorage {
    /** @type {Map<GuiHandle, HTMLElement>} */
    static storage = new Map();

    static Add(guiHandle, htmlNode) {
        this.storage.set(guiHandle, htmlNode);
    }
}

export class GuiStateStorage extends DataStorage {
    /** @type {Map<GuiHandle, Map<string, any>>} */
    static storage = new Map();

    static Add(guiHandle, stateMap) {
        this.storage.set(guiHandle, stateMap);
    }
}