import { AscScriptUtil } from "./Util/ascScriptUtil.js";
import { FRAG_LIGHTDIRECTIONAL,
    FRAG_SHADOWLIGHT,
    VERT_ARMATURE_OUTPUT,
    VERT_DEFAULT_OUTPUT,
    VERT_GET_BONE_MATRIX,
    VERT_SKIN_MATRIX } from "./shaderDefinitions.js";

const ShaderAttributes = {
    position: "position",
    normal: "normal",
    texcoord: "texcoord",
}

const shaderInPrefix = "a_";
const ShaderIn = Object.freeze({
    position: shaderInPrefix + ShaderAttributes.position,
    normal: shaderInPrefix + ShaderAttributes.normal,
    texcoord: shaderInPrefix + ShaderAttributes.texcoord,
});

const shaderOutPrefix = "v_";
const ShaderOut = Object.freeze({
    normal: shaderOutPrefix + ShaderAttributes.normal,
    texcoord: shaderOutPrefix + ShaderAttributes.texcoord,
    fragColor: "fragColor",
});

const shaderUniPrefix = "u_";
const ShaderUniform = Object.freeze({
    viewMatrix: shaderUniPrefix + "viewMatrix",
    objectMatrix: shaderUniPrefix + "objectMatrix",
    depthTexture: shaderUniPrefix + "depthTexture",
    lightDirectional: shaderUniPrefix + "projectedLightDirectionalTextureMatrix",
    timeSinceStart: shaderUniPrefix + "timeSinceStart",
    shadowBias: shaderUniPrefix + "lightDirectionalShadowBias"
});

export class ShaderGenerator {
    #version = "#version 300 es\n";
    #precision = "precision mediump float;\n"

    #globals = new Map();
    #ins = new Map();
    #outs = new Map();
    #uniforms = new Map();
    #definitions = new Map();

    #mainOutputDefinition;

    static vertex() { return new VertexShaderGenerator(); }
    static fragment() { return new FragmentShaderGenerator(); }

    global(type, name) { this.#globals.set(name, type); return this; }
    in(type, name) { this.#ins.set(name, type); return this; }
    out(type, name) { this.#outs.set(name, type); return this; }
    uniform(type, name) { this.#uniforms.set(name, type); return this; }

    define(returnType, name, listOfParams, definition) { this.#definitions.set(name, { name, returnType, listOfParams, definition }); return this; }

    mainOutput(definitionName) { this.#mainOutputDefinition = definitionName; return this; }

    generate(target) {
        this.define("void", "main", [], `    ${target} = ${this.#mainOutputDefinition}();\n`);

        let shader = this.#version
            + this.#precision;

        for (const [name, type] of this.#globals.entries()) { shader += type + " " + name + ";\n"; }
        for (const [name, type] of this.#ins.entries()) { shader += "in " + type + " " + name + ";\n"; }
        for (const [name, type] of this.#outs.entries()) { shader += "out " + type + " " + name + ";\n"; }
        for (const [name, type] of this.#uniforms.entries()) { shader += "uniform " + type + " " + name + ";\n"; }
        for (const [name, meta] of this.#definitions.entries()) {
            shader += meta.returnType + " "
                + name + "("
                + meta.listOfParams.join() + "){\n"
                + meta.definition + "}\n";
        }

        return shader;
    }
}

class VertexShaderGenerator extends ShaderGenerator {
    #internalAddons = new Map();

    constructor() {
        super();
        this.global("vec4", "worldPosition")
            .in("vec3", ShaderIn.position)
            .in("vec3", ShaderIn.normal)
            .in("vec2", ShaderIn.texcoord)
            .out("vec3", ShaderOut.normal)
            .out("vec2", ShaderOut.texcoord)
            .uniform("mat4", ShaderUniform.viewMatrix)
            .uniform("mat4", ShaderUniform.objectMatrix)
            .mainOutput("defaultOutput");
    }

    #generateDefaultOutput() {
        let defaultDefinition = VERT_DEFAULT_OUTPUT;

        for (const [name, statement] of this.#internalAddons.entries()) {
            defaultDefinition += "    " + name + " = " + statement + ";\n";
        }

        defaultDefinition += "    return u_viewMatrix * worldPosition;\n";
        return defaultDefinition;
    }

    #generateArmatureOutput() {
        let armatureDefinition = VERT_ARMATURE_OUTPUT;

        for (const [name, statement] of this.#internalAddons.entries()) {
            armatureDefinition += "    " + name + " = " + statement + ";\n";
        }

        armatureDefinition += "    return u_viewMatrix * worldPosition;\n";
        return armatureDefinition;
    }

    useLightDirectional() {
        this.out("vec4", "v_projectedTexcoord")
            .uniform("mat4", "u_projectedLightDirectionalTextureMatrix");
        this.#internalAddons.set("v_projectedTexcoord", "u_projectedLightDirectionalTextureMatrix * worldPosition");
        return this;
    }

    useArmature() {
        return this.in("vec4", "a_weights")
            .in("vec4", "a_joints")
            .uniform("sampler2D", "u_jointTexture")
            .define("mat4", "getBoneMatrix", ["int jointNdx"], VERT_GET_BONE_MATRIX)
            .define("mat4", "skinMatrix", [], VERT_SKIN_MATRIX)
            .define("vec4", "armatureOutput", [], this.#generateArmatureOutput())
            .mainOutput("armatureOutput");
    }

    generate() {
        const defaultDefinition = this.#generateDefaultOutput();
        this.define("vec4", "defaultOutput", [], defaultDefinition);
        return super.generate("gl_Position");
    }
}

class FragmentShaderGenerator extends ShaderGenerator {
    #internalAddons = new Map();
    #fragColorDefinition = "return texture(u_texture, v_texcoord);\n";

    constructor() {
        super();
        this.in("vec3", ShaderOut.normal)
            .in("vec2", ShaderOut.texcoord)
            .out("vec4", ShaderOut.fragColor)
            .uniform("sampler2D", "u_texture")
            .mainOutput("defaultOutput");
    }

    #generateDefaultOutput() {
        let defaultDefinition = "";

        for (const [name, statement] of this.#internalAddons.entries()) {
            defaultDefinition += name + " = " + statement + ";\n";
        }

        defaultDefinition += this.#fragColorDefinition;
        return defaultDefinition;
    }

    useDepth() {
        return this.uniform("sampler2D", "u_depthTexture");
    }

    useLightDirectional() {
        this.in("vec4", "v_projectedTexcoord")
            .uniform("vec3", "u_reverseLightDirection")
            .uniform("float", "u_intensity")
            .uniform("float", "u_lightDirectionalShadowBias")
            .define("float", "lightDirectional", [], FRAG_LIGHTDIRECTIONAL);
            
        this.#fragColorDefinition = "return mix(vec4(0, 0, 0, 1), texture(u_texture, v_texcoord), lightDirectional());"
        return this;
    }

    receiveShadows() {
        this.useDepth()
            .useLightDirectional()
            .define("float", "shadowLight", [], FRAG_SHADOWLIGHT);
            
        this.#fragColorDefinition = "return mix(vec4(0, 0, 0, 1), texture(u_texture, v_texcoord), lightDirectional() * shadowLight());"
        return this;
    }

    generate() {
        const defaultDefinition = this.#generateDefaultOutput();
        this.define("vec4", "defaultOutput", [], defaultDefinition);
        return super.generate("fragColor");
    }
}