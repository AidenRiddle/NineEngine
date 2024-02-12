import Vector3 from "./vector3.js";

export default class Matrix4 {
    static get identity() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    static #tempMatrix = this.identity;         //PlaceHolder matrix used during certain operations to avoid extra allocation
    static #otherTempMatrix = this.identity;    //PlaceHolder matrix used during certain operations to avoid extra allocation

    static errorCheck(m) {
        if (m.length != 16) throw new Error("Parameter is not a matrix.");
    }

    static resetToIdentity(m) {
        this.errorCheck(m);
        m[ 0] = 1; m[ 1] = 0; m[ 2] = 0; m[ 3] = 0;
        m[ 4] = 0; m[ 5] = 1; m[ 6] = 0; m[ 7] = 0;
        m[ 8] = 0; m[ 9] = 0; m[10] = 1; m[11] = 0;
        m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
    }

    static print(src) {
        return "\n" + src[0] + " | " + src[1] + " | " + src[2] + " | " + src[3] + " | " +
            "\n" + src[4] + " | " + src[5] + " | " + src[6] + " | " + src[7] + " | " +
            "\n" + src[8] + " | " + src[9] + " | " + src[10] + " | " + src[11] + " | " +
            "\n" + src[12] + " | " + src[13] + " | " + src[14] + " | " + src[15] + " | ";
    }

    static copy(dst, src) {
        this.errorCheck(src);
        this.errorCheck(dst);

        const matrixSize = 16;
        for (let i = 0; i < matrixSize; i++) dst[i] = src[i];
        return dst;
    }

    static setPosition = function (m, tx, ty, tz) {
        this.errorCheck(m);
        m[12] = tx;
        m[13] = ty;
        m[14] = tz;
    }

    static translateBy = function (m, tx, ty, tz) {
        this.errorCheck(m);
        m[12] += tx;
        m[13] += ty;
        m[14] += tz;
    }

    static setScale = function (m, sx, sy, sz) {
        this.errorCheck(m);
        m[0] = sx;
        m[5] = sy;
        m[10] = sz;
    }

    static scaleBy = function (m, sx, sy, sz) {
        this.errorCheck(m);
        m[0] *= sx;
        m[5] *= sy;
        m[10] *= sz;
    }

