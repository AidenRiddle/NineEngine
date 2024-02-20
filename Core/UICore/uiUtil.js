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
