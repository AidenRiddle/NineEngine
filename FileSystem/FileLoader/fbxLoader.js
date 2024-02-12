export default class FBXLoader {

    /** 
     * The FBX parser doesn't work.
     * FBX is a proprietary file format and there is no public documentation.
     * The only documentation out there to get you started is here (https://code.blender.org/2013/08/fbx-binary-file-format-specification).
     * However after following the specifications listed on this site, there seems to be an issue with the way compressed arrays are packed
     * into an FBX file.
     * When a compressed array is found, both lengths listed for the array and compressed array seem to be way off target. Numerous attempts
     * to parse these have ended in a distorted byte offset, leading to scrambled data. What's more is that the compressed array length is
     * almost always greater than the normal array length. Unfortunately, those lengths could also be the result of misinterpreted data.
    */
    FBXParser(byteData) {
        console.group("FBX Import Log");

        console.log(byteData);
        const view = new DataView(byteData);


        const header = ["", "", ""];
        const h1 = new Uint8Array(byteData, 0, 20);
        const h2 = new Uint8Array(byteData, 21, 2);
        const h3 = view.getUint32(23, true);

        for (let code of h1) { header[0] += String.fromCharCode(code); }
        for (let code of h2) { header[1] += String.fromCharCode(code); }
        header[2] = h3.toString();
        console.log("Header:", header);

        const nodes = [];

        function byteParser(offset) {
            const endOffset = view.getInt32(offset, true); offset += 4;
            const numProperties = view.getInt32(offset, true); offset += 4;
            const propertyListLen = view.getInt32(offset, true); offset += 4;
            const nameLen = view.getUint8(offset); offset += 1;
            const nameBytes = new Uint8Array(byteData, offset, nameLen);
            let name = "";
            for (let code of nameBytes) { name += String.fromCharCode(code); }
            const props = [];

            const dataParser = {
                offset: 0,
                isCompressed: false,

                //Primitives
                Y() { const res = view.getInt16(this.offset, true); this.offset += 2; return res; },
                C() { const res = view.getUint8(this.offset) == 1; this.offset += 1; return res; },
                I() { const res = view.getInt32(this.offset, true); this.offset += 4; return res; },
                F() { const res = view.getFloat32(this.offset, true); this.offset += 4; return res; },
                D() { const res = view.getFloat64(this.offset, true); this.offset += 8; return res; },
                L() { const res = view.getBigInt64(this.offset, true); this.offset += 8; return res; },

                //Arrays
                arrayParser(type) {
                    const arrayLength = view.getUint32(this.offset, true); this.offset += 4;
                    const encoding = view.getUint32(this.offset, true); this.offset += 4;
                    const compressedLength = view.getUint32(this.offset, true); this.offset += 4;
                    if (encoding == 0) { if (arrayLength + this.offset > endOffset) { console.warn("Array length exceeding node block.", endOffset, this.offset, arrayLength) } return arrayLength; }
                    if (encoding == 1) {
                        console.warn("Extracting compressed array.", type, endOffset, this.offset, compressedLength, arrayLength);
                        this.isCompressed = true;
                        return compressedLength;
                    }
                },

                f() { const res = []; const len = this.arrayParser("f"); for (let i = 0; i < len; i++) { res.push(view.getFloat32(this.offset, true)); this.offset += 4; }; return res; },
                d() { const res = []; const len = this.arrayParser("d"); for (let i = 0; i < len; i++) { res.push(view.getFloat64(this.offset, true)); this.offset += 8; }; return res; },
                l() { const res = []; const len = this.arrayParser("l"); for (let i = 0; i < len; i++) { res.push(view.getBigInt64(this.offset, true)); this.offset += 8; }; return res; },
                i() { const res = []; const len = this.arrayParser("i"); for (let i = 0; i < len; i++) { res.push(view.getInt32(this.offset, true)); this.offset += 4; }; return res; },
                b() { const res = []; const len = this.arrayParser("b"); for (let i = 0; i < len; i++) { res.push(view.getUint8(this.offset)); this.offset += 1; }; return res; },

                //String / Raw binary data
                stringParser() {
                    const len = view.getUint32(this.offset, true); this.offset += 4;
                    return len;
                },
                S() {
                    let res = "";
                    const len = this.stringParser();
                    for (let i = 0; i < len; i++) { res += (String.fromCharCode(view.getUint8(this.offset))); this.offset += 1; };
                    return res;
                },
                R() {
                    const res = [];
                    const len = this.stringParser();
                    for (let i = 0; i < len; i++) { res.push(view.getUint8(this.offset)); this.offset += 1; };
                    return res;
                },
            }

            dataParser.offset = offset + nameLen;
            for (let i = 0; i < numProperties; i++) {
                const prop = { type: String.fromCharCode(view.getUint8(dataParser.offset)) };
                dataParser.offset += 1;
                if (!dataParser[prop.type]) {
                    throw new Error("Reading type " + prop.type)
                };
                prop.data = dataParser[prop.type]();
                if (dataParser.isCompressed) { prop.ISCOMPRESSED = true; dataParser.isCompressed = false; }
                props.push(prop);
            }

            const res = {};
            res[name] = {
                endOffset,
                numProperties,
                propertyListLen,
                nameLen,
                name,
                props,
                children: []
            }

            offset = dataParser.offset;
            //console.log("Bytes left:", endOffset - offset);
            while (offset < endOffset) {
                const temp = byteParser(offset);
                offset = temp.finalOffset;
                res?.children?.push(temp.res);
            }

            if (offset > endOffset && endOffset != 0) { console.warn("Resetting offset."); offset = endOffset; }

            //console.log("Body:", res);
            console.groupEnd();
            return { finalOffset: offset, res };
        }
        let temp = { finalOffset: 27 };
        while (temp.finalOffset < byteData.byteLength) {
            temp = byteParser(temp.finalOffset);
            console.log(temp.res);
            nodes.push(temp.res);
        }
        console.log("FBX result:", nodes);
    }
}