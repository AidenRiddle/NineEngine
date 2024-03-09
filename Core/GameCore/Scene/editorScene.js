import { AppSettings, Key, System } from "../../../settings.js";
import Camera from "../Components/camera.js";
import { LightDirectional } from "../Components/lightDirectional.js";
import { InputManager } from "../Input/input.js";
import { RuntimeGenerator } from "../WebAssembly/runtimeGenerator.js";
import { ScriptManager } from "../WebAssembly/scriptManager.js";
import { RunningInstance } from "../runningInstance.js";
import SceneObject from "../sceneObject.js";
import PlayScene from "./playScene.js";
import { Scene } from "./scene.js";
import SceneUtils from "./sceneUtils.js";

export default class EditorScene {
    #ge;

    #objectsInScene = [];
    #dirtySceneObjects = [];

    camera = new Camera(true, AppSettings.field_of_view);

    get objs() { return this.#objectsInScene; }

    constructor(graphicsEngine, assets = undefined) {
        this.#ge = graphicsEngine;
        if (assets) {
            this.#objectsInScene = assets.sceneObjects;
            this.camera = assets.cameras[0];
            LightDirectional.activeLight = assets.lights[0];
        }
    }

    getObject(id) { return this.#objectsInScene.find(el => el.id === id); }

    /**
     * @param {SceneObject} mesh
     * @param {{id, parentId, posX, posY, posZ, scaleX, scaleY, scaleZ, rotX, rotY, rotZ}} params
     */
    Instantiate(modelId, params = undefined) {
        const so = new SceneObject(modelId, params?.name ?? "New SceneObject", params?.id);

        if (params) {
            so.transform.setPosition(params.posX ?? 0, params.posY ?? 0, params.posZ ?? 0);
            so.transform.setScale(params.scaleX ?? 1, params.scaleY ?? 1, params.scaleZ ?? 1);
            so.transform.setRotationEuler(params.rotX ?? 0, params.rotY ?? 0, params.rotZ ?? 0);
            if (params.parentId) {
                const parent = this.getObject(params.parentId);
                so.transform.parent = parent?.transform;
            }
        }

        this.#objectsInScene.push(so);
        this.#dirtySceneObjects.push(so);

        const pack = SceneUtils.pack(this);
        RunningInstance.updateScene(Scene.activeSceneName, pack);

        return so;
    }

    Delete(so) {
        if (so.transform.children.length > 0) {
            for (const child of so.transform.children) {
                child.transform.setParent(null);
            }
        }
        const index = this.#objectsInScene.findIndex(m => m.id == so.id);
        this.#objectsInScene.splice(index, 1);
        return null;
    }

    DeleteWithChildren(so) {
        if (so.transform.children.length > 0) {
            for (const child of so.transform.children) {
                this.DeleteWithChildren(child);
            }
        }
        return this.Delete(so);
    }

    #cleanDirtySceneObjects = () => {
        Camera.activeCamera.transform.updateWorldMatrix();
        LightDirectional.activeLight.updateLightInformation();
        while (this.#dirtySceneObjects.length > 0) {
            const so = this.#dirtySceneObjects.pop();
            so.transform.updateWorldMatrix();
        }
    }

    #SceneEventBeforeRender() {
        this.#cleanDirtySceneObjects();
        // this.getObject("p4nz").armature.root.rotateBy(0, 1, 0);
        // this.getObject("p4nz").armature.update();
    }

    #SceneEventAfterRender() {

    }

    Start = () => {
        Camera.activeCamera = this.camera;
        const inputState = InputManager.getState(System.input_state_editor);
        inputState.onPress("j", () => { this.getObject("p4nz").armature.root.scaleBy(0, 0.1, 0); });
    }

    Update = () => {
        for (const so of this.#objectsInScene) {
            this.#dirtySceneObjects.push(so);
        }
    }

    Draw = () => {
        this.#SceneEventBeforeRender();
        this.#ge.QueueSceneRender(this.#objectsInScene, Camera.activeCamera.getViewProjection());
        this.#SceneEventAfterRender();
    }

    PackAndPlay() {
        const pack = SceneUtils.pack(this);
        Camera.activeCamera = this.camera;
        const assets = SceneUtils.unpack(pack);
        return ScriptManager.Build(pack.components)
            .then(() => new PlayScene(this.#ge, assets))
    }
}