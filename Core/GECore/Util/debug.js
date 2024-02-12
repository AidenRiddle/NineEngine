import { Color } from "../Constants/constants.js";

export default class Debug {
    static #debugQueue = new Map();

    static #debugRoutine;
    static #debugActiveState;

    static #updateFrequency = 24;
    static #updateFrequencyInMilliseconds = (1 / this.#updateFrequency) * 1000;

    static #counters = new Map();
    static #average = new Map();
    static #max = new Map();

    static Log(str, ...values) {
        if (!this.#debugActiveState) return;
        values.forEach((e, i) => { values[i] = e?.toString(); });
        this.#debugQueue.set(str, { color: Color.white, value: values.join(", ") });
    }

    static StartCounter(str, startValue = 0) {
        if (!this.#debugActiveState) return;
        this.#counters.set(str, startValue);
    }

    static Count(str, increment = 1) {
        if (!this.#debugActiveState) return;
        if (!this.#counters.has(str)) throw new Error("Debug counter (" + str + ") not initialized");
        this.#counters.set(str, this.#counters.get(str) + increment);
        this.#debugQueue.set(str, { color: Color.green, value: this.#counters.get(str) });
    }

    static GetCount(str) {
        if (!this.#debugActiveState) return;
        return this.#counters.get(str);
    }

    static StartAverage(str, sampleSize = 10) {
        if (!this.#debugActiveState) return;
        this.#average.set(str, new Array(sampleSize));
    }

    static Average(str, value) {
        if (!this.#debugActiveState) return;
        if (!this.#average.has(str)) throw new Error("Debug average (" + str + ") not initialized");
        this.#average.get(str).shift();
        this.#average.get(str).push(value);

        const result = this.#average.get(str).reduce((p, q) => p + q, 0) / this.#average.get(str).length;
        this.#debugQueue.set(str, { color: Color.yellow, value: result });
    }

    static GetAverage(str) {
        if (!this.#debugActiveState) return;
        const result = this.#average.get(str).reduce((p, q) => p + q, 0) / this.#average.get(str).length;
        return result;
    }

    static Max(str, value) {
        if (!this.#debugActiveState) return;
        if (!this.#max.has(str)) this.#max.set(str, -1);
        this.#max.set(str, Math.max(this.#max.get(str), value));
        this.#debugQueue.set(str, { color: Color.lightBlue, value: this.#max.get(str) });
    }

    static #PrintToStack() {
        for (const [key, log] of this.#debugQueue) { sessionStorage.setItem(key, log.value); }
    }

    static #Update = () => {
        this.#PrintToStack();
    }

    static #Initialize() {
        console.log("Debugger started.");
        this.#debugActiveState = true;
        sessionStorage.clear();
        this.#debugRoutine = setInterval(this.#Update, this.#updateFrequencyInMilliseconds);
    }

    static #ShutDown() {
        console.log("Debugger shut off.");
        this.#debugActiveState = false;
        clearInterval(this.#debugRoutine);
    }

    static Clear = () => {
        console.log("Debugger cleared.");
        sessionStorage.clear();
    }

    static ToggleDebugMode = () => {
        (!this.#debugActiveState) ? this.#Initialize() : this.#ShutDown();
    }
}