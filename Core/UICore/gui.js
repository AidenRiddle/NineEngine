import { GuiStateStorage, GuiStorage } from "../DataStores/guiStore.js";

class GuiNodeBuilder {

    static buildNode(guiHandle) {
        const root = document.createElement("div");
        GuiStorage.Add(guiHandle, root);

        this.refreshNode(guiHandle);
    }

    static refreshNode(guiHandle) {
        const abortController = new AbortController();
        const gui = new GuiContext(guiHandle, abortController);
        const liveElement = GuiStorage.Get(guiHandle);

        new Promise(async (resolve, reject) => {
            abortController.signal.addEventListener("abort", reject, { once: true });
            GuiStorage.Add(guiHandle, liveElement.cloneNode());
            await guiHandle.constructor.builder(gui, GuiStorage.Get(guiHandle), guiHandle);
            resolve();
        })
            .then(() => {
                if (abortController.signal.aborted) {
                    console.error("Gui aborted but promise still resolved:", guiHandle.constructor.name);
                }
                liveElement.replaceWith(GuiStorage.Get(guiHandle));
            })
            .catch((e) => {
                console.log(`GuiNode (${guiHandle.constructor.name}) Build aborted.`, liveElement);
                GuiStorage.Get(guiHandle).replaceWith(liveElement);
                GuiStorage.Add(guiHandle, liveElement);
            });
    }
}

export class Canvas {
    static #activeHandles = new Set();
    static #dirtyHandles = new Set();

    static get active() { return this.#activeHandles; }
    static get dirty() { return this.#dirtyHandles; }

    /** @param {GuiHandle} guiHandle */
    static addToHUD(guiHandle) {
        if (this.#activeHandles.has(guiHandle)) { console.log("HUD element already added"); return; }

        const root = GuiStorage.Get(guiHandle);
        this.#activeHandles.add(guiHandle);
        document.body.append(root);
    }

    static queueRepaint(guiHandle) {
        this.#dirtyHandles.add(guiHandle);
    }

    static repaintImmediately(guiHandle) {
        if (this.#dirtyHandles.has(guiHandle)) {
            GuiNodeBuilder.refreshNode(guiHandle);
            this.#dirtyHandles.delete(guiHandle);
        }
    }

    static repaint() {
        for (const guiHandle of this.#dirtyHandles.values()) {
            GuiNodeBuilder.refreshNode(guiHandle);
        }
        this.#dirtyHandles.clear();
    }

    /** @param {GuiHandle} guiHandle */
    static createContextFrom(guiHandle, options = {}) {
        const context = window.open("", "_blank");
        context.document.title = guiHandle.constructor.name;
        const liveElement = GuiStorage.Get(guiHandle);
        const importedElement = context.document.adoptNode(liveElement);
        GuiStorage.Add(guiHandle, importedElement);

        if (options.useEventController) { }
    }
}

export class GuiContext {
    #guiHandle;
    /** @type {AbortController} */
    #abortController;

    constructor(guiHandle, abortController) {
        this.#guiHandle = guiHandle;
        this.#abortController = abortController;
    }

    makeRoot(guiHandle) {
        const node = this.getNode(guiHandle);
        GuiStorage.Add(this.#guiHandle, node);
    }

    state(key) { return GuiStateStorage.Get(this.#guiHandle).get(key); }

    /** 
     * @param {string} elName
     * @param {(builder: HTMLElement)} builder */
    node(elName, builder) {
        const el = document.createElement(elName);
        builder(el);
        return el;
    }

    /**
     * @param {GuiHandle} guiHandle 
     * @returns {HTMLElement}
     */
    getNode(guiHandle) {
        if (guiHandle == null) return;
        if (guiHandle instanceof Node) return guiHandle;

        Canvas.repaintImmediately(guiHandle);
        return GuiStorage.Get(guiHandle);
    }

    /**
     * @param {HTMLElement} target 
     * @param {GuiHandle[]} any 
     */
    bake(target, ...any) {
        const threshold = 50;  // milliseconds
        const start = performance.now();
        const flat = any.flat(Infinity);
        flat.map(this.getNode).filter(el => el != null).forEach(el => target.appendChild(el));
        if (performance.now() - start > threshold) {
            console.error("Gui bake took a long time:",
                this.#guiHandle.constructor.name,
                " - Flattened", flat.length, "total elements."
            );
        }
    }

    abortBuild() {
        this.#abortController.signal.throwIfAborted();
        this.#abortController.abort();
    }
}

export class GuiHandle {

    /** 
     * @param {GuiContext} gui
     * @param {HTMLElement} root
     * @param {GuiHandle} handle */
    static builder(gui, root, handle) { throw new Error("No builder defined"); }

    constructor(states = {}) {
        GuiStateStorage.Add(this, new Map(Object.entries(states)));
        GuiNodeBuilder.buildNode(this);
    }

    set = (stateName, value) => {
        GuiStateStorage.Get(this).set(stateName, value);
        this.rebuild();
    }

    rebuild = () => {
        Canvas.queueRepaint(this);
    }
}