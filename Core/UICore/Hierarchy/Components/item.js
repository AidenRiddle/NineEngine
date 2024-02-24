import { $ArrowExpand } from "../../Common/commonGui.js";
import { GuiHandle, GuiContext } from "../../gui.js";

let tabIndexCounter = -1;
const showSubfolderByDefault = true;

export class $Folder extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        tabIndexCounter++;
        const value = gui.state("value");
        const subfolders = gui.state("subfolders");
        const callback = gui.state("callback");

        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignItems = "flex-start";
        root.onclick = callback;
        root.onfocus = function (e) { e.target.style.background = "blue"; };
        root.onblur = function (e) { e.target.style.background = "none"; };

        const subfolderContainer = gui.node("div", div => {
            div.style.display = (showSubfolderByDefault) ? "block" : "none";
            div.style.padding = "0px 0px 0px 10px";
            if (subfolders != null && subfolders.length > 0) {
                gui.bake(div, subfolders);
            }
        });

        const displayCard = gui.node("div", div => {
            div.tabIndex = tabIndexCounter;
            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.alignItems = "center";
            div.style.padding = "0px";
            div.style.width = "100%";
            div.onclick = callback;
            div.onfocus = function (e) { div.style.background = "blue"; };
            div.onblur = function (e) { div.style.background = "none"; };

            div.append(
                gui.node("div", div => {
                    $ArrowExpand.builder(gui, div);
                    div.onclick = () => {
                        if (subfolderContainer.style.display === "none") {
                            subfolderContainer.style.display = "block";
                        } else {
                            subfolderContainer.style.display = "none";
                        }
                    }

                    if (subfolders == null || subfolders.length == 0) {
                        div.style.visibility = "hidden";
                    }
                }),
                gui.node("div", div => {
                    div.append(
                        gui.node("p", p => { p.textContent = value; })
                    )
                }),
            );
        })

        root.append(displayCard);
        root.append(subfolderContainer);
    }
}