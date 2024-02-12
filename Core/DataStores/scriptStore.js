import { DataStorage } from "./Base/baseStore.js";

export class Script {
    #className;
    #internalName;
    #declarations;

    get className() { return this.#className; }
    get internalName() { return this.#internalName; }
    get declarations() { return this.#declarations; }

    constructor(className, internalName, declarations) {
        this.#className = className;
        this.#internalName = internalName;
        this.#declarations = declarations;
    }
}

export class ScriptStorage extends DataStorage {
    static storage = new Map();

    static Add(fileRelativePath, className, internalName, declarations) {
        super.Add(fileRelativePath,
            new Script(
                className,
                internalName,
                declarations,
            ));
    }

    static Find(identifier) {
        let res = this.Get(identifier);
        if (res) return res;

        for (const key of this.keys()) {
            res = this.Get(key);
            if (res.fileRelativePath == identifier) break;
        }
        return res;
    }

    static pack() {
        const keys = {};
        for (const [path, script] of this.storage.entries()) { keys[path] = script.declarations; }
        return keys;
    }
}