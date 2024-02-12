export default class Matrix4 {
    static get identity(): Float32Array {
        const identity = new Float32Array(16);
        identity.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
        return identity;
    }

    static tempMatrix: Float32Array = Matrix4.identity;         //PlaceHolder matrix used during certain operations to avoid extra allocation
    static otherTempMatrix: Float32Array = Matrix4.identity;    //PlaceHolder matrix used during certain operations to avoid extra allocation

    static errorCheck(m: Float32Array): void {
        if (m.length != 16) throw new Error("Parameter is not a matrix.");
    }

    static resetToIdentity(m: Float32Array): void {
        this.errorCheck(m);
        m[0] = 1; m[1] = 0; m[2] = 0; m[3] = 0;
        m[4] = 0; m[5] = 1; m[6] = 0; m[7] = 0;
        m[8] = 0; m[9] = 0; m[10] = 1; m[11] = 0;
        m[12] = 0; m[13] = 0; m[14] = 0; m[15] = 1;
    }

    static print(src: Float32Array): String {
        return "\n[" + src[0] + "]" + "[" + src[1] + "]" + "[" + src[2] + "]" + "[" + src[3] + "]" +
            "\n[" + src[4] + "]" + "[" + src[5] + "]" + "[" + src[6] + "]" + "[" + src[7] + "]" +
            "\n[" + src[8] + "]" + "[" + src[9] + "]" + "[" + src[10] + "]" + "[" + src[11] + "]" +
            "\n[" + src[12] + "]" + "[" + src[13] + "]" + "[" + src[14] + "]" + "[" + src[15] + "]";
    }

    static copy(src: Float32Array, dst: Float32Array): Float32Array {
        this.errorCheck(src);
        this.errorCheck(dst);

        dst[0] = src[0];
        dst[1] = src[1];
        dst[2] = src[2];
        dst[3] = src[3];
        dst[4] = src[4];
        dst[5] = src[5];
        dst[6] = src[6];
        dst[7] = src[7];
        dst[8] = src[8];
        dst[9] = src[9];
        dst[10] = src[10];
        dst[11] = src[11];
        dst[12] = src[12];
        dst[13] = src[13];
        dst[14] = src[14];
        dst[15] = src[15];

        return dst;
    }

    static setPosition(m: Float32Array, tx: f32, ty: f32, tz: f32): void {
        this.errorCheck(m);
        m[12] = tx;
        m[13] = ty;
        m[14] = tz;
    }

    static translateBy(m: Float32Array, tx: f32, ty: f32, tz: f32): void {
        this.errorCheck(m);
        m[12] += tx;
        m[13] += ty;
        m[14] += tz;
    }

    static setScale(m: Float32Array, sx: f32, sy: f32, sz: f32): void {
        this.errorCheck(m);
        m[0] = sx;
        m[5] = sy;
        m[10] = sz;
    }

    static scaleBy(m: Float32Array, sx: f32, sy: f32, sz: f32): void {
        this.errorCheck(m);
        m[0] *= sx;
        m[5] *= sy;
        m[10] *= sz;
    }

    static setRotation(m: Float32Array, xAngleInRad: f32, yAngleInRad: f32, zAngleInRad: f32): void {
        this.errorCheck(m);

        const t1 = this.identity;
        this.rotateBy(t1, xAngleInRad, yAngleInRad, zAngleInRad);

        this.multiply(m, m, t1);
    }

    static rotateBy(m: Float32Array, xAngleInRad: f32, yAngleInRad: f32, zAngleInRad: f32): void {
        this.errorCheck(m);

        if (xAngleInRad != 0) { this.rotateXBy(m, xAngleInRad); }
        if (yAngleInRad != 0) { this.rotateYBy(m, yAngleInRad); }
        if (zAngleInRad != 0) { this.rotateZBy(m, zAngleInRad); }
    }

    static rotateXBy(m: Float32Array, angleInRad: f32): void {
        this.errorCheck(m);
        const res = this.identity;

        const q1 = Mathf.cos(angleInRad);
        const q2 = Mathf.sin(angleInRad);

        res[5] = q1;
        res[6] = q2;
        res[9] = -q2;
        res[10] = q1;

        this.multiply(m, m, res);
    }

    static rotateYBy(m: Float32Array, angleInRad: f32): void {
        this.errorCheck(m);
        const res = this.identity;

        const q1 = Mathf.cos(angleInRad);
        const q2 = Mathf.sin(angleInRad);

        res[0] = q1;
        res[2] = q2;
        res[8] = -q2;
        res[10] = q1;

        this.multiply(m, m, res);
    }

    static rotateZBy(m: Float32Array, angleInRad: f32): void {
        this.errorCheck(m);
        const res = this.identity;

        const q1 = Mathf.cos(angleInRad);
        const q2 = Mathf.sin(angleInRad);

        res[0] = q1;
        res[1] = q2;
        res[4] = -q2;
        res[5] = q1;

        this.multiply(m, m, res);
    }

    static multiply(dst: Float32Array, a: Float32Array, b: Float32Array): void {
        this.errorCheck(dst);
        this.errorCheck(a);
        this.errorCheck(b);
        //const localTemp = tempMatrix

        this.tempMatrix[0] = b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12];
        this.tempMatrix[1] = b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13];
        this.tempMatrix[2] = b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14];
        this.tempMatrix[3] = b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15];

        this.tempMatrix[4] = b[4] * a[0] + b[5] * a[4] + b[6] * a[8] + b[7] * a[12];
        this.tempMatrix[5] = b[4] * a[1] + b[5] * a[5] + b[6] * a[9] + b[7] * a[13];
        this.tempMatrix[6] = b[4] * a[2] + b[5] * a[6] + b[6] * a[10] + b[7] * a[14];
        this.tempMatrix[7] = b[4] * a[3] + b[5] * a[7] + b[6] * a[11] + b[7] * a[15];

        this.tempMatrix[8] = b[8] * a[0] + b[9] * a[4] + b[10] * a[8] + b[11] * a[12];
        this.tempMatrix[9] = b[8] * a[1] + b[9] * a[5] + b[10] * a[9] + b[11] * a[13];
        this.tempMatrix[10] = b[8] * a[2] + b[9] * a[6] + b[10] * a[10] + b[11] * a[14];
        this.tempMatrix[11] = b[8] * a[3] + b[9] * a[7] + b[10] * a[11] + b[11] * a[15];

        this.tempMatrix[12] = b[12] * a[0] + b[13] * a[4] + b[14] * a[8] + b[15] * a[12];
        this.tempMatrix[13] = b[12] * a[1] + b[13] * a[5] + b[14] * a[9] + b[15] * a[13];
        this.tempMatrix[14] = b[12] * a[2] + b[13] * a[6] + b[14] * a[10] + b[15] * a[14];
        this.tempMatrix[15] = b[12] * a[3] + b[13] * a[7] + b[14] * a[11] + b[15] * a[15];

        this.copy(this.tempMatrix, dst);
    }

    static multiplyMxV(a: Float32Array, b: Float32Array): Float32Array {
        this.errorCheck(a);
        const result = new Float32Array(4);
        result.set([
            b[0] * a[0] + b[1] * a[4] + b[2] * a[8] + b[3] * a[12],
            b[0] * a[1] + b[1] * a[5] + b[2] * a[9] + b[3] * a[13],
            b[0] * a[2] + b[1] * a[6] + b[2] * a[10] + b[3] * a[14],
            b[0] * a[3] + b[1] * a[7] + b[2] * a[11] + b[3] * a[15],
        ]);
        return result;
    }

    // https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html
    static inverse(target: Float32Array, source: Float32Array): void {
        const tmp_0 = source[10] * source[15], tmp_1 = source[14] * source[11], tmp_2 = source[6] * source[15], tmp_3 = source[14] * source[7];
        const tmp_4 = source[6] * source[11], tmp_5 = source[10] * source[7], tmp_6 = source[2] * source[15], tmp_7 = source[14] * source[3];
        const tmp_8 = source[2] * source[11], tmp_9 = source[10] * source[3], tmp_10 = source[2] * source[7], tmp_11 = source[6] * source[3];
        const tmp_12 = source[8] * source[13], tmp_13 = source[12] * source[9], tmp_14 = source[4] * source[13], tmp_15 = source[12] * source[5];
        const tmp_16 = source[4] * source[9], tmp_17 = source[8] * source[5], tmp_18 = source[0] * source[13], tmp_19 = source[12] * source[1];
        const tmp_20 = source[0] * source[9], tmp_21 = source[8] * source[1], tmp_22 = source[0] * source[5], tmp_23 = source[4] * source[1];

        const t0 = (tmp_0 * source[5] + tmp_3 * source[9] + tmp_4 * source[13]) - (tmp_1 * source[5] + tmp_2 * source[9] + tmp_5 * source[13]);
        const t1 = (tmp_1 * source[1] + tmp_6 * source[9] + tmp_9 * source[13]) - (tmp_0 * source[1] + tmp_7 * source[9] + tmp_8 * source[13]);
        const t2 = (tmp_2 * source[1] + tmp_7 * source[5] + tmp_10 * source[13]) - (tmp_3 * source[1] + tmp_6 * source[5] + tmp_11 * source[13]);
        const t3 = (tmp_5 * source[1] + tmp_8 * source[5] + tmp_11 * source[9]) - (tmp_4 * source[1] + tmp_9 * source[5] + tmp_10 * source[9]);

        const d = 1.0 / (source[0] * t0 + source[4] * t1 + source[8] * t2 + source[12] * t3);

        const localTemp = this.tempMatrix;
        localTemp[0] = d * t0;
        localTemp[1] = d * t1;
        localTemp[2] = d * t2;
        localTemp[3] = d * t3;
        localTemp[4] = d * ((tmp_1 * source[4] + tmp_2 * source[8] + tmp_5 * source[12]) - (tmp_0 * source[4] + tmp_3 * source[8] + tmp_4 * source[12]));
        localTemp[5] = d * ((tmp_0 * source[0] + tmp_7 * source[8] + tmp_8 * source[12]) - (tmp_1 * source[0] + tmp_6 * source[8] + tmp_9 * source[12]));
        localTemp[6] = d * ((tmp_3 * source[0] + tmp_6 * source[4] + tmp_11 * source[12]) - (tmp_2 * source[0] + tmp_7 * source[4] + tmp_10 * source[12]));
        localTemp[7] = d * ((tmp_4 * source[0] + tmp_9 * source[4] + tmp_10 * source[8]) - (tmp_5 * source[0] + tmp_8 * source[4] + tmp_11 * source[8]));
        localTemp[8] = d * ((tmp_12 * source[7] + tmp_15 * source[11] + tmp_16 * source[15]) - (tmp_13 * source[7] + tmp_14 * source[11] + tmp_17 * source[15]));
        localTemp[9] = d * ((tmp_13 * source[3] + tmp_18 * source[11] + tmp_21 * source[15]) - (tmp_12 * source[3] + tmp_19 * source[11] + tmp_20 * source[15]));
        localTemp[10] = d * ((tmp_14 * source[3] + tmp_19 * source[7] + tmp_22 * source[15]) - (tmp_15 * source[3] + tmp_18 * source[7] + tmp_23 * source[15]));
        localTemp[11] = d * ((tmp_17 * source[3] + tmp_20 * source[7] + tmp_23 * source[11]) - (tmp_16 * source[3] + tmp_21 * source[7] + tmp_22 * source[11]));
        localTemp[12] = d * ((tmp_14 * source[10] + tmp_17 * source[14] + tmp_13 * source[6]) - (tmp_16 * source[14] + tmp_12 * source[6] + tmp_15 * source[10]));
        localTemp[13] = d * ((tmp_20 * source[14] + tmp_12 * source[2] + tmp_19 * source[10]) - (tmp_18 * source[10] + tmp_21 * source[14] + tmp_13 * source[2]));
        localTemp[14] = d * ((tmp_18 * source[6] + tmp_23 * source[14] + tmp_15 * source[2]) - (tmp_22 * source[14] + tmp_14 * source[2] + tmp_19 * source[6]));
        localTemp[15] = d * ((tmp_22 * source[10] + tmp_16 * source[2] + tmp_21 * source[6]) - (tmp_20 * source[6] + tmp_23 * source[10] + tmp_17 * source[2]));

        this.copy(localTemp, target);
    }
}