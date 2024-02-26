import { DebugToggle, System } from "../../../settings.js";
import Matrix4 from "../../Math/matrix4.js";
import { Projection } from "../../Math/projection.js";
import SceneObject from "../sceneObject.js";
import Camera from "./camera.js";
import { Transform } from "./transform.js";

export class LightDirectional {
    /** @type LightDirectional */
    static activeLight;

    transform = new Transform(this);

    #width;
    #height;
    #depth;
    #intensity;
    #orthographicMatrix = Matrix4.identity;
    #viewProjectionMatrix = Matrix4.identity;
    #textureProjectionMatrix = Matrix4.identity;

    get width() { return this.#width; }
    get height() { return this.#height; }
    get depth() { return this.#depth; }
    get intensity() { return this.#intensity; }
    get viewProjection() { return this.#viewProjectionMatrix; }
    get textureProjection() { return this.#textureProjectionMatrix; }

    constructor(xRot, yRot, width, height, depth, intensity) {
        this.#width = width;
        this.#height = height;
        this.#depth = depth;
        this.#intensity = intensity;

        this.transform.setRotation(xRot, yRot, 0);
        this.transform.setPositionVector(this.transform.back.scale(depth / 2));

        Projection.orthographic(this.#orthographicMatrix, width, height, 1, depth);
    }

    getVisualDebug() {
        const shadowRealm = new SceneObject("default_Cube", "_shadowRealm", "lcam");
        const origin = new SceneObject("default_Cube", "_shadowOrigin", "lorg");
        shadowRealm.transform.parent = this.transform;
        shadowRealm.transform.setPosition(0, 0, this.#depth / 2);
        shadowRealm.transform.setScale(this.#width, this.#height, this.#depth);
        origin.transform.parent = this.transform;

        return [shadowRealm, origin];
    }

    getViewProjection() { return this.#viewProjectionMatrix; }

    updateLightInformation() {
        this.transform.updateWorldMatrix();
        Projection.projectView(this.#viewProjectionMatrix, this.transform.worldMatrix, this.#orthographicMatrix);

        Matrix4.resetToIdentity(this.#textureProjectionMatrix);
        Matrix4.translateBy(this.#textureProjectionMatrix, 0.5, 0.5, 0.5);
        Matrix4.scaleBy(this.#textureProjectionMatrix, 0.5, 0.5, 0.5);
        Matrix4.multiply(this.#textureProjectionMatrix, this.#textureProjectionMatrix, this.#viewProjectionMatrix);
    }
}