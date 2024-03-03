import { AssetType } from "../../../../settings.js";
import { GuiContext, GuiHandle } from "../../gui.js";
import { UiEvent } from "../../uiConfiguration.js";
import { $Receiver } from "./valueReceiver.js";

export class $Material extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const assetName = gui.state("assetName");
        const materialParams = gui.state("materialParams");

        function saveParam(key, value) {
            console.log("Saving Params:", key, "(", value, ")");
            if (key == "Shader") {
                if (!value.endsWith("glsl")) { window.postMessage({ uiEventCode: UiEvent.inspector_request_error }); return; }
                materialParams.shaderId = value;
            } else {
                if (!AssetType.isImage(value) && !value.startsWith("http")) { window.postMessage({ uiEventCode: UiEvent.inspector_request_error }); return; }
                materialParams.textures[Number.parseInt(key)] = value;
            }

            parent.postMessage({
                uiEventCode: UiEvent.inspector_assetFile_update,
                cargo: {
                    assetName: assetName,
                    content: JSON.stringify(materialParams)
                }
            })
        }

        root.id = "material-body";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignItems = "center";
        root.style.width = "100%";

        gui.bake(root, new $Receiver({
            tag: "Shader",
            expectedType: "shader",
            value: materialParams.shaderId,
            onchangeHandler: saveParam
        }));

        root.append(
            gui.node("p", p => {
                p.textContent = "Textures";
            })
        );

        materialParams.textures.forEach((mat, index) => {
            gui.bake(root, new $Receiver({
                tag: index.toString(),
                expectedType: "Textures",
                value: mat,
                onchangeHandler: saveParam
            }));
        })
    }
}