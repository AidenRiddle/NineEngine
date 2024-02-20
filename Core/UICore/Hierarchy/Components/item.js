import { GuiHandle, GuiContext } from "../../gui.js";

let tabIndexCounter = -1;
const downArrow = "/Core/UICore/AssetBrowser/Icons/211687_down_arrow_icon.png";
const showSubfolderByDefault = true;

class $SubfolderArrowIndicator extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const defaultRotation = "rotate(0deg)";
        const enabledRotation = "rotate(-90deg)";
        root.append(
            gui.node("img", img => {
                img.style.width = "15px";
                img.style.height = "15px";
                img.style.transition = "all 0.15s ease-out";
                img.style.transform = (showSubfolderByDefault) ? defaultRotation : enabledRotation;
                img.style.opacity = "1";
                img.style.filter = "invert(100%)";
                img.src = downArrow;
                img.onclick = () => {
                    if (img.style.transform == defaultRotation) img.style.transform = enabledRotation;
                    else img.style.transform = defaultRotation;
                }
            })
        );
    }
}

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
        root.style.width = "100%";

        const subfolderContainer = gui.node("div", div => {
            div.id = "folder-subfolder-container";
            div.style.display = (showSubfolderByDefault) ? "block" : "none";
            div.style.padding = "0px 0px 0px 10px";
            if (subfolders != null && subfolders.length > 0) {
                gui.bake(div, subfolders);
            }
        });

        const displayCard = gui.node("div", div => {
            div.tabIndex = tabIndexCounter.toString();

            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.alignItems = "center";
            div.style.padding = "0px";
            div.style.width = "200px";

            div.onfocus = function (e) { e.target.style.background = "blue"; };
            div.onblur = function (e) { e.target.style.background = "none"; };
            div.append(
                gui.node("div", div => {
                    $SubfolderArrowIndicator.builder(gui, div);
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
                    div.onclick = callback;
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