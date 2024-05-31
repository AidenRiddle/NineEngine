import { ScriptStorage } from "../../DataStores/scriptStore.js";

// https://www.assemblyscript.org/compiler.html#transforms
export class PreCompileTransform {

    afterInitialize(program) {
        console.log("What is a program?", structuredClone(program));
        for (const file of program.filesByName.values()) {
            const normalizedPath = file.source.normalizedPath;
            if (normalizedPath.startsWith("~lib")) continue;

            const internalName = file.source.simplePath;
            const declarations = {};
            for (const exp of file.exports.values()) {
                if (!this.#isChildOfComponent(exp)) continue;

                for (const member of exp.instanceMembers.values()) {
                    if (this.#isMemberSerialized(member)) {
                        declarations[member.name] = {
                            type: member.typeNode.name.identifier.text,
                            initialValue: this.#getMemberInitialValue(member)
                        };
                    }
                }
                ScriptStorage.Add(normalizedPath, exp.name, internalName, declarations);
                break;
            }
        }
        // console.log("Joe:", program.managedClasses);
    }

    afterCompile(module) {
        // console.log("What is a module?", module);
    }

    #isChildOfComponent(exp) {
        let parentClass = exp.basePrototype;
        while (parentClass != null) {
            if (parentClass.name == "Component") return true;
            parentClass = parentClass.basePrototype;
        }
        return false;
    }

    #isMemberSerialized(member) {
        const serializeToken = "Serialize";
        const decorators = this.#getMemberDecorators(member);
        return decorators.includes(serializeToken);
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
