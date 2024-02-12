import { SceneObject } from "./sceneObject";
import { Component } from "./NineEngine";
import { BoundingBox } from "./Physics/Colliders/boundingBox";

export class RuntimeManager {
    allSceneObjects: SceneObject[] = new Array<SceneObject>(0);
    allComponents: Component[] = new Array<Component>(0);
    allBoundingBoxes: BoundingBox[] = new Array<BoundingBox>(0);

    sceneObjectsById: Map<string, SceneObject> = new Map();
    topLevelSceneObjects: SceneObject[] = new Array<SceneObject>(0);

    newlyRegisteredComponents: Component[] = new Array<Component>(0);

    oddFrame: bool = true;

    registerSceneObject(id: string, sceneObject: SceneObject): void {
        this.sceneObjectsById.set(id, sceneObject);
        this.allSceneObjects.push(sceneObject);
    }
    registerComponent(component: Component): void {
        this.allComponents.push(component);
        if (component instanceof BoundingBox) { this.registerBoundingBox(<BoundingBox>component); }
        this.newlyRegisteredComponents.push(component);
    }
    registerBoundingBox(boundingBox: BoundingBox): void { this.allBoundingBoxes.push(boundingBox); }

    addSceneObject(id: string): SceneObject {
        const so = new SceneObject(id);
        this.registerSceneObject(id, so);
        return so;
    }

    Start(): void {
        for (let i = 0, end = this.allSceneObjects.length; i < end; i++) {
            const so = this.allSceneObjects[i];
            if (so.transform.parent == null) this.topLevelSceneObjects.push(so);
        }
        for (let i = 0, end = this.newlyRegisteredComponents.length; i < end; i++) {
            this.newlyRegisteredComponents[i].Awake();
        }
        while(this.newlyRegisteredComponents.length > 0) {
            const component = this.newlyRegisteredComponents.shift();
            component.Start();
        }
    }

    PhysicsUpdate(): void {
        for (let i = 0; i < this.allBoundingBoxes.length - 1; i++) {
            const s1 = this.allBoundingBoxes[i];
            for (let j = i + 1; j < this.allBoundingBoxes.length; j++) {
                const s2 = this.allBoundingBoxes[j];
                if (s1.overlaps(s2)) {
                    s1.otherColliders.set(s2.sceneObject.name, s2);
                    s2.otherColliders.set(s1.sceneObject.name, s1);
                }
            }
        }
    }

    Update(): void {
        while(this.newlyRegisteredComponents.length > 0) {
            const component = this.newlyRegisteredComponents.shift();
            component.Awake();
            component.Start();
        }

        if(this.oddFrame) { this.oddFrame = false; } //this.PhysicsUpdate(); 
        else this.oddFrame = true;

        for (let i = 0, end = this.allComponents.length; i < end; i++) { this.allComponents[i].Update(); }
    }

    ScriptEnd(): void {
        this.topLevelSceneObjects.forEach((so) => so.transform.updateWorldMatrix())
    }
}