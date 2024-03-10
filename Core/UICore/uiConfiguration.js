import { objectToEnum } from "../../methods.js";

function createFrame(src, style) {
    const iframe = document.createElement("iframe");
    iframe.src = src;

    for (const param in style) {
        iframe.style[param] = style[param];
    }
    // iframe.contentDocument.body.style.fontFamily = "cursive";

    return iframe;
}

export const UiEvent = {
    global_visibility_change: 0,
    global_context_menu: 0,
    global_gui_update: 0,

    hierarchy_refresh: 0,
    hierarchy_select: 0,
    hierarchy_new_sceneobject: 0,
    hierarchy_rename_sceneobject: 0,
    hierarchy_delete_sceneobject: 0,

    inspector_assetFile_update: 0,
    inspector_transform_change: 0,
    inspector_script_param_change: 0,
    inspector_request_error: 0,
    inspector_display_properties: 0,
    inspector_add_script: 0,

    assetBrowser_select_assetFile: 0,
    assetBrowser_refresh: 0,

    menuBar_compile: 0,
    menuBar_build: 0,
    menuBar_upload_image: 0,
    menuBar_play: 0,
    menuBar_saveProject: 0,
    menuBar_newProject: 0,
    menuBar_openProject: 0,
}
objectToEnum(UiEvent);

export const UiWindow = {
    View: "View",
    Hierarchy: "Hierarchy",
    Inspector: "Inspector",
    AssetBrowser: "AssetBrowser",
    MenuBar: "MenuBar",

    getFrameFor(uiWindow) { return UiFrame[uiWindow]; }
}

export const UiGroup = {
    header: document.getElementById("header"),
    left: document.getElementById("left"),
    middle: document.getElementById("middle"),
    middleTop: document.getElementById("middleTop"),
    middleBottom: document.getElementById("middleBottom"),
    right: document.getElementById("right")
}

const UiStyle = {
    [UiWindow.MenuBar]: {
        "display": "flex",
        "flexDirection": "row",
        "alignItems": "center",

        "padding": "0px",
        "border": "0",
        "height": "25px",

        "alignSelf": "stretch",
        "flexGrow": "1"
    },
    [UiWindow.View]: {
        "border": "0",
        "alignSelf": "stretch",

        "justifySelf": "stretch",
        "flexGrow": "1"
    },
    [UiWindow.Hierarchy]: {
        "display": "flex",
        "flexDirection": "row",
        "alignItems": "flex-start",

        "padding": "0px",
        "width": "300px",

        "alignSelf": "stretch",
    },
    [UiWindow.Inspector]: {
        "display": "flex",
        "flexDirection": "row",
        "alignItems": "flex-start",

        "padding": "0px",
        "width": "396px",

        "alignSelf": "stretch",
    },
    [UiWindow.AssetBrowser]: {
        "display": "flex",
        "flexDirection": "row",
        "alignItems": "flex-start",

        "padding": "0px",
        "height": "270px",

        "alignSelf": "stretch",
        "flexGrow": "1"
    },
}

const UiFrame = {
    [UiWindow.MenuBar]: createFrame("./Core/UICore/MenuBar/menuBar.html", UiStyle[UiWindow.MenuBar]),
    [UiWindow.View]: createFrame("./Core/UICore/View/view.html", UiStyle[UiWindow.View]),
    [UiWindow.Hierarchy]: createFrame("./Core/UICore/Hierarchy/hierarchy.html", UiStyle[UiWindow.Hierarchy]),
    [UiWindow.Inspector]: createFrame("./Core/UICore/Inspector/inspector.html", UiStyle[UiWindow.Inspector]),
    [UiWindow.AssetBrowser]: createFrame("./Core/UICore/AssetBrowser/assetBrowser.html", UiStyle[UiWindow.AssetBrowser]),
}