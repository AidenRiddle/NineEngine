import asc from "assemblyscript/asc";
import { AssemblyScript } from "../../../settings.js";
import { RuntimeGenerator } from "./runtimeGenerator.js";
import { MyTransform } from "./transform.js";

const runtimeFileName = "__Runtime.ts";

export function preCompile(compilerArgs, buildPackage) {
    console.groupCollapsed("Pre-compile generated file");
    buildPackage.set(runtimeFileName, RuntimeGenerator.generatePreRuntime(buildPackage));
    console.groupEnd();
    return asc.main(
        compilerArgs,
        {
            readFile(name, baseDir) { return buildPackage.get(name) ?? null; },
            writeFile(name, data, baseDir) { buildPackage.get(name) = data; },
            listFiles(dirname, baseDir) { console.log("Compiler ListFiles:", dirname); },
            transforms: [new MyTransform()],
        }
    )
        .then((output) => {
            console.log(output.stats.toString());
            if (output.error) throw new Error(output.stderr);
            return buildPackage;
        })
}

function compileToWebAssemblyModule(compilerArgs, buildPackage) {
    console.groupCollapsed("Runtime generated file");
    buildPackage.set(runtimeFileName, RuntimeGenerator.generateWithLog());
    console.groupEnd();
    return asc.main(
        compilerArgs,
        {
            readFile(name, baseDir) { return buildPackage.get(name) ?? null; },
            writeFile(name, data, baseDir) { buildPackage.get(name) = data; },
            listFiles(dirname, baseDir) { console.log("Compiler ListFiles:", dirname); }
        }
    )
        .then((output) => {
            console.log(output.stats.toString());
            if (output.error) throw new Error(output.stderr);
            return output.stdout;
        })
        .then((stdout) => stdout.toBuffer())
        .then((binary) => WebAssembly.compile(binary))
        .then((wasm) => { return { relativePath: runtimeFileName, module: wasm } });
}

/**
 * @param {{}} buildPackage Map<fileName, fileContents>
 * @returns Promise resolved with the list of modules
 */
export function compile(buildPackage) {
    const compilerArgs = [runtimeFileName].concat(AssemblyScript.compiler_args);
    console.log("Compiler Arguments:", compilerArgs.join(" "));
    return preCompile(compilerArgs, buildPackage)
        .then(() => compileToWebAssemblyModule(compilerArgs, buildPackage))
}

globalThis.ASChelp = async () => asc.main(["--help"], {}).then((output) => console.log(output.stdout.toString()));