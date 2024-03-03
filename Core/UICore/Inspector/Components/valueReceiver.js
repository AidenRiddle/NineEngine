import { $DragReceiver } from "../../Common/commonGui.js";
import { GuiContext, GuiHandle } from "../../gui.js";

export class $Receiver extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static builder(gui, root, handle) {
        const expectedType = gui.state("expectedType");
        const value = gui.state("value");
        const onchangeHandler = gui.state("onchangeHandler");
        const tag = gui.state("tag");

        root.style.display = "flex";
        root.style.flexDirection = "row";
        root.style.justifyContent = "space-between";
        root.style.alignItems = "center";
        root.style.width = "100%";

        root.append(
            gui.node("p", p => {
                p.textContent = tag;
            })
        );


        const receiver = gui.node("input", input => {
            input.type = "text";
            input.value = value ?? `None (${expectedType})`;
            input.style.width = "260px";
            input.onchange = (e) => onchangeHandler(gui.state("tag"), e.target.value);
        });

        handle.set("onItemDrop", (dt) => {
            const assetFilePath = dt.getData("assetFilePath");
            const url = dt.getData("text/plain");
            console.log("Types:", dt.types);
            if (assetFilePath != "") {
                receiver.value = assetFilePath;
                receiver.dispatchEvent(new Event('change'));
            } else if (url != "") {
                receiver.value = url;
                receiver.dispatchEvent(new Event('change'));
            }
        })
        $DragReceiver.builder(gui, receiver);

        root.append(receiver);
    }
}