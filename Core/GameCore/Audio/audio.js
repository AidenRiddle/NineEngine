// https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

class Audio {
    static load(src) {
        return new Promise((resolve) => {
            const audio = new Audio(src);
            audio.addEventListener("canplaythrough", (e) => { resolve(audio); });
        })
    }
}