import { NavFS } from "../../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { AssetType } from "../../../../settings.js";
import TexturePainter from "../../../GECore/Util/texturePainter.js";
import { $DragReceiver } from "../../Common/commonGui.js";
import { GuiContext, GuiHandle } from "../../gui.js";
import Payload from "../../payload.js";
import { UiEvent } from "../../uiConfiguration.js";
import { $File } from "./folder.js";

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
        const path = gui.state("path");
        handle.set("onItemDrop", (dt) => {
            const assetFilePath = dt.getData("assetFilePath");
            if (assetFilePath != "") {
                const { dirPath } = NavFS.getFileNameAndPath(assetFilePath);
                if (dirPath == path) { return; }
            }

            const promises = [];
            for (const file of dt.files) {
                const filePath = path + "/" + file.name;
                promises.push(NavFS.copyFile(file, filePath));
            }

            Promise.all(promises).then(() => handle.rebuild());
        });

        $DragReceiver.builder(gui, root, handle);
    }

    static broadcastSelectEvent(link) {
        const payload = new Payload(UiEvent.assetBrowser_select_assetFile, link);
        parent.postMessage(payload);
    }

    static async deleteFile(path, handle) {
        await NavFS.rm(path);
        handle.rebuild();
    }

    static async renameFile(path, handle, fileHandle, thumbnailCache) {
        const extension = NavFS.getFileExtension(fileHandle);
        const entry = prompt(`Rename Asset (${fileHandle.name}):`, fileHandle.name)?.trim();

        if (entry == null) return;

        const name = entry.endsWith(extension) ? entry : entry + extension;
        if (fileHandle.name == name) { return; }

        const filePath = path + '/' + fileHandle.name;
        const newPath = path + '/' + name;

        try {
            await NavFS.getFile(newPath);
            alert(newPath + " already exists.");
            return;
        } catch (e) { }

        await NavFS.copyFileFromPath(filePath, newPath);
        await NavFS.rm(filePath);

        thumbnailCache[newPath] = thumbnailCache[filePath];
        delete thumbnailCache[filePath];

        handle.rebuild();
        this.broadcastSelectEvent(newPath);

        // const cargo = { soid: so.id, newName: name };
        // const payload = new Payload(UiEvent.hierarchy_rename_sceneobject, cargo);
        // parent.postMessage(payload);
    }

    static listDirectories(gui, root, handle, dirHandles) {
        const thumbnailCache = gui.state("thumbnailCache");
        const path = gui.state("path");
        for (const dirHandle of dirHandles) {
            const filePath = path + "/" + dirHandle.name;
            const dirBlock = new $File({
                value: dirHandle.name,
                thumbnailUrl: thumbnailCache._default.default_folder,
                ondblclick: () => { handle.set("path", filePath); },
                onDelete: () => { this.deleteFile(filePath, handle); },
                dragData: { "assetFilePath": filePath }
            })
            gui.bake(root, dirBlock);
        }
    }

    static listFiles(gui, root, handle, fileHandles) {
        const path = gui.state("path");
        const thumbnailCache = gui.state("thumbnailCache");
        for (const fileHandle of fileHandles) {
            const filePath = path + "/" + fileHandle.name;
            let thumbnail = thumbnailCache[filePath];
            const fileExtension = NavFS.getFileExtension(fileHandle);
            if (AssetType.isMaterial(fileExtension)) {
                thumbnail = thumbnailCache._default.default_material;
            } else if (AssetType.isModel(fileExtension)) {
                thumbnail = thumbnailCache._default.default_model;
            } else if (AssetType.isScript(fileExtension)) {
                thumbnail = thumbnailCache._default.default_script;
            }

            const block = new $File({
                value: fileHandle.name,
                thumbnailUrl: thumbnail,
                onclick: () => this.broadcastSelectEvent(filePath),
                ondblclick: async () => { this.renameFile(path, handle, fileHandle, thumbnailCache); },
                onDelete: () => { this.deleteFile(filePath, handle); },
                dragData: { "assetFilePath": filePath }
            });
            gui.bake(root, block);

            if (thumbnail == null && AssetType.isImage(fileExtension)) {
                fileHandle.getFile()
                    .then((file) => TexturePainter.imageToThumbnailBlob(file, 75, 75))
                    .then((resized) => {
                        thumbnailCache[filePath] = URL.createObjectURL(resized);
                        block.set("thumbnailUrl", thumbnailCache[filePath]);
                    });
            }
        }
    }

    static async listBlocks(path, gui, root, handle) {
        const fileHandles = await NavFS.lsf(path);
        const dirHandles = await NavFS.lsdir(path);

        if (fileHandles.length == 0 && dirHandles.length == 0) {
            root.append(gui.node("p", p => { p.innerText = "This directory is empty."; }));
            return;
        }

        this.listDirectories(gui, root, handle, dirHandles);
        this.listFiles(gui, root, handle, fileHandles);
    }
}