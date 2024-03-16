import { NavFS } from "../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { Canvas, GuiContext, GuiHandle } from "../gui.js";
import { UiEvent } from "../uiConfiguration.js";
import { UiEventHandler } from "../uiEventHandler.js";
import { notImplemented } from "../../../methods.js";
import { $Button } from "./Components/button.js";
import GEInstanceDB from "../../../FileSystem/geInstanceDB.js";

const handler = {}

const idb = new GEInstanceDB();
await idb.getInstance("geInstanceDB");

const defaulter = {
    get: function (target, name) {
        return () => eventHandler.sendMessageToParent(UiEvent.menuBar_open_project, name);
    }
};

const emptyObj = {};
const proxy = new Proxy(emptyObj, defaulter);

const contextMenu = {
    "Save Project": () => { eventHandler.sendMessageToParent(UiEvent.menuBar_save_project); },
    "Set root folder": async function () {
        const dir = await window.showDirectoryPicker({ id: "NineProject", mode: "readwrite" });
        eventHandler.sendMessageToParent(UiEvent.menuBar_set_project_root, dir);
    },
    "New Project...": () => {
        const instanceName = prompt("New name ?");
        eventHandler.sendMessageToParent(UiEvent.menuBar_new_project, instanceName);
    },
    "Open Project": proxy,
    "Upload Image": async function () {
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
}

const eventHandler = new UiEventHandler(handler, contextMenu);

export class $MenuBar extends GuiHandle {
    static objectToButton(gui, obj, target) {
        for (const [name, handler] of Object.entries(obj)) {
            target.appendChild(gui.getNode(new $Button({ name, handler })));
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

        this.objectToButton(gui, leftButtons, leftDiv);
        this.objectToButton(gui, middleButtons, middleDiv);
        this.objectToButton(gui, rightButtons, rightDiv);

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
        "File": async (e) => {
            const box = e.target.getBoundingClientRect();
            const allProjects = await idb.getKeys("runningInstances");
            const projectsAsContextMenu = allProjects.reduce((map, projectName) => {
                map[projectName] = null;
                return map;
            }, {});
            eventHandler.sendMessageToParent(UiEvent.global_context_menu, {
                target: "MenuBar",
                screenX: box.left,
                screenY: box.bottom,
                items: {
                    "Save Project": null,
                    "Set root folder": null,
                    "New Project...": null,
                    "Open Project": projectsAsContextMenu,
                    "Upload Image": null,
                },
            })
        },
        "Edit": async () => { notImplemented(); },
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