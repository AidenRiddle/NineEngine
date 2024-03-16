import { JOB_FIBONACCI, JOB_PRINTERROR, JOB_PRINTLOG, JOB_PRINTTRACE, JOB_SLOWCODE } from "./tasks.js";

const init_source =
    `const commands = {
    "init": init
};

onmessage = (e) => {
    const methodName = e.data.f;
    const methodArgs = e.data.args;
    commands[methodName].apply(commands, methodArgs);
}

function init(name, mem) {
    const logPrefix = "%c[RUNNER %c" + name + "%c]";
    const logColorMain = "color: orange";
    const logColorSecondary = "color: yellow";
    const oldLogger = console.log;
    const oldTracer = console.trace;
    const oldErrorer = console.error;
    console.log = (...data) => { oldLogger(logPrefix, logColorMain, logColorSecondary, logColorMain, ...data); }
    console.trace = (...data) => { oldTracer(logPrefix, logColorMain, logColorSecondary, logColorMain, ...data); }
    console.error = (...data) => { oldErrorer(logPrefix, logColorMain, logColorSecondary, logColorMain, ...data); }

    console.log("Initializing job");

    // commands["mem"] = mem;

    for (const command of Object.keys(self)) {
        if (commands[command]) continue;
        commands[command] = (args) => {
            Promise.resolve(self[command](args))
                .then((ret) => postMessage({ f: command, status: "complete", ret }))
        }
    }
    const commandsWithoutInit = new Set(Object.keys(commands));
    commandsWithoutInit.delete("init");

    postMessage({ f: "init", status: "complete", ret: Array.from(commandsWithoutInit) });
}`

export class Job {
    #source;
    tasks = new Map();

    constructor(sourceCode) {
        this.#source = sourceCode;
    }

    getLink() {
        const jobDescription = new Blob([this.#source], { type: 'application/javascript' });
        return URL.createObjectURL(jobDescription);
    }
}

export class JobBuilder {
    static #source = "";
    static build() { return new Job(init_source + this.#source); }
    static fibonacci() { this.#source += JOB_FIBONACCI; return this; }
    static printError() { this.#source += JOB_PRINTERROR; return this; }
    static printLog() { this.#source += JOB_PRINTLOG; return this; }
    static printTrace() { this.#source += JOB_PRINTTRACE; return this; }
    static mySlowFunction() { this.#source += JOB_SLOWCODE; return this; }
}