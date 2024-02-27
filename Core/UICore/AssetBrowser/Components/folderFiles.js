import { NavFS } from "../../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { AssetType } from "../../../../settings.js";
import TexturePainter from "../../../GECore/Util/texturePainter.js";
import { GuiContext, GuiHandle } from "../../gui.js";
import Payload from "../../payload.js";
import { UiEvent } from "../../uiConfiguration.js";
import { $File } from "./folder.js";

function clickHandler(link) {
    const payload = new Payload(UiEvent.assetBrowser_select_assetFile, link);
    parent.postMessage(payload);
}

function dragoverHandler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
}

export class $Block extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static async builder(gui, root, handle) {
        const path = gui.state("path");

        root.id = "block-view";
        root.style.width = "200px";
        this.makeDropzone(root);

        if (path != null) this.listBlocks(path, gui, root, handle);
    }

    static makeDropzone(element) {
        element.ondrop = (ev) => {
            ev.preventDefault();
            const payload = ev.dataTransfer.items;
            const items = [];
            for (const item of payload) { items.push(item); }
            console.log("Items:", items);
        
            const promises = [];
            for (const file of ev.dataTransfer.files) {
                const filePath = gui.state("path") + "/" + file.name;
                console.log(filePath, file);
                promises.push(NavFS.copyFile(file, filePath));
            }
        
            Promise.all(promises).then(() => guiBlock.rebuild());
        };
        element.ondragover = dragoverHandler;
    }

    static async listBlocks(path, gui, root, handle) {
        const fileHandles = await NavFS.lsf(path);

        if (fileHandles.length == 0) {
            root.append(gui.node("p", p => { p.innerText = "This directory is empty."; }));
            return;
        }

        const dirHandles = await NavFS.lsdir(path);
        const thumbnailCache = gui.state("thumbnailCache");
        async function deleteFile(path) {
            await NavFS.rm(path);
            handle.rebuild();
        }

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
        gui.bake(root, blocks);

        for (let fileHandle of fileHandles) {
            const file = await fileHandle.getFile();
            const filePath = path + "/" + file.name;
            let thumbnail = thumbnailCache[filePath];
            const click = () => clickHandler(filePath);
            if (NavFS.getFileExtension(file) == AssetType.material.extension) {
                thumbnail = thumbnailCache._default.default_material;
            } else if (NavFS.getFileExtension(file) == AssetType.model.extension) {
                thumbnail = thumbnailCache._default.default_model;
            }

            const block = new $File({
                value: file.name,
                thumbnailUrl: thumbnail,
                onclick: click,
                deleteHandler: (e) => { e.preventDefault(); deleteFile(filePath); },
                dragData: filePath
            });
            gui.bake(root, block);

            if (thumbnail == null) {
                TexturePainter.imageToThumbnailBlob(file, 75, 75)
                    .then((resized) => {
                        thumbnailCache[filePath] = URL.createObjectURL(resized);
                        block.set("thumbnailUrl", thumbnailCache[filePath]);
                    });
            }
        }
    }
}