#version 300 es
precision mediump float;

in vec2 v_texcoord;
out vec4 fragColor;

uniform sampler2D u_first;
uniform sampler2D u_second;
uniform sampler2D u_third;
uniform sampler2D u_fourth;
uniform sampler2D u_fifth;

uniform float u_timeSinceStart;

void main() {
    float offsetX = 1.25;
    float offsetY = 4.5;
    float slideTime = u_timeSinceStart * 0.3;
    
    float mix1 = clamp(exp(2.0 * sin(slideTime)) - offsetY, 0.0 , 1.0);
    vec4 tex1 = texture(u_first, v_texcoord) * mix1;

    float mix2 = clamp(exp(2.0 * sin(slideTime - offsetX)) - offsetY, 0.0 , 1.0);
    vec4 tex2 = texture(u_second, v_texcoord) * mix2;

    float mix3 = clamp(exp(2.0 * sin(slideTime - offsetX * 2.0)) - offsetY, 0.0 , 1.0);
    vec4 tex3 = texture(u_third, v_texcoord) * mix3;

    float mix4 = clamp(exp(2.0 * sin(slideTime - offsetX * 3.0)) - offsetY, 0.0 , 1.0);
    vec4 tex4 = texture(u_fourth, v_texcoord) * mix4;

    float mix5 = clamp(exp(2.0 * sin(slideTime - offsetX * 4.0)) - offsetY, 0.0 , 1.0);
    vec4 tex5 = texture(u_fifth, v_texcoord) * mix5;

    fragColor = tex1 + tex2 + tex3 + tex4 + tex5;
}