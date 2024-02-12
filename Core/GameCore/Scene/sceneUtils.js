import { DebugToggle } from "../../../settings.js";
import Camera from "../Components/camera.js";
import { LightDirectional } from "../Components/lightDirectional.js";
import { RuntimeGenerator } from "../WebAssembly/runtimeGenerator.js";
import { RunningInstance } from "../runningInstance.js";
import SceneObject from "../sceneObject.js";

export default class SceneUtils {

    static #createCamera(srcCamera) {
        const camera = new Camera(
            true,
            srcCamera.fov,
            srcCamera.near,
            srcCamera.far
        );
        const pos = srcCamera.transform.position;
        const rot = srcCamera.transform.rotation;
        const sca = srcCamera.transform.scale;

        camera.transform.setPosition(pos.x, pos.y, pos.z);
        camera.transform.setScale(sca.x, sca.y, sca.z);
        camera.transform.setRotation(rot.x, rot.y, rot.z);

        return camera;
    }

    static #createLight(srcLight) {
        const light = new LightDirectional(
            srcLight.xRot,
            srcLight.yRot,
            srcLight.width,
            srcLight.height,
            srcLight.depth,
            srcLight.intensity
        );
        light.updateLightInformation();
        LightDirectional.activeLight = light;

        return light;
    }

    static #createSceneObject(srcSO) {
        const so = new SceneObject(srcSO.modelId, srcSO.name ?? "New SceneObject", srcSO.id);
        const pos = srcSO.transform.position;
        const rot = srcSO.transform.rotation;
        const sca = srcSO.transform.scale;

        so.transform.setPosition(pos.x, pos.y, pos.z);
        so.transform.setScale(sca.x, sca.y, sca.z);
        so.transform.setRotation(rot.x, rot.y, rot.z);

        RuntimeGenerator.addSceneObject(so.id);

        return so;
    }

    static #packCamera(srcCamera) {
        return {
            fov: srcCamera.fov,
            near: srcCamera.clipPlaneNear,
            far: srcCamera.clipPlaneFar,
            transform: {
                position: {
                    x: srcCamera.transform.position.x,
                    y: srcCamera.transform.position.y,
                    z: srcCamera.transform.position.z
                },
                rotation: {
                    w: srcCamera.transform.rotation.w,
                    x: srcCamera.transform.rotation.x,
                    y: srcCamera.transform.rotation.y,
                    z: srcCamera.transform.rotation.z
                },
                scale: {
                    x: srcCamera.transform.scale.x,
                    y: srcCamera.transform.scale.y,
                    z: srcCamera.transform.scale.z
                },
                parentId: srcCamera.transform.parent?.sceneObject.id
            }
        }
    }

    static #packLight(srcLight) {
        const lightRotation = srcLight.transform.rotation;
        return {
            xRot: lightRotation.x,
            yRot: lightRotation.y,
            width: srcLight.width,
            height: srcLight.height,
            depth: srcLight.depth,
            intensity: srcLight.intensity
        };
    }

    static #packSceneObject(srcSO) {
        return {
            id: srcSO.id,
            name: srcSO.name,
            modelId: srcSO.modelId,
            transform: {
                position: {
                    x: srcSO.transform.position.x,
                    y: srcSO.transform.position.y,
                    z: srcSO.transform.position.z
                },
                rotation: {
                    w: srcSO.transform.rotation.w,
                    x: srcSO.transform.rotation.x,
                    y: srcSO.transform.rotation.y,
                    z: srcSO.transform.rotation.z
                },
                scale: {
                    x: srcSO.transform.scale.x,
                    y: srcSO.transform.scale.y,
                    z: srcSO.transform.scale.z
                },
                parentId: srcSO.transform.parent?.sceneObject.id
            }
        }
    }

    static #packComponents(srcSO) {
        const soCom = [];
        for (const com of srcSO.components) {
            soCom.push({
                imports: com.imports,
                module: com.module
            });
        }
        return {
            soid: srcSO.id,
            soComponents: soCom,
        };
    }

    static pack(cameras, lights, sceneObjects) {
        const assets = {};
        assets.cameras = [];
        assets.components = [];
        assets.lights = [];
        assets.sceneObjects = [];
        for (const so of sceneObjects) {
            assets.sceneObjects.push(this.#packSceneObject(so));
            assets.components.push(this.#packComponents(so))
        }
        assets.cameras.push(this.#packCamera(cameras[0]));
        assets.lights.push(this.#packLight(lights[0]));

        return assets;
    }

    static unpack = (assets) => {
        const soParentMapping = new Map();
        const camera = this.#createCamera(assets.cameras[0]);
        const light = this.#createLight(assets.lights[0]);

        const sceneObjects = new Map();

        if (DebugToggle.light_ShadowRealm) {
            const [sr, or] = light.getVisualDebug();
            sceneObjects.set(sr.id, sr);
            sceneObjects.set(or.id, or);
        }

        for (const so of assets.sceneObjects) {
            sceneObjects.set(so.id, this.#createSceneObject(so));

            if (so.transform.parentId) {
                soParentMapping.set(so.id, so.transform.parentId);
            }
        }

        if (assets.cameras[0].transform.parentId) camera.transform.parent = sceneObjects.get(assets.cameras[0].transform.parentId).transform;
        for (const [childId, parentId] of soParentMapping) {
            const child = sceneObjects.get(childId).transform;
            const parent = sceneObjects.get(parentId).transform;
            child.parent = parent;
        }

        for (const componentPackage of assets.components) {
            for (const com of componentPackage.soComponents) {
                sceneObjects.get(componentPackage.soid).addComponent({ module: com.module, imports: com.imports });
                RunningInstance.putScript(com.module);
            }
        }

        return {
            cameras: [camera],
            lights: [light],
            sceneObjects: Array.from(sceneObjects.values()),
        };
    }
}