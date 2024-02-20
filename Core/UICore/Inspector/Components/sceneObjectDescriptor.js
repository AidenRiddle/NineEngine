import { GuiContext, GuiHandle } from "../../gui.js";

export class $SceneObjectDescriptor extends GuiHandle {
    /**
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const soName = frag.state("soName");

        root.append(
            frag.node("div", div => {
                div.id = "sodescriptor";
                div.append(frag.node("h2", h2 => {
                    h2.style.margin = "0px";

                    h2.append(
                        frag.node("b", b => {
                            b.id = "so-descriptor-name";
                            b.textContent = soName;
                        })
                    );
                }));
            })
        )
    }
}