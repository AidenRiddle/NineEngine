import Matrix4 from "./matrix4.js";
import Vector3 from "./vector3.js";

// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions
// https://www.omnicalculator.com/math/quaternion
// https://www.3dgep.com/understanding-quaternions/#Quaternions
// https://www.andre-gaschler.com/rotationconverter/

const deg2rad = Math.PI / 180;
const rad2deg = 180 / Math.PI;

export default class Quaternion {
    w; x; y; z;

    get norm() { return Math.sqrt((this.w * this.w) + (this.x * this.x) + (this.y * this.y) + (this.z * this.z)); }
    get conjugated() { return new Quaternion(this.w, this.x, this.y, this.z).conjugate(); }
    get inversed() { return new Quaternion(this.w, this.x, this.y, this.z).inverse(); }
    get asNormalized() { return new Quaternion(this.w, this.x, this.y, this.z).normalize(); }
    get angle() { return 2 * Math.acos(this.w) * rad2deg; }
    get axis() { return new Vector3(this.x, this.y, this.z).normalize(); }

    static get identity() { return new Quaternion(1, 0, 0, 0); }

    constructor(w, x, y, z) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static #errorCheck(q) { if (!(q instanceof Quaternion)) throw new Error("Parameter is not of type Quaternion."); }

    conjugate() { this.x = -this.x; this.y = -this.y; this.z = -this.z; return this; }
    normalize() { const norm = this.norm; this.w /= norm; this.x /= norm; this.y /= norm; this.z /= norm; return this; }
    inverse() {
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
    static from(angle, axis) {
        const finalAngle = angle * deg2rad * 0.5;
        axis = axis.asNormalized;
        return new Quaternion(
            Math.cos(finalAngle),
            Math.sin(finalAngle) * axis.x,
            Math.sin(finalAngle) * axis.y,
            Math.sin(finalAngle) * axis.z
        );
    }

    static fromEuler(x, y, z) {
        const newQuat = new Quaternion();
        newQuat.setFromEuler(x, y, z);
        return newQuat;
    }

    static fromVector(vec) {
        return this.fromEuler(vec.x, vec.y, vec.z);
    }

    static fromPure(w, x, y, z) { return new Quaternion(w, x, y, z); }

    static multiply(a, b) {
        return a.multiplyQuaternion(b);
    }

    static rotateVector(q, v) {
        const tempQuaternion = new Quaternion(q.w, q.x, q.y, q.z);
        tempQuaternion.multiplyByVector(v);
        return new Vector3(tempQuaternion.x, tempQuaternion.y, tempQuaternion.z);
    }

    values() { return [this.w, this.x, this.y, this.z]; }

    set(w, x, y, z) { this.w = w; this.x = x; this.y = y; this.z = z; return this; }
    add(w, x, y, z) { this.w += w; this.x += x; this.y += y; this.z += z; return this; }
    subtract(w, x, y, z) { this.w -= w; this.x -= x; this.y -= y; this.z -= z; return this; }
    scale(w, x, y, z) { this.w *= w; this.x *= x; this.y *= y; this.z *= z; return this; }

    multiply(w, x, y, z) {
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

    setQuaternion(quaternion) { return this.set(quaternion.w, quaternion.x, quaternion.y, quaternion.z); }
    addQuaternion(quaternion) { return this.add(quaternion.w, quaternion.x, quaternion.y, quaternion.z); }
    subtractQuaternion(quaternion) { return this.subtract(quaternion.w, quaternion.x, quaternion.y, quaternion.z); }
    multiplyQuaternion(quaternion) { return this.multiply(quaternion.w, quaternion.x, quaternion.y, quaternion.z); }
    scaleBy(scalar) { return this.scale(scalar, scalar, scalar, scalar); }

    toRotationMatrix() {
        // https://www.omnicalculator.com/math/quaternion#3d-geometry-quaternion-rotation
        // The rotation matrix from this source has been transposed here for compatibility

        const localTemp = Matrix4.identity;

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

        localTemp[0] = 1 - (2 * (cc + dd));
        localTemp[4] = 2 * (bc - ad);
        localTemp[8] = 2 * (bd + ac);
        localTemp[1] = 2 * (bc + ad);
        localTemp[5] = 1 - (2 * (bb + dd));
        localTemp[9] = 2 * (cd - ab);
        localTemp[2] = 2 * (bd - ac);
        localTemp[6] = 2 * (cd + ab);
        localTemp[10] = 1 - (2 * (bb + cc));

        return localTemp;
    }

    toEulerVector() {
        // https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles

        // roll (x-axis rotation)
        const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
        const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);

        // pitch (y-axis rotation)
        const temp = 2 * (this.w * this.y - this.x * this.z);
        const sinp = Math.sqrt(1 + temp);
        const cosp = Math.sqrt(1 - temp);

        // yaw (z-axis rotation)
        const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
        const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);

        return new Vector3(
            Math.atan2(sinr_cosp, cosr_cosp) * rad2deg,
            (2 * Math.atan2(sinp, cosp) - Math.PI / 2) * rad2deg,
            Math.atan2(siny_cosp, cosy_cosp) * rad2deg
        );
    }

    setFromEuler(x, y, z) {
        const roll = x * deg2rad * 0.5;
        const pitch = y * deg2rad * 0.5;
        const yaw = z * deg2rad * 0.5;

        const cr = Math.cos(roll);
        const sr = Math.sin(roll);
        const cp = Math.cos(pitch);
        const sp = Math.sin(pitch);
        const cy = Math.cos(yaw);
        const sy = Math.sin(yaw);

        return this.set(
            cr * cp * cy + sr * sp * sy,
            sr * cp * cy - cr * sp * sy,
            cr * sp * cy + sr * cp * sy,
            cr * cp * sy - sr * sp * cy
        )
    }

    setFromEulerVector(vec) {
        return this.setFromEuler(vec.x, vec.y, vec.z);
    }

    multiplyByVector(vec) {
        // result = q * p * qi    where qi is the inverse of q
        const q = this;
        const p = new Quaternion(0, vec.x, vec.y, vec.z);
        const qi = q.inversed;
        return q.multiplyQuaternion(p).multiplyQuaternion(qi);
    }

    rotate(w, x, y, z) {
        return this.multiply(w, x, y, z);
    }

    rotateQuaternion(quat) {
        return this.multiplyQuaternion(quat);
    }

    rotateEuler(x, y, z) {
        const tempQuaternion = Quaternion.fromEuler(x, y, z);
        return this.multiplyQuaternion(tempQuaternion);
    }

    rotateVector(vec) { return this.rotateEuler(vec.x, vec.y, vec.z); }

    rotateAround(angle, axis) {
        const rotation = Quaternion.from(angle, axis).multiplyQuaternion(this);
        return this.setQuaternion(rotation);
    }
}
Quaternion.prototype.toString = function () {
    return `(${this.w}, ${this.x}, ${this.y}, ${this.z})`;
}