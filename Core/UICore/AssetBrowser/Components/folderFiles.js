import { NavFS } from "../../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { AssetType } from "../../../../settings.js";
import TexturePainter from "../../../GECore/Util/texturePainter.js";
import { $DragReceiver } from "../../Common/commonGui.js";
import { GuiContext, GuiHandle } from "../../gui.js";
import Payload from "../../payload.js";
import { UiEvent } from "../../uiConfiguration.js";
import { $File } from "./folder.js";

function clickHandler(link) {
    const payload = new Payload(UiEvent.assetBrowser_select_assetFile, link);
    parent.postMessage(payload);
}

export class $Block extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static async builder(gui, root, handle) {
        const path = gui.state("path");

        root.id = "block-view";
        root.style.width = "200px";
        this.makeDropzone(gui, root, handle);

        if (path != null) this.listBlocks(path, gui, root, handle);
    }

    static makeDropzone(gui, root, handle) {
        handle.set("onItemDrop", (dt) => {
            const assetFilePath = dt.getData("assetFilePath");
            if (assetFilePath != "") {
                const { dirPath } = NavFS.getFileNameAndPath(assetFilePath);
                if (dirPath == gui.state("path")) { return; }
            }

            const promises = [];
            for (const file of dt.files) {
                const filePath = gui.state("path") + "/" + file.name;
                promises.push(NavFS.copyFile(file, filePath));
            }

            Promise.all(promises).then(() => handle.rebuild());
        });

        $DragReceiver.builder(gui, root, handle);
    }

    static async listBlocks(path, gui, root, handle) {
        const fileHandles = await NavFS.lsf(path);
        const dirHandles = await NavFS.lsdir(path);

        if (fileHandles.length == 0 && dirHandles.length == 0) {
            root.append(gui.node("p", p => { p.innerText = "This directory is empty."; }));
            return;
        }

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
                dragData: { "assetFilePath": filePath }
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
                ondblclick: async () => {
                    const extension = NavFS.getFileExtension(file);
                    const entry = prompt(`Rename Asset (${file.name}):`).trim();
                    const name = entry.endsWith(extension) ? entry : entry + '.' + extension;
                    if (file.name == name) { console.log("Hen:", file.name, name); return; }

                    const newPath = path + '/' + name;

                    try {
                        await NavFS.getFile(newPath);
                        alert(newPath + " already exists.");
                        return;
                    } catch (e) {}

                    await NavFS.copyFileFromPath(filePath, newPath);
                    await NavFS.rm(filePath);

                    thumbnailCache[newPath] = thumbnailCache[filePath];
                    delete thumbnailCache[filePath];

                    handle.rebuild();
                    clickHandler(newPath);

                    // const cargo = { soid: so.id, newName: name };
                    // const payload = new Payload(UiEvent.hierarchy_rename_sceneobject, cargo);
                    // parent.postMessage(payload);
                },
                deleteHandler: (e) => { e.preventDefault(); deleteFile(filePath); },
                dragData: { "assetFilePath": filePath }
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