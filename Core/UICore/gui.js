import { GuiStateStorage, GuiStorage } from "../DataStores/guiStore.js";

class GuiNodeBuilder {

    static buildNode(guiHandle) {
        const root = document.createElement("div");
        GuiStorage.Add(guiHandle, root);

        this.refreshNode(guiHandle);
    }

    static refreshNode(guiHandle) {
        const gui = new GuiContext(guiHandle);
        const root = GuiStorage.Get(guiHandle);

        // Delete all the children first
        root.replaceChildren();

        guiHandle.constructor.builder(gui, root, guiHandle);
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

        if (options.useEventController) {}
    }
}

export class GuiContext {
    #guiHandle;

    constructor(guiHandle) {
        this.#guiHandle = guiHandle;
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
        if (guiHandle instanceof Node) return guiHandle;

        GuiNodeBuilder.refreshNode(guiHandle);
        return GuiStorage.Get(guiHandle);
    }

    /**
     * @param {HTMLElement} target 
     * @param {GuiHandle | GuiHandle[]} any 
     */
    bake(target, any) {
        if (Array.isArray(any)) {
            any.map(this.getNode).forEach(el => target.appendChild(el));
        } else {
            target.appendChild(this.getNode(any));
        }

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