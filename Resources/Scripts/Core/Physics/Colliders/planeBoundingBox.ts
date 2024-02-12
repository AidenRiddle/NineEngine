import Vector3 from "../Math/vector3";
import { BoundingBox, Convex } from "./boundingBox";

const planeVertices = [
    new Vector3(0.5, 0, 0.5),
    new Vector3(-0.5, 0, 0.5),
    new Vector3(-0.5, 0, -0.5),
    new Vector3(0.5, 0, -0.5),
];

const scale = Vector3.one.scale(5);
const offset = Vector3.zero;

export class PlaneBoundingBox extends BoundingBox {
    otherColliders: Map<String, BoundingBox> = new Map();
    convexHull: Convex = new Convex(planeVertices, scale, offset);
    scale: Vector3 = scale;
    offset: Vector3 = offset;

    get isColliding(): bool { return this.otherColliders.keys().length > 0; }
}