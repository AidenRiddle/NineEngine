import { GuiContext, GuiHandle } from "./gui.js";

const divStyle = {
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    backgroundColor: "dimgrey",
    width: "150px",
}

const basePadding = '5px';
const sidePadding = '7px';
const pStyle = {
    margin: "0px",
    padding: basePadding,
    paddingLeft: sidePadding,
    paddingRight: sidePadding,
}

const contextMenuTester = {
    "Alien": () => { console.log("Clicked: Alien"); },
    "Animals": {
        "Dog": () => { console.log("Clicked: Dog"); },
        "Cat": () => { console.log("Clicked: Cat"); },
        "Dragon": () => { console.log("Clicked: Dragon"); },
        "Chicken": () => { console.log("Clicked: Chicken"); },
        "Cow": () => { console.log("Clicked: Cow"); },
        "Pig": () => { console.log("Clicked: Pig"); },
    },
    "Plants": {
        "Nuts": {
            "Peanuts": () => { console.log("Clicked: Peanuts"); },
            "Cashews": () => { console.log("Clicked: Cashews"); },
            "Walnuts": () => { console.log("Clicked: Walnuts"); },
            "Hazelnuts": () => { console.log("Clicked: Hazelnuts"); },
        },
        "Flowers": {
            "Roses": () => { console.log("Clicked: Roses"); },
            "Lillies": () => { console.log("Clicked: Lillies"); },
            "Lilac": () => { console.log("Clicked: Lilac"); },
        },
        "Fruits": {
            "Banana": () => { console.log("Clicked: Banana"); },
            "Apple": () => { console.log("Clicked: Apple"); },
            "Orange": () => { console.log("Clicked: Orange"); },
            "Pear": () => { console.log("Clicked: Pear"); },
            "Grape": () => { console.log("Clicked: Grape"); },
            "Tomato": () => { console.log("Clicked: Tomato"); },
        },
        "Vegetables": {
            "Carrot": () => { console.log("Clicked: Carrot"); },
            "Broccoli": () => { console.log("Clicked: Broccoli"); },
            "Potato": () => { console.log("Clicked: Potato"); },
            "Spinach": () => { console.log("Clicked: Spinach"); },
        },
        "Trees": {
            "Oak": () => { console.log("Clicked: Oak"); },
            "Willow": () => { console.log("Clicked: Willow"); },
            "Baobab": () => { console.log("Clicked: Baobab"); },
            "Palm": () => { console.log("Clicked: Palm"); },
            "Christmas": () => { console.log("Clicked: Christmas"); },
        }
    },
}

class $ContextMenuItem extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const title = gui.state("title");
        const handler = gui.state("handler");
        root.onmouseover = function (e) { e.target.style.background = "darkgrey"; };
        root.onmouseout = function (e) { e.target.style.background = "none"; };
        root.onclick = handler;
        root.append(gui.node("p", p => {
            p.innerText = title;
            Object.assign(p.style, pStyle);
        }))
    }
}

class $ContextMenuParentItem extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        const showSubMenu = gui.state("showSubMenu");
        const title = gui.state("title");
        const subMenu = gui.state("subMenu");

        root.id = gui.state("id");
        root.style.display = "flex";
        root.onmouseover = function (e) { e.target.style.background = "darkgrey"; };
        root.onmouseout = function (e) { e.target.style.background = "none"; };
        const item = gui.node("p", p => {
            p.innerText = title;
            p.style.width = "100%";
            Object.assign(p.style, pStyle);
        })
        root.append(item);

        if (showSubMenu) {
            const subContextMenu = new $ContextMenuItemList({
                visible: true,
                x: "100%",
                y: "initial",
                itemMap: subMenu,
                rootGuiHandle: gui.state("rootGuiHandle")
            })
            root.append(gui.getNode(subContextMenu));
        }
    }
}

class $ContextMenuItemList extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     */
    static builder(gui, root) {
        Object.assign(root.style, divStyle);
        root.style.display = "flex";
        root.style.left = gui.state("x");
        root.style.top = gui.state("y");

        /** @type {GuiHandle} */
        let activeParentItem = null;
        const listOfParentItems = new Map();
        const parentId = "contextMenuParentItem";
        root.onmouseover = (e) => {
            e.stopPropagation();

            if (listOfParentItems.has(e.target.textContent)) {
                if (activeParentItem == listOfParentItems.get(e.target.textContent)) return;

                activeParentItem?.set("showSubMenu", false);
                activeParentItem = listOfParentItems.get(e.target.textContent);
                activeParentItem.set("showSubMenu", true);
            } else {
                activeParentItem?.set("showSubMenu", false);
                activeParentItem = null;
            }
        }

        const itemMap = gui.state("itemMap");
        for (const [title, value] of Object.entries(itemMap)) {
            let child;
            if (typeof value == 'function') {
                const rootHandle = gui.state("rootGuiHandle");
                child = new $ContextMenuItem({
                    title,
                    handler: () => {
                        rootHandle.set("visible", false);
                        value();
                    }
                });
            } else {
                child = new $ContextMenuParentItem({
                    id: parentId,
                    showSubMenu: false,
                    title,
                    subMenu: value,
                    rootGuiHandle: gui.state("rootGuiHandle")
                });
                listOfParentItems.set(title, child);
            }

            root.append(gui.getNode(child));
        }
    }
}

export class $ContextMenu extends GuiHandle {
    /**
     * @param {GuiContext} gui 
     * @param {HTMLElement} root
     * @param {GuiHandle} handle
     */
    static builder(gui, root, handle) {
        if (gui.state("visible")) {
            Object.assign(root.style, divStyle);
            root.style.display = "flex";
            root.style.left = gui.state("x");
            root.style.top = gui.state("y");
            const itemList = new $ContextMenuItemList({
                x: 0,
                y: 0,
                itemMap: gui.state("itemMap"),
                rootGuiHandle: handle
            });
            gui.bake(root, itemList);
        } else {
            root.style.display = "none";
        }
    }
}