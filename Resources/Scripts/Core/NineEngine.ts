import { SceneObject } from "./sceneObject";

export function Serialize(...args: any[]): any {
    console.log("Serializing.");
    for (let i = 0, end = args.length; i < end; i++) {
        console.log(args[i]);
    }
}

export declare namespace Time {
    let deltaTime: f32;
    let timeSinceStartup: f32;
}

export declare namespace Debug {
    function ptr(c: Object): usize;
    function log(c: string): void;
}

export class Component {
    sceneObject: SceneObject;

    constructor(so: SceneObject) { this.sceneObject = so; }

    Awake(): void { };
    Start(): void { };
    Update(): void { };
}

class NoSuchElementException extends Error { }
export class Optional<A> {
    value: A | null = null;

    static empty<T>(): Optional<T> { return new Optional(); }
    static of<T>(value: T | null): Optional<T> {
        if (value == null) return this.empty<T>();
        const opt = new Optional<T>();
        opt.value = value;
        return opt;
    }

    get(): A {
        if (this.value == null) throw new NoSuchElementException("Optional contains no value.");
        return <A>this.value;
    }

    isPresent(): bool { return this.value != null; }
}
