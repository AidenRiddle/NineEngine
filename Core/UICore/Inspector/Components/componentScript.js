import { GuiContext, GuiHandle } from "../../gui.js";
import { UiEvent } from "../../uiConfiguration.js";

const primitiveTypeToInputType = {
    "string": "text",
    "number": "text",
    "boolean": "checkbox",
}

const primitiveTypeToPatternMatch = {
    "string": ".*",
    "number": "-?[0-9]*\\.?[0-9]*",
    "boolean": "",
}

const primitiveTypeToHandler = {
    "string": (event) => event.target.value,
    "number": (event) => Number.parseFloat(event.target.value),
    "boolean": (event) => event.target.checked,
}

export class $ScriptInput extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const initialValue = gui.state("initialValue");
        const onInputHandler = gui.state("onInput");

        const type = typeof initialValue;
        const handler = primitiveTypeToHandler[type];

        root.append(
            gui.node("input", input => {
                input.id = "script-parameter-value-input";
                input.type = primitiveTypeToInputType[type] ?? "text";
                input.pattern = primitiveTypeToPatternMatch[type] ?? "[^]*";
                input.autocomplete = "off";
                input.defaultValue = initialValue;
                input.checked = initialValue;
                input.value = initialValue;

                input.style.width = "170px";
                input.style.borderRadius = "4px";

                input.onchange = (e) => {
                    if (!e.target.reportValidity()) {
                        e.target.value = e.target.defaultValue;
                    } else {
                        e.target.defaultValue = e.target.value;
                        onInputHandler(handler(e));
                    }
                }
            })
        );
    }
}

export class $ScriptParameter extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static builder(gui, root, handle) {
        const name = gui.state("name");
        const onInputHandler = gui.state("onInputHandler");

        handle.set("onInput", (value) => onInputHandler(name, value));

        root.id = "script-parameter";
        root.style.display = "flex";
        root.style.flexDirection = "row";
        root.style.justifyContent = "space-between";
        root.style.alignItems = "center";
        root.style.width = "100%";

        const label = gui.node("p", p => { p.textContent = name; });
        root.append(label);

        $ScriptInput.builder(gui, root);
    }
}

export class $Script extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const com = gui.state("com");

        function saveParam(paramName, value) {
            console.log("Tweaked:", paramName, value);
            com.imports[paramName] = value;

            parent.postMessage({ uiEventCode: UiEvent.inspector_script_param_change, cargo: com })
        }


        root.id = "script-body";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.gap = "2px";
        root.style.alignItems = "center";
        root.style.alignSelf = "stretch";

        Object.entries(com.imports).forEach(([k, v]) => gui.bake(root, new $ScriptParameter({ name: k, initialValue: v, onInputHandler: saveParam })));
    }
}