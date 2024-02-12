import SceneObject from "../sceneObject.js";

export default class Component {
    /** @type {SceneObject} */
    sceneObject;

    constructor(sceneObject) {
        this.sceneObject = sceneObject;
    }
}