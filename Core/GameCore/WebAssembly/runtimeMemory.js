import { System } from "../../../settings.js";

export class RuntimeMemory extends WebAssembly.Memory {
    #dataView;

    constructor(memoryDescriptor = {
        initial: System.runtime_initial_memory,
        maximum: System.runtime_maximum_memory,
        shared: true
    }) {
        super(memoryDescriptor);
        this.#dataView = new DataView(this.buffer);
    }

    #checkAddress(address) { if (address == 0) { console.error("Null pointed address."); return; } }

    writeString(address, str) {
        this.#checkAddress(address);
        for (var i = 0; i < str.length; i++) {
            this.#dataView.setUint16(address + (i*2), str.charCodeAt(i), true);
        }
    }

    readByte(address) {
        this.#checkAddress(address);
        return this.#dataView.getUint8(address, true);
    }

    readInt(address) {
        this.#checkAddress(address);
        return this.#dataView.getInt32(address, true);
    }

    readFloat(address) {
        this.#checkAddress(address);
        return this.#dataView.getFloat32(address, true);
    }

    readString(address) {
        this.#checkAddress(address);
        let strLength;
        try {
            strLength = this.#dataView.getUint32(address - 4, true) >> 1;
        } catch (e) {
            throw new Error(e + " (Offset: " + address + ")");
        }
        let str = "";
        while (strLength > 0) {
            const tempLen = strLength > 1024 ? 1024 : strLength;
            str += String.fromCharCode(...new Uint16Array(this.buffer, address, tempLen));
            strLength -= tempLen;
        }
        return str;
    }

    getRtId = (address) => {
        this.#checkAddress(address);
        try {
            return this.#dataView.getUint32(address - 8, true);
        } catch (e) {
            throw new Error(e + " (Offset: " + address + ")");
        }
    }

    getRtSize = (address) => {
        this.#checkAddress(address);
        try {
            return this.#dataView.getUint32(address - 4, true);
        } catch (e) {
            throw new Error(e + " (Offset: " + address + ")");
        }
    }
}