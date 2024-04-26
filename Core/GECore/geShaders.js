export const vertexShader = `#version 300 es
precision mediump float;

in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

out vec3 v_normal;
out vec2 v_texcoord;
out vec4 v_projectedTexcoord;

uniform mat4 u_viewMatrix;
uniform mat4 u_objectMatrix;
uniform mat4 u_projectedLightDirectionalTextureMatrix;

void main() {
    vec4 worldPosition = u_objectMatrix * a_position;

    v_texcoord = a_texcoord;
    v_normal = transpose(inverse(mat3(u_objectMatrix))) * a_normal;
    v_projectedTexcoord = u_projectedLightDirectionalTextureMatrix * worldPosition;

    gl_Position = u_viewMatrix * worldPosition;
}`;

export const depthVS = `#version 300 es
in vec3 a_position;

uniform mat4 u_viewMatrix;
uniform mat4 u_objectMatrix;

void main() { gl_Position = u_viewMatrix * u_objectMatrix * vec4(a_position, 1); }
`;

export const depthFS = `#version 300 es
void main () {}
`;

export const pickFS = `#version 300 es
precision mediump float;
uniform vec4 u_id;
out vec4 fragColor;
void main () {
  fragColor = u_id;
  // fragColor = vec4(u_id.xyz, 0.5);
  // fragColor = vec4(1, 1, 1, 0);
}
`;

export const staticFS = `#version 300 es
precision mediump float;
out vec4 fragColor;
void main () {
  fragColor = vec4(1, 0, 1, 1);
}
`;

export const blurVS = `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

out vec2 v_texCoord;

void main() {
  gl_Position = a_position;
  v_texCoord = a_texcoord;
}
`;

export const blurFS = `#version 300 es
precision highp float;

uniform sampler2D u_depthTexture;
uniform float u_textureSize;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {
  vec2 onePixel = vec2(1.0, 1.0) / vec2(u_textureSize);
  fragColor = (
      texture(u_depthTexture, v_texCoord) +
      texture(u_depthTexture, v_texCoord + vec2(onePixel.x, 0.0)) +
      texture(u_depthTexture, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
  //fragColor = texture(u_depthTexture, v_texCoord);
}
`;

export const copyFS = `#version 300 es
precision highp float;

uniform sampler2D u_texture;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {
  // fragColor = texture(u_texture, v_texCoord);
  fragColor = vec4(1, 1, 0, 1);
}
`;