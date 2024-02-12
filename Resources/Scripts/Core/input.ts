import { Component } from "./NineEngine";

export const enum InputModifier {
    alt = 1 << 0,
    ctrl = 1 << 1,
    shift = 1 << 2,
    ml = 1 << 3,
};

export class InputManager {
    static runtimeInputStates: Map<string, InputState> = new Map();

    static createState(id: string): InputState {
        _InputManager.createState(id);
        const state = new InputState(id);
        this.runtimeInputStates.set(id, state);
        return state;
    }

    static getState(id: string): InputState { return this.runtimeInputStates.get(id); }
    static enableState(id: string): void { return _InputManager.enableState(id); }
    static disableState(id: string): void { return _InputManager.disableState(id); }
    static lockCursor(): void { return _InputManager.lockCursor(); }
    static freeCursor(): void { return _InputManager.freeCursor(); }
}

export class MouseInputDescriptor {
    isLocked(): bool { return _MouseInputDescriptor.isLocked; };
    screenX(): f32 { return _MouseInputDescriptor.screenX; };
    screenY(): f32 { return _MouseInputDescriptor.screenY; };
    deltaX(): f32 { return _MouseInputDescriptor.deltaX; };
    deltaY(): f32 { return _MouseInputDescriptor.deltaY; };
}

declare namespace _InputManager {
    function createState(id: string): string;
    function getState(id: string): string;
    function enableState(id: string): void;
    function disableState(id: string): void;
    function lockCursor(): void;
    function freeCursor(): void;
}

declare namespace _InputState {
    function onPress(stateName: string, keyCode: string, target: Component, action: () => void, flags: i32): void;
    function onHeld(stateName: string, keyCode: string, target: Component, action: () => void, flags: i32): void;
    function onLift(stateName: string, keyCode: string, target: Component, action: () => void, flags: i32): void;
    function onMouseMove(stateName: string, target: Component, action: (descriptor: MouseInputDescriptor) => void, flags: i32): void;
}

declare namespace _MouseInputDescriptor {
    let isLocked: bool;
    let screenX: f32;
    let screenY: f32;
    let deltaX: f32;
    let deltaY: f32;
}

class InputState {
    id: string;

    constructor(id: string) {
        this.id = id;
    }

    onPress(keyCode: string, target: Component, action: () => void, flags: i32 = 0): void { _InputState.onPress(this.id, keyCode, target, action, flags); }
    onHeld(keyCode: string, target: Component, action: () => void, flags: i32 = 0): void { _InputState.onHeld(this.id, keyCode, target, action, flags); }
    onLift(keyCode: string, target: Component, action: () => void, flags: i32 = 0): void { _InputState.onLift(this.id, keyCode, target, action, flags); }
    onMouseMove(target: Component, action: (descriptor: MouseInputDescriptor) => void, flags: i32 = 0): void { _InputState.onMouseMove(this.id, target, action, flags); }
}