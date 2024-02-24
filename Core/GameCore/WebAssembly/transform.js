import { ScriptStorage } from "../../DataStores/scriptStore.js";

// https://www.assemblyscript.org/compiler.html#transforms
export class MyTransform {
    prg;

    afterInitialize(program) {
        // console.log("What is a program?", program);
        this.prg = program;
        // console.log("Joe:", program.managedClasses);
    }
    afterCompile(module) {
        // console.log("What is a module?", module);

        for (const file of this.prg.filesByName.values()) {
            const normalizedPath = file.source.normalizedPath;
            if (!normalizedPath.startsWith("Scripts")) continue;

            const internalName = file.source.simplePath;
            const declarations = {};
            for (const exp of file.exports.values()) {
                const className = exp.name;
                let base = exp.basePrototype;
                while (base != null) {
                    if (base.name != "Component") { base = base.basePrototype; continue; }

                    for (const member of exp.instanceMembers.values()) {
                        const decoratorNodes = member.decoratorNodes;
                        if (!decoratorNodes) continue;
                        for (const decorator of decoratorNodes) {
                            if (decorator.name.text != "Serialize") continue;

                            declarations[member.name] = { type: member.typeNode.name.identifier.text };
                            break;
                        }
                    }
                    ScriptStorage.Add(normalizedPath, className, internalName, declarations);
                    break;
                }
            }
        }
    }
}
