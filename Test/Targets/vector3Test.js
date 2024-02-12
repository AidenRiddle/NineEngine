import Vector3 from "../../Core/Math/vector3.js";

export class Vector3Test {
    testAdd() {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        v1.addVector(v2);
        assertEquals(v1.x, 5);
        assertEquals(v1.y, 7);
        assertEquals(v1.z, 9);
    }

    testMagnitude() {
        const v1 = new Vector3(1, 2, 3);
        const mag = v1.magnitude;
        assertEquals(mag, 3.7416573867739413);
    }

    testNormalized() {
        const v1 = new Vector3(1, 2, 3);
        const normalized = v1.asNormalized;
        assertEquals(normalized.x, 0.2672612419124244);
        assertEquals(normalized.y, 0.5345224838248488);
        assertEquals(normalized.z, 0.8017837257372732);
    }

    testDotProduct() {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const res = Vector3.dot(v1, v2);
        assertEquals(res, 32);
    }

    testCrossProduct() {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const res = Vector3.cross(v1, v2);
        assertEquals(res.x, -3);
        assertEquals(res.y, 6);
        assertEquals(res.z, -3);
    }

    testAngleBetween() {
        const v1 = new Vector3(1, 2, 3);
        const v2 = new Vector3(4, 5, 6);
        const res = Vector3.angleBetween(v1, v2);
        assertEquals(res, 12.933154491899135);
    }
}