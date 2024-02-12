import { GuiHandle, GuiNodeBuilder } from "../../gui.js";
import { _div_, _img_, _p_, makeDraggable, makeDraggableReciever } from "../../uiUtil.js";

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

function $folder(value, subfolders, callback, adderCallback, moveFileCallBack) {
    tabIndexCounter++;
    const subfolderContainer = _div_({
        id: "folder-subfolder-container",
        children: subfolders,
        style: {
            display: (showSubfolderByDefault) ? "block" : "none",
            padding: "0px 0px 0px 10px",
        },
    });

    const arrowImg = _img_({
        style: {
            width: "15px",
            height: "15px",
            transition: "all 0.15s ease-out",
            transform: (showSubfolderByDefault) ? "rotate(0)" : "rotate(-90deg)",
            opacity: (subfolders.length > 0) ? "1" : "0",
            filter: "invert(100%)",
        },
        src: downArrow,
        onclick: () => {
            toggleFolderListView(arrowImg, subfolderContainer);
        }
    });

    const addFolderButton = _div_({
        id: "folder-add",
        children: [
            _p_({
                textContent: "+"
            }),
        ],
        style: {
            display: "none"
        },
        onclick: adderCallback
    })

    return _div_({
        id: "folder",
        children: [
            makeDraggableReciever(_div_({
                id: "folder-header",
                tabIndex: tabIndexCounter.toString(),
                children: [
                    _div_({
                        id: "folder-arrow",
                        children: [
                            arrowImg,
                        ]
                    }),
                    _div_({
                        id: "folder-name",
                        children: [
                            _p_({
                                textContent: value
                            }),
                        ]
                    }),
                    addFolderButton,
                ],
                style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "0px",
                    width: "200px",
                },
                onclick: function (e) {
                    callback();
                },
                onfocus: function (e) {
                    e.target.style.background = "blue";
                    addFolderButton.style.display = "block";
                },
                onblur: function (e) {
                    e.target.style.background = "none";
                    addFolderButton.style.display = "none";
                }
            }), moveFileCallBack),
            subfolderContainer,
        ],
        style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
        }
    })
}

function $file(value, thumbnailUrl, onclick, deleteHandler, dragData) {
    tabIndexCounter++;

    const childrenMaxWidth = "100px";

    const label = _p_({
        style: {
            maxWidth: childrenMaxWidth,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
            wordBreak: "break-word",
            textAlign: "center",
        },
        textContent: value,
    });

    return makeDraggable(_div_({
        tabIndex: tabIndexCounter.toString(),
        style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "10px",
            gap: "5px",
            width: "95px",
            height: "fit-content",
        },
        children: [
            _img_({
                style: {
                    maxWidth: childrenMaxWidth,
                    maxHeight: "75px",
                },
                src: thumbnailUrl ?? imgThumbnail,
                ondblclick: (e) => {
                    window.open(thumbnailUrl ?? imgThumbnail, '_blank');
                },
            }),
            label,
        ],
        onfocus: function (e) {
            e.target.style.background = "blue";
            label.style.maxWidth = "100px";
            label.style.whiteSpace = "initial";
            // label.style.overflow = "initial";

            this.onmouseup = (e) => { onclick(); }
        },
        onblur: function (e) {
            e.target.style.background = "none";
            label.style.maxWidth = childrenMaxWidth;
            label.style.whiteSpace = "nowrap";
            label.style.overflow = "hidden";

            this.onmouseup = (e) => { }
        },
        oncontextmenu: deleteHandler,
    }), dragData);
}

export class $Folder extends GuiHandle {
    /**
     * @param {GuiNodeBuilder} frag 
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
     * @param {GuiNodeBuilder} frag 
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