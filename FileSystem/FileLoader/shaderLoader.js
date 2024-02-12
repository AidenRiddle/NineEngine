export default class ShaderLoader {
    extract = (file) => {
        return new Promise((resolve) => {
            const fileReader = new FileReader();
            fileReader.onloadend = (e) => { resolve(e.target.result); }
            fileReader.readAsText(file);
        })
    }
}