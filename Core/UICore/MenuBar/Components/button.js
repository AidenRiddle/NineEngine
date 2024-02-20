import { GuiHandle, GuiContext } from "../../gui.js";

export class $Button extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const name = gui.state("name");
        const handler = gui.state("handler");

        root.onclick = handler;
        root.append(
            gui.node("p", p => { p.innerText = name })
        )
    }
}