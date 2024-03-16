import { NavFS } from "../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { notImplemented } from "../../../methods.js";
import { Canvas } from "../gui.js";
import { UiEvent } from "../uiConfiguration.js";
import { UiEventHandler } from "../uiEventHandler.js";
import { $Block } from "./Components/folderFiles.js";
import { $Tree } from "./Components/folderTree.js";

let wdPath;

const thumbnailCache = {
    _default: {
        default_folder: "/Core/UICore/AssetBrowser/Icons/icons8-file-folder-96.png",
        default_material: "/Core/UICore/AssetBrowser/Icons/crystal-ball.png",
        default_model: "/Core/UICore/AssetBrowser/Icons/3d.png",
        default_script: "/Core/UICore/AssetBrowser/Icons/icon_script.png",
    }
};

let rootFolderIsAccessible = await NavFS.isReady();
const guiBlock = new $Block({ thumbnailCache });
const guiTree = new $Tree({ fsReady: rootFolderIsAccessible, block: guiBlock });

Canvas.addToHUD(guiTree);
Canvas.addToHUD(guiBlock);

const handler = {
    [UiEvent.assetBrowser_refresh]: async () => {
        if (!rootFolderIsAccessible) {
            rootFolderIsAccessible = await NavFS.isReady();
            guiTree.set("fsReady", rootFolderIsAccessible);
        } else {
            guiTree.rebuild();
        }
    },
    [UiEvent.global_visibility_change]: guiTree.rebuild,
}

const contextMenu = {
    "New Folder": () => {
        const name = prompt("Folder name?");
        if (name != '') {
            NavFS.makeDirectory(wdPath + '/' + name);
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