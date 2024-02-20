import { NavFS } from "../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { Canvas, GuiHandle, GuiContext } from "../gui.js";
import { UiEvent } from "../uiConfiguration.js";
import { UiEventHandler } from "../uiEventHandler.js";
import { notImplemented } from "../uiUtil.js";
import { $Button } from "./Components/button.js";

const handler = {}

const contextMenu = {}

const eventHandler = new UiEventHandler(handler, contextMenu);

export class $MenuBar extends GuiHandle {
    static objectToButton(obj, target) {
        for (const [name, handler] of Object.entries(obj)) {
            target.appendChild(new $Button({ name, handler }).getNode());
        }
    }

    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const leftDiv = gui.node("div", div => {
            div.id = "left";
            div.style.display = "flex";
            div.style.gap = "20px";
            div.style.marginLeft = "10px";
            div.style.width = "33%";
        });
        const middleDiv = gui.node("div", div => {
            div.id = "middle";
            div.style.display = "flex";
            div.style.gap = "20px";
            div.style.flexGrow = 1;
            div.style.justifyContent = "center";
        });
        const rightDiv = gui.node("div", div => {
            div.id = "right";
            div.style.display = "flex";
            div.style.gap = "20px";
            div.style.marginRight = "10px";
            div.style.width = "33%";
            div.style.justifyContent = "right";
        });

        const leftButtons = gui.state("leftButtons");
        const middleButtons = gui.state("middleButtons");
        const rightButtons = gui.state("rightButtons");

        this.objectToButton(leftButtons, leftDiv);
        this.objectToButton(middleButtons, middleDiv);
        this.objectToButton(rightButtons, rightDiv);

        root.style.overflow = "hidden";
        root.style.margin = "0";
        root.style.backgroundColor = "black";
        root.style.color = "white";
        root.style.display = "flex";
        root.style.flexDirection = "row";
        root.style.gap = "15px";

        root.append(leftDiv, middleDiv, rightDiv);
    }
}

Canvas.addToHUD(new $MenuBar({
    leftButtons: {
        "File": async () => {
            const dir = await window.showDirectoryPicker({ id: "NineProject", mode: "readwrite" });
            console.log(dir);
            NavFS.bootFromDirectory(dir);
        },
        "Upload Image": async () => {
            const [fileHandle] = await window.showOpenFilePicker();
            const file = await fileHandle.getFile();
            const fileReader = new FileReader();

            fileReader.onload = async (e) => {
                const clientKey = "d2a8dd286a1e260c66eb6df9834bc6a2";
                const expiration = 600;
                const sliceIndex = e.target.result.indexOf(',') + 1; // Searches for the first comma found in the header: "data:*/*;base64,"
                const imgData = e.target.result.slice(sliceIndex);
                const formData = new FormData();
                formData.append("image", imgData);
                const response = await fetch(`https://api.imgbb.com/1/upload?expiration=${expiration}&key=${clientKey}`, {
                    method: "POST",
                    body: formData
                })
                const json = await response.json();
                console.log(json);
                const url = json.data.url;
                eventHandler.sendMessageToParent(UiEvent.menuBar_upload_image, { url });
            }
            fileReader.readAsDataURL(file);
        },
        "Edit": async () => { notImplemented(); }
    },

    middleButtons: {
        "Compile": async () => { eventHandler.sendMessageToParent(UiEvent.menuBar_compile); },
        "BootRun": async () => { eventHandler.sendMessageToParent(UiEvent.menuBar_play); },
        "Build": async () => { eventHandler.sendMessageToParent(UiEvent.menuBar_build); },
    },

    rightButtons: {
        "Profile": async () => { notImplemented(); }
    }
}));
Canvas.repaint();