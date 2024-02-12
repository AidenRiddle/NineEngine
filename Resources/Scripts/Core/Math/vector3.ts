
const degToRad: f32 = Mathf.PI / 180;
const radToDeg: f32 = 180 / Mathf.PI;

export default class Vector3 {
    Vec: Float32Array = new Float32Array(3);

    static get zero(): Vector3 { return new Vector3(0, 0, 0); }
    static get one(): Vector3 { return new Vector3(1, 1, 1); }

    static get up(): Vector3 { return new Vector3(0, 1, 0); }
    static get forward(): Vector3 { return new Vector3(0, 0, 1); }
    static get left(): Vector3 { return new Vector3(1, 0, 0); }

    static get down(): Vector3 { return new Vector3(0, -1, 0); }
    static get back(): Vector3 { return new Vector3(0, 0, -1); }
    static get right(): Vector3 { return new Vector3(-1, 0, 0); }

    get x(): f32 { return this.Vec[0]; }
    get y(): f32 { return this.Vec[1]; }
    get z(): f32 { return this.Vec[2]; }
    set x(value: f32) { this.Vec[0] = value; }
    set y(value: f32) { this.Vec[1] = value; }
    set z(value: f32) { this.Vec[2] = value; }

    get magnitude(): f32 { return Mathf.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z)); }
    get inversed(): Vector3 { return Vector3.copy(this).inverse(); }
    get normalized(): Vector3 { return Vector3.copy(this).normalize(); }

    constructor(x: f32, y: f32, z: f32) {
        this.Vec[0] = x;
        this.Vec[1] = y;
        this.Vec[2] = z;
    }

    static dot(v1: Vector3, v2: Vector3): f32 { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
    static cross(v1: Vector3, v2: Vector3): Vector3 {
        return new Vector3(
            v1.y * v2.z - v1.z * v2.y,
            v1.z * v2.x - v1.x * v2.z,
            v1.x * v2.y - v1.y * v2.x
        );
    }

    static angleBetween(v1: Vector3, v2: Vector3): f32 { return Mathf.acos(this.dot(v1, v2) / (v1.magnitude * v2.magnitude)) * radToDeg; }
    static axisBetween(v1: Vector3, v2: Vector3): Vector3 { return this.cross(v1, v2).normalize(); }

    static copy(v: Vector3): Vector3 { return new Vector3(v.x, v.y, v.z); }

    set(x: f32, y: f32, z: f32): Vector3 { this.x = x; this.y = y; this.z = z; return this; }
    add(x: f32, y: f32, z: f32): Vector3 { this.x += x; this.y += y; this.z += z; return this; }
    subtract(x: f32, y: f32, z: f32): Vector3 { this.x -= x; this.y -= y; this.z -= z; return this; }
    multiply(x: f32, y: f32, z: f32): Vector3 { this.x *= x; this.y *= y; this.z *= z; return this; }
    divide(x: f32, y: f32, z: f32): Vector3 { this.x /= x; this.y /= y; this.z /= z; return this; }

    setVector(vec: Vector3): Vector3 { return this.set(vec.x, vec.y, vec.z); }
    addVector(vec: Vector3): Vector3 { return this.add(vec.x, vec.y, vec.z); }
    subtractVector(vec: Vector3): Vector3 { return this.subtract(vec.x, vec.y, vec.z); }
    multiplyVector(vec: Vector3): Vector3 { return this.multiply(vec.x, vec.y, vec.z); }
    divideVector(vec: Vector3): Vector3 { return this.divide(vec.x, vec.y, vec.z); }

    scale(scalar: f32): Vector3 { return this.multiply(scalar, scalar, scalar); }

    inverse(): Vector3 {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    normalize(): Vector3 {
        const mag = this.magnitude;
        if (mag == 0) return this;
        const invMag = <f32>1.0 / mag;
        this.x *= invMag;
        this.y *= invMag;
        this.z *= invMag;
        return this;
    }
}