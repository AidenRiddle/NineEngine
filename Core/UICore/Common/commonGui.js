import { GuiContext, GuiHandle } from "../gui.js";

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