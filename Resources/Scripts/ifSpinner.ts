import { Component, Serialize, Time } from "./Core/NineEngine";

export class IfSpinner extends Component {
    angleToRad: f32 = 3.14159 / 180;

    @Serialize
    xrot: i16 = 12;

    @Serialize
    yrot: i16 = 0;

    @Serialize
    zrot: i16 = 0;

    Update(): void {
        this.updateFunc();
    }

    updateFunc(): void {
        const xangle = <f32>this.xrot * Time.deltaTime;
        const yangle = <f32>this.yrot * Time.deltaTime;
        const zangle = <f32>this.zrot * Time.deltaTime;

        this.sceneObject.transform.rotateByEuler(xangle, yangle, zangle);
    }
}