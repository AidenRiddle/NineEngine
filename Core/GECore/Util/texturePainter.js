import { Defaults, ColorUtils, Color } from "../Constants/constants.js";
import { TexturePainterSettings } from "../../../settings.js";

export default class TexturePainter {
    static #canvas = (() => {   // Offscreen canvas ... different canvas from the global one defined in 'app.js'
        const c = document.createElement("canvas");
        c.style.position = "absolute";
        c.style.left = "0px";
        c.style.top = "0px";
        return c;
    })();

    /** @type {CanvasRenderingContext2D} */
    static #ctx = this.#canvas.getContext('2d', TexturePainterSettings.contextAttributes);
    static #font = "monospace";

    static get principalColorTextureName() {
        return "PrincipalColors";
    }

    static get letterAtlasTextureName() {
        return "LetterAtlas";
    }

    static get Font() {
        return Defaults.font_size + "px " + this.#font;
    }

    static get letterBoundingBoxWidth() {
        return (55 / 100) * Defaults.font_size;
    }

    static get letterBoundingBoxHeight() {
        return (105 / 100) * Defaults.font_size;
    }

    static get letterBaselineHeight() {
        return (80 / 100) * Defaults.font_size;
    }

    static #DrawRectangle(color, width, height, offsetX = 0, offsetY = 0) {
        this.#ctx.fillStyle = ColorUtils.colorToRGBAString(color);
        this.#ctx.fillRect(offsetX, offsetY, width, height);
    }

    static DrawMessageTexture = (message) => {
        const strArr = message.split('\n');
        const diff = this.letterBoundingBoxHeight - this.letterBaselineHeight;

        //Set texture size
        this.#canvas.width = 0;
        for (let str of strArr) {
            this.#canvas.width = (str.length > this.#canvas.width) ? str.length : this.#canvas.width;
        }
        this.#canvas.width *= this.letterBoundingBoxWidth;
        this.#canvas.height = strArr.length * this.letterBoundingBoxHeight;

        //WebGL minimum specs indicates that not all browsers support texture sizes bigger than 4096.
        if (this.#canvas.width > 4096) console.warn("Creating a texture bigger than common requirements: " + message);
        if (this.#canvas.height > 4096) console.warn("Creating a texture bigger than common requirements: " + message);

        //Reset the canvas image
        this.#DrawRectangle([0, 0, 0, 0], this.#canvas.width, this.#canvas.height);

        //Draw the message
        this.#ctx.font = this.Font;
        this.#ctx.fillStyle = ColorUtils.colorToRGBAString(Defaults.font_color);
        let i = 1;
        for (const str of strArr) {
            this.#ctx.fillText(str, 0, (this.letterBoundingBoxHeight * i) - diff);
            i++;
        }

        return this.#ctx.getImageData(0, 0, this.#canvas.width, this.#canvas.height);
    }

    static DrawPrincipalColorTextures = () => {
        let i = 0;
        for (let color in Color) {
            this.#DrawRectangle(Color[color], 1, 1, i, 0);
            i++;
        }

        return this.#ctx.getImageData(0, 0, i, 1);
    }

    static DrawLocalImageTexture = (img) => {
        return createImageBitmap(img).then((bitmap) => {
            //WebGL minimum specs indicates that not all browsers support texture sizes bigger than 4096.
            if (bitmap.width > 4096) throw new Error("Creating a texture bigger than common requirements: ");
            else if (bitmap.height > 4096) throw new Error("Creating a texture bigger than common requirements: ");

            //Set texture size
            [this.#canvas.width, this.#canvas.height] = [bitmap.width, bitmap.height];

            //Reset the canvas image
            this.#ctx.drawImage(bitmap, 0, 0);
            return this.#ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        })
    }

    static DrawImageTexture = (imgUrl) => {
        return new Promise((resolve) => {
            console.log("Downloading texture (" + imgUrl + ")");
            const img = new Image();
            img.src = imgUrl;
            img.crossOrigin = "";
            img.onload = () => {
                this.DrawLocalImageTexture(img)
                    .then((imgData) => resolve(imgData))
                    .catch((e) => { throw e + imgUrl; });
            };
        })
    }

    static debug = (img) => {
        const fileReader = new FileReader();
        fileReader.onloadend = (e) => {
            const base64 = btoa(e.target.result);
            const image = new Image();
            image.src = "data:image/png;base64," + base64;
    
            document.body.appendChild(image);
        }
        fileReader.readAsBinaryString(img);
    }
}