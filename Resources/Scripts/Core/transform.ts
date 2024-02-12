import Matrix4 from "./Math/matrix4";
import Quaternion from "./Math/quaternion";
import Vector3 from "./Math/vector3";
import { SceneObject } from "./sceneObject";

export class Transform {
    position: Vector3 = Vector3.zero;
    rotation: Quaternion = Quaternion.identity;
    scale: Vector3 = Vector3.one;

    localMatrix: Float32Array = Matrix4.identity;
    worldMatrix: Float32Array = Matrix4.identity;

    static bufferMatrix: Float32Array = Matrix4.identity;

    Parent: Transform | null = null;
    sceneObject: SceneObject;
    children: Array<Transform> = new Array<Transform>(0);

    get up(): Vector3 { return Quaternion.rotateVector(this.rotation, Vector3.up); }
    get down(): Vector3 { return Quaternion.rotateVector(this.rotation, Vector3.down); }
    get forward(): Vector3 { return Quaternion.rotateVector(this.rotation, Vector3.forward); }
    get back(): Vector3 { return Quaternion.rotateVector(this.rotation, Vector3.back); }
    get left(): Vector3 { return Quaternion.rotateVector(this.rotation, Vector3.left); }
    get right(): Vector3 { return Quaternion.rotateVector(this.rotation, Vector3.right); }

    get parent(): Transform | null { return this.Parent; }
    set parent(value: Transform | null) {
        if (this.parent) {
            const parent = <Transform>this.parent;
            var ndx = parent.children.indexOf(this);
            if (ndx >= 0) {
                parent.children.splice(ndx, 1);
            }
        }
        if (value) { value.children.push(this); }
        this.Parent = value;
    }

    constructor(sceneObject: SceneObject) {
        this.sceneObject = sceneObject;
    }

    updateLocalTransform(): void {
        Matrix4.resetToIdentity(this.localMatrix);
        Matrix4.setPosition(this.localMatrix, this.position.x, this.position.y, this.position.z);

        // writeToRotationMatrix() method will reset the buffer matrix.
        this.rotation.writeToRotationMatrix(Transform.bufferMatrix);
        Matrix4.multiply(this.localMatrix, this.localMatrix, Transform.bufferMatrix);

        Matrix4.resetToIdentity(Transform.bufferMatrix);
        Matrix4.setScale(Transform.bufferMatrix, this.scale.x, this.scale.y, this.scale.z);
        Matrix4.multiply(this.localMatrix, this.localMatrix, Transform.bufferMatrix);
    }

    updateWorldMatrixScaleXY(): void {
        this.updateLocalTransform();
        if (this.parent) {
            Matrix4.multiply(this.worldMatrix, (<Transform>this.parent).worldMatrix, this.localMatrix);
        } else {
            Matrix4.copy(this.localMatrix, this.worldMatrix);
        }

        this.children.forEach(function (child) {
            child.updateWorldMatrix();
        });
    }

    updateWorldMatrix(): void { this.updateWorldMatrixScaleXY(); }

    setPosition(x: f32, y: f32, z: f32): void { this.position.set(x, y, z); }
    setPositionVector(vec: Vector3): void { this.position.setVector(vec); }

    setRotation(w: f32, x: f32, y: f32, z: f32): void { this.rotation.set(w, x, y, z); }
    setRotationQuaternion(quat: Quaternion): void { this.rotation.setQuaternion(quat); }
    setRotationEuler(x: f32, y: f32, z: f32): void { this.rotation.setFromEuler(x, y, z); }
    setRotationEulerVector(vec: Vector3): void { this.rotation.setFromEulerVector(vec); }

    setScale(x: f32, y: f32, z: f32): void { this.scale.set(x, y, z); }
    setScaleVector(vec: Vector3): void { this.scale.setVector(vec); }

    translateBy(x: f32, y: f32, z: f32): void { this.position.add(x, y, z); }
    translateByVector(vec: Vector3): void { this.position.addVector(vec); }

    rotateBy(w: f32, x: f32, y: f32, z: f32): void { this.rotation.rotate(w, x, y, z); }
    rotateByQuaternion(quat: Quaternion): void { this.rotation.rotateQuaternion(quat); }
    rotateByEuler(x: f32, y: f32, z: f32): void { this.rotation.rotateEuler(x, y, z); }
    rotateByEulerVector(vec: Vector3): void { this.rotation.rotateVector(vec); }

    scaleBy(x: f32, y: f32, z: f32): void { this.scale.add(x, y, z); }
    scaleByVector(vec: Vector3): void { this.scale.addVector(vec); }
}