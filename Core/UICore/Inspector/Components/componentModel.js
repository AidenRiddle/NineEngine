import { notImplemented } from "../../../../methods.js";
import { AssetType } from "../../../../settings.js";
import { GuiContext, GuiHandle } from "../../gui.js";
import { UiEvent } from "../../uiConfiguration.js";
import { $Receiver } from "./valueReceiver.js";

export class $Model extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const assetName = gui.state("assetName");
        const modelParams = gui.state("modelParams");

        function saveParam(key, value) {
            console.log("Saving Params:", "(" + key + ")", value);
            if (key == "MeshID") {
                if (!AssetType.isMesh(value)) { window.postMessage({ uiEventCode: UiEvent.inspector_request_error }); return; }
                modelParams.meshId = value;
            } else if (key == "ModelID") {
                notImplemented();
                return;
            } else {
                if (!AssetType.isMaterial(value)) { window.postMessage({ uiEventCode: UiEvent.inspector_request_error }); return; }
                modelParams.materials[Number.parseInt(key)] = value;
            }

            parent.postMessage({
                uiEventCode: UiEvent.inspector_assetFile_update,
                cargo: {
                    assetName: assetName,
                    content: JSON.stringify(modelParams)
                }
            })
        }

        const modelInput = new $Receiver({
            tag: "ModelID",
            expectedType: "Mesh",
            value: assetName,
            onchangeHandler: saveParam,
        });

        const meshInput = new $Receiver({
            tag: "MeshID",
            expectedType: "Mesh",
            value: modelParams.meshId,
            onchangeHandler: saveParam,
        });

        const materialTitle = gui.node("p", p => { p.textContent = "Materials"; });
        const materialSection = [materialTitle];
        modelParams.materials.forEach((mat, index) => {
            materialSection.push(new $Receiver({
                tag: index.toString(),
                expectedType: "Material",
                value: mat,
                onchangeHandler: saveParam
            }));
        })

        root.id = "model-body";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignItems = "center";
        root.style.width = "100%";

        gui.bake(root, modelInput, meshInput, materialSection);
    }
}