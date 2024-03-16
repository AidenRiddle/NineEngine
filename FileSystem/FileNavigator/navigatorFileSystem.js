import { Stash } from "../../settings.js";
import { Address } from "../address.js";
import GEInstanceDB from "../geInstanceDB.js";

const idb = new GEInstanceDB();
await idb.getInstance("geInstanceDB");

async function runFixtures() {
    const fixtures = await fetch(Stash.fixtures).then((response) => response.json());

    function recur(path, dir) {
        const promises = [];
        for (const [key, value] of Object.entries(dir)) {
            const newPath = path + "/" + key;
            if (typeof value == 'object') {
                promises.push(NavFS.makeDirectory(newPath).then(() => recur(newPath, value)));
            } else {
                let data;
                try { data = atob(value); }     // Depending on file format (.jpg, .glb, etc), file data could be Base64 encoded
                catch (e) { data = value; }     // If not, write the data as is.
                promises.push(NavFS.put(newPath, data));
            }
        }
        return Promise.all(promises);
    }
    return recur(".", fixtures);
}

export class NavFS {
    /** @type {FileSystemDirectoryHandle} */
    static #root;

    static get rootName() { return this.#root?.name; }
    static get coreName() { return ".NineEngine"; }

    static #cutPath(path, match) {
        const temp = path.replace(match, '');
        return temp.startsWith('/') ? temp.slice(1) : temp;
    }

