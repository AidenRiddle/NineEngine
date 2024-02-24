import { Canvas, GuiContext, GuiHandle } from "../gui.js";
import { UiEvent } from "../uiConfiguration.js";
import { UiEventHandler } from "../uiEventHandler.js";
import { notImplemented } from "../uiUtil.js";
import { $Card } from "./Components/card.js";
import { $Material, $Model } from "./Components/componentModel.js";
import { $Script } from "./Components/componentScript.js";
import { $Transform } from "./Components/componentTransform.js";
import { $SceneObjectDescriptor } from "./Components/sceneObjectDescriptor.js";

export class $Inspector extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const cargo = gui.state("cargo");
        if (cargo == null) return;

        root.style.padding = "10px";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignSelf = "stretch";

        if (cargo.assetName?.endsWith("mat")) this.assetBrowserSelectMaterial(gui, root, cargo);
        else if (cargo.assetName?.endsWith("model")) this.assetBrowserSelectModel(gui, root, cargo);
        else this.hierarchySelect(gui, root, cargo);
    }

    static assetBrowserSelectMaterial(gui, root, cargo) {
        gui.bake(root, new $Card({
            title: "Material",
            isEnableable: false,
            content: new $Material({ assetName: cargo.assetName, materialParams: JSON.parse(cargo.content) })
        }));
    }

    static assetBrowserSelectModel(gui, root, cargo) {
        gui.bake(root, new $Card({
            title: "Model",
            isEnableable: false,
            content: new $Model({ assetName: cargo.assetName, modelParams: JSON.parse(cargo.content) })
        }))
    }

    static hierarchySelect(gui, root, cargo) {
        gui.bake(root, new $SceneObjectDescriptor({ soName: cargo.so.name }));
        gui.bake(root, new $Card({
            title: "Transform",
            isEnableable: false,
            content: new $Transform({ transformParams: cargo.transform })
        }))
        gui.bake(root, new $Card({
            title: "Model",
            isEnableable: false,
            content: new $Model({ assetName: cargo.model.id, modelParams: cargo.model })
        }))
        cargo.components.forEach((com) => {
            gui.bake(root, new $Card({
                title: com.module,
                isEnableable: false,
                content: new $Script({ com })
            }));
        })
    }
}

const inspector = new $Inspector();
Canvas.addToHUD(inspector);
// Canvas.createContextFrom(inspector);
Canvas.repaint();

const handler = {
    [UiEvent.inspector_request_error]: () => { console.log("You suck"); },
    [UiEvent.assetBrowser_select_assetFile]: (cargo) => { inspector.set("cargo", cargo); Canvas.repaint(); },
    [UiEvent.hierarchy_select]: (cargo) => { inspector.set("cargo", cargo); Canvas.repaint(); },
}

const contextMenu = {
    "Add component": {
        "Script": () => { notImplemented(); }
    },
}

const eventHandler = new UiEventHandler(handler, contextMenu);