import { CanvasInput, Key, System } from "../../../settings.js";
import Debug from "../../GECore/Util/debug.js";
import { ScriptGlobals } from "../WebAssembly/scriptGlobals.js";
import { BitMask } from "../Utils/bitmask.js";

// Alternate keyboard input implementation: https://developer.mozilla.org/en-US/docs/Web/API/Keyboard_API#browser_compatibility
// However, as of today, the KeyboardAPI is still experimental and is not implemented in all browsers.

// https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#navigation_keys

class KeyboardInputDescriptor {
    timestamp;
}

class MouseInputDescriptor extends KeyboardInputDescriptor {
    isLocked = false;

    screenX;
    screenY;

    deltaX;
    deltaY;
}

export const InputModifier = Object.freeze({
    alt: 1 << 0,
    ctrl: 1 << 1,
    shift: 1 << 2,
    ml: 1 << 3,

    debug(flag) {
        let msg = ": ";
        if(BitMask.match(flag, this.ml)) msg += "MouseLock : ";
        if(BitMask.match(flag, this.shift)) msg += "Shift : ";
        if(BitMask.match(flag, this.ctrl)) msg += "Ctrl : ";
        if(BitMask.match(flag, this.alt)) msg += "Alt : ";
        return msg;
    }
});

class InputReader {
    #mouseInputDescriptor = new MouseInputDescriptor();
    #keyboardInputDescriptor = new KeyboardInputDescriptor();

    #targetCallback;

    constructor(targetCallback) { this.#targetCallback = targetCallback; }

    #updateKeyboardInputDescriptor() {
        this.#keyboardInputDescriptor.timestamp = ScriptGlobals.timeSinceStartup.value;
        return this.#keyboardInputDescriptor;
    }

