import { CubeBoundingBox } from "./Core/Physics/Colliders/cubeBoundingBox";
import { SceneObject } from "./Core/sceneObject";
import { Component, Debug, Optional, Serialize, Time } from "./Core/NineEngine";

export class IfTranslater extends Component {
    @Serialize x: f32 = 0;
    @Serialize y: f32 = 0;
    @Serialize z: f32 = 0.1;

    @Serialize toggle: bool = true;
    @Serialize toggle2: bool = true;
    @Serialize msg: string = "IfTranslater message !!!";
    @Serialize ufo: SceneObject | null = null;
    po: Optional<SceneObject> = Optional.empty<SceneObject>();

    Start(): void {
        if (this.toggle || this.toggle2) console.log(this.msg);

        this.po = Optional.of<SceneObject>(this.ufo);
        const ufo = this.po.get();
        if (ufo.GetComponent<CubeBoundingBox>().isPresent()) console.log(ufo.name + " has CubeBoundingBox");
        Debug.log("Ufo: " + ufo.name);
    }

    Update(): void {
        this.updateFunc();
    }

    updateFunc(): void {
        this.sceneObject.transform.translateBy(this.x * Time.deltaTime, this.y * Time.deltaTime, this.z * Time.deltaTime);
    }
}