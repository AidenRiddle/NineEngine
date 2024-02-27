import { NavFS } from "../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { AssetType } from "../../../settings.js";
import { Canvas, GuiContext, GuiHandle } from "../gui.js";
import { UiEvent } from "../uiConfiguration.js";
import { UiEventHandler } from "../uiEventHandler.js";
import { notImplemented } from "../uiUtil.js";
import { $File, $Folder } from "./Components/folder.js";

let wdPath;

class $Tree extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static async builder(gui, root, handle) {
        root.id = "tree-view";
        root.style.width = "250px";
        root.style.height = "100%";
        root.style.overflow = "auto";

        const fileSystemIsReady = gui.state("fsReady");

        console.log("Refreshing asset browser ...");
        if (fileSystemIsReady) {
            const treeNode = await this.buildTree(".");
            gui.bake(root, treeNode);
        } else this.displayDefaultMessage(gui, root, handle);
    }

    static displayDefaultMessage(gui, root, handle) {
        const p = gui.node("p", p => { p.innerText = "Please provide Read/Write access to your project folder." })
        const button = gui.node("button", button => {
            button.innerText = "Give Access";
            button.onclick = (e) => {
                NavFS.getDirectoryAccess()
                    .then(() => handle.set("fsReady", true))
                    .catch((msg) => console.error("User denied Read/Write access.", msg))
            }
        })
        root.append(p, button);
    }

    static async buildTree(path) {
        const entries = await NavFS.lsdir(path);
        const callback = () => { guiBlock.set("path", path); };
        const adderCallback = () => {
            const name = prompt("New folder name ?");
            if (name == null || name.length == 0) return;
            NavFS.mkdir(path + "/" + name);
            guiTree.rebuild();
        };
        const moveFileCallBack = (str) => {     // From Drag'n'Drop
            const fileName = NavFS.getFileNameFromPath(str);
            NavFS.moveFile(str, path + "/" + fileName);
        }
        const states = {
            subfolders: [],
            callback: callback,
            adderCallback: adderCallback,
            moveFileCallBack: moveFileCallBack
        };

        if (entries) {
            states.value = path.split("/").splice(-1);
            for (const dirName of entries) {
                states.subfolders.push(await this.buildTree(path + "/" + dirName.name));
            }
        } else {
            states.value = '.';
        }
        return new $Folder(states);
    }
}

function dragoverHandler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
}

const dropHandler = (ev) => {
    ev.preventDefault();
    const payload = ev.dataTransfer.items;
    const items = [];
    for (const item of payload) { items.push(item); }
    console.log("Items:", items);

    const promises = [];
    for (const file of ev.dataTransfer.files) {
        const path = wdPath + "/" + file.name;
        console.log(path, file);
        promises.push(NavFS.copyFile(file, path));
    }

    Promise.all(promises).then(() => guiBlock.rebuild());
}

class $Block extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static async builder(gui, root, handle) {
        const path = gui.state("path");
        wdPath = path;

        root.id = "block-view";
        root.style.width = "200px";
        this.makeDropzone(root);

        if (path != null) this.listBlocks(path, gui, root, handle);
    }

    static makeDropzone(element) {
        element.ondrop = dropHandler;
        element.ondragover = dragoverHandler;
    }

    static async listBlocks(path, gui, block, handle) {
        const fileHandles = await NavFS.lsf(path);
        const dirHandles = await NavFS.lsdir(path);
        if (!fileHandles) return;

        const blocks = [];
        for (const dirHandle of dirHandles) {
            const filePath = path + "/" + dirHandle.name;
            blocks.push(new $File({
                value: dirHandle.name,
                thumbnailUrl: thumbnailCache._default.default_folder,
                ondblclick: async () => { handle.set("path", filePath); },
                deleteHandler: (e) => { e.preventDefault(); deleteFile(filePath); },
                dragData: filePath
            }));
        }
        for (let fileHandle of fileHandles) {
            const file = await fileHandle.getFile();
            const filePath = path + "/" + file.name;
            let thumbnail = thumbnailCache[filePath];
            const click = () => clickHandler(filePath);
            if (NavFS.getFileExtension(file) == AssetType.material.extension) {
                thumbnail = thumbnailCache._default.default_material;
            } else if (NavFS.getFileExtension(file) == AssetType.model.extension) {
                thumbnail = thumbnailCache._default.default_model;
            } else if (thumbnail == null) {
                thumbnailCache[filePath] = URL.createObjectURL(file);
                thumbnail = thumbnailCache[filePath];
            }
            blocks.push(new $File({
                value: file.name,
                thumbnailUrl: thumbnail,
                onclick: click,
                deleteHandler: (e) => { e.preventDefault(); deleteFile(filePath); },
                dragData: filePath
            }));
        }
        gui.bake(block, blocks);

        if (block.children.length == 0) {
            block.append(gui.node("p", p => { p.innerText = "This directory is empty."; }));
        }
    }
}

const rootFolderIsAccessible = await NavFS.isReady();
const guiTree = new $Tree({ fsReady: rootFolderIsAccessible });
const guiBlock = new $Block({});

const handler = {
    [UiEvent.assetBrowser_refresh]: guiTree.rebuild,
    [UiEvent.global_visibility_change]: guiTree.rebuild,
}

const contextMenu = {
    "New Folder": () => {
        const name = prompt("Folder name?");
        if (name != '') {
            NavFS.mkdir(wdPath + '/' + name);
            guiTree.rebuild();
            guiBlock.set("path", wdPath);
        }
    },
    "New Model": () => {
        const name = prompt("Model name?");
        if (name != '') {
            let fullName = wdPath + '/' + name;
            if (!fullName.endsWith(".model")) fullName += ".model";
            NavFS.put(fullName, "{\"vertexShaderId\":\"defaultVS\", \"meshId\": \"3DModels/cube.glb\", \"materials\": [\"slideshow_if.mat\"]}");
            guiTree.rebuild();
            guiBlock.set("path", wdPath);
        }
    },
    "New Material": () => {
        const name = prompt("Material name?");
        if (name != '') {
            let fullName = wdPath + '/' + name;
            if (!fullName.endsWith(".mat")) fullName += ".mat";
            NavFS.put(fullName, "{\"shaderId\":\"Shaders/fragment.glsl\",\"uniformValueMap\":{\"u_texture\":0},\"textures\":[\"Textures/if1.jpg\"]}");
            guiTree.rebuild();
            guiBlock.set("path", wdPath);
        }
    },
    "New Shader": () => { notImplemented() },
    "New Script": () => { notImplemented() },
}

const eventHandler = new UiEventHandler(handler, contextMenu);

function clickHandler(link) {
    eventHandler.sendMessageToParent(UiEvent.assetBrowser_select_assetFile, link);
}

async function deleteFile(path) {
    await NavFS.rm(path);
    guiBlock.rebuild();
}

Canvas.addToHUD(guiTree);
Canvas.addToHUD(guiBlock);

const thumbnailCache = {
    _default: {
        default_folder: "/Core/UICore/AssetBrowser/Icons/icons8-file-folder-96.png",
        default_material: "/Core/UICore/AssetBrowser/Icons/crystal-ball.png",
        default_model: "/Core/UICore/AssetBrowser/Icons/3d.png",
    }
};