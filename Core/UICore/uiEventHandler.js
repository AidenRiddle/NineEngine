import Payload from "./payload.js";
import { UiEvent } from "./uiConfiguration.js";

export class UiEventHandler {
    handler;
    contextMenu;
    contextMenuKeys;

    constructor(handler, contextMenu) {
        this.handler = handler;
        this.contextMenu = contextMenu;
        this.contextMenuKeys = this.#contextMenuToKeys(contextMenu);

        window.addEventListener("message", (event) => {
            const payload = new Payload(event.data.uiEventCode, event.data.cargo);
            this.#invokeHandler(payload);
        });

        document.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            this.sendMessageToParent(UiEvent.global_context_menu, {
                target: e.view.name,
                screenX: e.screenX,
                screenY: e.screenY,
                items: this.contextMenuKeys,
            })
        });
    }

    /** @param {Payload} payload */
    #invokeHandler(payload) {
        if (payload.uiEventCode == UiEvent.global_context_menu)
            this.#handleContextMenu(payload.cargo["selection"]);
        else
            this.handler[payload.uiEventCode](payload.cargo);
    }

    #handleContextMenu(selection) {
        let handler = this.contextMenu;
        for (const menuItem of selection.split('.')) {
            handler = handler[menuItem];
        }
        if (typeof handler != 'function') throw new Error("Bad context menu selection: " + selection);
        handler();
    }

    #contextMenuToKeys(contextMenu) {
        const keyspace = {};
        for (const [key, value] of Object.entries(contextMenu)) {
            if (typeof value == 'function') keyspace[key] = null;
            else if (typeof value == 'object') keyspace[key] = this.#contextMenuToKeys(value);
            else throw new Error("Provided Context Menu is malformed. Found " + (typeof value));
        }
        return keyspace;
    }

    sendMessageToParent(eventCode, cargo) {
        const payload = new Payload(eventCode, cargo);
        parent.postMessage(payload);
    }
}