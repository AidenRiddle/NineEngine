import { Component, Optional } from "./NineEngine";
import { Transform } from "./transform";

declare function registerSceneObject(name: string, so: SceneObject): void;
declare function registerComponent(com: Component): void;
declare function findSceneObjectByName(id: string): SceneObject | null;

export class SceneObject {
    id: string = "";
    name: string;
    transform: Transform = new Transform(this);
    components: Map<string, Component> = new Map();
    
    constructor(name: string = "") {
        this.name = name;
        registerSceneObject(this.name, this);
    }

    GetComponent<T extends Component>(): Optional<T> {
        const arr = this.components.values();
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] instanceof T) return Optional.of(<T>arr[i]);
        }
        return Optional.empty<T>();
    }

    AddComponent<T extends Component>(): T {
        const name = nameof<T>();
        if(this.components.has(name)) return <T> this.components.get(name);
        
        const component = instantiate<T>(this);
        this.components.set(name, component);
        registerComponent(component);
        return component;
    }

    static Find(name: string): SceneObject | null {
        return findSceneObjectByName(name);
    }
}