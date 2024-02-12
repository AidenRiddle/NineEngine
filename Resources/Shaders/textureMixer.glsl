#version 300 es
precision mediump float;

in vec2 v_texcoord;
out vec4 fragColor;

uniform sampler2D u_diffuse;
uniform sampler2D u_tint;

uniform float intensity;

void main() {
    vec4 mainColor = texture(u_diffuse, v_texcoord);
    vec4 tint = texture(u_tint, v_texcoord);
    float i = intensity;

    fragColor = (mainColor * (1.0 - i)) + (tint * i);
}