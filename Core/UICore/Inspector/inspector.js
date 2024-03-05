import { NavFS } from "../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { AssetType, System } from "../../../settings.js";
import { Canvas, GuiContext, GuiHandle } from "../gui.js";
import { UiEvent } from "../uiConfiguration.js";
import { UiEventHandler } from "../uiEventHandler.js";
import { notImplemented } from "../../../methods.js";
import { $Card } from "./Components/card.js";
import { $Model } from "./Components/componentModel.js";
import { $Script } from "./Components/componentScript.js";
import { $Transform } from "./Components/componentTransform.js";
import { $SceneObjectDescriptor } from "./Components/sceneObjectDescriptor.js";
import { $Image } from "./Components/imagePreviewer.js";
import { $Material } from "./Components/componentMaterial.js";
import { $DragReceiver } from "../Common/commonGui.js";

export class $Inspector extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static async builder(gui, root, handle) {
        const cargo = gui.state("cargo");
        if (cargo == null) return;

        root.style.padding = "10px";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignSelf = "stretch";

        if (cargo.type == "assetFile") {
            if (AssetType.isMaterial(cargo.target)) {
                const content = await NavFS.readFileAsText(cargo.target);
                this.assetBrowserSelectMaterial(gui, root, cargo.target, content);
            }
            else if (AssetType.isModel(cargo.target)) {
                const content = await NavFS.readFileAsText(cargo.target);
                this.assetBrowserSelectModel(gui, root, cargo.target, content);
            }
            else if (AssetType.isImage(cargo.target)) {
                this.assetBrowserSelectImage(gui, root, cargo.target);
            } else {
                System.error(System.ui_message_prefix, "Unknown asset type:", cargo.target);
                gui.abortBuild();
            }
        } else if (cargo.type == "sceneObject") {
            this.hierarchySelect(gui, root, cargo.target);
            handle.set("onItemDrop", (dt) => {
                const assetFilePath = dt.getData("assetFilePath");
                if (assetFilePath != "" && AssetType.isScript(assetFilePath)) {
                    eventHandler.sendMessageToParent(UiEvent.inspector_add_script, assetFilePath);
                }
            });

            $DragReceiver.builder(gui, root, handle);
        } else {
            System.error(System.ui_message_prefix, "Unknown cargo type:", cargo.type);
        }
    }

    static assetBrowserSelectMaterial(gui, root, assetName, content) {
        gui.bake(root, new $Card({
            title: "Material",
            isEnableable: false,
            content: new $Material({ assetName, materialParams: JSON.parse(content) })
        }));
    }

    static assetBrowserSelectModel(gui, root, assetName, content) {
        gui.bake(root, new $Card({
            title: "Model",
            isEnableable: false,
            content: new $Model({ assetName, modelParams: JSON.parse(content) })
        }))
    }

    static assetBrowserSelectImage(gui, root, path) {
        const assetName = NavFS.getFileNameFromPath(path);
        const imagePage = new $Image({ assetName, path });
        gui.bake(root, imagePage);
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

const handler = {
    [UiEvent.inspector_request_error]: () => { console.log("You suck"); },
    [UiEvent.inspector_display_properties]: (cargo) => { inspector.set("cargo", cargo); },
    [UiEvent.hierarchy_select]: (cargo) => { inspector.set("cargo", cargo); },
}

const contextMenu = {
    "Add component": {
        "Script": () => { notImplemented(); }
    },
}

const eventHandler = new UiEventHandler(handler, contextMenu);