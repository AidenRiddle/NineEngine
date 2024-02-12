import { Key, System } from "../../../settings.js";
import Vector3 from "../../Math/vector3.js";
import Debug from "../../GECore/Util/debug.js";
import Camera from "../Components/camera.js";
import { LightDirectional } from "../Components/lightDirectional.js";
import { ScriptGlobals } from "../WebAssembly/scriptGlobals.js";
import { InputManager, InputModifier } from "./input.js";

// Try incorporating e.preventDefault();
document.body.onmousedown = function () { return false };  //Disables the scroll 'compass' when clicking with middle mouse

export function defaultInputScheme() {
    const inputState = InputManager.createState(System.input_state_editor);
    inputState.onPress('m', () => { this.saveRunningInstance(); });
    inputState.onPress('p', () => { Debug.Clear(); Scene.Play(); });
    inputState.onPress('c', () => { Debug.ToggleDebugMode(); });
    inputState.onHeld('b', () => { LightDirectional.activeLight.transform.rotateBy(80 * ScriptGlobals.deltaTime.value, 0, 0); });

    inputState.onPress('0', () => { Camera.activeCamera.isPerspective = !Camera.activeCamera.isPerspective; });
    inputState.onPress('1', () => {
        const oldCamera = Camera.activeCamera;
        Camera.activeCamera = LightDirectional.activeLight;

        inputState.onPress('2', () => { if (Camera.activeCamera == LightDirectional.activeLight) Camera.activeCamera = oldCamera; });
    });

    let cameraSpeed = 2;
    let cameraRotation = 80;
    inputState.onHeld('w', () => { Camera.activeCamera.transform.translateByVector(Camera.activeCamera.transform.forward.scale(cameraSpeed * ScriptGlobals.deltaTime.value)); });
    inputState.onHeld('a', () => { Camera.activeCamera.transform.translateByVector(Camera.activeCamera.transform.left.scale(cameraSpeed * ScriptGlobals.deltaTime.value)); });
    inputState.onHeld('s', () => { Camera.activeCamera.transform.translateByVector(Camera.activeCamera.transform.back.scale(cameraSpeed * ScriptGlobals.deltaTime.value)); });
    inputState.onHeld('d', () => { Camera.activeCamera.transform.translateByVector(Camera.activeCamera.transform.right.scale(cameraSpeed * ScriptGlobals.deltaTime.value)); });
    inputState.onHeld('e', () => { Camera.activeCamera.transform.translateByVector(Vector3.up.scale(cameraSpeed * ScriptGlobals.deltaTime.value)); });
    inputState.onHeld('q', () => { Camera.activeCamera.transform.translateByVector(Vector3.down.scale(cameraSpeed * ScriptGlobals.deltaTime.value)); });

    inputState.onPress(Key.shift, () => { cameraSpeed = 5; });
    inputState.onLift(Key.shift, () => { cameraSpeed = 2; });

    inputState.onHeld(Key.arrowRight, () => { Camera.activeCamera.transform.rotation.y += -cameraRotation * ScriptGlobals.deltaTime.value; });
    inputState.onHeld(Key.arrowLeft, () => { Camera.activeCamera.transform.rotation.y += cameraRotation * ScriptGlobals.deltaTime.value; });

    inputState.onHeld(Key.arrowUp, () => { Camera.activeCamera.transform.rotateBy(cameraRotation * ScriptGlobals.deltaTime.value, 0, 0) });
    inputState.onHeld(Key.arrowDown, () => { Camera.activeCamera.transform.rotateBy(-cameraRotation * ScriptGlobals.deltaTime.value, 0, 0) });

    inputState.onLift(Key.scrollUp, () => { Camera.activeCamera.setFov(Camera.activeCamera.fov - System.camera_zoom_step); });
    inputState.onPress(Key.scrollDown, () => { Camera.activeCamera.setFov(Camera.activeCamera.fov + System.camera_zoom_step); });

    const sensitivity = 0.1;
    inputState.onPress(Key.alt, (inpDesc) => { InputManager.lockCursor(); });
    inputState.onLift(Key.alt, (inpDesc) => { InputManager.freeCursor(); }, InputModifier.ml);
    inputState.onMouseMove((inpDesc) => {
        let dx = inpDesc.deltaX;
        let dy = inpDesc.deltaY;
        Camera.activeCamera.transform.rotateBy(dy * sensitivity, 0, 0);
        Camera.activeCamera.transform.rotation.y -= dx * sensitivity;
    }, InputModifier.ml + InputModifier.alt);

    InputManager.enableState(System.input_state_editor);
}