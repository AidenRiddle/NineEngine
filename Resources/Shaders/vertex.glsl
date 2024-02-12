#version 300 es
precision mediump float;
uniform mat4 u_viewMatrix;
uniform mat4 u_objectMatrix;
in vec4 a_position;

in vec3 a_normal;
out vec3 v_normal;

in vec2 a_texcoord;
out vec2 v_texcoord;

void main() {
    gl_Position = u_viewMatrix * u_objectMatrix * a_position;

    v_texcoord = a_texcoord;
    v_normal = transpose(inverse(mat3(u_objectMatrix))) * a_normal;
}