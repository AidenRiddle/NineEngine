import { $Draggable, $ExpandableCard } from "../../Common/commonGui.js";
import { GuiContext, GuiHandle } from "../../gui.js";

const showSubfolderByDefault = true;

const imgThumbnail = "/Resources/Textures/unavailable-image.jpg";

var tabIndexCounter = -1;

export class $Folder extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static builder(gui, root, handle) {
        const value = gui.state("value");
        const subfolders = gui.state("subfolders");
        const adderCallback = gui.state("adderCallback");
        const moveFileCallBack = gui.state("moveFileCallBack");

        const addFolderButton = gui.node("div", div => {
            div.id = "folder-add";
            div.append(gui.node("p", p => { p.textContent = "+"; }));
            // div.style.display = "none";
            div.onclick = adderCallback;
        })

        const wrapper = gui.node("div", div => {
            div.id = "folder-header";
            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.alignItems = "center";
            div.style.gap = "5px";
            div.append(
                gui.node("p", p => { p.textContent = value; }),
                addFolderButton,
            )
        });

        if (subfolders != null && subfolders.length > 0) {
            const subfolderContainer = gui.node("div", div => {
                div.id = "folder-subfolder-container";
                div.style.display = (showSubfolderByDefault) ? "block" : "none";
                div.style.padding = "0px 0px 0px 10px";
                gui.bake(div, subfolders);
            });
            handle.set("subCard", subfolderContainer);
        }

        handle.set("titleCard", wrapper);
        handle.set("onselect", gui.state("callback"));
        handle.set("highlightOnSelect", true);

        $ExpandableCard.builder(gui, root, handle);
    }
}

export class $File extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const value = gui.state("value");
        const thumbnailUrl = gui.state("thumbnailUrl");
        const onclick = gui.state("onclick");
        const ondblclick = gui.state("ondblclick");
        const deleteHandler = gui.state("deleteHandler");

        tabIndexCounter++;
        const childrenMaxWidth = "100px";
        const label = gui.node("p", p => {
            p.textContent = value;
            p.style.maxWidth = childrenMaxWidth;
            p.style.textOverflow = "ellipsis";
            p.style.whiteSpace = "nowrap";
            p.style.overflow = "hidden";
            p.style.wordBreak = "break-word";
            p.style.textAlign = "center";
        });

        if (gui.state("dragData") != null) $Draggable.builder(gui, root);

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
        }
        if (onclick != null) root.onclick = (e) => { onclick(); }
        if (ondblclick != null) root.ondblclick = (e) => { ondblclick(); }
        root.onblur = function (e) {
            e.target.style.background = "none";
            label.style.maxWidth = childrenMaxWidth;
            label.style.whiteSpace = "nowrap";
            label.style.overflow = "hidden";
        }
        root.oncopy = deleteHandler;
        root.append(
            gui.node("img", img => {
                img.style.maxWidth = childrenMaxWidth;
                img.style.maxHeight = "75px";
                img.src = thumbnailUrl ?? imgThumbnail;
            }),
            label
        );
    }
}