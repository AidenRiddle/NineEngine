"use strict";

import GraphicsEngine from "./Core/GECore/ge.js";
import Debug from "./Core/GECore/Util/debug.js";
import GEInstanceDB from "./FileSystem/geInstanceDB.js";
import Resources from "./FileSystem/resources.js";

import { MaterialStorage } from "./Core/DataStores/materialStore.js";
import { MeshStorage } from "./Core/DataStores/meshStore.js";
import { ModelStorage } from "./Core/DataStores/modelStore.js";
import { ProgramStorage } from "./Core/DataStores/programStore.js";
import { SceneStorage } from "./Core/DataStores/sceneStore.js";
import { ScriptStorage } from "./Core/DataStores/scriptStore.js";
import { ShaderStorage } from "./Core/DataStores/shaderStore.js";
import { TextureStorage } from "./Core/DataStores/textureStore.js";
import Camera from "./Core/GameCore/Components/camera.js";
import { defaultInputScheme } from "./Core/GameCore/Input/editorInputScheme.js";
import { InputManager } from "./Core/GameCore/Input/input.js";
import { runtimeInputScheme } from "./Core/GameCore/Input/runtimeInputScheme.js";
import { RunningInstance } from "./Core/GameCore/runningInstance.js";
import { Scene } from "./Core/GameCore/Scene/scene.js";
import { ScriptGlobals } from "./Core/GameCore/WebAssembly/scriptGlobals.js";
import UiManager from "./Core/UICore/uiManager.js";
import { UiEvent, UiWindow } from "./Core/UICore/uiConfiguration.js";
import { EventController } from "./eventController.js";
import { AppSettings, Stash, System } from "./settings.js";
import { NavFS } from "./FileSystem/FileNavigator/navigatorFileSystem.js";
import Gpu from "./Core/GECore/Gpu/gpu.js";
import { WorkerManager } from "./Core/Worker/workerManager.js";
import { Canvas } from "./Core/UICore/gui.js";

class Main {
    /** @type {HTMLCanvasElement} */
    #canvas;

    #gl;
    #geInstanceDB;

    #saveFileName = "saved_running_instance";
    #runningInstance;

