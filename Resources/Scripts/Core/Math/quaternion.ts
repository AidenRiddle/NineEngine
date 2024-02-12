import Matrix4 from "./matrix4";
import Vector3 from "./vector3";

const degToRad = <f32>(Mathf.PI / 180);
const radToDeg = <f32>(180 / Mathf.PI);

export default class Quaternion {
    Quat: Float32Array = new Float32Array(4);

    get quat(): Float32Array { return this.Quat; }

    get w(): f32 { return this.Quat[0]; }
    get x(): f32 { return this.Quat[1]; }
    get y(): f32 { return this.Quat[2]; }
    get z(): f32 { return this.Quat[3]; }
    set w(value: f32) { this.Quat[0] = value; }
    set x(value: f32) { this.Quat[1] = value; }
    set y(value: f32) { this.Quat[2] = value; }
    set z(value: f32) { this.Quat[3] = value; }

    get norm(): f32 { return Mathf.sqrt((this.w * this.w) + (this.x * this.x) + (this.y * this.y) + (this.z * this.z)); }
    get conjugated(): Quaternion { return new Quaternion(this.w, this.x, this.y, this.z).conjugate(); }
    get inversed(): Quaternion { return new Quaternion(this.w, this.x, this.y, this.z).inverse(); }
    get normalized(): Quaternion { return new Quaternion(this.w, this.x, this.y, this.z).normalize(); }
    get angle(): f32 { return 2 * Mathf.acos(this.w) * radToDeg; }
    get axis(): Vector3 { return new Vector3(this.x, this.y, this.z).normalize(); }

    static get identity(): Quaternion { return new Quaternion(1, 0, 0, 0); }

    constructor(w: f32, x: f32, y: f32, z: f32) {
        this.Quat[0] = w;
        this.Quat[1] = x;
        this.Quat[2] = y;
        this.Quat[3] = z;
    }

    static fromPure(w: f32, x: f32, y: f32, z: f32): Quaternion { return new Quaternion(w, x, y, z); }

