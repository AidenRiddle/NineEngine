import { QuaternionTest } from "./Targets/quaternionTest.js";
import { ScriptUtilTest } from "./Targets/scriptUtilTest.js";
import { Vector3Test } from "./Targets/vector3Test.js";

const classes = [
    Vector3Test,
    QuaternionTest,
    ScriptUtilTest
]

function printToPage(pel) {
    const target = document.getElementById("main");
    target.append(pel);
}

function log(str) {
    const p = document.createElement("p");
    p.textContent = str;
    p.style.color = "white";
    printToPage(p);
}

function title(str) {
    const p = document.createElement("h3");
    p.textContent = str;
    p.style.color = "white";
    printToPage(p);
}

function error(str) {
    const p = document.createElement("p");
    p.textContent = str;
    p.style.color = "red";
    printToPage(p);
}

function assertEquals(value, expected) {
    if (value === expected) return true;
    throw new Error("Expected (" + expected + ") but found: " + value);
}

function assertTrue(value) { assertEquals(value, true); }
function assertFalse(value) { assertEquals(value, false); }

function run(testName, instance) {
    try {
        instance[testName]();
        log(`${testName}: passed!`);
    } catch (e) {
        error(`${testName}: ${e}`);
    }
}

for(const cl of classes) {
    title(`--------- ${cl.name} ---`);
    const obj = new cl();
    const keys = Object.getOwnPropertyNames(cl.prototype);
    for(const key of keys) {
        if(key.startsWith("test"))
            run(key, obj);
    }
}
