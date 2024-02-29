import { Stash } from "../../settings.js";
import GEInstanceDB from "../geInstanceDB.js";

const nineEngineRootName = "NineEngine";

const idb = new GEInstanceDB();
await idb.getInstance("geInstanceDB");

async function runFixtures() {
    const fixtures = await fetch(Stash.fixtures).then((response) => response.json());

    function recur(path, dir) {
        const promises = [];
        for (const [key, value] of Object.entries(dir)) {
            const newPath = path + "/" + key;
            if (typeof value == 'object') {
                promises.push(NavFS.mkdir(newPath).then(() => recur(newPath, value)));
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

const promiseNavStorage = navigator.storage.persisted()
    .then(async (isPersisted) => {
        if (!isPersisted && !(await navigator.storage.persist())) {
            throw new Error("Failed to persist default Navigator Storage.");
        } else {
            return navigator.storage.getDirectory();
        }
    });

const promiseUserDirectory = idb.get("userConfiguration", "projectRoot")
    .then((result) => result.dirHandle)
    .catch((e) => {
        console.warn(e, "\nPlease specify a project directory.");
        return null;
    })

const navDir = await Promise.all([promiseNavStorage, promiseUserDirectory])
    .then(([navDir, userDir]) => userDir);

function promiseIteratorToArray(asyncIterator) {
    const listOfFiles = [];
    function recur(asyncIt) {
        return asyncIt.next().then((res) => { if (res.done) return listOfFiles; listOfFiles.push(res.value); return recur(asyncIt); });
    }
    return recur(asyncIterator);
}

export class NavFS {
    static #root = navDir;

    static async #resolveDir(path, create = false) {
        const { dirHandle } = await idb.get("userConfiguration", "projectRoot");
        let wd = dirHandle;
        if (path.startsWith("./")) path = path.slice(2);
        if (path.startsWith(nineEngineRootName)) {
            const temp = path.replace(nineEngineRootName, "");
            path = temp.startsWith("/")
                ? temp.slice(1)
                : temp;
            wd = await navigator.storage.getDirectory();
        }
        if (path == "." || path == "") return wd;
        for (const dirName of path.split("/")) {
            try {
                wd = await wd.getDirectoryHandle(dirName, { create });
            } catch (e) {
                throw new Error("Invalid path. Could not find (" + dirName + ").");
            }
        }
        return wd;
    }

    static async #resolveFile(path, create = false) {
        const { fileName, dirPath } = this.getFileNameAndPath(path);

        const dir = await this.#resolveDir(dirPath);
        return await dir.getFileHandle(fileName, { create });
    }

    static #getSuffix(str, separator) { return str.substring(str.lastIndexOf(separator)); }
    static getFileExtension(file) { return this.#getSuffix(file.name, '.'); }
    static getFileNameFromPath(path) { return this.#getSuffix(path, '/'); }
    static getFileNameAndPath(path) {
        if (!path.includes('.')) throw new Error("Invalid file path.");
        const fileNameStartIndex = path.lastIndexOf("/");
        return {
            fileName: path.substring(fileNameStartIndex + 1),
            dirPath: path.substring(0, fileNameStartIndex)
        }
    }

    static async bootFromDirectory(dirHandle) {
        const originalDirectory = await idb.get("userConfiguration", "projectRoot").catch(() => null);
        if (originalDirectory != null && originalDirectory.dirHandle.name != dirHandle.name) {
            const decision = confirm("The directory you have chosen is different from the one previously associated to your project. "
                + "Changing directories could be fatal to your project. Do you wish to continue ?");
            if (!decision) return;
        }
        idb.store("userConfiguration", { name: "projectRoot", dirHandle });
        this.#root = dirHandle;
    }

    static async #verifyFolderAccess(handle) {
        if (handle.name == '') return Promise.reject("User has not specified a project folder.");
        const opts = { mode: "readwrite" };
        const permission = await handle.queryPermission(opts);

        if (permission === "granted") { return Promise.resolve(permission); }
        else {
            console.log(`(${handle.name}) permissions: `, permission);
            return Promise.reject("User has not granted write access to the project folder.");
        }
    }

    static async validateRootFolder() {
        const fixtures = await fetch(Stash.fixtures).then((response) => response.json());

        const invalidDirectory = "The provided directory does not contain a project or is invalid: ";
        const path = "./Assets";

        try {
            const directories = await this.lsdir(path);
            for (const dirName of Object.keys(fixtures)) {
                const result = directories.find(dir => dir.name == dirName);
                if (result == null) return Promise.reject(invalidDirectory + path);
            }
            return Promise.resolve();
        } catch(e) {
            console.log(this.#root);
            return Promise.reject(invalidDirectory + path);
        }
    }

    static async getDirectoryAccess() {
        const { dirHandle } = await idb.get("userConfiguration", "projectRoot").catch(e => { alert("You have not specified a project folder."); return Promise.reject(e); });
        this.#root = dirHandle;
        return this.#root.requestPermission({ mode: "readwrite" })
            .then((response) => {
                if (response === "granted") {
                    return this.validateRootFolder()
                        .catch((e) => {
                            const useFixtures = confirm("Project folder is invalid. Would you like to repair it?");
                            if (useFixtures) return runFixtures();
                            else return Promise.reject(e);
                        })
                } else return Promise.reject(response)
            })
    }

    static async isReady() {
        return this.#verifyFolderAccess(this.#root)
            .then(() => true)
            .catch((msg) => { console.error(msg); return false; })
    }

    static async makeRoot(dirHandle) {
        const decision = confirm("You are about to change the root directory of your project.\nDo you wish to continue?");
        if (decision) this.#root = dirHandle;
    }

    static async ls(path) {
        const directory = await this.#resolveDir(path);
        return promiseIteratorToArray(directory.values());
    }

    static async lsdir(path) {
        const arr = await this.ls(path);
        return arr.filter(handle => handle.kind == "directory");
    }

    static async lsf(path) {
        const arr = await this.ls(path);
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

    static async mkdir(path) {
        return this.#resolveDir(path, true);
    }

    static async touch(path) {
        return this.#resolveFile(path, true);
    }

    static async put(path, byteData) {
        return this.touch(path)
            .then(() => this.write(path, byteData));
    }

    static async rm(path) {
        const targetName = this.getFileNameFromPath(path);
        const pathWithoutTarget = path.replace("/" + targetName, '');
        const handle = await this.#resolveDir(pathWithoutTarget);
        return handle.removeEntry(targetName);
    }

    static async rmdir(path) {
        const targetName = this.getFileNameFromPath(path);
        const pathWithoutTarget = path.replace("/" + targetName, '');
        return this.#resolveDir(pathWithoutTarget).then((dir) => dir.removeEntry(targetName, { recursive: true }));
    }

    /**
     * 
     * @param {string} path 
     * @returns {File}
     */
    static async getFile(path) {
        const fileHandle = await this.#resolveFile(path);
        return fileHandle.getFile();
    }

    static async copyFile(file, targetPath) {
        try {
            await this.#resolveFile(targetPath);
            console.error("A file already exists at the target destination:\nSource:", srcPath, "\nTarget:", targetPath);
            return;
        } catch (e) {
            const fileReader = new FileReader();
            return new Promise((resolve) => {
                fileReader.onloadend = (e) => { resolve(e.target.result); }
                fileReader.readAsArrayBuffer(file);
            }).then((srcData) => this.put(targetPath, srcData));
        }
    }

    static async copyFileFromPath(srcPath, targetPath) {
        try {
            await this.#resolveFile(targetPath);
            console.error("A file already exists at the target destination:\nSource:", srcPath, "\nTarget:", targetPath);
            return;
        } catch (e) {
            const srcData = await this.readFileAsByteArray(srcPath);
            return this.put(targetPath, srcData);
        }
    }

    static async moveFile(srcPath, targetPath) {
        return this.copyFileFromPath(srcPath, targetPath).then(() => this.rm(srcPath));
    }

    static async #readFileAs(path, method) {
        const fileReader = new FileReader();
        const file = await this.getFile(path);
        return new Promise((resolve) => {
            fileReader.onloadend = (e) => { resolve(e.target.result); }
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
            const a = await this.ls(path);
            for (const b of a) {
                if (b.kind == "directory") {
                    res[b.name] = await recur(path + "/" + b.name);
                } else {
                    res[b.name] = b;
                }
            }
            return res;
        }
        console.log("Debug:", await recur("."));
        console.log(nineEngineRootName + ":", await recur(nineEngineRootName));
    }
}

window.NavFS = NavFS;