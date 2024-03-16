import { NavFS } from "../../../../FileSystem/FileNavigator/navigatorFileSystem.js";
import { GuiContext, GuiHandle } from "../../gui.js";
import { $Folder } from "./folder.js";

export class $Tree extends GuiHandle {
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
            const coreTreeNode = await this.buildTree(gui, NavFS.coreName);
            const projectTreeNode = await this.buildTree(gui, NavFS.rootName);
            gui.bake(root, coreTreeNode, projectTreeNode);
        } else this.displayDefaultMessage(gui, root, handle);
    }

    static displayDefaultMessage(gui, root, handle) {
        const p = gui.node("p", p => { p.innerText = "Please provide Read/Write access to your project folder." })
        const button = gui.node("button", button => {
            button.innerText = "Give Access";
            button.onclick = (e) => {
                NavFS.getDirectoryAccess()
                    .then(() => NavFS.isReady())
                    .then((isReady) => handle.set("fsReady", isReady))
                    .catch((msg) => console.error(msg))
            }
        })
        root.append(p, button);
    }

    static async buildTree(gui, path) {
        const entries = await NavFS.listDirectories(path);
        const callback = () => { gui.state("block").set("path", path); };
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

        states.value = path.split("/").splice(-1);
        for (const dirName of entries) {
            states.subfolders.push(await this.buildTree(gui, path + "/" + dirName.name));
        }
        return new $Folder(states);
    }
}