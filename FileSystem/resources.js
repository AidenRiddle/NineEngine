import { Stash } from "../settings.js";
import GEInstanceDB from "./geInstanceDB.js";
import DataBaseSchema from "./geInstanceDBSchema.js";
import Loader from "./loader.js";
import { NavFS } from "./Navigator/navigatorFileSystem.js";

class DiskResources {
    /** @param {string} fileRelativePath */
    loadFileFromDisk(fileRelativePath) {
        return NavFS.getFile(fileRelativePath)
            .then((file) => {
                console.log("Loading from disk!!!"); return file;
            });
    }
}

class CachedResources {
    /** @type {GEInstanceDB} */
    #geInstanceDB;
    #schema;

    constructor(geInstanceDB, schema) {
        this.#geInstanceDB = geInstanceDB;
        this.#schema = schema;
    }

    loadFileFromCache(fileName) {
        return this.#geInstanceDB.get(this.#schema.resources.storeName, fileName);
    }

    writeToCache(file) {
        return this.#geInstanceDB.store(this.#schema.resources.storeName, file);
    }

    deleteFromCache(fileName) {
        return this.#geInstanceDB.delete(this.#schema.resources.storeName, fileName);
    }
}

class WebResources {
    #root;
    #error_cors_texture;

    constructor(baseURL) {
        this.#root = baseURL;
        this.#error_cors_texture = baseURL + "Textures/error_cors.png";
    }

    readChunk(readableStream) {
        const reader = readableStream.getReader();
        return reader.read().then(({ value }) => {
            reader.releaseLock();
            return value;
        })
    }

    readFullStream(readableStream) {
        const reader = readableStream.getReader();
        const result = [];
        let totalLength = 0;
        function recur() {
            return reader.read().then(({ done, value }) => {      // 'value' is guaranteed to be a byte array (Uint8Array)
                if (done) return result;
                totalLength += value.length;
                result.push(value);
                return recur();
            })
        }
        return recur();
    }

    #getFileData(fileRelativePath) {
        const address = (fileRelativePath.startsWith("http")) ? fileRelativePath : this.#root + fileRelativePath;
        return fetch(address)
            .catch((e) => {
                console.log("Fetch failed. Using CORS proxy for resource:", address);
                return fetch("http://api.allorigins.win/raw?url=" + encodeURIComponent(address));
            })
            .then((response) => {
                if (!response.ok) { console.error(response); throw new Error("Bad response (" + fileRelativePath + ")") };
                const fileTypeConverter = {
                    "application/json; charset=UTF-8": "json",
                    "model/gltf-binary": "glb",
                    "image/jpeg": "jpg",
                    "image/png": "png",
                    "image/webp": "webp",
                    "video/mp2t": "ts",
                    "application/octet-stream": "glsl"
                }
                const mimeType = response.headers.get("Content-Type");
                if (!fileTypeConverter[mimeType]) throw new Error("Unknow MIME type (" + fileRelativePath + "): " + mimeType);
                const fileType = fileTypeConverter[response.headers.get("Content-Type")];
                return this.readFullStream(response.body)
                    .then((data) => { return { fileType, fileData: data } })
            })
    }

    /**
     * @param {string} fileRelativePath 
     */
    loadFileFromWeb(fileRelativePath) {
        return this.#getFileData(fileRelativePath)
            .then((payload) => new File(payload.fileData, fileRelativePath, { type: payload.fileType }))
    }
}

export default class Resources {
    static #disk;
    static #cache;
    static #web;

    /** @type Loader */
    static #loader;

    static #tracker = new Set();    // Tracks which resources have already been loaded and cached to the disk

    static #defaultFetchOptions = { newFileName: undefined, cacheResult: true, hardFetch: false };

    /**
     * 
     * @param {GEInstanceDB} geInstanceDB 
     * @returns 
     */
    static open(geInstanceDB) {
        return geInstanceDB.getInstance("geInstanceDB")
            .then(() => geInstanceDB.getKeys("resources"))
            .then(
                (keys) => { console.groupCollapsed("Found cached Resources ..."); console.log(keys.join("\n")); console.groupEnd(); for (const key of keys) { this.#tracker.add(key); } },
                (rejectMessage) => { console.log(rejectMessage); }
            )
            .then(() => {
                this.fetchRaw = this.#fetchRawImpl;
                this.fetchAsText = this.#fetchAsTextImpl;
                this.load = this.#loadImpl;
                this.loadAll = this.#loadAllImpl;
                this.plant = this.#plantImpl;
                this.uncache = this.#uncacheImpl;

                this.#disk = new DiskResources();
                this.#cache = new CachedResources(geInstanceDB, DataBaseSchema);
                this.#web = new WebResources(Stash.resource_root);

                this.#loader = new Loader();
            });
    }

    static #notInitialized() { throw new Error("Module (Resources) must be started before this function can be called.") }

    // --- Function definitions updated after the 'Start' method is called ---
    static fetchRaw(fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) { this.#notInitialized(); }
    static fetchAsText(fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) { this.#notInitialized(); }
    static load(fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) { this.#notInitialized(); }
    static loadAll(arrayOfFileRelativePaths, options = { cacheResult: true, hardFetch: false }) { this.#notInitialized(); }
    static plant(file, pathWithName) { this.#notInitialized(); }
    static uncache(pathWithName) { this.#notInitialized(); }
    // -----------------------------------------------------------------------

    static #stash(file) {
        this.#tracker.add(file.name);
        this.#cache.writeToCache(file);
    }

    static #fetchRawImpl = (fileRelativePath, options = this.#defaultFetchOptions) => {
        options = Object.assign({}, this.#defaultFetchOptions, options);
        const fileName = options.newFileName ?? fileRelativePath;
        if (!options.hardFetch && this.#tracker.has(fileName)) {
            return this.#cache.loadFileFromCache(fileName)
        }
        return this.#disk.loadFileFromDisk(fileRelativePath)
            .catch(() => this.#web.loadFileFromWeb(fileRelativePath))
            .then((file) => {
                file = new File([file], fileName);
                if (options.cacheResult) this.#stash(file);
                return file;
            })
            .catch((e) => console.error(e, fileRelativePath, fileName))
    }

    static #fetchAsTextImpl = (fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) => {
        return this.fetchRaw(fileRelativePath, options)
            .then((file) => {
                const fileReader = new FileReader();
                return new Promise((resolve, reject) => {
                    fileReader.onloadend = (e) => { console.log(file.name, e); resolve(e.target.result); }
                    fileReader.onerror = (e) => { console.log("Rejected:", file.name, e); reject(e.target); }
                    fileReader.readAsText(file);
                });
            })
    }

    static #loadImpl = (fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) => {
        return this.fetchRaw(fileRelativePath, options)
            .then((file) => this.#loader.unpackFile(file))
    }

    static #loadAllImpl = (fileMap, options = { cacheResult: true, hardFetch: false }) => {
        const promises = [];
        for (const frp in fileMap) {
            promises.push(this.load(fileMap[frp], { newFileName: frp, ...options }));
        }
        return Promise.all(promises)
    }

    static #plantImpl = (file, pathWithName) => {
        file = new File([file], pathWithName);
        return this.#cache.writeToCache(file)
            .then(() => this.#tracker.add(pathWithName))
    }

    static #uncacheImpl = (pathWithName) => {
        if (!this.#tracker.has(pathWithName)) return;

        return this.#cache.deleteFromCache(pathWithName)
            .then(() => this.#tracker.delete(pathWithName));
    }

}