    static setRotation = function (m, xAngleInRad, yAngleInRad, zAngleInRad) {
        this.errorCheck(m);

        this.resetToIdentity(this.#otherTempMatrix);
        this.rotateBy(this.#otherTempMatrix, xAngleInRad, yAngleInRad, zAngleInRad);

        this.multiply(m, m, this.#otherTempMatrix);
    }

    static rotateBy = function (m, xAngleInRad, yAngleInRad, zAngleInRad) {
        this.errorCheck(m);

        if (xAngleInRad != 0) { this.rotateXBy(m, xAngleInRad); }
        if (yAngleInRad != 0) { this.rotateYBy(m, yAngleInRad); }
        if (zAngleInRad != 0) { this.rotateZBy(m, zAngleInRad); }
    }

    static rotateXBy = function (m, angleInRad) {
        this.errorCheck(m);
        this.resetToIdentity(this.#tempMatrix);

        const q1 = Math.cos(angleInRad);
        const q2 = Math.sin(angleInRad);

        this.#tempMatrix[5] = q1;
        this.#tempMatrix[6] = q2;
        this.#tempMatrix[9] = -q2;
        this.#tempMatrix[10] = q1;

        this.multiply(m, m, this.#tempMatrix);
    }

    static rotateYBy = function (m, angleInRad) {
        this.errorCheck(m);
        this.resetToIdentity(this.#tempMatrix);

        const q1 = Math.cos(angleInRad);
        const q2 = Math.sin(angleInRad);

        this.#tempMatrix[0] = q1;
        this.#tempMatrix[2] = -q2;
        this.#tempMatrix[8] = q2;
        this.#tempMatrix[10] = q1;

        this.multiply(m, m, this.#tempMatrix);
    }

    static rotateZBy = function (m, angleInRad) {
        this.errorCheck(m);
        this.resetToIdentity(this.#tempMatrix);

        const q1 = Math.cos(angleInRad);
        const q2 = Math.sin(angleInRad);

        this.#tempMatrix[0] = q1;
        this.#tempMatrix[1] = q2;
        this.#tempMatrix[4] = -q2;
        this.#tempMatrix[5] = q1;

        this.multiply(m, m, this.#tempMatrix);
    }

    static multiply = function (dst, a, b) {
        this.errorCheck(dst);
        this.errorCheck(a);
        this.errorCheck(b);

        this.#tempMatrix[0] = b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12];
        this.#tempMatrix[1] = b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13];
        this.#tempMatrix[2] = b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14];
        this.#tempMatrix[3] = b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15];

        this.#tempMatrix[4] = b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12];
        this.#tempMatrix[5] = b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13];
        this.#tempMatrix[6] = b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14];
        this.#tempMatrix[7] = b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15];

        this.#tempMatrix[8] = b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12];
        this.#tempMatrix[9] = b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13];
        this.#tempMatrix[10] = b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14];
        this.#tempMatrix[11] = b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15];

        this.#tempMatrix[12] = b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12];
        this.#tempMatrix[13] = b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13];
        this.#tempMatrix[14] = b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14];
        this.#tempMatrix[15] = b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15];

        this.copy(dst, this.#tempMatrix);
    }

    static multiplyVector(mat, vec) {
        this.errorCheck(mat);
        const x = vec.x;
        const y = vec.y;
        const z = vec.z;
        vec.set(
            x * mat[0] + y * mat[4] + z * mat[8] + mat[12],
            x * mat[1] + y * mat[5] + z * mat[9] + mat[13],
            x * mat[2] + y * mat[6] + z * mat[10] + mat[14],
        );
    }

    // https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    static inverse(dst, src) {
        this.errorCheck(dst);
        this.errorCheck(src);

        const tmp_0 = src[10] * src[15], tmp_1 = src[14] * src[11], tmp_2 = src[6] * src[15], tmp_3 = src[14] * src[7];
        const tmp_4 = src[6] * src[11], tmp_5 = src[10] * src[7], tmp_6 = src[2] * src[15], tmp_7 = src[14] * src[3];
        const tmp_8 = src[2] * src[11], tmp_9 = src[10] * src[3], tmp_10 = src[2] * src[7], tmp_11 = src[6] * src[3];
        const tmp_12 = src[8] * src[13], tmp_13 = src[12] * src[9], tmp_14 = src[4] * src[13], tmp_15 = src[12] * src[5];
        const tmp_16 = src[4] * src[9], tmp_17 = src[8] * src[5], tmp_18 = src[0] * src[13], tmp_19 = src[12] * src[1];
        const tmp_20 = src[0] * src[9], tmp_21 = src[8] * src[1], tmp_22 = src[0] * src[5], tmp_23 = src[4] * src[1];

        const t0 = (tmp_0 * src[5] + tmp_3 * src[9] + tmp_4 * src[13]) - (tmp_1 * src[5] + tmp_2 * src[9] + tmp_5 * src[13]);
        const t1 = (tmp_1 * src[1] + tmp_6 * src[9] + tmp_9 * src[13]) - (tmp_0 * src[1] + tmp_7 * src[9] + tmp_8 * src[13]);
        const t2 = (tmp_2 * src[1] + tmp_7 * src[5] + tmp_10 * src[13]) - (tmp_3 * src[1] + tmp_6 * src[5] + tmp_11 * src[13]);
        const t3 = (tmp_5 * src[1] + tmp_8 * src[5] + tmp_11 * src[9]) - (tmp_4 * src[1] + tmp_9 * src[5] + tmp_10 * src[9]);

        const d = 1.0 / (src[0] * t0 + src[4] * t1 + src[8] * t2 + src[12] * t3);

        const tm = this.#tempMatrix;
        tm[0] = d * t0;
        tm[1] = d * t1;
        tm[2] = d * t2;
        tm[3] = d * t3;
        tm[4] = d * ((tmp_1 * src[4] + tmp_2 * src[8] + tmp_5 * src[12]) - (tmp_0 * src[4] + tmp_3 * src[8] + tmp_4 * src[12]));
        tm[5] = d * ((tmp_0 * src[0] + tmp_7 * src[8] + tmp_8 * src[12]) - (tmp_1 * src[0] + tmp_6 * src[8] + tmp_9 * src[12]));
        tm[6] = d * ((tmp_3 * src[0] + tmp_6 * src[4] + tmp_11 * src[12]) - (tmp_2 * src[0] + tmp_7 * src[4] + tmp_10 * src[12]));
        tm[7] = d * ((tmp_4 * src[0] + tmp_9 * src[4] + tmp_10 * src[8]) - (tmp_5 * src[0] + tmp_8 * src[4] + tmp_11 * src[8]));
        tm[8] = d * ((tmp_12 * src[7] + tmp_15 * src[11] + tmp_16 * src[15]) - (tmp_13 * src[7] + tmp_14 * src[11] + tmp_17 * src[15]));
        tm[9] = d * ((tmp_13 * src[3] + tmp_18 * src[11] + tmp_21 * src[15]) - (tmp_12 * src[3] + tmp_19 * src[11] + tmp_20 * src[15]));
        tm[10] = d * ((tmp_14 * src[3] + tmp_19 * src[7] + tmp_22 * src[15]) - (tmp_15 * src[3] + tmp_18 * src[7] + tmp_23 * src[15]));
        tm[11] = d * ((tmp_17 * src[3] + tmp_20 * src[7] + tmp_23 * src[11]) - (tmp_16 * src[3] + tmp_21 * src[7] + tmp_22 * src[11]));
        tm[12] = d * ((tmp_14 * src[10] + tmp_17 * src[14] + tmp_13 * src[6]) - (tmp_16 * src[14] + tmp_12 * src[6] + tmp_15 * src[10]));
        tm[13] = d * ((tmp_20 * src[14] + tmp_12 * src[2] + tmp_19 * src[10]) - (tmp_18 * src[10] + tmp_21 * src[14] + tmp_13 * src[2]));
        tm[14] = d * ((tmp_18 * src[6] + tmp_23 * src[14] + tmp_15 * src[2]) - (tmp_22 * src[14] + tmp_14 * src[2] + tmp_19 * src[6]));
        tm[15] = d * ((tmp_22 * src[10] + tmp_16 * src[2] + tmp_21 * src[6]) - (tmp_20 * src[6] + tmp_23 * src[10] + tmp_17 * src[2]));

        this.copy(dst, tm);
    }

    static compose(dst, translation, quaternion, scale) {
        this.errorCheck(dst);

        const [x, y, z, w] = quaternion;
        const [sx, sy, sz] = scale;

        const x2 = x + x;
        const y2 = y + y;
        const z2 = z + z;

        const xx = x * x2;
        const xy = x * y2;
        const xz = x * z2;

        const yy = y * y2;
        const yz = y * z2;
        const zz = z * z2;

        const wx = w * x2;
        const wy = w * y2;
        const wz = w * z2;

        dst[0] = (1 - (yy + zz)) * sx;
        dst[1] = (xy + wz) * sx;
        dst[2] = (xz - wy) * sx;
        dst[3] = 0;

        dst[4] = (xy - wz) * sy;
        dst[5] = (1 - (xx + zz)) * sy;
        dst[6] = (yz + wx) * sy;
        dst[7] = 0;

        dst[ 8] = (xz + wy) * sz;
        dst[ 9] = (yz - wx) * sz;
        dst[10] = (1 - (xx + yy)) * sz;
        dst[11] = 0;

        dst[12] = translation[0];
        dst[13] = translation[1];
        dst[14] = translation[2];
        dst[15] = 1;

        return dst;
      }
}