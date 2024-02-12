export class DataStorage {
    static Add(key, value) { this.storage.set(key, value); }

    static Get(name) { return this.storage.get(name); }

    static Exists(name) { return this.storage.has(name); }

    static keys() { return this.storage.keys(); }

    static values() { return this.storage.values(); }

    static pack() { return Object.fromEntries(this.storage); }

    static debug() { return Object.fromEntries(this.storage); }
}