import { GuiContext, GuiHandle } from "../../gui.js";

const showSubfolderByDefault = true;
const downArrow = "/Core/UICore/AssetBrowser/Icons/211687_down_arrow_icon.png";
const rightArrow = "/Core/UICore/AssetBrowser/Icons/211607_right_arrow_icon.png";

const imgThumbnail = "/Resources/Textures/skull/jl9.jpg";

var tabIndexCounter = -1;

function toggleFolderListView(arrowImg, node) {
    if (node.style.display === "none") {
        node.style.display = "block";
        arrowImg.style.transform = "rotate(0)";
    } else {
        node.style.display = "none";
        arrowImg.style.transform = "rotate(-90deg)";
    }
}

export class $Folder extends GuiHandle {
    /**
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const value = frag.state("value");
        const subfolders = frag.state("subfolders");
        const callback = frag.state("callback");
        const adderCallback = frag.state("adderCallback");
        const moveFileCallBack = frag.state("moveFileCallBack");

        tabIndexCounter++;
        const subfolderContainer = frag.node("div", div => {
            div.id = "folder-subfolder-container";
            div.style.display = (showSubfolderByDefault) ? "block" : "none";
            div.style.padding = "0px 0px 0px 10px";
            frag.bake(div, subfolders);
        });

        const arrowImg = frag.node("img", img => {
            img.src = downArrow;
            img.style.width = "15px";
            img.style.height = "15px";
            img.style.transition = "all 0.15s ease-out";
            img.style.transform = (showSubfolderByDefault) ? "rotate(0)" : "rotate(-90deg)";
            img.style.opacity = (subfolders.length > 0) ? "1" : "0";
            img.style.filter = "invert(100%)";
            img.onclick = () => {
                toggleFolderListView(img, subfolderContainer);
            }
        });

        const addFolderButton = frag.node("div", div => {
            div.id = "folder-add",
                div.append(frag.node("p", p => { p.textContent = "+"; })),
                div.style.display = "none"
            div.onclick = adderCallback
        })

        // This was a draggableReciever with moveFileCallBack
        const wrapper = frag.node("div", div => {
            div.id = "folder-header";
            div.tabIndex = tabIndexCounter.toString();
            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.alignItems = "center";
            div.style.padding = "0px";
            div.style.width = "200px";
            div.onclick = callback;
            div.onfocus = function (e) {
                e.target.style.background = "blue";
                addFolderButton.style.display = "block";
            }
            div.onblur = function (e) {
                e.target.style.background = "none";
                addFolderButton.style.display = "none";
            }
            div.append(
                frag.node("div", div => {
                    div.id = "folder-arrow";
                    div.append(arrowImg);
                }),
                frag.node("div", div => {
                    div.id = "folder-name";
                    div.append(
                        frag.node("p", p => {
                            p.textContent = value;
                        })
                    )
                }),
                addFolderButton,
            )
        })

        root.id = "folder";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignItems = "flex-start";
        root.style.width = "100%";
        root.append(
            wrapper,
            subfolderContainer,
        )
    }
}

export class $File extends GuiHandle {
    /**
     * @param {GuiContext} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const value = frag.state("value");
        const thumbnailUrl = frag.state("thumbnailUrl");
        const onclick = frag.state("onclick");
        const deleteHandler = frag.state("deleteHandler");
        const dragData = frag.state("dragData");

        tabIndexCounter++;
        const childrenMaxWidth = "100px";
        const label = frag.node("p", p => {
            p.textContent = value;
            p.style.maxWidth = childrenMaxWidth;
            p.style.textOverflow = "ellipsis";
            p.style.whiteSpace = "nowrap";
            p.style.overflow = "hidden";
            p.style.wordBreak = "break-word";
            p.style.textAlign = "center";
        });

        // This was a draggableReciever with dragData
        root.tabIndex = tabIndexCounter.toString();
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignItems = "center";
        root.style.padding = "10px";
        root.style.gap = "5px";
        root.style.width = "95px";
        root.style.height = "fit-content";
        root.onfocus = function (e) {
            e.target.style.background = "blue";
            label.style.maxWidth = "100px";
            label.style.whiteSpace = "initial";
            // label.style.overflow = "initial";

            this.onmouseup = (e) => { onclick(); }
        }
        root.onblur = function (e) {
            e.target.style.background = "none";
            label.style.maxWidth = childrenMaxWidth;
            label.style.whiteSpace = "nowrap";
            label.style.overflow = "hidden";

            this.onmouseup = (e) => { }
        }
        root.oncontextmenu = deleteHandler;
        root.append(
            frag.node("img", img => {
                img.style.maxWidth = childrenMaxWidth;
                img.style.maxHeight = "75px";
                img.src = thumbnailUrl ?? imgThumbnail;
                img.ondblclick = (e) => { window.open(thumbnailUrl ?? imgThumbnail, '_blank'); };
            }),
            label
        );
    }
}