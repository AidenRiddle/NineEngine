import { DataBaseSchema } from "../settings.js";

export default class GEInstanceDB {
    /** @type {IDBDatabase} */
    #database;

    getInstance(name, version = 3) {
        return new Promise((resolve, reject) => {
            const creationRequest = window.indexedDB.open(name, version);
            creationRequest.onsuccess = (event) => {
                this.#database = event.target.result;
                resolve(this.#database);
            }
            creationRequest.onupgradeneeded = (event) => {
                console.log("No database was found. Creating a new one ...");
                for (const objStore of Object.values(DataBaseSchema)) {
                    event.target.result.createObjectStore(objStore.storeName, { keyPath: objStore.key })
                }
            }
            creationRequest.onerror = (event) => {
                console.error("Failed to create DB", event.target);
                reject(event.target);
            };
        });
    }

    store(objStore, data) {
        return new Promise((resolve, reject) => {
            const request = this.#database.transaction(objStore, "readwrite")
                .objectStore(objStore)
                .put(data);

            request.onsuccess = (event) => {
                (event.target.result) ?
                    resolve(event.target.result) :
                    reject(`Unable to write (${data}) to store (${objStore}).`);
            };
            request.onerror = (e) => { console.error(e); throw new Error(e.target.result); }
        });
    }

    get(objStore, keyValue) {
        return new Promise((resolve, reject) => {
            const request = this.#database.transaction(objStore, "readonly")
                .objectStore(objStore)
                .get(keyValue);

            request.onsuccess = (event) => {
                (event.target.result) ?
                    resolve(event.target.result) :
                    reject(`Key (${keyValue}) not found in store (${objStore}).`);
            };
            request.onerror = (e) => { console.error(e); throw new Error(e.target.result); }
        });
    }

    getKeys(objStore) {
        return new Promise((resolve, reject) => {
            const request = this.#database.transaction(objStore, "readonly")
                .objectStore(objStore)
                .getAllKeys();

            request.onsuccess = (event) => {
                (event.target.result.length > 0) ?
                    resolve(event.target.result) :
                    reject(`No cached Resources found.`);
            };
            request.onerror = (e) => { console.error(e); throw new Error(e.target.result); }
        });
    }

    delete(objStore, keyValue) {
        return new Promise((resolve, reject) => {
            const request = this.#database.transaction(objStore, "readwrite")
                .objectStore(objStore)
                .delete(keyValue);

            request.onsuccess = (event) => {
                //console.log("DELETE", keyValue, event.target.result);
                (event.target.result) ?
                    resolve(event.target.result) :
                    reject(`Key (${keyValue}) not found in store (${objStore}).`);
            };
            request.onerror = (e) => { console.error(e); throw new Error(e.target.result); }
        });
    }
}