    conjugate(): Quaternion {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    normalize(): Quaternion {
        const norm = this.norm;
        this.w /= norm;
        this.x /= norm;
        this.y /= norm;
        this.z /= norm;
        return this;
    }

    inverse(): Quaternion {
        const norm = this.norm;
        const conj = this.conjugated;
        conj.scaleBy(1 / (norm * norm));
        this.w = conj.w;
        this.x = conj.x;
        this.y = conj.y;
        this.z = conj.z;
        return this;
    }

    /**
     * @param {*} angle 
     * @param {Vector3} axis 
     * @returns 
     */
    static from(angle: f32, axis: Vector3): Quaternion {
        const finalAngle = angle * degToRad * 0.5;
        axis = axis.normalized;
        return new Quaternion(
            Mathf.cos(finalAngle),
            Mathf.sin(finalAngle) * axis.x,
            Mathf.sin(finalAngle) * axis.y,
            Mathf.sin(finalAngle) * axis.z
        );
    }

    static fromEuler(x: f32, y: f32, z: f32): Quaternion {
        const newQuat = Quaternion.identity;
        newQuat.setFromEuler(x, y, z);
        return newQuat;
    }

    static fromEulerVector(vec: Vector3): Quaternion {
        return this.fromEuler(vec.x, vec.y, vec.z);
    }

    set(w: f32, x: f32, y: f32, z: f32): Quaternion { this.w = w; this.x = x; this.y = y; this.z = z; return this; }
    add(w: f32, x: f32, y: f32, z: f32): Quaternion { this.w += w; this.x += x; this.y += y; this.z += z; return this; }
    subtract(w: f32, x: f32, y: f32, z: f32): Quaternion { this.w -= w; this.x -= x; this.y -= y; this.z -= z; return this; }
    scale(w: f32, x: f32, y: f32, z: f32): Quaternion { this.w *= w; this.x *= x; this.y *= y; this.z *= z; return this; }

    multiply(w: f32, x: f32, y: f32, z: f32): Quaternion {
        const sa = this.w; const sb = w;
        const xa = this.x; const xb = x;
        const ya = this.y; const yb = y;
        const za = this.z; const zb = z;

        this.w = (sa * sb) - (xa * xb) - (ya * yb) - (za * zb);
        this.x = (sa * xb) + (sb * xa) + (ya * zb) - (yb * za);
        this.y = (sa * yb) + (sb * ya) + (za * xb) - (zb * xa);
        this.z = (sa * zb) + (sb * za) + (xa * yb) - (xb * ya);

        return this;
    }

    setQuaternion(q: Quaternion): Quaternion { return this.set(q.w, q.x, q.y, q.z); }
    addQuaternion(q: Quaternion): Quaternion { return this.add(q.w, q.x, q.y, q.z); }
    subtractQuaternion(q: Quaternion): Quaternion { return this.subtract(q.w, q.x, q.y, q.z); }
    multiplyQuaternion(q: Quaternion): Quaternion { return this.multiply(q.w, q.x, q.y, q.z); }
    scaleBy(scalar: f32): Quaternion { return this.scale(scalar, scalar, scalar, scalar); }

    static rm(q: Quaternion): Matrix4 {
        return q.toRotationMatrix();
    }

    writeToRotationMatrix(buffer: Float32Array): void {
        // https://www.omnicalculator.com/Mathf/quaternion#3d-geometry-quaternion-rotation
        // The rotation matrix from this source has been transposed here for compatibility

        const a = this.w;
        const b = this.x;
        const c = this.y;
        const d = this.z;

        const ab = a * b;
        const ac = a * c;
        const ad = a * d;
        const bb = b * b;
        const bc = b * c;
        const bd = b * d;
        const cc = c * c;
        const cd = c * d;
        const dd = d * d;

        Matrix4.resetToIdentity(buffer);
        buffer[0] = 1 - (2 * (cc + dd));
        buffer[4] = 2 * (bc - ad);
        buffer[8] = 2 * (bd + ac);
        buffer[1] = 2 * (bc + ad);
        buffer[5] = 1 - (2 * (bb + dd));
        buffer[9] = 2 * (cd - ab);
        buffer[2] = 2 * (bd - ac);
        buffer[6] = 2 * (cd + ab);
        buffer[10] = 1 - (2 * (bb + cc));
    }

    toRotationMatrix(): Float32Array {
        const buffer = Matrix4.identity;
        this.writeToRotationMatrix(buffer);
        return buffer;
    }

    toEulerVector(): Vector3 {
        // https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles

        // roll (x-axis rotation)
        const sinr_cosp: f32 = 2 * (this.w * this.x + this.y * this.z);
        const cosr_cosp: f32 = 1 - 2 * (this.x * this.x + this.y * this.y);

        // pitch (y-axis rotation)
        const temp: f32 = 2 * (this.w * this.y - this.x * this.z);
        const sinp: f32 = Mathf.sqrt(1 + temp);
        const cosp: f32 = Mathf.sqrt(1 - temp);

        // yaw (z-axis rotation)
        const siny_cosp: f32 = 2 * (this.w * this.z + this.x * this.y);
        const cosy_cosp: f32 = 1 - 2 * (this.y * this.y + this.z * this.z);

        return new Vector3(
            Mathf.atan2(sinr_cosp, cosr_cosp) * radToDeg,
            (2 * Mathf.atan2(sinp, cosp) - Mathf.PI / 2) * radToDeg,
            Mathf.atan2(siny_cosp, cosy_cosp) * radToDeg
        );
    }

    setFromEuler(x: f32, y: f32, z: f32): Quaternion {
        const roll = x * degToRad * 0.5;
        const pitch = y * degToRad * 0.5;
        const yaw = z * degToRad * 0.5;

        const cr = Mathf.cos(roll);
        const sr = Mathf.sin(roll);
        const cp = Mathf.cos(pitch);
        const sp = Mathf.sin(pitch);
        const cy = Mathf.cos(yaw);
        const sy = Mathf.sin(yaw);

        return this.set(
            cr * cp * cy + sr * sp * sy,
            sr * cp * cy - cr * sp * sy,
            cr * sp * cy + sr * cp * sy,
            cr * cp * sy - sr * sp * cy
        )
    }

    setFromEulerVector(vec: Vector3): Quaternion {
        return this.setFromEuler(vec.x, vec.y, vec.z);
    }

    static multiply(a: Quaternion, b: Quaternion): Quaternion {
        return a.multiplyQuaternion(b);
    }

    multiplyByVector(vec: Vector3): Quaternion {
        // result = q * p * qi    where qi is the inverse of q
        const q = this;
        const p = new Quaternion(0, vec.x, vec.y, vec.z);
        const qi = q.inversed;
        return q.multiplyQuaternion(p).multiplyQuaternion(qi);
    }

    static rotateVector(q: Quaternion, v: Vector3): Vector3 {
        const tempQuaternion = new Quaternion(q.w, q.x, q.y, q.z);
        tempQuaternion.multiplyByVector(v);
        return new Vector3(tempQuaternion.x, tempQuaternion.y, tempQuaternion.z);
    }

    rotate(w: f32, x: f32, y: f32, z: f32): Quaternion {
        return this.multiply(w, x, y, z);
    }

    rotateQuaternion(quat: Quaternion): Quaternion {
        return this.multiplyQuaternion(quat);
    }

    rotateEuler(x: f32, y: f32, z: f32): Quaternion {
        const tempQuaternion = Quaternion.fromEuler(x, y, z);
        return this.multiplyQuaternion(tempQuaternion);
    }

    rotateVector(vec: Vector3): Quaternion { return this.rotateEuler(vec.x, vec.y, vec.z); }

    rotateAround(angle: f32, axis: Vector3): Quaternion {
        const rotation = Quaternion.from(angle, axis).multiplyQuaternion(this);
        return this.setQuaternion(rotation);
    }
}