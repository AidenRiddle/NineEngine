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
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const cargo = frag.state("cargo");
        if (cargo == null) return;

        root.style.padding = "10px";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignSelf = "stretch";

        if (cargo.assetName?.endsWith("mat")) this.assetBrowserSelectMaterial(frag, root, cargo);
        else if (cargo.assetName?.endsWith("model")) this.assetBrowserSelectModel(frag, root, cargo);
        else this.hierarchySelect(frag, root, cargo);
    }

    static assetBrowserSelectMaterial(frag, root, cargo) {
        frag.bake(root, new $Card({
            title: "Material",
            isEnableable: false,
            content: new $Material({ assetName: cargo.assetName, materialParams: JSON.parse(cargo.content) }).getNode()
        }));
    }

    static assetBrowserSelectModel(frag, root, cargo) {
        frag.bake(root, new $Card({
            title: "Model",
            isEnableable: false,
            content: new $Model({ assetName: cargo.assetName, modelParams: JSON.parse(cargo.content) }).getNode()
        }))
    }

    static hierarchySelect(frag, root, cargo) {
        frag.bake(root, new $SceneObjectDescriptor({ soName: cargo.so.name }));
        frag.bake(root, new $Card({
            title: "Transform",
            isEnableable: false,
            content: new $Transform({ transformParams: cargo.transform }).getNode()
        }))
        frag.bake(root, new $Card({
            title: "Model",
            isEnableable: false,
            content: new $Model({ assetName: cargo.model.id, modelParams: cargo.model }).getNode()
        }))
        cargo.components.forEach((com) => {
            frag.bake(root, new $Card({
                title: com.module,
                isEnableable: false,
                content: new $Script({ com }).getNode()
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