import { NavFS } from "../../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { notImplemented } from "../../../../methods.js";
import { GuiContext, GuiHandle } from "../../gui.js";
import { $Receiver } from "./valueReceiver.js";

export class $Image extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const assetName = gui.state("assetName");
        const path = gui.state("path");

        const image = gui.node("img", img => {
            img.style.maxHeight = "100%";
            img.style.maxWidth = "100%";
        });
        const preview = gui.node("div", div => {
            div.style.width = "100%";
            div.style.height = "535px";
            div.style.width = "100%";
            div.style.height = "510px";
            div.style.display = "flex";
            div.style.flexDirection = "column";
            div.style.justifyContent = "center";
            div.style.alignItems = "center";

            div.append(image);
        });

        NavFS.readFileAsDataUrl(path).then((dataUrl) => {
            image.src = dataUrl;
            gui.bake(root, preview)
        });

        const label = gui.node("h2", h2 => {
            h2.style.margin = "0px";
            h2.append(gui.node("b", b => { b.textContent = assetName; }));
        });

        const input = new $Receiver({
            tag: "Reference URI",
            expectedType: "path",
            value: path,
            onchangeHandler: (tag, newValue) => { preview.style.backgroundImage = `url(${newValue})`; console.log(assetName, " to reference", newValue); }
        });

        const referenceOnly = gui.node("div", div => {
            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.justifyContent = "space-between";
            div.style.alignItems = "center";
            div.style.width = "100%";

            const label = gui.node("p", p => { p.textContent = "External reference?"; });
            div.append(
                label,
                gui.node("input", input => {
                    input.type = "checkbox";
                    input.checked = false;
                    input.onchange = (e) => { notImplemented(); input.checked = false; }
                })
            );
        });

        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.width = "100%";

        gui.bake(root, label, input, referenceOnly, preview);
    }
}