const KB = 1024;      // KiloByte
const MB = KB * KB;   // MegaByte
const GB = KB * MB;   // GigaByte

const display_width = 1280;
const display_height = 720;
const render_scale = 1;     //float between 0 - 1, can go past 1 to render higher than the display

const aspect_ratio = display_width / display_height;
const render_width = ~~(display_width * render_scale);
const render_height = ~~(display_height * render_scale);

export const AppSettings = {
    display_width,
    display_height,
    aspect_ratio,
    render_scale,
    render_width,
    render_height,
    field_of_view: 70,

    vertex_size: 3,
    maximum_vertex_buffer_allocation_per_draw_call: 215 * KB,
    maximum_index_buffer_allocation_per_draw_call: 160 * KB,
    vertex_buffer_size: 2 * MB,

    shadow_map_resolution: 2 * KB,
    shadow_halfSamples: 1,
    shadow_biasMin: 0.0005,
    shadow_biasMax: 0.002
};

export const System = Object.freeze({
    target_frame_rate: 60,
    target_background_frame_rate: 30,
    max_threads: 0,
    runtime_initial_memory: 1,
    runtime_maximum_memory: 100,

    camera_zoom_max: 175,
    camera_zoom_min: 5,
    camera_zoom_step: 5,

    deg_to_rad: Math.PI / 180,
    rad_to_deg: 180 / Math.PI,

    // https://www.w3schools.com/cssref/css_colors.php
    dev_console_message_prefix: ["%c[Dev]", "color: BlueViolet"],
    debug_message_prefix: ["%c[Debug]", "color: LimeGreen"],
    ui_message_prefix: ["%c[UI]", "color: LightSkyBlue"],
    input_message_prefix: ["%c[INPUT]", "color: LightSeaGreen"],

    input_state_editor: "The One State To Rule Them All",
    input_state_runtime: "Runtime Input State",

    log(style, ...msgs) { console.log(...style, ...msgs); }
})

export const DebugToggle = Object.freeze({
    light_ShadowRealm: false,
    enumFullName: true,
    ui_logs: true,
})

export const Stash = Object.freeze({
    resource_root: location.href + "Resources/",
    worker_script_root: location.href,
    default_running_instance: location.href + "Core/defaultRunningInstance.json",
    fixtures: location.href + "FileSystem/Navigator/fixtures.json"
})

export const DataBaseSchema = Object.freeze({
    resources : Object.freeze({
        storeName : "resources",
        key : "name",
    }),
    runningInstances : Object.freeze({
        storeName : "runningInstances",
        key : "name",
    }),
    userConfiguration : Object.freeze({
        storeName : "userConfiguration",
        key : "name",
    })
});

export const AssetType = {
    material: Object.freeze({
        extension: "mat"
    }),
    mesh: Object.freeze({
        extension: "glb"
    }),
    model: Object.freeze({
        extension: "model"
    })
}

export const Webgl = {
    contextAttribute: {
        alpha: true,
        antialias: true,
        depth: true,
        desynchronized: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "default",         // "low-power" - "default" - "high-performance"
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
        xrCompatible: false
    },
    engineTexture: Object.freeze({          // Reserved index for these textures
        depthTexture: 0,
        effectsTexture: 1,
        jointTexture: 2,
        length: 3
    }),
    uniform: Object.freeze({
        viewMatrix: "u_viewMatrix",
        objectMatrix: "u_objectMatrix",
        depthTexture: "u_depthTexture",
        lightDirectional: "u_projectedLightDirectionalTextureMatrix",
        timeSinceStart: "u_timeSinceStart",
        shadowHalfSamples: "u_halfSamples",
        shadowBiasMin: "u_biasMin",
        shadowBiasMax: "u_biasMax"
    })
}

export const TexturePainterSettings = {
    contextAttributes: {
        alpha: true,
        colorSpace: "srgb",
        willReadFrequently: "false"
    }
}

export const CanvasInput = {
    contextAttributes: {
        unadjustedMovement: true            // Mouse Raw-Input
    }
}

const comments = /(\/\/[^]*?\n)|([\t\r]*\/\*[^]*?\*\/)/g;
const singleQuotes = /(\'[^]*?\')/g;
const doubleQuotes = /(\"[^]*?\")/g;
export const Regex = Object.freeze({
    comments,
    excess_white_space: /[\s]*[\n\t\r][\s]*| [\s]+/g,
    token_separator: new RegExp(
        comments.source + "|"
        + singleQuotes.source + "|"
        + doubleQuotes.source + "|"
        + /([()<>,.:;{}+\-*\/\"\'])|\s+/.source,
        'g'
    )
})

export const AssemblyScript = Object.freeze({
    compiler_args: `
        --outFile --stats --debug
        --importMemory --sharedMemory --zeroFilledMemory --maximumMemory ${System.runtime_maximum_memory}
        --enable threads
        --exportTable
        --exportStart
        --exportRuntime --runtime minimal`
        .trim().replaceAll(Regex.excess_white_space, ' ').split(' ')
})

export const Key = Object.freeze({
    alt: "alt",
    ctrl: "control",
    shift: "shift",
    ml: "mouselock",

    lmb: "lmb",
    mmb: "mmb",
    rmb: "rmb",
    mouseMove: "mousemove",
    scrollDown: "scrolldown",
    scrollUp: "scrollup",
    arrowRight: "arrowright",
    arrowLeft: "arrowleft",
    arrowUp: "arrowup",
    arrowDown: "arrowdown",
})