import Resources from "../../../FileSystem/resources.js";
import { Stash, System } from "../../../settings.js";
import { SceneStorage } from "../../DataStores/sceneStore.js";
import UiManager from "../../UICore/uiManager.js";
import { InputManager } from "../Input/input.js";
import SceneObject from "../sceneObject.js";

export class Scene {
    static #activeScene;
    static #activeSceneName;

    static get activeSceneName() { return this.#activeSceneName; }
    static get objectsInScene() { return this.#activeScene.objs; }

    static getObject(id) {
        return this.#activeScene.getObject(id);
    }

    static changeScene(sceneName) {
        const newScene = SceneStorage.Get(sceneName);
        if (newScene != null) {
            this.#activeScene = SceneStorage.Get(sceneName);
            this.#activeSceneName = sceneName;
            UiManager.syncSceneObjects(this.objectsInScene);
            this.Start();
        } else {
            console.error(`Scene (${sceneName}) not found.`);
        }
    }

    static createNewScene(sceneName) {
        return Resources.fetchAsJson(Stash.default_running_instance, { hardFetch: true, cacheResult: false })
            .then((ri) => {
                ri[sceneName] = ri["defaultScene"];
                delete ri["defaultScene"];
                console.log(ri["defaultScene"]);
                return SceneStorage.unpack(ri.scenes);
            });
    }

    static pack() {
        return this.#activeScene.pack();
    }

    /**
     * @param {SceneObject} mesh
     * @param {{id, parentId, posX, posY, posZ, scaleX, scaleY, scaleZ, rotX, rotY, rotZ}} params
     */
    static Instantiate(modelId, params = undefined) {
        const newSo = this.#activeScene.Instantiate(modelId, params);
        UiManager.syncSceneObjects(this.objectsInScene);

        return newSo;
    }

    static Bind(soid, waModuleName, waModuleImports) { return this.#activeScene.Bind(soid, waModuleName, waModuleImports); }

    static Delete(soid) { return this.#activeScene.Delete(this.#activeScene.getObject(soid)); }

    static DeleteWithChildren(soid) { this.#activeScene.DeleteWithChildren(this.#activeScene.getObject(soid)); }

    static Start() { this.#activeScene.Start(); }

    static Update() {
        try {
            this.#activeScene.Update();
        } catch (e) {
            console.error(e);
            this.Stop();
        }
    }

    static Draw() { this.#activeScene.Draw(); }

    static Play() {
        console.groupCollapsed("Build Log");
        const startTime = ~~performance.now();

        const devScene = this.#activeScene;
        this.Stop = function () {
            console.log("Exiting Play Mode.", devScene);
            this.#activeScene.Stop();

            InputManager.enableState(System.input_state_editor);
            InputManager.disableState(System.input_state_runtime);
            InputManager.getState(System.input_state_runtime).resetMap();
            InputManager.freeCursor();

            this.#activeScene = devScene;
            this.#activeScene.Start();
            this.Stop = function () { console.error("Active Scene is not in Play Mode"); }
        };
        this.#activeScene.PackAndPlay()
            .then((playScene) => {
                console.groupEnd();
                console.log("Build Finished in " + (~~performance.now() - startTime) + "ms. Entering Play Mode.", playScene);

                InputManager.disableState(System.input_state_editor);
                InputManager.enableState(System.input_state_runtime);
                InputManager.getState(System.input_state_runtime).onPress('o', () => { this.Stop(); });

                this.#activeScene = playScene;
                try {
                    this.#activeScene.Start();
                } catch (e) {
                    console.error(e);
                    console.error("ABORTING. Exiting Play Mode.")
                    this.Stop();
                }
            })
    }

    static Stop() { console.error("Active Scene is not in Play Mode"); }
}