import { Transform } from "./transform.js";
import Matrix4 from "../../Math/matrix4.js";
import { System, AppSettings } from "../../../settings.js";
import Debug from "../../GECore/Util/debug.js";
import Component from "./component.js";
import { Projection } from "../../Math/projection.js";

export default class Camera extends Component {
    /** @type Camera */
    static activeCamera;

    transform = new Transform(this);
    #perspectiveMatrix = Matrix4.identity;
    #orthographicMatrix = Matrix4.identity;
    #viewProjectionMatrix = Matrix4.identity;

    #fov;
    #isPerspective = true;
    #clipPlaneNear;
    #clipPlaneFar;

    get fov() { return this.#fov; }
    get isPerspective() { return this.#isPerspective; }
    get clipPlaneNear() { return this.#clipPlaneNear; }
    get clipPlaneFar() { return this.#clipPlaneFar; }

    set isPerspective(value) { this.#isPerspective = value; }

    constructor(isPerspective, fieldOfView, near = 0.01, far = 2000) {
        super();
        this.#isPerspective = isPerspective;
        this.#fov = fieldOfView;
        this.#clipPlaneNear = near;
        this.#clipPlaneFar = far;

        Projection.perspective(this.#perspectiveMatrix, fieldOfView, AppSettings.aspect_ratio, near, far);
        Projection.orthographic(this.#orthographicMatrix, 10, 10, near, far);
    }

    setAspectRatio(ratio) {
        Projection.perspective(this.#perspectiveMatrix, this.#fov, ratio, this.#clipPlaneNear, this.#clipPlaneFar);
    }

    setFov(fov) {
        this.#fov = Math.max(Math.min(fov, System.camera_zoom_max), System.camera_zoom_min);
        Projection.perspective(this.#perspectiveMatrix, this.#fov, AppSettings.aspect_ratio, this.#clipPlaneNear, this.#clipPlaneFar);
    }

    getViewProjection() {
        Debug.Log("Camera: ", ~~this.transform.worldMatrix[12], ~~this.transform.worldMatrix[13], ~~this.transform.worldMatrix[14]);

        const distortionMatrix = (this.#isPerspective)
            ? this.#perspectiveMatrix
            : this.#orthographicMatrix;

        Projection.projectView(this.#viewProjectionMatrix, this.transform.worldMatrix, distortionMatrix);
        return this.#viewProjectionMatrix;
    }
}