import { AppSettings } from "../../../settings.js";
import Camera from "../Components/camera.js";
import { LightDirectional } from "../Components/lightDirectional.js";
import { ScriptManager } from "../WebAssembly/scriptManager.js";
import SceneObject from "../sceneObject.js";

export default class PlayScene {
    #ge;

    #objectsInScene = [];
    #dirtySceneObjects = [];

    camera = new Camera(true, AppSettings.field_of_view);

    get objs() {
        return this.#objectsInScene;
    }

    constructor(graphicsEngine, assets = undefined) {
        this.#ge = graphicsEngine;
        if (assets) {
            this.#objectsInScene = assets.sceneObjects;
            this.camera = assets.cameras[0];
            LightDirectional.activeLight = assets.lights[0];
        }
    }

    getObject(id) {
        return this.#objectsInScene.find(el => el.id === id);
    }

    /**
     * @param {SceneObject} mesh
     * @param {{id, parentId, posX, posY, posZ, scaleX, scaleY, scaleZ, rotX, rotY, rotZ}} params
     */
    Instantiate(modelId, params = undefined) {
        const so = new SceneObject(modelId, params.name ?? "New SceneObject", params?.id);

        if (params) {
            so.transform.setPosition(params.posX ?? 0, params.posY ?? 0, params.posZ ?? 0);
            so.transform.setScale(params.scaleX ?? 1, params.scaleY ?? 1, params.scaleZ ?? 1);
            so.transform.setRotationEuler(params.rotX ?? 0, params.rotY ?? 0, params.rotZ ?? 0);
        }

        this.#objectsInScene.push(so);
        this.#dirtySceneObjects.push(so);

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
        while (this.#dirtySceneObjects.length > 0) {
            const so = this.#dirtySceneObjects.pop();
            so.transform.updateWorldMatrix();
        }
    }

    #SceneEventBeforeRender() {
        this.#cleanDirtySceneObjects();
    }

    #SceneEventAfterRender() {

    }

    Bind = (so) => {
        ScriptManager.bindSceneObject(so);
    }

    Start = () => {
        this.#objectsInScene.forEach(so => this.Bind(so));
        Camera.activeCamera = this.camera;
        const cameraTarget = this.getObject("cam1");
        if (cameraTarget != null) {
            this.camera.transform.parent = cameraTarget.transform;
            this.camera.transform.setPosition(0, 0, 0);
            this.camera.transform.setRotation(0, 0, 0);
        }
        ScriptManager.start();
    }

    Update = () => {
        ScriptManager.update();
    }

    Stop = () => {
        ScriptManager.stop();
    }

    Draw = () => {
        this.#SceneEventBeforeRender();
        this.#ge.QueueSceneRender(this.#objectsInScene, Camera.activeCamera.getViewProjection());
        this.#SceneEventAfterRender();
    }
}