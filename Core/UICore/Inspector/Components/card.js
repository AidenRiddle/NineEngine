import { $ExpandableCard } from "../../Common/commonGui.js";
import { GuiContext, GuiHandle } from "../../gui.js";

const checkboxFilled = "/Core/UICore/Inspector/Icons/8679969_checkbox_line_icon.png";
const checkboxEmpty = "/Core/UICore/Inspector/Icons/8679886_checkbox_blank_line_icon.png";
const componentIcon = "/Core/UICore/Inspector/Icons/754626_deadly_decoration_halloween_lethal_scary_icon.png";

export class $InspectorCardIcon extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static builder(gui, root, handle) {
        gui.makeRoot(gui.node("img", img => {
            img.src = gui.state("iconSource");
            img.style.width = "25px";
            img.style.height = "25px";
            if (gui.state("invert")) img.style.filter = "invert(100%)";
        }));
    }
}

export class $Card extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static builder(gui, root, handle) {
        const title = gui.state("title");
        const isEnableable = gui.state("isEnableable");

        const icon = gui.getNode(new $InspectorCardIcon({ "iconSource": componentIcon, "invert": true }));
        const label = gui.node("p", p => { p.textContent = title; });
        const titleCard = gui.node("div", div => {
            div.id = "card-header";
            div.style.display = "flex";
            div.style.flexDirection = "row";
            div.style.alignItems = "center";
            div.style.gap = "5px";

            div.append(icon, label);
        });

        if (isEnableable) {
            const enableCheckmark = gui.node("img", img => {
                img.src = checkboxFilled;
                img.style.width = "15px";
                img.style.height = "15px";
                img.style.filter = "invert(100%)";
                img.onclick = function (e) {
                    e.target.src = (e.target.src.endsWith(checkboxEmpty)) ? checkboxFilled : checkboxEmpty
                }
            });
            titleCard.append(enableCheckmark);
        }

        const card = gui.getNode(new $ExpandableCard({
            "titleCard": titleCard,
            "subCard": gui.state("content"),
            "onselect": gui.state("callback"),
            "onexpand": () => { root.style.marginBottom = "30px"; },
            "oncollapse": () => { root.style.marginBottom = "5px"; },
            "highlightOnSelect": true,
        }));

        card.id = "card";
        card.style.alignSelf = "stretch";
        card.style.marginBottom = "30px";

        gui.makeRoot(card);
    }
}