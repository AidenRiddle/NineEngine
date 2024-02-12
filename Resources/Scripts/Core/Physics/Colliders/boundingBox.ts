import { Component } from "../../NineEngine";
import Vector3 from "../../Math/vector3";

export class BoundingBox extends Component {
    scale: Vector3 = Vector3.one;
    offsetVector: Vector3 = Vector3.zero;
    convexHull: Convex = new Convex(new Array<Vector3>(0), this.scale, this.offsetVector);

    otherColliders: Map<String, BoundingBox> = new Map();

    get isColliding(): bool { return this.otherColliders.keys().length > 0; }

    overlaps(target: BoundingBox): bool {
        return GJK.overlaps(this, target);
    }
}

export class Convex {
    vertices: Array<Vector3>;

    constructor(shape: Array<Vector3>, scale: Vector3, offsetVector?: Vector3) {
        for (let i = 0; i < shape.length; i++) {
            const vert = shape[i];
            vert.multiplyVector(scale);
            if (offsetVector != null) vert.addVector(offsetVector);
        }
        this.vertices = shape;
    }

    supportPoint(direction: Vector3): Vector3 {
        let highestDotProduct = <f32>-2;
        let supportPoint: Vector3 = this.vertices[0];
        for (let i = 0; i < this.vertices.length; i++) {
            const vert = this.vertices[i];
            const distance = Vector3.dot(direction, vert);
            if (distance > highestDotProduct) {
                highestDotProduct = distance;
                supportPoint = vert;
            }
        }
        return supportPoint;
    }
}

// https://dyn4j.org/2010/04/gjk-gilbert-johnson-keerthi/

class GJK {
    static tripleProduct(v1: Vector3, v2: Vector3, v3: Vector3): Vector3 {
        return Vector3.cross(Vector3.cross(v1, v2), v3)
    }

    static overlaps(s1: BoundingBox, s2: BoundingBox): bool {
        const offsetVector1 = s1.sceneObject.transform.position;
        const offsetVector2 = s2.sceneObject.transform.position;
        const simplex = new Array<Vector3>(0);

        let d = Vector3.copy(offsetVector2).subtractVector(offsetVector1).normalize();
        simplex.push(this.simplex(s1.convexHull, s2.convexHull, offsetVector1, offsetVector2, d));

        d = Vector3.zero.subtractVector(simplex[0]);
        while (true) {
            let a = this.simplex(s1.convexHull, s2.convexHull, offsetVector1, offsetVector2, d);
            if (Vector3.dot(a, d) < 0) return false;
            simplex.push(a);
            if (this.handleSimplex(simplex, d)) return true;
        }
    }

    static simplex(s1: Convex, s2: Convex, offsetVector1: Vector3, offsetVector2: Vector3, direction: Vector3): Vector3 {
        const fp1 = Vector3.copy(s1.supportPoint(direction)).addVector(offsetVector1);
        const fp2 = Vector3.copy(s2.supportPoint(direction.inversed)).addVector(offsetVector2);
        const simplex = fp1.subtractVector(fp2);
        return simplex;
    }

    static handleSimplex(simplex: Array<Vector3>, direction: Vector3): bool {
        if (simplex.length == 2) return this.lineCase(simplex, direction);
        if (simplex.length == 3) return this.triangleCase(simplex, direction);
        return this.tetrahedronCase(simplex, direction);
    }

    static lineCase(simplex: Array<Vector3>, direction: Vector3): bool {
        const a = simplex[0];
        const b = simplex[1];
        const ab = Vector3.copy(b).subtractVector(a);
        const ao = Vector3.zero.subtractVector(a);
        const abPerpendicular = this.tripleProduct(ab, ao, ab);
        direction.setVector(abPerpendicular);
        return false;
    }

    static triangleCase(simplex: Array<Vector3>, direction: Vector3): bool {
        const a = simplex[0];
        const b = simplex[1];
        const c = simplex[2];
        const ab = Vector3.copy(b).subtractVector(a);
        const ac = Vector3.copy(c).subtractVector(a);
        const ao = Vector3.zero.subtractVector(a);

        const abPerpendicular = this.tripleProduct(ac, ab, ab);
        if (Vector3.dot(abPerpendicular, ao) > 0) {
            simplex.splice(0, 1);
            direction.setVector(abPerpendicular);
            return false;
        }

        const acPerpendicular = this.tripleProduct(ab, ac, ac);
        if (Vector3.dot(acPerpendicular, ao) > 0) {
            simplex.splice(1, 1);
            direction.setVector(acPerpendicular);
            return false;
        }

        return false;
    }

    static tetrahedronCase(simplex: Array<Vector3>, direction: Vector3): bool {
        const a = simplex[0];
        const b = simplex[1];
        const c = simplex[2];
        const d = simplex[3];

        const ab = Vector3.copy(b).subtractVector(a);
        const ac = Vector3.copy(c).subtractVector(a);
        const ad = Vector3.copy(d).subtractVector(a);
        const ao = a.inversed;

        const abc = Vector3.cross(ab, ac);
        const acd = Vector3.cross(ac, ad);
        const adb = Vector3.cross(ad, ab);

        if (Vector3.dot(abc, ao) > 0) {
            simplex.splice(3, 1);
            direction.setVector(abc);
            return false;
        }

        if (Vector3.dot(acd, ao) > 0) {
            simplex.splice(1, 1);
            direction.setVector(acd);
            return false;
        }

        if (Vector3.dot(adb, ao) > 0) {
            simplex.splice(2, 1);
            direction.setVector(adb);
            return false;
        }

        return true;
    }
}
