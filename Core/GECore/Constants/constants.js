export const ColorUtils = {
    colorToRGBAString : function(color){ return "rgba(" + color[0] * 255 + ", " + color[1] * 255 + ", " + color[2] * 255 + ", " + color[3] + ")"; },
}

export const Color = {
    wine : [0.6, 0, 0, 1],
    transparent : [0, 0, 0, 0],
    darken : [0, 0, 0, 0.2],

    white : [1, 1, 1, 1],
    black : [0, 0, 0, 1],

    light : [0.92, 0.92, 0.92, 1],
    grey : [0.5, 0.5, 0.5, 1],
    dark : [0.12, 0.12, 0.12, 1],

    red : [1, 0, 0, 1],
    orange : [1, 0.5, 0, 1],
    yellow : [0.9, 0.9, 0, 1],

    green : [0, 0.8, 0, 1],

    blue : [0, 0, 0.8, 1],
    darkBlue : [0.035, 0.082, 0.2, 1],
    lightBlue : [0.3, 0.7, 1, 1],
    secondaryBlue : [0.2, 0.6, 1, 1],
    
    purple : [0.5, 0, 1, 1],
    pink : [1, 0, 1, 1],
}

export const Defaults = {
    characters_in_atlas : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 :;_#\"\'[]()<>@=+-*/.,",
    font_size : 60,
    font_color : Color.pink,
    target_letter_texture_height : 30,
    get target_letter_texture_width(){ return Defaults.variable_texture_scale_parameter * (Defaults.font_size * 0.50); },
    get variable_texture_scale_parameter(){ return Defaults.target_letter_texture_height / (Defaults.font_size * 1.05); },
}