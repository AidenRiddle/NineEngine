import { System } from "../../settings.js";
import Matrix4 from "./matrix4.js";

export class Projection {
    static #corrector = this.#createCorrectorMatrix();

    static #createCorrectorMatrix() {
        const res = Matrix4.identity;
        Matrix4.rotateYBy(res, 180 * System.deg_to_rad);
        return res;
    }

    static orthographic(dst, width, height, near, far) {
        const left = -width / 2;
        const right = width / 2;
        const bottom = height / 2;
        const top = -height / 2;

        Matrix4.resetToIdentity(dst);
        dst[0] = 2 / (right - left);
        dst[5] = -2 / (top - bottom);
        dst[10] = 2 / (near - far);
        dst[12] = (left + right) / (left - right);
        dst[13] = (bottom + top) / (bottom - top);
        dst[14] = (near + far) / (near - far);
        dst[15] = 1;
    }

    static perspective(dst, fov, aspect, near, far) {
        const fieldOfViewInRadians = fov * System.deg_to_rad;
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        const rangeInv = 1.0 / (near - far);

        Matrix4.resetToIdentity(dst);
        dst[0] = f / aspect;
        dst[5] = f;
        dst[10] = (near + far) * rangeInv;
        dst[11] = -1;
        dst[14] = near * far * rangeInv * 2;
        dst[15] = 0;
    }

    static projectView(dst, objectMatrix, distortionMatrix) {
        Matrix4.multiply(dst, objectMatrix, this.#corrector);
        Matrix4.inverse(dst, dst);
        Matrix4.multiply(dst, distortionMatrix, dst);
    }
}