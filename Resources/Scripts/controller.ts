import Quaternion from "./Core/Math/quaternion";
import Vector3 from "./Core/Math/vector3";
import { SceneObject } from "./Core/sceneObject";
import { Component, Debug, Serialize, Time } from "./Core/NineEngine";
import { IfTranslater } from "./ifTranslater";
import { InputManager, InputModifier, MouseInputDescriptor } from "./Core/input";

export class Controller extends Component {
    @Serialize speed: f32 = 3;
    @Serialize rotationSpeed: f32 = 90;
    @Serialize sensitivity: f32 = 0.1;

    @Serialize target: SceneObject | null = null;

    forward(v: f32): void { this.sceneObject.transform.translateByVector(this.sceneObject.transform.forward.scale(v * Time.deltaTime)); }
    left(v: f32): void { this.sceneObject.transform.translateByVector(this.sceneObject.transform.left.scale(v * Time.deltaTime)); }
    up(v: f32): void { this.sceneObject.transform.translateByVector(this.sceneObject.transform.up.scale(v * Time.deltaTime)); }

    forwardGlobal(v: f32): void { this.sceneObject.transform.translateByVector(Vector3.forward.scale(v * Time.deltaTime)); }
    leftGlobal(v: f32): void { this.sceneObject.transform.translateByVector(Vector3.left.scale(v * Time.deltaTime)); }
    upGlobal(v: f32): void { this.sceneObject.transform.translateByVector(Vector3.up.scale(v * Time.deltaTime)); }

    rotate(x: f32, y: f32, z: f32): void { this.sceneObject.transform.rotateByEuler(x * Time.deltaTime, y * Time.deltaTime, z * Time.deltaTime); }
    rotateGlobal(x: f32, y: f32, z: f32): void {
        const vec = new Vector3(x, y, z);
        const mag = vec.magnitude * Time.deltaTime;
        const quat = Quaternion.from(mag, vec.normalize());
        this.sceneObject.transform.rotation.setQuaternion(Quaternion.multiply(quat, this.sceneObject.transform.rotation));
    }

    w(): void { this.forward(this.speed); }
    s(): void { this.forward(-this.speed); }
    a(): void { this.left(this.speed); }
    d(): void { this.left(-this.speed); }
    e(): void { this.upGlobal(this.speed); }
    q(): void { this.upGlobal(-this.speed); }

    Up(): void { this.rotate(this.rotationSpeed, 0, 0); }
    Down(): void { this.rotate(-this.rotationSpeed, 0, 0); }
    Left(): void { this.rotateGlobal(0, this.rotationSpeed, 0); }
    Right(): void { this.rotateGlobal(0, -this.rotationSpeed, 0); }

    MouseMove(inpDesc: MouseInputDescriptor): void {
        let dx = inpDesc.deltaX();
        let dy = inpDesc.deltaY();
        this.sceneObject.transform.rotateByEuler(dy * this.sensitivity, 0, 0);
        
        const vec = new Vector3(0, -dx * this.sensitivity, 0);
        const mag = vec.magnitude;
        const quat = Quaternion.from(mag, vec.normalize());
        this.sceneObject.transform.rotation.setQuaternion(quat.multiplyQuaternion(this.sceneObject.transform.rotation));
    }

    LockMouse(): void {
        InputManager.lockCursor();
    }

    setupInputs(): void {
        const inputStateName = "controller";
        const x = InputManager.createState(inputStateName);
        InputManager.enableState(inputStateName);

        x.onHeld("w", this, this.w);
        x.onHeld("s", this, this.s);
        x.onHeld("a", this, this.a);
        x.onHeld("d", this, this.d);
        x.onHeld("e", this, this.e);
        x.onHeld("q", this, this.q);

        x.onHeld("arrowup", this, this.Up);
        x.onHeld("arrowdown", this, this.Down);
        x.onHeld("arrowleft", this, this.Left);
        x.onHeld("arrowright", this, this.Right);

        x.onMouseMove(this, this.MouseMove, InputModifier.ml);
        x.onPress("lmb", this, this.LockMouse);
    }

    Start(): void {
        this.setupInputs();
        InputManager.lockCursor();
    }
}