import { ScriptStorage } from "../../DataStores/scriptStore.js";

const primitives = new Set([
    "f32",
    "f64",
    "i8",
    "i16",
    "i32",
    "i64",
    "isize",
    "u8",
    "u16",
    "u32",
    "u64",
    "usize",
    "bool",
    "string"
])

// https://www.assemblyscript.org/compiler.html#transforms
export class CompileTransform {
    prg;

    afterInitialize(program) {
        console.log("What is a program?", program);
        this.prg = program;

        // for (const file of this.prg.filesByName.values()) {
        //     const normalizedPath = file.source.normalizedPath;
        //     if (!normalizedPath.startsWith("Scripts")) continue;
        //     for (const exp of file.exports.values()) {
        //         let base = exp.basePrototype;
        //         while (base != null) {
        //             if (base.name != "Component") {
        //                 base = base.basePrototype;
        //             } else {
        //                 break;
        //             }
        //         }
        //         if (base == null) continue;

        //         for (const member of exp.instanceMembers.values()) {
        //             const type = member.fieldDeclaration?.type.name.identifier.text;
        //             if (type != null && !primitives.has(type)) {
        //                 member.fieldDeclaration.type.isNullable = true;
        //             }
        //         }
        //         break;
        //     }
        // }
    }
}
