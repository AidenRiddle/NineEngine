import { UiEvent } from "../uiConfiguration.js";
import { notImplemented } from "../uiUtil.js";
import { UiEventHandler } from "../uiEventHandler.js";
import { $Folder } from "./Components/item.js";
import { Canvas, GuiHandle, GuiContext } from "../gui.js";

function clickHandler(so) { eventHandler.sendMessageToParent(UiEvent.hierarchy_select, so); }

export class $Hierarchy extends GuiHandle {
    /**
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const cargo = frag.state("cargo");
        const soMap = new Map();
        const parents = new Map();
        const orphans = [];
        for (const [id, so] of Object.entries(cargo)) {
            const folder = new $Folder({
                value: so.name,
                subfolders: [],
                callback: () => { clickHandler(id); }
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
        frag.bake(root, orphans);
    }
}

const mainHierarchy = new $Hierarchy({ "cargo": {} });
const handler = {
    [UiEvent.hierarchy_refresh]: cargo => { mainHierarchy.set("cargo", cargo); Canvas.repaint() },
}

const contextMenu = {
    "New SceneObject": {
        "Empty": function () { notImplemented(); },
        "Cube": function () { eventHandler.sendMessageToParent(UiEvent.hierarchy_new_sceneobject, { modelId: "default_Cube.model" }); },
        "Sphere": function () { eventHandler.sendMessageToParent(UiEvent.hierarchy_new_sceneobject, { modelId: "default_Sphere.model" }); },
        "Plane": function () { eventHandler.sendMessageToParent(UiEvent.hierarchy_new_sceneobject, { modelId: "default_Plane.model" }); },
        "Jet": function () { eventHandler.sendMessageToParent(UiEvent.hierarchy_new_sceneobject, { modelId: "default_Jet.model" }); },
    }
}

const eventHandler = new UiEventHandler(handler, contextMenu);

Canvas.addToHUD(mainHierarchy);