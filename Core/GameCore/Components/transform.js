import { System } from "../../../settings.js";
import Matrix4 from "../../Math/matrix4.js";
import Quaternion from "../../Math/quaternion.js";
import Vector3 from "../../Math/vector3.js";

export class Transform {
    position = Vector3.zero;
    rotation = Vector3.zero;
    scale = Vector3.one;

    localMatrix = Matrix4.identity;
    worldMatrix = Matrix4.identity;

    /** @type {Transform} */
    #parent;
    sceneObject;
    children = [];

    get up() { return this.rotation.rotateVector(Vector3.up); }
    get down() { return this.rotation.rotateVector(Vector3.down); }
    get forward() { return this.rotation.rotateVector(Vector3.forward); }
    get back() { return this.rotation.rotateVector(Vector3.back); }
    get left() { return this.rotation.rotateVector(Vector3.left); }
    get right() { return this.rotation.rotateVector(Vector3.right); }

    get parent() { return this.#parent; }
    set parent(parent) {
        if (this.#parent) {
            var ndx = this.#parent.children.indexOf(this);
            if (ndx >= 0) {
                this.#parent.children.splice(ndx, 1);
            }
        }
        if (parent) { parent.children.push(this); }
        this.#parent = parent;
    }

    constructor(sceneObject) {
        this.sceneObject = sceneObject;
    }

    static from(sceneObject, position, rotation, scale) {
        const transform = new Transform(sceneObject);
        transform.setPositionVector(position);
        transform.setRotationQuaterion(rotation);
        transform.setScaleVector(scale);
        transform.updateWorldMatrix();
        return transform;
    }

    #positionToLocalMatrix() {
        const translation = Matrix4.identity;
        Matrix4.setPosition(translation, this.position.x, this.position.y, this.position.z);
        return translation;
    }

    #rotationToLocalMatrix() {
        return Quaternion.fromVector(this.rotation).toRotationMatrix();
    }

    #scaleToLocalMatrix() {
        const scale = Matrix4.identity;
        Matrix4.setScale(scale, this.scale.x, this.scale.y, this.scale.z);
        return scale;
    }

    #updateLocalTransform() {
        const translation = this.#positionToLocalMatrix();
        const rotation = this.#rotationToLocalMatrix();
        const scale = this.#scaleToLocalMatrix();

        Matrix4.multiply(this.localMatrix, translation, rotation);
        Matrix4.multiply(this.localMatrix, this.localMatrix, scale);
    }

    /** @param {Transform} child */
    addChild(child) { child.parent = this; }

    updateWorldMatrix() {
        this.#updateLocalTransform();
        if (this.#parent?.worldMatrix) {
            Matrix4.multiply(this.worldMatrix, this.#parent.worldMatrix, this.localMatrix);
        } else {
            Matrix4.copy(this.worldMatrix, this.localMatrix);
        }

        var worldMatrix = this.worldMatrix;
        this.children.forEach(function (child) {
            child.updateWorldMatrix(worldMatrix);
        });
    }

    setPosition(x, y, z) { this.position.set(x, y, z); }
    setPositionVector(vec) { this.position.setVector(vec); }

    setRotation(x, y, z) { this.rotation.set(x, y, z); }
    setRotationQuaterion(quat) { this.rotation.setQuaternion(quat); }
    setRotationVector(vec) { this.rotation.setVector(vec); }

    setScale(x, y, z) { this.scale.set(x, y, z); }
    setScaleVector(vec) { this.scale.setVector(vec); }

    translateBy(x, y, z) { this.position.add(x, y, z); }
    translateByVector(vec) { this.position.addVector(vec); }

    rotateBy(x, y, z) { this.rotation.add(x, y, z); }
    rotateByQuaterion(quat) { this.rotation.addQuaternion(quat); }
    rotateByVector(vec) { this.rotation.addVector(vec); }

    scaleBy(x, y, z) { this.scale.add(x, y, z); }
    scaleByVector(vec) { this.scale.addVector(vec); }
}