    #updateMouseInputDescriptor(mouseEvent) {
        this.#mouseInputDescriptor.timestamp = ScriptGlobals.timeSinceStartup.value;
        this.#mouseInputDescriptor.screenX = mouseEvent.screenX;
        this.#mouseInputDescriptor.screenY = mouseEvent.screenY;
        this.#mouseInputDescriptor.deltaX = mouseEvent.movementX;
        this.#mouseInputDescriptor.deltaY = mouseEvent.movementY;
        return this.#mouseInputDescriptor;
    }

    //The following methods starting with Lower case letters are methods invoked by Canvas events
    onKeyDown = e => {
        e.preventDefault();
        if (e.repeat) return;
        const key = e.key.toLowerCase();
        this.OnKeyDown(key, this.#updateKeyboardInputDescriptor());
    }
    onKeyUp = e => {
        e.preventDefault();
        const key = e.key.toLowerCase();
        this.OnKeyUp(key, this.#updateKeyboardInputDescriptor());
    }

    onMouseLock = e => { this.OnKeyDown(Key.ml, this.#updateKeyboardInputDescriptor()); }
    onMouseUnlock = e => { this.OnKeyUp(Key.ml, this.#updateKeyboardInputDescriptor()); }
    onMouseMove = e => { this.OnKeyUp(Key.mouseMove, this.#updateMouseInputDescriptor(e)); }

    onMouseDown = e => {
        switch (e.button) {
            case 0: this.OnKeyDown(Key.lmb, this.#updateMouseInputDescriptor(e)); return;
            case 1: this.OnKeyDown(Key.mmb, this.#updateMouseInputDescriptor(e)); return;
            case 2: this.OnKeyDown(Key.rmb, this.#updateMouseInputDescriptor(e)); return;
        }
    }

    onMouseUp = e => {
        switch (e.button) {
            case 0: this.OnKeyUp(Key.lmb, this.#updateMouseInputDescriptor(e)); return;
            case 1: this.OnKeyUp(Key.mmb, this.#updateMouseInputDescriptor(e)); return;
            case 2: this.OnKeyUp(Key.rmb, this.#updateMouseInputDescriptor(e)); return;
        }
    }

    onMouseScroll = e => {
        const trigger = e.deltaY > 0 ? Key.scrollDown : Key.scrollUp;
        const descriptor = this.#updateKeyboardInputDescriptor();
        this.OnKeyDown(trigger, descriptor);
        this.OnKeyUp(trigger, descriptor);
    }

    //The following methods starting with Upper case letters are the handler methods
    OnKeyDown(trigger, descriptor) { this.#targetCallback(true, trigger, descriptor); }
    OnKeyUp(trigger, descriptor) { this.#targetCallback(false, trigger, descriptor); }
}

export class InputState {
    #pressStack = new Set();
    #heldStack = new Set();
    #liftStack = new Set();

    #pressActions = new Map();
    #heldActions = new Map();
    #liftActions = new Map();

    #inputDescriptorStore = new Map();
    #flags = 0;

    #bindAction(inputCode, modifierFlag, actionFunc, actionMap) {
        if (!actionMap.has(inputCode)) actionMap.set(inputCode, new Map());
        actionMap.get(inputCode).set(actionFunc, modifierFlag);
    }

    #execute(inputDescriptor, actions) {
        if (actions == null) return;
        for (const [func, flags] of actions) {
            if (BitMask.match(this.#flags, flags)) {
                try { func(inputDescriptor); }
                catch (e) { console.error(e); }
            } // else { console.error(this.#flags, "|", flags, "|", InputModifier.debug(flags)); }
        }
    }

    onPress(inputCode, actionFunc, modifierFlag = 0) { this.#bindAction(inputCode, modifierFlag, actionFunc, this.#pressActions); }
    onHeld(inputCode, actionFunc, modifierFlag = 0) { this.#bindAction(inputCode, modifierFlag, actionFunc, this.#heldActions); }
    onLift(inputCode, actionFunc, modifierFlag = 0) { this.#bindAction(inputCode, modifierFlag, actionFunc, this.#liftActions); }
    onMouseMove(actionFunc, modifierFlag = 0) { this.onLift(Key.mouseMove, actionFunc, modifierFlag); }

    press(inputCode, inputDescriptor) {
        if (inputCode == Key.alt) { this.#flags = BitMask.add(this.#flags, InputModifier.alt); }
        else if (inputCode == Key.ctrl) { this.#flags = BitMask.add(this.#flags, InputModifier.ctrl); }
        else if (inputCode == Key.shift) { this.#flags = BitMask.add(this.#flags, InputModifier.shift); }
        else if (inputCode == Key.ml) { this.#flags = BitMask.add(this.#flags, InputModifier.ml); }

        this.#inputDescriptorStore.set(inputCode, inputDescriptor);
        this.#pressStack.add(inputCode);
    }

    lift(inputCode, inputDescriptor) {
        if (inputCode == Key.alt) { this.#flags = BitMask.remove(this.#flags, InputModifier.alt); }
        else if (inputCode == Key.ctrl) { this.#flags = BitMask.remove(this.#flags, InputModifier.ctrl); }
        else if (inputCode == Key.shift) { this.#flags = BitMask.remove(this.#flags, InputModifier.shift); }
        else if (inputCode == Key.ml) { this.#flags = BitMask.remove(this.#flags, InputModifier.ml); }

        this.#inputDescriptorStore.set(inputCode, inputDescriptor);
        this.#liftStack.add(inputCode);
    }

    Update() {
        Debug.Log("Inputs: ", ...this.#heldStack);
        for (const inputCode of this.#pressStack) {
            this.#execute(this.#inputDescriptorStore.get(inputCode), this.#pressActions.get(inputCode));

            this.#pressStack.delete(inputCode);
            this.#heldStack.add(inputCode);
        }
        for (const inputCode of this.#heldStack) {
            this.#execute(this.#inputDescriptorStore.get(inputCode), this.#heldActions.get(inputCode));
        }
        for (const inputCode of this.#liftStack) {
            this.#execute(this.#inputDescriptorStore.get(inputCode), this.#liftActions.get(inputCode));

            this.#liftStack.delete(inputCode);
            this.#heldStack.delete(inputCode);
            this.#inputDescriptorStore.delete(inputCode);
        }
    }

    resetMap() {
        this.#pressActions.clear();
        this.#heldActions.clear();
        this.#liftActions.clear();
        console.warn("Input Map has been reset fully.");
    }
}

export class InputManager {
    static #canvas;
    static #inputStates = new Map();
    static #activeInputStates = new Set();

    static #inputReader = new InputReader(
        (isPress, trigger, inputDescriptor) => {
            if (isPress) {
                for (const inputState of this.#activeInputStates) {
                    inputState.press(trigger, inputDescriptor);
                }
            } else {
                for (const inputState of this.#activeInputStates) {
                    inputState.lift(trigger, inputDescriptor);
                }
            }
        }
    );

    static initialize(canvas) {
        canvas.addEventListener('contextmenu', event => event.preventDefault());

        this.#canvas = canvas;
        canvas.addEventListener('keydown', this.#inputReader.onKeyDown);
        canvas.addEventListener('keyup', this.#inputReader.onKeyUp);
        canvas.addEventListener('mousedown', this.#inputReader.onMouseDown);
        canvas.addEventListener('mousemove', this.#inputReader.onMouseMove);
        canvas.addEventListener('mouseup', this.#inputReader.onMouseUp);
        canvas.addEventListener('wheel', this.#inputReader.onMouseScroll);

        const owner = canvas.ownerDocument;
        owner.addEventListener("pointerlockchange", async () => {
            if (owner.pointerLockElement === canvas) this.#inputReader.onMouseLock();
            else this.#inputReader.onMouseUnlock();
        });
        owner.addEventListener("pointerlockerror", () => {
            console.error("Error locking pointer");
        });
    }

    static Update() {
        for (const inputState of this.#activeInputStates) {
            inputState.Update();
        }
    }

    static createState(id) {
        if (this.#inputStates.has(id)) throw new Error("InputState (" + id + ") already exists.");
        System.log(System.input_message_prefix, "New InputState:", id);
        const iState = new InputState();
        this.#inputStates.set(id, iState);
        return iState;
    }

    static deleteState(id) {
        if (!this.#inputStates.has(id)) throw new Error("InputState (" + id + ") does not exist.");
        this.#activeInputStates.delete(this.#inputStates.get(id));
        this.#inputStates.delete(id);
    }

    static getState(id) {
        if (!this.#inputStates.has(id)) throw new Error("InputState (" + id + ") already exists.");
        return this.#inputStates.get(id);
    }

    static enableState(id) {
        if (!this.#inputStates.has(id)) throw new Error("InputState (" + id + ") does not exist.");
        this.#activeInputStates.add(this.#inputStates.get(id));
    }

    static disableState(id) {
        if (!this.#inputStates.has(id)) throw new Error("InputState (" + id + ") does not exist.");
        this.#activeInputStates.delete(this.#inputStates.get(id));
    }

    static lockCursor() {
        return this.#canvas.requestPointerLock(CanvasInput.contextAttributes).then(() => this.#canvas.focus());
    }

    static freeCursor() {
        this.#canvas.ownerDocument.exitPointerLock();
    }
}