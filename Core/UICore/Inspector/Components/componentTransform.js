import { GuiHandle, GuiContext } from "../../gui.js";
import { UiEvent } from "../../uiConfiguration.js";

export class $TransformInput extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const initialValue = gui.state("initialValue");
        const onInputHandler = gui.state("onInput");

        gui.makeRoot(
            gui.node("input", input => {
                input.type = "number";
                input.value = initialValue;
                input.style.width = "60px";
                input.style.borderRadius = "7px";
                input.oninput = (e) => onInputHandler(Number.parseFloat(e.target.value))
            })
        );
    }
}

export class $TransformParameter extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const name = gui.state("name");
        const x = gui.state("x");
        const y = gui.state("y");
        const z = gui.state("z");
        const onInputHandler = gui.state("onInputHandler");

        const xLabel = gui.node("p", p => { p.textContent = "X"; });
        const yLabel = gui.node("p", p => { p.textContent = "Y"; });
        const zLabel = gui.node("p", p => { p.textContent = "Z"; });

        const xInput = new $TransformInput({ initialValue: x, onInput: (value) => onInputHandler(0, value) });
        const yInput = new $TransformInput({ initialValue: y, onInput: (value) => onInputHandler(1, value) });
        const zInput = new $TransformInput({ initialValue: z, onInput: (value) => onInputHandler(2, value) });

        const wrapper = gui.node("div", div => {
            div.id = "transform-parameter-values";
            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.alignItems = "center";
            div.style.gap = "5px";

            gui.bake(div, [
                xLabel, xInput,
                yLabel, yInput,
                zLabel, zInput,
            ]);
        })

        root.id = "transform-parameter";
        root.style.display = "flex";
        root.style.flexDirection = "row";
        root.style.justifyContent = "space-between";
        root.style.alignItems = "center";
        root.style.width = "100%";

        root.append(
            gui.node("p", p => { p.textContent = name; }),
            wrapper
        );
    }
}

export class $Transform extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const transformParams = gui.state("transformParams");
        function saveParam(key, index, value) {
            transformParams[key][index] = value;
            parent.postMessage({ uiEventCode: UiEvent.inspector_transform_change, cargo: transformParams })
        }

        root.id = "transform-body";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.gap = "1px";
        root.style.alignItems = "center";
        root.style.alignSelf = "stretch";
        gui.bake(root, [
            new $TransformParameter({
                name: "Position",
                x: transformParams.pos[0],
                y: transformParams.pos[1],
                z: transformParams.pos[2],
                onInputHandler: (index, value) => saveParam("pos", index, value)
            }),
            new $TransformParameter({
                name: "Rotation",
                x: transformParams.rot[0],
                y: transformParams.rot[1],
                z: transformParams.rot[2],
                onInputHandler: (index, value) => saveParam("rot", index, value)
            }),
            new $TransformParameter({
                name: "Scale",
                x: transformParams.scale[0],
                y: transformParams.scale[1],
                z: transformParams.scale[2],
                onInputHandler: (index, value) => saveParam("scale", index, value)
            }),
        ]);
    }
}