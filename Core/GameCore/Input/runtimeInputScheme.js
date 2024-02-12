import { System } from "../../../settings.js";
import { InputManager } from "./input.js";

// Try incorporating e.preventDefault();
document.body.onmousedown = function () { return false };  //Disables the scroll 'compass' when clicking with middle mouse

export function runtimeInputScheme() {
    let inputState = InputManager.createState(System.input_state_runtime);
}