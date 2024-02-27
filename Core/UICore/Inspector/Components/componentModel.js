import { AssetType } from "../../../../settings.js";
import { GuiHandle, GuiContext } from "../../gui.js";
import { UiEvent } from "../../uiConfiguration.js";
import { notImplemented } from "../../uiUtil.js";

export class $DropReceiver extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const expectedType = gui.state("expectedType");
        const value = gui.state("value");
        const onchangeHandler = gui.state("onchangeHandler");

        const receiver = gui.node("input", input => {
            input.id = "receiver-hitbox";
            input.type = "text";
            input.value = value ?? `None (${expectedType})`;
            input.style.width = "260px";
            input.onchange = (e) => onchangeHandler(gui.state("tag"), e.target.value);
        });

        root.append(receiver);
    }
}

export class $Receiver extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const tag = gui.state("tag");

        root.style.display = "flex";
        root.style.flexDirection = "row";
        root.style.justifyContent = "space-between";
        root.style.alignItems = "center";
        root.style.width = "100%";

        root.append(
            gui.node("p", p => {
                p.textContent = tag;
            })
        );

        $DropReceiver.builder(gui, root);
    }
}

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
                if (!value.endsWith("jpg")) { window.postMessage({ uiEventCode: UiEvent.inspector_request_error }); return; }
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