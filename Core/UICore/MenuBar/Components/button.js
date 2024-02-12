import { GuiHandle, GuiNodeBuilder } from "../../gui.js";

export class $Button extends GuiHandle {
    /**
     * @param {GuiNodeBuilder} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const name = frag.state("name");
        const handler = frag.state("handler");

        root.onclick = handler;
        root.append(
            frag.node("p", p => { p.innerText = name })
        )
    }
}