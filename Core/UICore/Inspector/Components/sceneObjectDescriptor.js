import { GuiContext, GuiHandle } from "../../gui.js";

export class $SceneObjectDescriptor extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const soName = gui.state("soName");

        root.append(
            gui.node("div", div => {
                div.id = "sodescriptor";
                div.append(gui.node("h2", h2 => {
                    h2.style.margin = "0px";

                    h2.append(
                        gui.node("b", b => {
                            b.id = "so-descriptor-name";
                            b.textContent = soName;
                        })
                    );
                }));
            })
        )
    }
}