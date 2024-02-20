import { GuiHandle, GuiContext } from "../../gui.js";
import { UiEvent } from "../../uiConfiguration.js";

export class $DropReceiver extends GuiHandle {
    /**
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const expectedType = frag.state("expectedType");
        const value = frag.state("value");
        const onchangeHandler = frag.state("onchangeHandler");

        const receiver = frag.node("input", input => {
            input.id = "receiver-hitbox";
            input.type = "text";
            input.value = value ?? `None (${expectedType})`;
            input.style.width = "260px";
            input.onchange = (e) => onchangeHandler(frag.state("tag"), e.target.value);
        });

        root.append(receiver);
    }
}

export class $Receiver extends GuiHandle {
    /**
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const tag = frag.state("tag");

        root.style.display = "flex";
        root.style.flexDirection = "row";
        root.style.justifyContent = "space-between";
        root.style.alignItems = "center";
        root.style.width = "100%";

        root.append(
            frag.node("p", p => {
                p.textContent = tag;
            })
        );

        $DropReceiver.builder(frag, root);
    }
}

export class $Material extends GuiHandle {
    /**
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const assetName = frag.state("assetName");
        const materialParams = frag.state("materialParams");

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

        frag.bake(root, new $Receiver({
            tag: "Shader",
            expectedType: "shader",
            value: materialParams.shaderId,
            onchangeHandler: saveParam
        }));

        root.append(
            frag.node("p", p => {
                p.textContent = "Textures";
            })
        );

        materialParams.textures.forEach((mat, index) => {
            frag.bake(root, new $Receiver({
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
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const assetName = frag.state("assetName");
        const modelParams = frag.state("modelParams");

        function saveParam(key, value) {
            console.log("Saving Params:", "(" + key + ")", value);
            if (key == "MeshID") {
                if (!value.endsWith("glb")) { window.postMessage({ uiEventCode: UiEvent.inspector_request_error }); return; }
                modelParams.meshId = value;
            } else {
                if (!value.endsWith("mat")) { window.postMessage({ uiEventCode: UiEvent.inspector_request_error }); return; }
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

        frag.bake(root, new $Receiver({
            tag: "MeshID",
            expectedType: "Mesh",
            value: modelParams.meshId,
            onchangeHandler: saveParam,
        }))
        root.append(
            frag.node("p", p => {
                p.textContent = "Materials";
            })
        )

        modelParams.materials.forEach((mat, index) => {
            frag.bake(root, new $Receiver({
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
    }
}