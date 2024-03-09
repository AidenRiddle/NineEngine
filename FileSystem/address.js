import { Stash } from "../settings.js";
import { NavFS } from "./FileNavigator/navigatorFileSystem.js";

export class Address {
    /** @type {string} */ #raw;
    /** @type {string} */ #filePath;
    /** @type {string} */ #url;
    /** @type {string} */ #internal;

    get raw() { return this.#raw; }
    get filePath() { return this.#filePath; }
    get url() { return this.#url; }
    get internal() { return this.#internal; }

    static asFilePath(address) {
        const adr = new Address(address);
        return adr.#filePath;
    }

    static asURL(address) {
        const adr = new Address(address);
        return adr.#url;
    }

    static asInternal(address) {
        const adr = new Address(address);
        return adr.#internal;
    }

    constructor(address) {
        this.#raw = address;
        if (URL.canParse(address)) {
            this.#filePath = null;
            this.#url = address;
            this.#internal = address;
        }
        else if (address.startsWith(NavFS.coreName + '/')) {
            this.#filePath = address;
            this.#url = null;
            this.#internal = address;
        }
        else if (address.startsWith(NavFS.rootName + '/')) {
            this.#filePath = address.replace(NavFS.rootName + '/', "./");
            this.#url = null;
            this.#internal = address.replace(NavFS.rootName + '/', '');
        }
        else if (address.startsWith("./")) {
            this.#filePath = address;
            this.#url = address.replace("./", Stash.resource_root);
            this.#internal = address.replace("./", '');
        }
        else if (address.startsWith(NavFS.coreName)) {
            this.#filePath = address;
            this.#url = null;
            this.#internal = null;
        }
        else if (address.startsWith(NavFS.rootName)) {
            this.#filePath = address;
            this.#url = null;
            this.#internal = null;
        }
        else {
            this.#filePath = "./" + address;
            this.#url = Stash.resource_root + address;
            this.#internal = address;
        }
    }
}