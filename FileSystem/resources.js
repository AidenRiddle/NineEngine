import { AssetType, DataBaseSchema, Stash } from "../settings.js";
import GEInstanceDB from "./geInstanceDB.js";
import Loader from "./loader.js";
import { NavFS } from "./FileNavigator/navigatorFileSystem.js";

class DiskResources {
    /** @param {string} fileRelativePath */
    loadFileFromDisk(fileRelativePath) {
        return NavFS.getFile(fileRelativePath)
            .then((file) => {
                console.log("Loading from disk:", fileRelativePath);
                return file;
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
    #error_404_texture;
    #error_unknown_texture;

    constructor(baseURL) {
        this.#root = baseURL;
        this.#error_cors_texture = this.#root + "Textures/error_cors.jpg";
        this.#error_404_texture = this.#root + "Textures/error_404.jpg";
        this.#error_unknown_texture = this.#root + "Textures/error_unknown.jpg";
    }

    #processFetchResponse(response) {
        return response.blob();
    }

    /**
     * @param {Response} response 
     */
    #processBadResponse(address, response) {
        console.log("Bad response (" + address + "):", response);

        if (AssetType.isImage(address)) {
            if (response.status == 404) {
                return Resources.fetchRaw(this.#error_404_texture, { newFileName: address, cacheResult: false });
            } else {
                return Resources.fetchRaw(this.#error_unknown_texture, { newFileName: address, cacheResult: false });
            }
        }
        throw new TypeError("Fetch error (" + address + ")", { cause: response });
    }

    /**
     * @param {TypeError} e 
     */
    #processFetchError(address, e) {
        const err = new TypeError("Fetch error (" + address + ")", { cause: e });
        console.warn(err);

        // console.log("Fetch failed with CORS error. Using proxy for resource:", address);
        // return this.#fetchFileData("http://api.allorigins.win/raw?url=" + encodeURIComponent(address));

        if (AssetType.isImage(address) || address.startsWith("http")) {
            return fetch(this.#error_unknown_texture);
        }
        throw err;
    }

    #fetchFileData(fileRelativePath) {
        const address = (fileRelativePath.startsWith("http")) ? fileRelativePath : this.#root + fileRelativePath;

        return fetch(address)
            .catch(e => this.#processFetchError(address, e))
            .then(response => response.ok
                ? this.#processFetchResponse(response)
                : this.#processBadResponse(address, response)
            );
    }

    /**
     * @param {ReadableStream} readableStream 
     */
    readFullStream(readableStream) {
        const reader = readableStream.getReader();
        const result = [];
        return reader.read().then(function pump({ done, value }) {      // 'value' is guaranteed to be a byte array (Uint8Array)
            if (done) { reader.releaseLock(); return result; }
            result.push(value);
            return reader.read().then(pump);
        });
    }

    /**
     * @param {string} fileRelativePath 
     */
    loadFileFromWeb(fileRelativePath) {
        return this.#fetchFileData(fileRelativePath);
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
                this.fetchAsJson = this.#fetchAsJsonImpl;
                this.load = this.#loadImpl;
                this.loadAll = this.#loadAllImpl;
                this.plant = this.#plantImpl;
                this.uncache = this.#uncacheImpl;
                this.rename = this.#renameImpl;

                this.#disk = new DiskResources();
                this.#cache = new CachedResources(geInstanceDB, DataBaseSchema);
                this.#web = new WebResources(Stash.resource_root);

                this.#loader = new Loader();
            });
    }

    static #notInitialized() { return Promise.reject("Module (Resources) must be started before this function can be called."); }

    // --- Function definitions updated after the 'Start' method is called ---
    static fetchRaw(fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) { return this.#notInitialized(); }
    static fetchAsText(fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) { return this.#notInitialized(); }
    static fetchAsJson(fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) { return this.#notInitialized(); }
    static load(fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) { return this.#notInitialized(); }
    static loadAll(arrayOfFileRelativePaths, options = { cacheResult: true, hardFetch: false }) { return this.#notInitialized(); }
    static plant(file, pathWithName) { return this.#notInitialized(); }
    static uncache(pathWithName) { return this.#notInitialized(); }
    static rename(oldPathWithName, newPathWithName) { return this.#notInitialized(); }
    // -----------------------------------------------------------------------

    static #stash(file) {
        this.#tracker.add(file.name);
        this.#cache.writeToCache(file);
    }

    static #fetchRawImpl = (fileRelativePath, options = this.#defaultFetchOptions) => {
        options = Object.assign({}, this.#defaultFetchOptions, options);
        const fileName = options.newFileName ?? fileRelativePath;
        if (!options.hardFetch && this.#tracker.has(fileName)) {
            return this.#cache.loadFileFromCache(fileName);
        }
        return this.#disk.loadFileFromDisk(fileRelativePath)
            .catch(() => this.#web.loadFileFromWeb(fileRelativePath))
            .then((file) => {
                const renamedFile = new File([file], fileName, { type: file.type });
                if (options.cacheResult) this.#stash(renamedFile);
                return renamedFile;
            })
    }

    static #fetchAsTextImpl = (fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) => {
        return this.fetchRaw(fileRelativePath, options)
            .then((file) => file.text())
    }

    static #fetchAsJsonImpl = (fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) => {
        return this.fetchAsText(fileRelativePath, options)
            .then((jsonText) => JSON.parse(jsonText))
    }

    static #loadImpl = (fileRelativePath, options = { newFileName: undefined, cacheResult: true, hardFetch: false }) => {
        return this.fetchRaw(fileRelativePath, options)
            .then((file) => this.#loader.unpackFile(file))
    }

    static #loadAllImpl = (fileMap, options = { cacheResult: true, hardFetch: false }) => {
        const promises = [];
        for (const [fileRelativePath, fetchPath] of fileMap.entries()) {
            promises.push(this.load(fetchPath, { newFileName: fileRelativePath, ...options }));
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
            .finally(() => this.#tracker.delete(pathWithName));
    }

    static #renameImpl = (oldPathWithName, newPathWithName) => {
        return this.fetchRaw(oldPathWithName, { newFileName: newPathWithName, cacheResult: true })
            .then(() => this.uncache(oldPathWithName));
    }

}