    static async #resolveDir(dirPath, create = false) {
        let path = Address.asFilePath(dirPath);
        let wd = await this.getRoot();
        if (path.startsWith(this.coreName)) {
            path = this.#cutPath(path, this.coreName);
            wd = await navigator.storage.getDirectory();
        }
        if (path.startsWith(this.rootName + '/')) path = this.#cutPath(path, this.rootName);
        if (path.startsWith("./")) path = this.#cutPath(path, "./");
        if (path == "." || path == "" || path == this.rootName || path == this.coreName) return wd;
        for (const dirName of path.split("/")) {
            try {
                wd = await wd.getDirectoryHandle(dirName, { create });
            } catch (e) {
                throw new Error("Could not find (" + dirName + "). Invalid path (" + dirPath + ").");
            }
        }
        return wd;
    }

    static async #resolveFile(path, create = false) {
        const { fileName, dirPath } = this.getFileNameAndPath(path);

        const dir = await this.#resolveDir(dirPath);
        return await dir.getFileHandle(fileName, { create });
    }

    static async #verifyFolderIsValid(path, stashHref) {
        const invalidDirectory = "The provided directory does not contain a project or is invalid: ";
        const fixtures = await fetch(stashHref).then((response) => response.json());
        try {
            const directories = await this.listDirectories(path);
            for (const dirName of Object.keys(fixtures["Assets"])) {
                const result = directories.find(dir => dir.name == dirName);
                if (result == null) {
                    console.error(invalidDirectory + path);
                    console.error("Could not find " + dirName, "in", fixtures);
                    return Promise.resolve(false);
                }
            }
            return Promise.resolve(true);
        } catch (e) {
            console.error(e);
            console.error(invalidDirectory + path);
            return Promise.resolve(false);
        }
    }

    static getFileExtension(file) { return file.name.substring(file.name.lastIndexOf('.')); }
    static getFileNameFromPath(path) { return path.substring(path.lastIndexOf('/') + 1); }
    static getFileNameAndPath(path) {
        path = Address.asFilePath(path);
        const fileNameStartIndex = path.lastIndexOf("/");
        return {
            fileName: path.substring(fileNameStartIndex + 1),
            dirPath: path.substring(0, fileNameStartIndex)
        }
    }

    static async hasRoot() {
        return await this.getRoot() != null;
    }

    static async getRoot() {
        if (this.#root == null) {
            this.#root = await idb.get("userConfiguration", "projectRoot")
                .then((obj) => obj.dirHandle)
                .catch(e => null);
        }
        return this.#root;
    }

    static async verifyFolderAccess(handle) {
        if (handle.name == '') {
            console.error("User has not specified a project folder.");
            return false;
        }

        const opts = { mode: "readwrite" };
        const permission = await handle.queryPermission(opts);

        if (permission != "granted") {
            console.log(`(${handle.name}) permission:`, permission);
            return false;
        }
        return true;
    }

    static async verifyRootFolderIsValid() {
        const path = "./Assets";
        return this.#verifyFolderIsValid(path, Stash.fixtures);
    }

    static async isReady() {
        // if (!await this.hasRoot()) {
        //     console.error("hasRoot failed.");
        //     return false;
        // }
        // if (!await navigator.storage.persisted().then(persisted => persisted ? true : navigator.storage.persist())) {
        //     console.error("navigator.storage failed.");
        //     return false;
        // }
        // if (!await this.#verifyFolderIsValid(this.coreName + "/Assets", Stash.coreFixtures)) {
        //     console.error("verifyFolderIsValid failed.");
        //     return false;
        // }
        // if (!await this.verifyFolderAccess(this.#root)) {
        //     console.error("verifyFolderAccess failed.");
        //     return false;
        // }
        // if (!await this.verifyRootFolderIsValid()) {
        //     console.error("verifyRootFolderIsValid failed.");
        //     return false;
        // }
        // return true;

        return await this.hasRoot()
            && await navigator.storage.persisted().then(persisted => persisted ? true : navigator.storage.persist())
            && await this.#verifyFolderIsValid(this.coreName + "/Assets", Stash.coreFixtures)
            && await this.verifyFolderAccess(this.#root)
            && await this.verifyRootFolderIsValid();
    }

    static async getDirectoryAccess() {
        try {
            const { dirHandle } = await idb.get("userConfiguration", "projectRoot").catch(e => { alert("You have not specified a project folder."); return Promise.reject(e); });
            this.#root = dirHandle;
            await this.requestFolderAccess(this.#root, "readwrite");
            const rootFolderIsValid = await this.verifyRootFolderIsValid();
            if (!rootFolderIsValid) {
                const useFixtures = confirm("Project folder is invalid. Would you like to repair it?");
                if (useFixtures) await runFixtures();
                else throw new Error("Provided root folder is invalid");
            }
            return Promise.resolve();
        } catch (e) {
            console.error(`Unable to get directory access for the provided root folder`);
            this.#root = null;
            return Promise.reject(e);
        }
    }

    static async bootFromDirectory(dirHandle) {
        const originalDirectory = await this.getRoot();
        if (originalDirectory != null && originalDirectory.dirHandle.name != dirHandle.name) {
            const decision = confirm("The directory you have chosen is different from the one previously associated to your project. "
                + "Changing directories could be fatal to your project. Do you wish to continue ?");
            if (!decision) return;
        }
        await idb.store("userConfiguration", { name: "projectRoot", dirHandle });
        return this.getDirectoryAccess()
            .catch((e) => {
                idb.store("userConfiguration", originalDirectory);
                return Promise.reject(e);
            });
    }

    /**
     * @param {FileSystemDirectoryHandle} dirHandle
     * @param {"read" | "readwrite"} accessMode
     */
    static async requestFolderAccess(dirHandle, accessMode) {
        const response = await dirHandle.requestPermission({ mode: accessMode });
        return response === "granted" ? Promise.resolve() : Promise.reject(`User denied '${accessMode}' access.`);
    }

    static async list(path) {
        const directory = await this.#resolveDir(path);
        const list = await Array.fromAsync(directory.values());
        if (path.startsWith(this.coreName)) list.reverse();
        return list;
    }

    static async listDirectories(path) {
        const arr = await this.list(path);
        return arr.filter(handle => handle.kind == "directory");
    }

    static async listFiles(path) {
        const arr = await this.list(path);
        return arr.filter(handle => handle.kind == "file");
    }

    static async write(path, byteData) {
        const fileHandle = await this.#resolveFile(path);
        return fileHandle.createWritable()
            .then((writableStream) => writableStream.write(byteData)
                .then(() => writableStream.close())
            )
            .then(() => fileHandle.getFile());
    }

    static async makeDirectory(path) {
        return this.#resolveDir(path, true);
    }

    static async makeFile(path) {
        return this.#resolveFile(path, true);
    }

    static async put(path, byteData) {
        return this.makeFile(path)
            .then(() => this.write(path, byteData));
    }

    static async #removePath(path, recursive = false) {
        const { fileName, dirPath } = this.getFileNameAndPath(path);
        const handle = await this.#resolveDir(dirPath);
        return handle.removeEntry(fileName, { recursive });
    }

    static async removeFile(path) {
        return this.#removePath(path, false)
    }

    static async removeDirectory(path) {
        return this.#removePath(path, true)
    }

    /**
     * 
     * @param {string} path
     */
    static async getFile(path) {
        const fileHandle = await this.#resolveFile(path);
        return fileHandle.getFile();
    }

    static async fileExists(path) {
        try {
            await this.#resolveFile(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    /** @param {File} file */
    static async copyFile(file, targetPath) {
        const targetExists = await this.fileExists(targetPath);
        if (targetExists) {
            console.error("A file already exists at the target destination:", targetPath);
            return;
        }

        const srcData = await file.arrayBuffer();
        return this.put(targetPath, srcData);
    }

    static async copyFileFromPath(srcPath, targetPath) {
        const targetExists = await this.fileExists(targetPath);
        if (targetExists) {
            console.error("A file already exists at the target destination:\nSource:", srcPath, "\nTarget:", targetPath);
            return;
        }

        const srcData = await this.readFileAsByteArray(srcPath);
        return this.put(targetPath, srcData);
    }

    static async moveFile(srcPath, targetPath) {
        const targetExists = await this.fileExists(targetPath);
        if (targetExists) {
            console.error("A file already exists at the target destination:\nSource:", originalPath, "\nTarget:", targetPath);
            return;
        }
        return this.copyFileFromPath(srcPath, targetPath).then(() => this.removeFile(srcPath));
    }

    static async #readFileAs(path, method) {
        const fileReader = new FileReader();
        const file = await this.getFile(path);
        return new Promise((resolve, reject) => {
            fileReader.onloadend = (e) => { resolve(e.target.result); }
            fileReader.onerror = reject;
            fileReader[method](file);
        });
    }

    /** 
     * @param {string} path 
     * @returns {string} Contents of the file as a string
     */
    static async readFileAsText(path) {
        return this.#readFileAs(path, "readAsText");
    }

    /** 
     * @param {string} path 
     * @returns {ArrayBuffer} Contents of the file as an ArrayBuffer
     */
    static async readFileAsByteArray(path) {
        return this.#readFileAs(path, "readAsArrayBuffer");
    }

    /** 
     * @param {string} path 
     * @returns {string} Contents of the file as a base64 encoded string
     */
    static async readFileAsDataUrl(path) {
        return this.#readFileAs(path, "readAsDataURL");
    }

    static async debug() {
        const recur = async (path) => {
            const res = {};
            const a = await this.list(path);
            for (const b of a) {
                if (b.kind == "directory") {
                    res[b.name] = await recur(path + "/" + b.name);
                } else {
                    res[b.name] = b;
                }
            }
            return res;
        }
        console.log(this.rootName, ":", await recur(this.rootName));
        console.log(this.coreName + ":", await recur(this.coreName));
    }
}

window.NavFS = NavFS;