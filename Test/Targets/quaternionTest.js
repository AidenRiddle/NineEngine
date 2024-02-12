import Quaternion from "../../Core/Math/quaternion.js";
import Vector3 from "../../Core/Math/vector3.js";

export class QuaternionTest {
    testFrom () {
        const quat = Quaternion.from(102, new Vector3(1, 7, 8));
        assertEquals(quat.w, 0.6293203910498375);
        assertEquals(quat.x, 0.0727863881028613);
        assertEquals(quat.y, 0.5095047167200291);
        assertEquals(quat.z, 0.5822911048228904);
    }

    testRotateVector () {
        const vec = Quaternion.rotateVector(
            Quaternion.from(45, new Vector3(0.707, 0, 0.707)),
            new Vector3(2, 0, 0)
        )
        assertEquals(vec.x, 1.7071067811865475);
        assertEquals(vec.y, 0.9999999999999998);
        assertEquals(vec.z, 0.29289321881345237);
    }

    testRotateVector2 () {
        const vec = Quaternion.rotateVector(
            Quaternion.from(45, new Vector3(0.707, 0, 0.707)),
            new Vector3(1, 2, 3)
        )
        assertEquals(vec.x, 0.2928932188134525);
        assertEquals(vec.y, 0.41421356237309537);
        assertEquals(vec.z, 3.7071067811865475);
    }

    testRotateVector3 () {
        const vec = Quaternion.rotateVector(
            Quaternion.from(102, new Vector3(1, 7, 8)),
            new Vector3(6, 1, 8)
        )

        assertEquals(vec.x, 3.9657720217285366);
        assertEquals(vec.y, 9.167656207021128);
        assertEquals(vec.z, 1.107579316140447);
    }

    testQuaternionFromEuler () {
        const q = Quaternion.identity;
        q.rotateEuler(0, 127, 0);

        assertEquals(q.w, 0.4461978131098087);
        assertEquals(q.x, 0);
        assertEquals(q.y, 0.8949343616020251);
        assertEquals(q.z, 0);

        const q2 = Quaternion.fromPure(0.4461978131098087, 0, 0.8949343616020251, 0);
        q2.rotateEuler(0, 127, 0);

        assertEquals(q2.w, -0.6018150231520485);
        assertEquals(q2.x, 0);
        assertEquals(q2.y, 0.7986355100472927);
        assertEquals(q2.z, 0);

        const q3 = Quaternion.identity;
        q3.rotateEuler(0, 128, 0);

        assertEquals(q3.w, 0.43837114678907746);
        assertEquals(q3.x, 0);
        assertEquals(q3.y, 0.898794046299167);
        assertEquals(q3.z, 0);

        const q4 = Quaternion.fromPure(0.4461978131098087, 0, 0.8949343616020251, 0);
        const q5 = Quaternion.fromPure(0.43837114678907746, 0, 0.898794046299167, 0);
        q4.multiplyQuaternion(q5);

        assertEquals(q4.w, -0.6087614290087208);
        assertEquals(q4.x, 0);
        assertEquals(q4.y, 0.7933533402912352);
        assertEquals(q4.z, 0);

    }
}