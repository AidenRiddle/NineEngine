import { GuiContext, GuiHandle } from "../gui.js";

let tabIndexCounter = -1;
const showSubfolderByDefault = true;
const downArrow = "/Core/UICore/AssetBrowser/Icons/211687_down_arrow_icon.png";

export class $ArrowExpand extends GuiHandle {
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

export class $ExpandableCard extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const titleCard = gui.getNode(gui.state("titleCard"));
        const subCard = gui.getNode(gui.state("subCard"));
        const onselect = gui.state("onselect");
        const onexpand = gui.state("onexpand");
        const oncollapse = gui.state("oncollapse");
        const highlightOnSelect = gui.state("highlightOnSelect");

        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignItems = "flex-start";

        const arrowWrapper = gui.node("div", div => {
            const arrow = gui.getNode(new $ArrowExpand());
            div.addEventListener("click", (e) => {
                e.stopPropagation();
                if (subCard.style.display === "none") {
                    subCard.style.display = "block";
                    if (onexpand != null) onexpand();
                } else {
                    subCard.style.display = "none";
                    if (oncollapse != null) oncollapse();
                }
            });
            div.append(arrow);
        })

        const titleWrapper = gui.node("div", div => {
            div.tabIndex = tabIndexCounter++;
            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.alignItems = "center";
            div.style.padding = "0px";
            div.style.width = "100%";

            if (onselect != null) div.addEventListener("click", onselect);
            if (highlightOnSelect) {
                div.onfocus = function (e) { div.style.background = "blue"; };
                div.onblur = function (e) { div.style.background = "none"; };
            }

            if (subCard == null) arrowWrapper.style.visibility = "hidden";
            div.append(arrowWrapper);
            div.append(titleCard);
        })

        root.append(titleWrapper);
        if (subCard != null) root.append(gui.getNode(subCard));
    }
}