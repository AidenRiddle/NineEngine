import Resources from "../../../FileSystem/resources.js";
import { Key, System } from "../../../settings.js";
import { ScriptStorage } from "../../DataStores/scriptStore.js";
import Quaternion from "../../Math/quaternion.js";
import { InputManager } from "../Input/input.js";
import { RunningInstance } from "../runningInstance.js";
import { compile } from "./asCompiler.js";
import { RuntimeMemory } from "./runtimeMemory.js";
import { ScriptGlobals } from "./scriptGlobals.js";

export class ScriptManager {
    static #runtime;
    static #memory = new RuntimeMemory();
    static #runtimeBuffers = {};
    static #waModule;
    static #dataView = new DataView(this.#memory.buffer);
    static #componentMaps = {};
    static #mid;
    static #inputStates = new Set();
    static #importMap = {
        "env": {
            "console.log": (ptr) => { this.#logDev(this.#memory.readString(ptr)); },
            memory: this.#memory,
            abort: (msg, fileName, line, col) => {
                console.error(
                    this.#memory.readString(msg),
                    this.#memory.readString(fileName),
                    line,
                    col
                );
            },
        },
        "NineEngine": {
            "Time.deltaTime": ScriptGlobals.deltaTime,
            "Time.timeSinceStartup": ScriptGlobals.timeSinceStartup,

            "Debug.ptr": (ptr) => { this.#logDebug("Debug.Ptr:", ptr); },
            "Debug.log": (str) => { this.#logDebug(this.#memory.readString(str)); },
        },
        "input": {
            "pingBuffer": (tag, buffer) => { this.#runtimeBuffers[this.#memory.readString(tag)] = buffer; },

            "_MouseInputDescriptor.isLocked": ScriptGlobals.isLocked,
            "_MouseInputDescriptor.screenX": ScriptGlobals.screenX,
            "_MouseInputDescriptor.screenY": ScriptGlobals.screenY,
            "_MouseInputDescriptor.deltaX": ScriptGlobals.deltaX,
            "_MouseInputDescriptor.deltaY": ScriptGlobals.deltaY,

            "_InputManager.createState": (idPtr) => { this.#inputStates.add(this.#memory.readString(idPtr)); InputManager.createState(this.#memory.readString(idPtr)); },
            "_InputManager.getState": (idPtr) => { InputManager.getState(this.#memory.readString(idPtr)); },
            "_InputManager.enableState": (idPtr) => { InputManager.enableState(this.#memory.readString(idPtr)); },
            "_InputManager.disableState": (idPtr) => { InputManager.disableState(this.#memory.readString(idPtr)); },
            "_InputManager.lockCursor": () => { InputManager.lockCursor(); },
            "_InputManager.freeCursor": () => { InputManager.freeCursor(); },

            "_InputState.onPress": (stateName, keyCodePtr, targetPtr, funcPtr, flags) => { this.#bindInputKeyFromPointers("onPress", stateName, keyCodePtr, targetPtr, funcPtr, flags); },
            "_InputState.onHeld": (stateName, keyCodePtr, targetPtr, funcPtr, flags) => { this.#bindInputKeyFromPointers("onHeld", stateName, keyCodePtr, targetPtr, funcPtr, flags); },
            "_InputState.onLift": (stateName, keyCodePtr, targetPtr, funcPtr, flags) => { this.#bindInputKeyFromPointers("onLift", stateName, keyCodePtr, targetPtr, funcPtr, flags); },
            "_InputState.onMouseMove": (stateName, targetPtr, funcPtr, flags) => { this.#bindMouseMove(stateName, targetPtr, funcPtr, flags); },
        },
        "sceneObject": {
            registerSceneObject: (name, so) => this.#runtime["registerSceneObject"](name, so),
            registerComponent: (com) => this.#runtime["registerComponent"](com),
            findSceneObjectByName: (id) => this.#runtime["findSceneObjectByName"](id),
        }
    };

    static #bindInputKeyFromPointers(keyAction, stateNamePtr, keyCodePtr, targetPtr, funcPtr, flags) {
        this.#bindInputKey(keyAction,
            this.#memory.readString(stateNamePtr),
            this.#memory.readString(keyCodePtr),
            targetPtr,
            this.#runtime.table.get(this.#memory.readByte(funcPtr)),
            flags
        );
    }

    static #bindMouseMove(stateNamePtr, targetPtr, funcPtr, flags) {
        const keyAction = "onLift";
        const stateName = this.#memory.readString(stateNamePtr);
        const keyCode = Key.mouseMove;
        const target = targetPtr;
        const func = this.#runtime.table.get(this.#memory.readByte(funcPtr));
        console.log(
            `Input Key (${stateName}):`
            + ` ${keyAction} : ${keyCode} (${flags.toString(2).padStart(4, '0')})`
            + ` - TargetAddress: ${target}`
            + ` - FuncAddress: ${func}`
        );
        InputManager.getState(stateName)[keyAction](keyCode, () => { func(target, this.#mid) }, flags);
    }

    static #bindInputKey(keyAction, stateName, keyCode, target, func, flags) {
        console.log(
            `Input Key (${stateName}):`
            + ` ${keyAction} : ${keyCode} (${flags.toString(2).padStart(4, '0')})`
            + ` - TargetAddress: ${target}`
            + ` - FuncAddress: ${func}`
        );
        InputManager.getState(stateName)[keyAction](keyCode, () => { func(target) }, flags);
    }

    static #createBuildPackage() {
        const pathMap = Object.fromEntries(RunningInstance.getScriptDependencies());
        console.log("Script sources:", pathMap);
        return Resources.loadAll(pathMap, { hardFetch: true }).then((arrOfExtractedFiles) => {
            const buildPackage = {};
            let i = 0;
            for (const path in pathMap) {
                buildPackage[path] = arrOfExtractedFiles[i];
                i++;
            }
            console.log("Script definitions:", buildPackage);
            return buildPackage;
        })
    }

    static #writeStringToRuntime(str) {
        const ptr = this.#runtime.allocString(str.length);
        console.log("Writing string to", ptr);
        this.#memory.writeString(ptr, str);
        return ptr;
    }

    static #logDev(...msgs) { System.log(System.dev_console_message_prefix, ...msgs); }
    static #logDebug(...msgs) { System.log(System.debug_message_prefix, ...msgs); }

    static Compile() {
        const startTime = ~~performance.now();
        console.groupCollapsed("Script Compilation Log");
        return this.#createBuildPackage()
            .then((buildPackage) => compile(buildPackage))
            .then((wa) => {
                this.#waModule = wa.module;

                console.log("Compiler Transform result:", ScriptStorage.pack());
                console.log("Compilation result:", wa);
                console.groupEnd();
                console.log("Compiled successfully. Finished in " + (~~performance.now() - startTime) + "ms.");
            })
    }

    static Build(componentImports) {
        console.log("Script Imports:", componentImports);
        return WebAssembly.instantiate(this.#waModule, this.#importMap)
            .then((instance) => {
                console.log(instance.exports);
                this.#runtime = instance.exports;
                this.#runtime._start();
                for (const comPackage of componentImports) {
                    for (const com of comPackage.soComponents) {
                        if (!Object.hasOwn(this.#componentMaps, comPackage.soid)) this.#componentMaps[comPackage.soid] = {};
                        const sceneObjectPtr = this.#runtime[comPackage.soid];
                        const className = ScriptStorage.Get(com.module).className;
                        this.#componentMaps[comPackage.soid][com.module] = this.#runtime["add_component_" + className](sceneObjectPtr);
                    }
                    for (const com of comPackage.soComponents) {
                        for (const field in com.imports) {
                            const rawValue = com.imports[field];
                            console.log(field, rawValue);
                            const rawValueType = typeof rawValue;
                            const requiredType = ScriptStorage.Get(com.module).declarations[field].type;
                            let interpretedValue;
                            if (rawValueType == 'number') interpretedValue = rawValue;
                            else if (rawValueType == 'boolean') interpretedValue = (rawValue) ? 1 : 0;
                            else if (rawValueType == 'string') {
                                if (requiredType == "string") interpretedValue = this.#writeStringToRuntime(rawValue);
                                else if (requiredType == "SceneObject") interpretedValue = this.#runtime[rawValue];
                                else interpretedValue = this.#componentMaps[rawValue][requiredType];
                            }
                            const className = ScriptStorage.Get(com.module).className;
                            if (field == "ufo") console.log(rawValue, rawValueType, requiredType, className);
                            this.publishValue(comPackage.soid, com.module, className, field, requiredType, interpretedValue);
                        }
                    }
                }
                console.log("Component Addresses:", this.#componentMaps);
            })
    }

    static bindSceneObject(so) {
        const soPtr = this.#runtime[so.id];
        const bindMethod = "bind_";

        const ptr = this.#runtime[bindMethod + "worldMatrix"](soPtr);
        so.transform.worldMatrix = new Float32Array(this.#memory.buffer, ptr + (4 * 8), 16);
        so.transform.updateWorldMatrix = () => { };

        if (so.transform.parent) {
            const parentObject = this.#runtime[so.transform.parent.sceneObject.id];
            this.#runtime[bindMethod + "parent"](soPtr, parentObject);
        }

        const newPosition = new Float32Array(this.#memory.buffer, this.#runtime[bindMethod + "position"](soPtr) + (4 * 8), 3);
        newPosition[0] = so.transform.position.x;
        newPosition[1] = so.transform.position.y;
        newPosition[2] = so.transform.position.z;

        const newRotation = new Float32Array(this.#memory.buffer, this.#runtime[bindMethod + "rotation"](soPtr) + (4 * 8), 4);
        const quat = Quaternion.fromVector(so.transform.rotation);
        newRotation[0] = quat.w;
        newRotation[1] = quat.x;
        newRotation[2] = quat.y;
        newRotation[3] = quat.z;

        const newScale = new Float32Array(this.#memory.buffer, this.#runtime[bindMethod + "scale"](soPtr) + (4 * 8), 3);
        newScale[0] = so.transform.scale.x;
        newScale[1] = so.transform.scale.y;
        newScale[2] = so.transform.scale.z;
    }

    static publishValue(soid, srcRelativePath, componentName, fieldName, fieldType, fieldValue) {
        const offsetAddress = "get_offset_" + componentName + "_" + fieldName;
        const ptr = this.#componentMaps[soid][srcRelativePath];

        console.log("Publishing to WAMemory:", offsetAddress, `(${fieldType}: ${fieldValue})`);
        const offset = this.#runtime[offsetAddress];
        const addr = ptr + offset;

        const delegate = {
            "f32": () => this.#dataView.setFloat32(addr, fieldValue, true),
            "f64": () => this.#dataView.setFloat64(addr, fieldValue, true),

            "i8": () => this.#dataView.setInt8(addr, fieldValue),
            "i16": () => this.#dataView.setInt16(addr, fieldValue, true),
            "i32": () => this.#dataView.setInt32(addr, fieldValue, true),
            "i64": () => this.#dataView.setBigInt64(addr, fieldValue, true),
            "isize": () => this.#dataView.setInt32(addr, fieldValue, true),

            "u8": () => this.#dataView.setUint8(addr, fieldValue),
            "u16": () => this.#dataView.setUint16(addr, fieldValue, true),
            "u32": () => this.#dataView.setUint32(addr, fieldValue, true),
            "u64": () => this.#dataView.setBigUint64(addr, fieldValue, true),
            "usize": () => this.#dataView.setUint32(addr, fieldValue, true),

            "bool": () => this.#dataView.setUint8(addr, fieldValue),
        }

        if (Object.hasOwn(delegate, fieldType)) delegate[fieldType]();
        else delegate["usize"]();

        console.log("- Success:", addr);
    }

    static readByte(addr) { return this.#memory.readFloat(addr); }

    static start() {
        ScriptGlobals.timeSinceStartup.value = 0;

        const inputState = InputManager.getState(System.input_state_runtime);
        function updateMouseInputDescriptor(mid) {
            ScriptGlobals.isLocked.value = mid.isLocked;
            ScriptGlobals.screenX.value = mid.screenX;
            ScriptGlobals.screenY.value = mid.screenY;
            ScriptGlobals.deltaX.value = mid.deltaX;
            ScriptGlobals.deltaY.value = mid.deltaY;
        }
        inputState.onPress(Key.lmb, updateMouseInputDescriptor);
        inputState.onHeld(Key.lmb, updateMouseInputDescriptor);
        inputState.onLift(Key.lmb, updateMouseInputDescriptor);
        inputState.onPress(Key.rmb, updateMouseInputDescriptor);
        inputState.onHeld(Key.rmb, updateMouseInputDescriptor);
        inputState.onLift(Key.rmb, updateMouseInputDescriptor);
        inputState.onPress(Key.mmb, updateMouseInputDescriptor);
        inputState.onHeld(Key.mmb, updateMouseInputDescriptor);
        inputState.onLift(Key.mmb, updateMouseInputDescriptor);
        inputState.onMouseMove(updateMouseInputDescriptor);

        this.#mid = this.#runtime["MouseInputDescriptor_classId"];

        this.#runtime.Start();
    }

    static update() {
        this.#runtime.Update();
        this.#runtime.ScriptEnd();
        this.#runtime.__collect();
    }

    static stop() {
        for (const inputState of this.#inputStates) {
            InputManager.deleteState(inputState);
        }
    }
}
globalThis.scriptManager = ScriptManager;