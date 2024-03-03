import Quaternion from "./quaternion.js";

const deg2rad = Math.PI / 180;
const rad2deg = 180 / Math.PI;

export default class Vector3 {
    x; y; z;

    static get zero() { return new Vector3(0, 0, 0); }
    static get one() { return new Vector3(1, 1, 1); }

    static get up() { return new Vector3(0, 1, 0); }
    static get forward() { return new Vector3(0, 0, 1); }
    static get left() { return new Vector3(1, 0, 0); }

    static get down() { return new Vector3(0, -1, 0); }
    static get back() { return new Vector3(0, 0, -1); }
    static get right() { return new Vector3(-1, 0, 0); }

    get magnitude() { return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z)); }
    get asNormalized() { return Vector3.copy(this).normalize(); }

    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static from(x, y, z) { return new Vector3(x, y, z); }

    static dot(v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
    static cross(v1, v2) {
        return new Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        );
    }

    static angleBetween(v1, v2) { return Math.acos(this.dot(v1, v2) / (v1.magnitude * v2.magnitude)) * rad2deg; }
    static axisBetween(v1, v2) { return this.cross(v1, v2).normalize(); }

    static copy(v) { return new Vector3(v.x, v.y, v.z); }

    values() { return [this.x, this.y, this.z]; }

    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    add(x, y, z) { this.x += x; this.y += y; this.z += z; return this; }
    subtract(x, y, z) { this.x -= x; this.y -= y; this.z -= z; return this; }
    multiply(x, y, z) { this.x *= x; this.y *= y; this.z *= z; return this; }
    divide(x, y, z) { this.x /= x; this.y /= y; this.z /= z; return this; }

    scale(scalar) { return this.multiply(scalar, scalar, scalar); }

    setVector(vec) { return this.set(vec.x, vec.y, vec.z); }
    addVector(vec) { return this.add(vec.x, vec.y, vec.z); }
    subtractVector(vec) { return this.subtract(vec.x, vec.y, vec.z); }
    multiplyVector(vec) { return this.multiply(vec.x, vec.y, vec.z); }
    divideVector(vec) { return this.divide(vec.x, vec.y, vec.z); }

    setQuaternion(quat) { return this.setVector(quat.toEulerVector()); }
    addQuaternion(quat) { return this.addVector(quat.toEulerVector()); }
    subtractQuaternion(quat) { return this.subtractVector(quat.toEulerVector()); }
    multiplyQuaternion(quat) { return this.multiplyVector(quat.toEulerVector()); }
    divideQuaternion(quat) { return this.divideVector(quat.toEulerVector()); }

    normalize() {
        const invMag = 1 / this.magnitude;
        this.x *= invMag;
        this.y *= invMag;
        this.z *= invMag;
        return this;
    }

    rotateVector(vec) {
        return Quaternion.rotateVector(
            Quaternion.fromVector(this),
            vec
        );
    }
}
Vector3.prototype.toString = function () {
    return `(${this.x}, ${this.y}, ${this.z})`;
}