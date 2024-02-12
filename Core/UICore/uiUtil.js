function create(elName, options) {
    const el = document.createElement(elName);

    for (const key in options) {
        if (key == "children") continue;
        if (key == "style") continue;
        el[key] = options[key];
    }

    for (const key in options?.style) {
        el.style[key] = options.style[key];
    }

    if (options?.children) { el.replaceChildren(...options.children); }

    return el;
}

export function _div_(options) { return create("div", options); }
export function _img_(options) { return create("img", options); }
export function _p_(options) { return create("p", options); }
export function _b_(options) { return create("b", options); }
export function _h1_(options) { return create("h1", options); }
export function _h2_(options) { return create("h2", options); }
export function _h3_(options) { return create("h3", options); }
export function _input_(options) { return create("input", options); }
export function _textArea_(options) { return create("textarea", options); }
export function _button_(options) { return create("button", options); }

export function makeDraggableReciever(domElement, onDropHandler) {
    domElement.ondragenter = (e) => e.preventDefault();
    domElement.ondragover = (e) => e.preventDefault();
    domElement.ondrop = (e) => {
        e.preventDefault();
        for (const item of e.dataTransfer.items) {
            if (item.kind != "string") console.error("Unsupported Drop item:", item);
            item.getAsString((str) => {
                console.log("Dropped:", str);
                onDropHandler(str);
            });
        }
    }
    return domElement;
}

export function makeDraggable(domElement, dataToDrag) {
    if (typeof dataToDrag != 'string') console.error("Drag data type is not a string.", dataToDrag);
    domElement.draggable = true;
    domElement.ondragstart = (e) => {
        e.dataTransfer.setData("text/string", dataToDrag);
    }
    return domElement;
}

export function notImplemented() { alert("Not implemented."); }
