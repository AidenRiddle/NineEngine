import { $ExpandableCard } from "../../Common/commonGui.js";
import { GuiContext, GuiHandle } from "../../gui.js";

const showSubfolderByDefault = true;

export class $Folder extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static builder(gui, root, handle) {
        const value = gui.state("value");
        const subfolders = gui.state("subfolders");

        const titleCard = gui.node("div", div => {
            div.append(
                gui.node("p", p => { p.textContent = value; })
            )
        });

        if (subfolders != null && subfolders.length > 0) {
            const subfolderContainer = gui.node("div", div => {
                div.style.display = (showSubfolderByDefault) ? "block" : "none";
                div.style.padding = "0px 0px 0px 10px";
                gui.bake(div, subfolders);
            });
            handle.set("subCard", subfolderContainer);
        }

        handle.set("titleCard", titleCard);
        handle.set("onselect", gui.state("callback"));
        handle.set("highlightOnSelect", true);

        $ExpandableCard.builder(gui, root, handle);
    }
}