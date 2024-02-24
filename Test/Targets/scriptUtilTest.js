import { AscScriptUtil } from "../../Core/GECore/Util/ascScriptUtil.js";

export class ScriptUtilTest {
    formatted = `import { BoundingBox } from "./Core/Physics/Colliders/boundingBox";
import { Component, Time } from "./NineEngine";

export class IfSpinner extends Component implements A, B, C {
    @Serialize angleToRad: f32 = 3.14159 / 180;
    @Serialize xrot: f32 = xrot;
    @Serialize yrot: f32 = yrot;
    @Serialize zrot: f32 = zrot;
    //@Serialize joe: BoundingBox = (<BoundingBox> notJoe);

    Start(): void {}
    Update(): void {
        this.updateFunc();
    }

    /* Single Line encapsulated comment */
        /* 
            Multi
            Line 
            encapsulated 
            comment 
        */

    updateFunc(): void {
        const xangle = this.xrot * Time.deltaTime;
        const yangle = this.yrot * Time.deltaTime;
        const zangle = this.zrot * Time.deltaTime;

        //this.joe.isColliding;
        this.sceneObject.transform.rotateByEuler(xangle, yangle, zangle);
    }
}
`;

    flat = `import { BoundingBox } from "./Core/Physics/Colliders/boundingBox";import { Component, Time } from "./NineEngine";export class IfSpinner extends Component implements A, B, C {@Serialize angleToRad: f32 = 3.14159 / 180;@Serialize xrot: f32 = xrot;@Serialize yrot: f32 = yrot;@Serialize zrot: f32 = zrot;//@Serialize joe: BoundingBox = (<BoundingBox> notJoe);Start(): void {}Update(): void {this.updateFunc();}/* Single Line encapsulated comment *//*MultiLineencapsulatedcomment*/updateFunc(): void {const xangle = this.xrot * Time.deltaTime;const yangle = this.yrot * Time.deltaTime;const zangle = this.zrot * Time.deltaTime;//this.joe.isColliding;this.sceneObject.transform.rotateByEuler(xangle, yangle, zangle);}}`;

    testTokenStream() {
        const res = [];
        for (const t of AscScriptUtil.textToTokenStream(this.formatted)) { res.push(t); }
        assertEquals(res.length, 154);
    }

    testFlatten() {
        assertEquals(this.flat, AscScriptUtil.flattenCode(this.formatted));
    }

    testFormat() {
        // Self Verified
        const formatted = AscScriptUtil.formatCode(this.formatted).formattedText;
        assertTrue(true);
    }

    testClassName() {
        assertEquals("IfSpinner", AscScriptUtil.getClassName(this.formatted));
    }

    testInheritance() {
        const inheritance = AscScriptUtil.getInheritance(this.formatted, "IfSpinner");
        const parent = inheritance.parent;
        const interfaces = inheritance.interfaces;
        assertEquals(parent, "Component");
        assertEquals(interfaces.length, 3);
        assertEquals(interfaces[0], "A");
        assertEquals(interfaces[1], "B");
        assertEquals(interfaces[2], "C");
    }

    testUserDeclarations() {
        const serializedMembers = AscScriptUtil.getSerializedMembers(this.formatted, "IfSpinner");
        assertEquals(serializedMembers.length, 4);
        assertEquals(serializedMembers[0], "angleToRad");
        assertEquals(serializedMembers[1], "xrot");
        assertEquals(serializedMembers[2], "yrot");
        assertEquals(serializedMembers[3], "zrot");
    }
}