export default class OBJLoader {

    OBJParser(byteData) {
        console.groupCollapsed("OBJ Import Log");

        byteData = new Uint8Array(byteData, 0);
        let dataAsString = "";
        for (let code of byteData) {
            dataAsString += String.fromCharCode(code);
        }

        const mesh = {
            name: "",
            gvd: [],
            tvd: [],
            ivd: [],
        }

        const meshFunction = {
            texVD: [],
            indexVD: [],
            o: function (tokens) { mesh.name = tokens[1]; },
            v: function (tokens) { for (let i = 1; i < tokens.length; i++) { mesh.gvd.push(Number.parseFloat(tokens[i])); } },
            vt: function (tokens) { for (let i = 1; i < tokens.length; i++) { this.texVD.push(Number.parseFloat(tokens[i])); } },
            f: function (tokens) {
                for (let i = 1; i < tokens.length; i++) {
                    const t = tokens[i].split('/');
                    mesh.ivd.push(Number.parseInt(t[0]) - 1);
                    this.indexVD.push(Number.parseInt(t[1]) - 1);
                }
            },
            solve: function () {
                console.log(this.indexVD);
                for (let i = 0; i < this.indexVD.length; i++) {
                    mesh.tvd[mesh.ivd[i] * 2] = this.texVD[this.indexVD[i] * 2];
                    mesh.tvd[(mesh.ivd[i] * 2) + 1] = this.texVD[(this.indexVD[i] * 2) + 1];
                }
            }
        }

        const stream = dataAsString.split('\n');
        for (const instructions of stream) {
            const tokens = instructions.trim().split(/\s+/);
            if (tokens[0] == '#') { continue; }
            if (meshFunction[tokens[0]]) { meshFunction[tokens[0]](tokens); }
            else { console.log("Unhandled token: ", tokens[0], tokens[0].charCodeAt(0)); }
        }
        meshFunction.solve();

        console.log("Import result: ", mesh);
        console.groupEnd();

        return mesh;
    }
}