import { DebugToggle } from "./settings.js";

export function objectToEnum(obj) {
    const keys = Object.keys(obj);
    if(DebugToggle.enumFullName) for (const key of keys) { obj[key] = key; }
    else for (let i = 0; i < keys.length; i++) { obj[key] = ++i; }
    Object.freeze(obj);
}