import { GuiStateStorage, GuiStorage } from "../DataStores/guiStore.js";

export class Canvas {
    static #activeHandles = new Set();
    static #dirtyHandles = new Set();

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
            const liveElement = GuiStorage.Get(guiHandle);
            GuiNodeBuilder.buildNode(guiHandle);
            const newElement = GuiStorage.Get(guiHandle);
            liveElement.parentElement.replaceChild(newElement, liveElement);
        }
        this.#dirtyHandles.clear();
    }

    static createContext(srcMainUrl, options = {}) {
        const iframe = document.createElement("iframe");
        const iframeDoc = iframe.contentDocument;
        const mainScript = iframeDoc.createElement("script");
        mainScript.src = srcMainUrl;

        if (options?.useEventController)

        document.body.appendChild(iframe);
    }
}

export class GuiNodeBuilder {
    #guiHandle;

    static buildNode(guiHandle) {
        const frag = new GuiNodeBuilder(guiHandle);
        const root = document.createElement("div");
        guiHandle.constructor.builder(frag, root, guiHandle);
        GuiStorage.Add(guiHandle, root);
    }

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

    getNode(guiHandle) { return GuiStorage.Get(guiHandle); }

    /**
     * @param {GuiHandle} guiHandle 
     * @returns {HTMLElement}
     */
    #cleanSingle(guiHandle) {
        if (guiHandle instanceof Node) return guiHandle;

        GuiNodeBuilder.buildNode(guiHandle);
        return GuiStorage.Get(guiHandle);
    }

    /**
     * @param {HTMLElement} target 
     * @param {GuiHandle | GuiHandle[]} any 
     */
    bake(target, any) {
        if (Array.isArray(any)) {
            any.map(this.#cleanSingle).forEach(el => target.appendChild(el));
        }
        else {
            target.appendChild(this.#cleanSingle(any));
        }

    }
}

export class GuiHandle {

    /** @param {GuiNodeBuilder} frag  */
    static builder(frag, root) { throw new Error("No builder defined"); }

    constructor(states = {}) {
        GuiStateStorage.Add(this, new Map(Object.entries(states)));
        GuiNodeBuilder.buildNode(this);
    }

    set(stateName, value) {
        GuiStateStorage.Get(this).set(stateName, value);
        this.rebuild();
    }

    rebuild() {
        Canvas.queueRepaint(this);
    }

    getNode() { return GuiStorage.Get(this); }
}