import asc from "assemblyscript/asc";
import { AssemblyScript } from "../../../settings.js";
import { RuntimeGenerator } from "./runtimeGenerator.js";
import { PreCompileTransform } from "./preCompileTransform.js";
import { CompileTransform } from "./compileTransform.js";

const runtimeFileName = "__Runtime.ts";

export function preCompile(buildPackage) {
    const compilerArgs = [runtimeFileName].concat(AssemblyScript.compiler_args);
    console.log("Pre-compiler Arguments:", compilerArgs.join(" "));
    console.groupCollapsed("Pre-compile generated file");
    buildPackage.set(runtimeFileName, RuntimeGenerator.generatePreRuntime(buildPackage));
    console.groupEnd();
    return asc.main(
        compilerArgs,
        {
            readFile(name, baseDir) { return buildPackage.get(baseDir + "/" + name) ?? buildPackage.get(name); },
            writeFile(name, data, baseDir) { buildPackage.set(name, data); },
            listFiles(dirname, baseDir) { console.log("Compiler ListFiles:", dirname); },
            transforms: [new PreCompileTransform()],
        }
    )
        .then((output) => {
            console.log(output.stats.toString());
            if (output.error) throw new Error(output.stderr);
            return buildPackage;
        })
}

function compileToWebAssemblyModule(buildPackage) {
    const compilerArgs = [runtimeFileName].concat(AssemblyScript.compiler_args);
    console.log("Compiler Arguments:", compilerArgs.join(" "));
    console.groupCollapsed("Runtime generated file");
    buildPackage.set(runtimeFileName, RuntimeGenerator.generateWithLog());
    console.groupEnd();
    return asc.main(
        compilerArgs,
        {
            readFile(name, baseDir) { return buildPackage.get(baseDir + "/" + name) ?? buildPackage.get(name); },
            writeFile(name, data, baseDir) { buildPackage.set(name, data); },
            listFiles(dirname, baseDir) { console.log("Compiler ListFiles:", dirname); },
            transforms: [new CompileTransform()],
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
    return preCompile(buildPackage)
        .then(() => compileToWebAssemblyModule(buildPackage))
}

globalThis.ASChelp = async () => asc.main(["--help"], {}).then((output) => console.log(output.stdout.toString()));