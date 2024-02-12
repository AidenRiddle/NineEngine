export class ScriptGlobals {
    static deltaTime = this.#newGlobal("f32", true);
    static timeSinceStartup = this.#newGlobal("f32", true);

    static isLocked = this.#newGlobal("i32", true);
    static screenX = this.#newGlobal("f32", true);
    static screenY = this.#newGlobal("f32", true);
    static deltaX = this.#newGlobal("f32", true);
    static deltaY = this.#newGlobal("f32", true);

    static #newGlobal(type, mut) {
        return new WebAssembly.Global({ value: type, mutable: mut });
    }
}