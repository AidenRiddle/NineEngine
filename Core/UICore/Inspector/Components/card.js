import { GuiHandle, GuiNodeBuilder } from "../../gui.js";
import { _div_, _img_, _p_ } from "../../uiUtil.js";

const downArrow = "/Core/UICore/AssetBrowser/Icons/211687_down_arrow_icon.png";
const checkboxFilled = "/Core/UICore/Inspector/Icons/8679969_checkbox_line_icon.png";
const checkboxEmpty = "/Core/UICore/Inspector/Icons/8679886_checkbox_blank_line_icon.png";
const componentIcon = "/Core/UICore/Inspector/Icons/754626_deadly_decoration_halloween_lethal_scary_icon.png";

function toggleFolderListView(arrowImg, node) {
    if (node.style.display === "none") {
        node.style.display = "flex";
        arrowImg.style.transform = "rotate(0)";
        return true;
    }
    
    node.style.display = "none";
    arrowImg.style.transform = "rotate(-90deg)";
    return false;
}

export class $Card extends GuiHandle {
    /**
     * @param {GuiNodeBuilder} frag 
     * @param {HTMLElement} root
     */
    static builder(frag, root) {
        const title = frag.state("title");
        const isEnableable = frag.state("isEnableable");
        const content = frag.state("content");

        const arrowImg = frag.node("img", img => {
            img.src = downArrow;
            img.style.width = "15px";
            img.style.height = "15px";
            img.style.transition = "all 0.15s ease-out";
            img.style.filter = "invert(100%)";
        });

        const icon = frag.node("img", img => {
            img.src = componentIcon;
            img.style.width = "25px";
            img.style.height = "25px";
            img.style.filter = "invert(100%)";
        });

        const label = frag.node("p", p => {
            p.textContent = title;
        });
        
        const wrapper = frag.node("div", div => {
            div.id = "card-header";
            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.alignItems = "center";
            div.onclick = function(e) {
                if(toggleFolderListView(arrowImg, content)) root.style.marginBottom = "30px";
                else root.style.marginBottom = "0px";
            };

            div.append(arrowImg, icon, label);
        });

        if(isEnableable){
            const enableCheckmark = frag.node("img", img => {
                img.src = checkboxFilled;
                img.style.width = "15px";
                img.style.height = "15px";
                img.style.filter = "invert(100%)";
                img.onclick = function(e) {
                    e.target.src = (e.target.src.endsWith(checkboxEmpty)) ? checkboxFilled : checkboxEmpty
                }
            });
            wrapper.append(enableCheckmark);
        }

        root.id = "card";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.alignItems = "flex-start";
        root.style.alignSelf = "stretch";
        root.style.marginBottom = "30px";

        root.append(wrapper, content);
    }
}

export function $card(title, isEnableable, content){
    const arrowImg = _img_({
        style: {
            width: "15px",
            height: "15px",
            transition: "all 0.15s ease-out",
            filter: "invert(100%)",
        },
        src: downArrow,
    });

    const children = [
        arrowImg,
        _img_({
            style: {
                width: "25px",
                height: "25px",
                filter: "invert(100%)",
            },
            src: componentIcon,
        }),
        _p_({
            textContent: title
        }),
    ];

    if(isEnableable){
        children.push(
            _img_({
                style: {
                    width: "15px",
                    height: "15px",
                    filter: "invert(100%)",
                },
                src: checkboxFilled,
                onclick: function(e) {
                    e.target.src = (e.target.src.endsWith(checkboxEmpty)) ? checkboxFilled : checkboxEmpty
                }
            })
        )
    }

    const container = _div_({
        id: "card",
        children: [
            _div_({
                id: "card-header",
                children: children,
                style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center"
                },
                onclick: function(e) {
                    if(toggleFolderListView(arrowImg, content)) container.style.marginBottom = "30px";
                    else container.style.marginBottom = "0px";
                },
            }),
            content
        ],
        style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            alignSelf: "stretch",

            marginBottom: "30px"
        }
    })

    return container;
}