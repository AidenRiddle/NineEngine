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
                    console.log(objStore.storeName);
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
            const store = this.#database.transaction(objStore, "readwrite").objectStore(objStore);
            store.put(data).onsuccess = (event) => {
                //console.log("PUT", objStore, event.target.result);
                (event.target.result) ?
                    resolve(event.target.result) :
                    reject(`Unable to write (${data}) to store (${objStore}).`);
            };
        });
    }

    get(objStore, keyValue) {
        return new Promise((resolve, reject) => {
            const store = this.#database.transaction(objStore, "readonly").objectStore(objStore);
            store.get(keyValue).onsuccess = (event) => {
                //console.log("GET", keyValue, event.target.result);
                (event.target.result) ?
                    resolve(event.target.result) :
                    reject(`Key (${keyValue}) not found in store (${objStore}).`);
            };
        });
    }

    getKeys(objStore) {
        return new Promise((resolve, reject) => {
            const store = this.#database.transaction(objStore, "readonly").objectStore(objStore);
            store.getAllKeys().onsuccess = (event) => {
                (event.target.result.length > 0) ?
                    resolve(event.target.result) :
                    reject(`No cached Resources found.`);
            };
        });
    }

    delete(objStore, keyValue) {
        return new Promise((resolve, reject) => {
            this.#database.transaction(objStore, "readwrite")
                .objectStore(objStore)
                .delete(keyValue)
                .onsuccess = (event) => {
                    //console.log("DELETE", keyValue, event.target.result);
                    (event.target.result) ?
                        resolve(event.target.result) :
                        reject(`Key (${keyValue}) not found in store (${objStore}).`);
                };
        });
    }
}