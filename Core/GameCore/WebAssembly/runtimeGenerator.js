import { ScriptStorage } from "../../DataStores/scriptStore.js";
import { AscScriptUtil } from "../../GECore/Util/ascScriptUtil.js";

export class RuntimeGenerator {
    static #runtimeScript = "";
    static #sceneObjects = new Set();

    static #generateCoreImports() {
        let body =
            `import { RuntimeManager } from "./Scripts/Core/RuntimeManager";`
            + `import { Component } from "./Scripts/Core/NineEngine";`
            + `import { SceneObject } from "./Scripts/Core/sceneObject";`
            + `import { MouseInputDescriptor } from "./Scripts/Core/input";`;
        return body;
    }

    static #generateRuntimeImports() {
        let body = "";
        for (const classPath of ScriptStorage.keys()) {
            const className = ScriptStorage.Get(classPath).className;
            body += `import { ${className} } from "./${classPath}";`;
        }
        return body;
    }

    static #generateDataStores() {
        let body = "const rm = new RuntimeManager();";
        return body;
    }

    static #generateUtils() {
        let body = 
            `export const MouseInputDescriptor_classId: u32 = idof<MouseInputDescriptor>();`

            + `export function addSceneObject(id: string): SceneObject { return rm.addSceneObject(id); }`
            + `export function registerSceneObject(id: string, so: SceneObject): void { rm.registerSceneObject(id, so); }`
            + `export function registerComponent(com: Component): void { rm.registerComponent(com); }`
            + `export function findSceneObjectById(id: string): SceneObject | null { return rm.sceneObjectsById.get(id); }`
            + `export function allocF32Array(len: u32): StaticArray<f32> { return new StaticArray<f32>(len); }`
            + `export function allocString(len: u32): string { return new StaticArray<u8>(len).join(''); }`;
        return body;
    }

    static #generateSceneObjects() {
        let body = "";
        for (const soid of this.#sceneObjects) {
            body += `export const ${soid} = addSceneObject("${soid}");`;
        }
        return body;
    }

    static #generateSceneObjectBinds() {
        let body =
            `export function bind_worldMatrix(target: SceneObject): Float32Array { return target.transform.worldMatrix; }`
            + `export function bind_position(target: SceneObject): Float32Array { return target.transform.position.Vec; }`
            + `export function bind_rotation(target: SceneObject): Float32Array { return target.transform.rotation.Quat; }`
            + `export function bind_scale(target: SceneObject): Float32Array { return target.transform.scale.Vec; }`
            + `export function bind_parent(target: SceneObject, parentObject: SceneObject): void { target.transform.parent = parentObject.transform; }`;
        return body;
    }

    static #generateComponentAdders() {
        let body = "";
        for (const sc of ScriptStorage.values()) {
            const className = sc.className;
            body += 
                `export function add_component_${className}(so: SceneObject): ${className} {`
                + `return so.AddComponent<${className}>();`
                + "}";
        }
        return body;
    }

    static #generateComponentFieldPointers() {
        let body = "";
        for (const sc of ScriptStorage.values()) {
            const className = sc.className;
            for (const field in sc.declarations) {
                body += `export const get_offset_${className}_${field} = offsetof<${className}>("${field}");`
            }
        }
        return body;
    }

    static #generateEvents() {
        let body =
            `export function Start(): void { rm.Start(); }`
            + `export function Update(): void { rm.Update(); }`
            + `export function ScriptEnd(): void { rm.ScriptEnd(); }`;
        return body;
    }

    static addSceneObject(soid) {
        this.#sceneObjects.add(soid);
    }

    static generate() {
        this.#runtimeScript = this.#generateCoreImports()
            + this.#generateRuntimeImports()
            + this.#generateDataStores()
            + this.#generateUtils()
            + this.#generateSceneObjects()
            + this.#generateSceneObjectBinds()
            + this.#generateComponentAdders()
            + this.#generateComponentFieldPointers()
            + this.#generateEvents();
        return this.#runtimeScript;
    }

    static generateWithLog() {
        const gen = this.generate();
        console.log(...AscScriptUtil.formatCode(gen).stylized);
        return gen;
    }

    static generatePreRuntime(buildPackage) {
        let preRuntimeScript = "";

        const preImports = new Map();
        for (const [normalizedPath, sourceText] of Object.entries(buildPackage)) {
            const className = AscScriptUtil.getClassName(sourceText);
            preImports.set(className, normalizedPath);
        }

        for (const [className, classPath] of preImports.entries()) {
            preRuntimeScript += `import { ${className} } from "./${classPath}";`;
        }

        preRuntimeScript += "export const so = idof<SceneObject>();";

        let i = 0;
        for (const className of preImports.keys()) {
            preRuntimeScript += `export const $${i} = idof<${className}>();`;
            i++;
        }

        console.log(...AscScriptUtil.formatCode(preRuntimeScript).stylized);
        return preRuntimeScript;
    }
}