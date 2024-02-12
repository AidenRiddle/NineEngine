import TexturePainter from "../../Core/GECore/Util/texturePainter.js";

export default class ImageLoader {
    extract = (file) => {
        return TexturePainter.DrawLocalImageTexture(file);
    }
}