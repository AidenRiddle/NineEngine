
const commands = {
    "init": init
};

onmessage = (e) => {
    const methodName = e.data.f;
    const methodArgs = e.data.args;
    commands[methodName].apply(commands, methodArgs);
}

function init(name, mem, scriptPath) {
    const logPrefix = "Worker " + name + ":";
    const oldLogger = console.log;
    const oldTracer = console.trace;
    const oldErrorer = console.error;
    console.log = (...data) => { oldLogger(logPrefix, ...data); }
    console.trace = (...data) => { oldTracer(logPrefix, ...data); }
    console.error = (...data) => { oldErrorer(logPrefix, ...data); }

    console.log("Initializing with", scriptPath);

    // commands["mem"] = mem;

    const oldKeys = Object.keys(self);
    importScripts(scriptPath);
    const newKeys = Object.keys(self);

    const addedCommands = newKeys.filter(x => !oldKeys.includes(x));
    for (const command of addedCommands) {
        if (commands[command]) throw new Error("Duplicate property (" + command + ")");
        commands[command] = (args) => {
            Promise.resolve(self[command](args))
                .then((ret) => postMessage({ f: command, status: "complete", ret }))
        }
    }
    const commandsWithoutInit = new Set(Object.keys(commands));
    commandsWithoutInit.delete("init");
    
    
    postMessage({ f: "init", status: "complete", ret: Array.from(commandsWithoutInit) });
}