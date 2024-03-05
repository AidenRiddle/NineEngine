import { NavFS } from "../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { Address } from "../../FileSystem/address.js";
import Resources from "../../FileSystem/resources.js";
import { AssetType, DebugToggle, System } from "../../settings.js";
import { ModelStorage } from "../DataStores/modelStore.js";
import { ScriptStorage } from "../DataStores/scriptStore.js";
import { Scene } from "../GameCore/Scene/scene.js";
import { ScriptManager } from "../GameCore/WebAssembly/scriptManager.js";
import { RunningInstance } from "../GameCore/runningInstance.js";
import SceneObject from "../GameCore/sceneObject.js";
import { showContextMenu } from "./contextmenu.js";
import Payload from "./payload.js";
import { UiEvent, UiGroup, UiWindow } from "./uiConfiguration.js";

export default class UiManager {
    static #windows = new Map();
    /** @type {SceneObject} */
    static #activeSceneObject;
    static #handler = {
        [UiEvent.global_visibility_change]: (cargo) => {
            const payload = new Payload(UiEvent.global_visibility_change, cargo);
            this.sendMessage(UiWindow.AssetBrowser, payload);
        },
        [UiEvent.global_context_menu]: (cargo) => {
            this.#assignHandlers(cargo.target, cargo.items);
            showContextMenu(cargo.screenX, cargo.screenY, cargo.items);
        },
        [UiEvent.hierarchy_select]: (cargo) => {
            const so = Scene.getObject(cargo);
            const soModel = ModelStorage.Get(so.modelId);
            const packagedSO = {
                so: {
                    id: so.id,
                    name: so.name
                },
                transform: {
                    pos: [so.transform.position.x, so.transform.position.y, so.transform.position.z],
                    rot: [so.transform.rotation.x, so.transform.rotation.y, so.transform.rotation.z],
                    scale: [so.transform.scale.x, so.transform.scale.y, so.transform.scale.z]
                },
                model: {
                    id: so.modelId,
                    meshId: soModel.meshId,
                    materials: soModel.materials
                },
                components: so.components
            }
            this.#activeSceneObject = so;
            const out = { type: "sceneObject", target: packagedSO };
            const payload = new Payload(UiEvent.inspector_display_properties, out);
            this.sendMessage(UiWindow.Inspector, payload);
        },
        [UiEvent.hierarchy_new_sceneobject]: (cargo) => {
            const so = Scene.Instantiate(cargo.modelId);
            this.#activeSceneObject = so;
        },
        [UiEvent.hierarchy_rename_sceneobject]: (cargo) => {
            this.#activeSceneObject.name = cargo.newName;
            this.syncSceneObjects(Scene.objectsInScene);
            this.#handler[UiEvent.hierarchy_select](this.#activeSceneObject.id);
        },
        [UiEvent.inspector_assetFile_update]: (cargo) => {
            cargo.assetName = Address.asInternal(cargo.assetName);
            const data = JSON.parse(cargo.content);
            let promiseChain;
            if (AssetType.isMaterial(cargo.assetName)) {
                promiseChain = RunningInstance.putMaterial(cargo.assetName, data);
            }
            if (AssetType.isModel(cargo.assetName)) {
                promiseChain = RunningInstance.putModel(cargo.assetName, data);
            }
            promiseChain
                .then((assetContent) => NavFS.write(cargo.assetName, JSON.stringify(assetContent)))
                .then(() => {
                    const payload = new Payload(
                        UiEvent.assetBrowser_select_assetFile,
                        cargo.assetName
                    );
                    this.sendMessage(UiWindow.Inspector, payload);
                })
            // .catch((e) => console.error("Failed to update asset (", cargo.assetName, ").", e));
        },
        [UiEvent.inspector_transform_change]: (cargo) => {
            const newPos = cargo.pos;
            const newRot = cargo.rot;
            const newScale = cargo.scale;
            this.#activeSceneObject.transform.setPosition(newPos[0], newPos[1], newPos[2]);
            this.#activeSceneObject.transform.setRotation(newRot[0], newRot[1], newRot[2]);
            this.#activeSceneObject.transform.setScale(newScale[0], newScale[1], newScale[2]);

            RunningInstance.updateSceneObject(this.#activeSceneObject.id,
                newPos[0], newPos[1], newPos[2],
                newRot[0], newRot[1], newRot[2],
                newScale[0], newScale[1], newScale[2]
            );
        },
        [UiEvent.inspector_script_param_change]: (cargo) => {
            const com = this.#activeSceneObject.components.find((com) => com.module == cargo.module);
            Object.assign(com.imports, cargo.imports);
            console.log(this.#activeSceneObject);
        },
        [UiEvent.inspector_add_script]: (cargo) => {
            const script = ScriptStorage.Get(cargo) ?? ScriptStorage.Get(cargo.substring(2));
            const imports = {};
            for (const [field, value] of Object.entries(script.declarations)) {
                imports[field] = value.initialValue;
            }
            const component = { module: cargo, imports: imports };
            this.#activeSceneObject.addComponent(component);
            console.log(this.#activeSceneObject);
            this.#handler[UiEvent.hierarchy_select](this.#activeSceneObject.id);
        },
        [UiEvent.assetBrowser_select_assetFile]: (cargo) => {
            const out = { type: "assetFile", target: cargo };
            const payload = new Payload(
                UiEvent.inspector_display_properties,
                out
            )
            this.sendMessage(UiWindow.Inspector, payload);
        },
        [UiEvent.assetBrowser_refresh]: (cargo) => {
            const payload = new Payload(UiEvent.assetBrowser_refresh, null);
            this.sendMessage(UiWindow.AssetBrowser, payload);
        },
        [UiEvent.menuBar_compile]: (cargo) => { ScriptManager.Compile(); },
        [UiEvent.menuBar_build]: (cargo) => { Scene.Play(); },
        [UiEvent.menuBar_play]: (cargo) => {
            ScriptManager.Compile()
                .then(() => this.#handler[UiEvent.menuBar_build](cargo));
        },
        [UiEvent.menuBar_upload_image]: (cargo) => {
            RunningInstance.addResource("Textures/eh1.jpg", cargo.url);
            // RunningInstance.quietSave();
            Resources.load(cargo.url, { newFileName: "Textures/eh1.jpg", hardFetch: true });
            // location.reload();
        },
        [UiEvent.menuBar_saveProject]: (cargo) => { RunningInstance.saveProject(); alert("Project saved!"); },

    }

    static start() {
        window.onmessage = (event) => {
            const payload = new Payload(event.data.uiEventCode, event.data.cargo);
            if (DebugToggle.ui_logs) System.log(System.ui_message_prefix, `In  (${event.source.name}):`, payload);
            if (!(payload.uiEventCode in this.#handler)) { console.error("Unhandled UIEvent:", payload.uiEventCode); return; }
            this.#handler[payload.uiEventCode](payload.cargo);
        };
    }

    static sendMessage(recipient, payload) {
        if (!(payload instanceof Payload)) throw new Error("Argument is not of type Payload.");
        if (DebugToggle.ui_logs) System.log(System.ui_message_prefix, `Out (${recipient}):`, payload);
        this.#windows.get(recipient)?.contentWindow.postMessage(payload, "*");
    }

    static addWindow(uiWindow, groupName) {
        const iframe = UiWindow.getFrameFor(uiWindow);
        iframe.id = uiWindow;
        iframe.name = uiWindow;
        this.#windows.set(uiWindow, iframe);
        UiGroup[groupName].appendChild(iframe);
        const promise = new Promise((resolve) => {
            iframe.onload = function () { resolve(iframe); }
        })
        return promise;
    }

    static syncSceneObjects(arrOfSceneObjects) {
        const cargo = arrOfSceneObjects.reduce((map, so) => {
            map[so.id] = { id: so.id, parentId: so.transform.parent?.sceneObject?.id, name: so.name };
            return map;
        }, {});
        const payload = new Payload(UiEvent.hierarchy_refresh, cargo);
        this.sendMessage(UiWindow.Hierarchy, payload);
    }

    static sendGuiUpdate() {
        const payload = new Payload(UiEvent.global_gui_update);
        for (const iframe of this.#windows.values()) {
            iframe.contentWindow.postMessage(payload, "*");
        }
    }

    static #assignHandlers(target, items, prefix = '') {
        for (const [key, value] of Object.entries(items)) {
            if (value == null)
                items[key] = () => this.sendMessage(target, new Payload(UiEvent.global_context_menu, { selection: prefix + key }));
            else
                this.#assignHandlers(target, value, prefix + key + '.');
        }
    }
}