    #loadUi() {
        UiManager.start();
        return Promise.all([
            UiManager.addWindow(UiWindow.MenuBar, "header"),
            UiManager.addWindow(UiWindow.Hierarchy, "middleTop"),
            UiManager.addWindow(UiWindow.View, "middleTop"),
            UiManager.addWindow(UiWindow.Inspector, "middleTop"),
            UiManager.addWindow(UiWindow.AssetBrowser, "middleBottom"),
        ]);
    }

    async #loadModules() {
        const childWindow = document.getElementById(UiWindow.View).contentWindow;
        this.#canvas = childWindow.document.querySelector("#RenderCanvas");

        const gpu = new Gpu(this.#canvas);
        this.#gl = new GraphicsEngine(gpu);

        InputManager.initialize(this.#canvas);

        this.#canvas.ownerDocument.body.onresize = this.#resizeView;

        AppSettings.display_width = childWindow.innerWidth;
        AppSettings.display_height = childWindow.innerHeight;
        this.#canvas.width = AppSettings.render_width;
        this.#canvas.height = AppSettings.render_height;

        this.#geInstanceDB = new GEInstanceDB();
        await Resources.open(this.#geInstanceDB);

        console.log("Loaded Modules ...");
    }

    #loadFromRunningInstance() {
        return RunningInstance.initialize(
            () => this.#geInstanceDB.get("runningInstances", "The one running instance to rule them all"),
            (data) => this.#geInstanceDB.store("runningInstances", data))
            .then(() => {
                Scene.changeScene(RunningInstance.activeScene);
            })
            .finally(() => {
                console.log("Successfully unpacked running instance ...");
            })

    }

    #resizeView = (event) => {
        const childWindow = document.getElementById(UiWindow.View).contentWindow;
        AppSettings.display_width = childWindow.innerWidth;
        AppSettings.display_height = childWindow.innerHeight;

        Debug.Log("Screen resolution: ", AppSettings.display_width, AppSettings.display_height);
        Debug.Log("Render resolution: ", AppSettings.render_width, AppSettings.render_height);

        this.#canvas.width = AppSettings.render_width;
        this.#canvas.height = AppSettings.render_height;

        this.#gl.resizeViewport(AppSettings.display_width, AppSettings.display_height);
        Camera.activeCamera.setAspectRatio(AppSettings.aspect_ratio);
    }

    getSceneObject(id) {
        return Scene.getObject(id);
    }

    saveRunningInstance = () => {
        console.log("Saving...");
        return RunningInstance.saveProject();
    }

    defineEngineCycle(eventController) {
        const cycleName = "engineCycle";
        const targetDeltaTime = (System.target_frame_rate != 0) ? 1000 / System.target_frame_rate : 0;
        eventController.addCycle(cycleName, targetDeltaTime, this.engineCycleDelegate);
        eventController.enableCycle(cycleName);
    }

    defineGuiCycle(eventController) {
        const cycleName = "guiCycle";
        const targetDeltaTime = 1000 / System.target_gui_frame_rate;
        eventController.addCycle(cycleName, targetDeltaTime, (startOfThisFrame, deltaTime) => { Canvas.repaint(); UiManager.sendGuiUpdate(); });
        eventController.enableCycle(cycleName);
    }

    engineCycleDelegate = (startOfThisFrame, deltaTime) => {
        ScriptGlobals.deltaTime.value = deltaTime;
        ScriptGlobals.timeSinceStartup.value += deltaTime;

        InputManager.Update();
        Scene.Update();
        const scriptEndTime = performance.now();

        Scene.Draw();
        const renderEndTime = performance.now();

        this.logFrameInfo(startOfThisFrame, deltaTime, scriptEndTime, renderEndTime);
    }

    logFrameInfo(startTime, deltaTime, scriptEndTime, renderEndTime) {
        const frameTime = ~~(renderEndTime - startTime);
        Debug.Log("Camera forward:", Camera.activeCamera.transform.forward);
        Debug.Log("Last Script Time (ms): ", ~~(scriptEndTime - startTime));
        Debug.Log("Last Render Time (ms): ", ~~(renderEndTime - scriptEndTime));
        Debug.Log("Total Frame Time (ms): ", frameTime);
        Debug.Log("Delta Time: ", deltaTime);
        Debug.Average("Avg FPS:", 1 / Debug.GetAverage("Avg Delta Time:"));
        Debug.Average("Avg Delta Time:", deltaTime);
    }

    logApplicationInfo(startTime) {
        const gpuLog = {
            "TotalBufferAllocationSize": Gpu.bufferAllocation
        }
        console.log("Finished loading in " + (~~performance.now() - startTime) + "ms",
            "\n",
            "\nGpu:", gpuLog,
            "\n",
            "\nMaterials:", MaterialStorage.debug(),
            "\nMeshes:", MeshStorage.debug(),
            "\nModels:", ModelStorage.debug(),
            "\nPrograms:", ProgramStorage.debug(),
            "\nScenes:", SceneStorage.debug(),
            "\nScripts:", ScriptStorage.debug(),
            "\nShaders:", ShaderStorage.debug(),
            "\nTextures:", TextureStorage.debug(),
            "\n",
            "\nStarting application...");
        Debug.Log("Screen resolution: ", AppSettings.display_width, AppSettings.display_height);
        Debug.Log("Render resolution: ", AppSettings.render_width, AppSettings.render_height);
        Debug.Log("Pixels Per Unit: ", AppSettings.pixels_per_unit);
        Debug.Log("Screen Space mouse: ", 0, 0);
        Debug.Log("World Space mouse: ", 0, 0);
    }

    async runFixtures() {
        const projectFolderFound = await NavFS.isReady();
        if (projectFolderFound) {
            const fixtures = await Resources.fetchAsJson(Stash.fixtures, { hardFetch: true, cacheResult: false });
    
            function recur(path, dir) {
                const promises = [];
                for (const [key, value] of Object.entries(dir)) {
                    const newPath = path + "/" + key;
                    if (typeof value == 'object') {
                        promises.push(NavFS.mkdir(newPath).then(() => recur(newPath, value)));
                    } else {
                        let data;
                        try { data = atob(value); }     // Depending on file format (.jpg, .glb, etc), file data could be Base64 encoded
                        catch (e) { data = value; }     // If not, write the data as is.
                        promises.push(NavFS.put(newPath, data));
                    }
                }
                return Promise.all(promises);
            }
            return recur("./NineEngine", fixtures);
        } else {
            return Promise.resolve();
        }
    }

    Main = async () => {
        const startTime = ~~performance.now();
        console.group("Core Boot Log");

        // window.open('debug.html', "tab", "popup");
        Debug.ToggleDebugMode();

        await this.#loadUi()
            .then(() => this.#loadModules())
            .then(() => this.#loadFromRunningInstance());

        const asyncInitialize = Promise.all([
            this.runFixtures()
        ]);

        // Resources.fetchRaw("3DModels/vanguard@samba.glb", { cacheResult: false, hardFetch: true })
        // const model = ModelStorage.Get("default_Vanguard");
        // model.setMeshId("3DModels/vanguard.glb");
        // model.setMaterials(["Vanguard"]);

        defaultInputScheme();
        runtimeInputScheme();

        Scene.Start();
        this.#resizeView();

        const eventController = new EventController();
        this.defineEngineCycle(eventController);
        this.defineGuiCycle(eventController);
        eventController.start();

        document.addEventListener("visibilitychange", () => {
            eventController.solveAnimationCallback();
            // window.postMessage({ uiEventCode: UiEvent.global_visibility_change, cargo: { hidden: document.hidden } })
        });

        await asyncInitialize;
        this.logApplicationInfo(startTime);
        console.groupEnd();
        console.log("Welcome to Nine Engine !");
    }
}
new Main().Main();