import { Component, Time } from "../NineEngine";
import Quaternion from "../Math/quaternion";
import Vector3 from "../Math/vector3";
import { BoundingBox } from "./Colliders/boundingBox";
import { CubeBoundingBox } from "./Colliders/cubeBoundingBox";

// https://www.omnicalculator.com/physics/free-fall-air-resistance#air-resistance-formula
// https://www.grc.nasa.gov/www/k-12/VirtualAero/BottleRocket/airplane/falling.html

export class RigidBody extends Component {
    isKinematic: bool = false;
    gravity: f32 = 0;
    airDensity: f32 = 0;
    mass: f32 = 0;
    weight: f32 = 0; // Newtons

    velocity: Vector3 = Vector3.zero;
    speed: f32 = 0;
    drag: f32 = 0;

    boundingBox: BoundingBox | null = null;

    Start(): void {
        this.gravity = (this.isKinematic) ? 0.0 : this.gravity;
        this.weight = this.mass * Mathf.abs(this.gravity);

        this.boundingBox = this.sceneObject.GetComponent<BoundingBox>().get();
        if (this.boundingBox == null) abort("SceneObject (" + this.sceneObject.name + ") has component RigidBody without a BoundingBox." );

        else console.log("(" + this.sceneObject.name + ") RigidBody: " + (<BoundingBox>this.boundingBox).sceneObject.name)
    }

    Update(): void {
        if (this.boundingBox == null || !(<BoundingBox>this.boundingBox).isColliding) this.applyGravity();
        else this.velocity.set(0, 0, 0);

        this.updateDynamicProperties();
        this.sceneObject.transform.translateByVector(this.velocity);
    }

    updateDynamicProperties(): void {
        this.speed = this.velocity.magnitude;
        this.drag = 0.5 * this.airDensity * this.speed * this.speed;
    }

    applyGravity(): void {
        const rotation = this.sceneObject.transform.rotation;
        const acceleration = (this.weight - this.drag) / this.mass;
        const accelerationVector = Vector3.down.scale(acceleration * Time.deltaTime);
        const localisedVector = Quaternion.rotateVector(rotation.inversed, accelerationVector);

        this.addForce(localisedVector);
    }

    addForce(vec: Vector3): void {
        this.velocity.addVector(vec);
    }

    debugGravity(a: f32): void {
        console.log(
            "Acceleration: " + a.toString() +
            " - Drag: " + this.drag.toString() +
            " - Weight: " + this.weight.toString() +
            " - Speed: " + this.speed.toString() +
            " - Time: " + Time.timeSinceStartup.toString()
        );
    }
}
