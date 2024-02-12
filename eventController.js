import Debug from "./Core/GECore/Util/debug.js";
import { System } from "./settings.js";

const safeguard = 2000;

class EventCycle {
    #startOfLastFrame = 0;
    #startOfLastRender = 0;
    #elapsedTime = 0;
    #deltaTime = 0;

    #targetDeltaTime = 0;

    #framesCounted = 0;

    #delegate;

    constructor(targetDeltaTime, delegate) {
        this.#targetDeltaTime = targetDeltaTime;
        this.#delegate = delegate;
    }

    systemCycle = (startOfThisFrame) => {
        this.#framesCounted++;
        const cycleDt = startOfThisFrame - this.#startOfLastFrame;
        if (this.#elapsedTime > safeguard) this.#elapsedTime = this.#targetDeltaTime;
        this.#elapsedTime += cycleDt;
        if (this.#elapsedTime < this.#targetDeltaTime) {
            this.#startOfLastFrame = startOfThisFrame;
            return;
        }

        this.#deltaTime = (startOfThisFrame - this.#startOfLastRender) * 0.001;
        this.#delegate(startOfThisFrame, this.#deltaTime);

        Debug.Average("Frames Skipped Avg:", this.#framesCounted);

        this.#elapsedTime -= this.#targetDeltaTime;
        this.#framesCounted = 0;
        this.#startOfLastFrame = startOfThisFrame;
        this.#startOfLastRender = startOfThisFrame;
    }

    start() {
        this.#targetDeltaTime = (System.target_frame_rate != 0) ? 1000 / System.target_frame_rate : 0;
        this.#startOfLastFrame = performance.now();
        this.#elapsedTime = this.#targetDeltaTime;
        Debug.StartAverage("Frames Skipped Avg:", 50);
        Debug.StartAverage("Avg Delta Time:", 50);
        Debug.StartAverage("Avg FPS:");
    }
}

export class EventController {
    #animationCallback = requestAnimationFrame;
    #activeAnimationHandle = 0;

    #cycles = new Map();
    #activeCycles = [];

    #setTimeoutWrapper = (delegate) => {
        const backgroundRefreshRate = 1000 / System.target_background_frame_rate;
        return setTimeout(() => {
            delegate(performance.now());
        }, backgroundRefreshRate);
    }

    #systemCycle = (startOfThisFrame) => {
        this.#activeAnimationHandle = this.#animationCallback.call(window, this.#systemCycle);
        for (const cycle of this.#activeCycles) { cycle.systemCycle(startOfThisFrame); }
    }

    addCycle(name, targetDeltaTime, delegate) {
        const cycle = new EventCycle(targetDeltaTime, delegate);
        this.#cycles.set(name, cycle);
    }

    enableCycle(name) {
        if (!this.#cycles.has(name)) throw new Error("Cycle (" + name + ") does not exist.");
        const cycle = this.#cycles.get(name);
        cycle.start();
        this.#activeCycles.push(cycle);
    }

    disableCycle(name) {
        if (!this.#cycles.has(name)) throw new Error("Cycle (" + name + ") does not exist.");
        const cycle = this.#cycles.get(name);
        const index = this.#activeCycles.indexOf(cycle);
        this.#activeCycles.splice(index, 1);
    }

    solveAnimationCallback = () => {
        if (document.hidden) {
            cancelAnimationFrame(this.#activeAnimationHandle);
            this.#animationCallback = this.#setTimeoutWrapper;
        } else {
            clearTimeout(this.#activeAnimationHandle);
            this.#animationCallback = requestAnimationFrame;
        }
        this.#systemCycle(performance.now());
    }

    start() {
        this.solveAnimationCallback();
    }
}