import { objectToEnum } from "../../methods.js";
import { Stash, System } from "../../settings.js";
import Debug from "../GECore/Util/debug.js";

// https://developer.mozilla.org/en-US/docs/Web/API/Navigator
// https://developer.mozilla.org/en-US/docs/Web/API/Worker
// https://www.compart.com/en/unicode/scripts/Grek

const Greek = Object.freeze({
    alpha_lowercase: "\u03b1",
    beta_lowercase: "\u03b2",
    delta_lowercase: "\u03b4",
    delta_uppercase: "\u0394",
    koppa_lowercase: "\u03df",
    lambda_lowercase: "\u03bb",
    omega_uppercase: "\u03a9",
    pi: "\u03c0",
    sigma_lowercase: "\u03c3",
    sigma_uppercase: "\u03a3"
})

const state = {
    IDLE: "idle",
    RUNNING: "running",
    FINISHED: "finished",
};
objectToEnum(state);

function updateState(instance, state) {
    instance.state = state;
    Debug.Log("Worker " + instance.id, instance.state);
}

export class WorkerRequest {
    f;
    args;

    constructor(f, args) {
        this.f = f;
        this.args = args;
    }
}

export class WorkerResponse {
    f;
    status;
    ret;

    constructor(f, status, ret) {
        this.f = f;
        this.status = status;
        this.ret = ret;
    }
}

export class Runner {
    id;
    mem;

    /** @type Worker */
    worker;
    tasks = new Map();
    state = state.IDLE;

    constructor(id, mem, worker) {
        this.id = id;
        this.mem = mem;
        this.worker = worker;

        this.worker.onmessage = this.onTaskComplete;
    }

    onTaskComplete = (e) => {
        const response = new WorkerResponse(e.data.f, e.data.status, e.data.ret);
        const returnedCommand = response.f;
        if (response.status == "complete") {
            const task = this.tasks.get(returnedCommand);
            task.resolve(response.ret);
            clearTimeout(task.timeout);

            this.tasks.delete(returnedCommand);
            if (this.tasks.size == 0) { this.changeState(state.FINISHED); }
        }
        else {
            this.tasks.get(returnedCommand).reject(`${this.id} Failed to complete (${returnedCommand}): ${response.status}`);
        }
    }

    changeState(state) {
        this.state = state;
        Debug.Log("Worker " + this.id, this.state);
    }

    run(command, args) {
        const maxTime = 20000;
        this.changeState(state.RUNNING);
        return new Promise((resolve, reject) => {
            this.worker.postMessage({ f: command, args });
            const timeout = setTimeout(() => {
                this.worker.terminate();
                const response = { data: { f: command, status: "timedout", ret: null } };
                this.onTaskComplete(response);
            }, maxTime)
            this.tasks.set(command, { resolve, reject, timeout });
        })
    }

    async hire(scriptPath) {
        const commands = await this.run("init", [this.id, this.mem, Stash.worker_script_root + scriptPath]);
        this.changeState(state.IDLE);

        return commands;
    }
}

export class WorkerManager {
    static #workerPoolSize = Math.min(navigator.hardwareConcurrency >> 1, System.max_threads);
    static #baseWorkerPath = "Core/Worker/worker.js";

    static #pool = (() => {
        const pool = [];
        const id = Object.values(Greek);
        const options = {
            type: "classic"
        }
        console.log("Worker Threads:", this.#workerPoolSize);
        for (let i = 0; i < this.#workerPoolSize; i++) {
            const worker = new Runner(
                id[i],
                null,
                new Worker(this.#baseWorkerPath, options),
            );
            pool.push(worker);
            Debug.Log("Worker " + worker.id, worker.state);
        }
        return pool;
    })();

    static crewCommands = new Map();

    static hire(...scriptPaths) {
        if (this.#workerPoolSize == 0) throw new Error("No Worker Threads have been granted.");
        const map = new Map();
        for (const job of scriptPaths) {
            if (map.has(job)) map.set(job, map.get(job) + 1);
            else map.set(job, 1);
        }

        const promises = [];
        for (let i = 0; i < scriptPaths.length; i++) {
            const scriptPath = scriptPaths[i];
            const instance = this.#pool[i];
            promises.push(instance.hire(scriptPath));
        }
        return Promise.all(promises)
            .then((interfaces) => {
                const crewInterface = {};
                for (let i = 0; i < interfaces.length; i++) {
                    const io = interfaces[i];
                    for (const command of io) {
                        if (!this.crewCommands.has(command)) this.crewCommands.set(command, []);

                        this.crewCommands.get(command).push(this.#pool[i]);
                    }
                }

                for (const command of this.crewCommands.keys()) {
                    crewInterface[command] = (...args) => {
                        const runners = this.crewCommands.get(command);
                        for (const runner of runners) {
                            if (runner.state != state.RUNNING) {
                                console.log("Runner", runner.id, "chosen for", command);
                                return runner.run(command, args);
                            }
                        }
                        throw new Error("All runners busy. xQcL");
                    }
                }

                return crewInterface;
            });
    }

    static retire(workerInterface) {

    }
}

// WorkerManager.hire(
//     "Core/Worker/Scripts/slowCode.js",
//     "Core/Worker/Scripts/slowCode.js",
//     "Core/Worker/Scripts/slowCode.js",
//     "Core/Worker/Scripts/slowCode.js",
// )
//     .then((crew) => {
//         console.log(crew);
//         crew.mySlowFunction(12).then((value) => console.log(value));
//         crew.mySlowFunction(12).then((value) => console.log(value));
//         crew.mySlowFunction(12).then((value) => console.log(value));
//         crew.mySlowFunction(12).then((value) => console.log(value));
//     })
//     .then(() => console.log("finished"));