import { UiEvent } from "../uiConfiguration.js";
import { notImplemented } from "../uiUtil.js";
import { UiEventHandler } from "../uiEventHandler.js";
import { $Folder } from "./Components/item.js";
import { Canvas, GuiHandle, GuiContext } from "../gui.js";
import Payload from "../payload.js";

function clickHandler(so) { eventHandler.sendMessageToParent(UiEvent.hierarchy_select, so); }

export class $Hierarchy extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const cargo = gui.state("cargo");
        const soMap = new Map();
        const parents = new Map();
        const orphans = [];
        for (const [id, so] of Object.entries(cargo)) {
            const folder = new $Folder({
                value: so.name,
                subfolders: [],
                callback: () => { clickHandler(id); },
                dblClick: () => {
                    const name = prompt("Rename SceneObject:");
                    const cargo = { soid: so.id, newName: name };
                    const payload = new Payload(UiEvent.hierarchy_rename_sceneobject, cargo);
                    parent.postMessage(payload);
                }
            });
            soMap.set(id, folder);

            const parentId = so.parentId;
            if (parentId == null) {
                orphans.push(folder);
            } else {
                if (!parents.has(parentId)) parents.set(parentId, []);
                parents.get(parentId).push(folder);
            }
        }

        for (const [id, childFolders] of parents.entries()) {
            soMap.get(id).set("subfolders", childFolders);
        }

        root.style.width = "100%"

        gui.bake(root, orphans);
    }
}

const mainHierarchy = new $Hierarchy({ "cargo": {} });
const handler = {
    [UiEvent.hierarchy_refresh]: cargo => { mainHierarchy.set("cargo", cargo); },
}

const contextMenu = {
    "New SceneObject": {
        "Empty": function () { notImplemented(); },
        "Cube": function () { eventHandler.sendMessageToParent(UiEvent.hierarchy_new_sceneobject, { modelId: "default_cube.model" }); },
        "Sphere": function () { eventHandler.sendMessageToParent(UiEvent.hierarchy_new_sceneobject, { modelId: "default_sphere.model" }); },
        "Plane": function () { eventHandler.sendMessageToParent(UiEvent.hierarchy_new_sceneobject, { modelId: "default_plane.model" }); },
        "Jet": function () { eventHandler.sendMessageToParent(UiEvent.hierarchy_new_sceneobject, { modelId: "jet.model" }); },
    }
}

const eventHandler = new UiEventHandler(handler, contextMenu);

Canvas.addToHUD(mainHierarchy);