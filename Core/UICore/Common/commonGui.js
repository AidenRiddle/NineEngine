import { GuiContext, GuiHandle } from "../gui.js";

let tabIndexCounter = -1;
const showSubfolderByDefault = true;
const downArrow = "/Core/UICore/AssetBrowser/Icons/211687_down_arrow_icon.png";

function preventDefault(e) { e.preventDefault(); }

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
        const ondblclick = gui.state("ondblclick");
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
            if (ondblclick != null) div.addEventListener("dblclick", ondblclick);
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

export class $Draggable extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const dragData = gui.state("dragData");

        root.draggable = true;
        root.ondragstart = (e) => {
            for (const [type, data] of Object.entries(dragData)) {
                e.dataTransfer.setData(type, data);
            }
        }
    }
}

export class $DragReceiver extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const onFileDrop = gui.state("onFileDrop");
        const onItemDrop = gui.state("onItemDrop");

        root.addEventListener("dragenter", preventDefault);
        root.addEventListener("dragover", preventDefault);
        root.addEventListener("drop", preventDefault);
        if (onFileDrop != null) root.addEventListener("drop", (e) => { onFileDrop(e.dataTransfer.files) });
        if (onItemDrop != null) root.addEventListener("drop", (e) => { onItemDrop(e.dataTransfer) });
    }
}

export class $Deleteable extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const onDelete = gui.state("onDelete");
        root.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() == "delete") onDelete(e);
        });
    }
}