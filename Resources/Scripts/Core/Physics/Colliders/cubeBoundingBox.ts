import Vector3 from "../../Math/vector3";
import { BoundingBox, Convex } from "./boundingBox";

const cubeVertices = [
    new Vector3(0.5, -0.5, 0.5),
    new Vector3(-0.5, -0.5, 0.5),
    new Vector3(-0.5, 0.5, 0.5),
    new Vector3(0.5, 0.5, 0.5),
    new Vector3(0.5, -0.5, -0.5),
    new Vector3(-0.5, -0.5, -0.5),
    new Vector3(-0.5, 0.5, -0.5),
    new Vector3(0.5, 0.5, -0.5),
];

const scale = Vector3.one;
const offset = Vector3.zero;

export class CubeBoundingBox extends BoundingBox {
    convexHull: Convex = new Convex(cubeVertices, scale, offset);
    scale: Vector3 = scale;
    offset: Vector3 = offset;
}