import { ScriptStorage } from "../../DataStores/scriptStore.js";

// https://www.assemblyscript.org/compiler.html#transforms
export class PreCompileTransform {
    prg;

    afterInitialize(program) {
        console.log("What is a program?", program);
        this.prg = program;
        // console.log("Joe:", program.managedClasses);
    }
    afterCompile(module) {
        // console.log("What is a module?", module);

        for (const file of this.prg.filesByName.values()) {
            const normalizedPath = file.source.normalizedPath;
            if (normalizedPath.startsWith("~lib")) continue;

            const internalName = file.source.simplePath;
            const declarations = {};
            for (const exp of file.exports.values()) {
                const className = exp.name;

                let base = exp.basePrototype;
                while (base != null) {
                    if (base.name != "Component") {
                        base = base.basePrototype;
                    } else {
                        break;
                    }
                }
                if (base == null) continue;

                for (const member of exp.instanceMembers.values()) {
                    const decorators = this.#getMemberDecorators(member);
                    if (decorators.includes("Serialize")) {
                        declarations[member.name] = {
                            type: member.typeNode.name.identifier.text,
                            initialValue: this.#getMemberInitialValue(member)
                        };
                    }
                }
                ScriptStorage.Add(normalizedPath, className, internalName, declarations);
                break;
            }
        }
    }

    #getMemberDecorators(member) {
        const res = [];
        if (member.fieldDeclaration?.decorators != null) {
            for (const decoratorObject of member.fieldDeclaration.decorators) {
                res.push(decoratorObject.name.text);
            }
        }
        return res;
    }

    #getMemberInitialValue(member) {
        const init = member.fieldDeclaration.initializer;
        const value = init.value?.low
            ?? init.value
            ?? init.text;
        return value == "null" ? null : value;
    }
}
