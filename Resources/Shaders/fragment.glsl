#version 300 es
precision highp float;

in vec3 v_normal;
in vec2 v_texcoord;
in vec4 v_projectedTexcoord;

out vec4 fragColor;

uniform sampler2D u_texture;
uniform vec3 u_reverseLightDirection;
uniform sampler2D u_depthTexture;
uniform float u_intensity;

uniform float u_biasMin;
uniform float u_biasMax;
uniform int u_halfSamples;

vec4 ambientColor = vec4(0, 0, 0, 1);
vec4 shadowColor = vec4(0, 0, 0, 1);

float lightDirectional() {
    vec3 normal = normalize(v_normal);
    return dot(normal, u_reverseLightDirection) * u_intensity;
}

float shadowLight() {
    vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(u_reverseLightDirection);
    float bias = mix(u_biasMin, u_biasMax, 1.0 - dot(normal, lightDir));
    float currentDepth = projectedTexcoord.z - bias;

    bool inRange =
        projectedTexcoord.x >= 0.0 &&
        projectedTexcoord.x <= 1.0 &&
        projectedTexcoord.y >= 0.0 &&
        projectedTexcoord.y <= 1.0;

    float shadow = 0.0;
    vec2 texelSize = 1.0 / vec2(textureSize(u_depthTexture, 0));
    for (int x = -u_halfSamples; x <= u_halfSamples; ++x) {
        for (int y = -u_halfSamples; y <= u_halfSamples; ++y) {
            float pcfDepth = texture(u_depthTexture, projectedTexcoord.xy + vec2(x, y) * texelSize).r;
            shadow += (inRange && pcfDepth <= currentDepth) ? 0.1 : 1.0;
        }
    }
    shadow /= pow(float(u_halfSamples) * 2.0 + 1.0, 2.0);

    return shadow;
}

void main() {
    float light = lightDirectional();
    float shadowLight = shadowLight();
    vec4 texColor = texture(u_texture, v_texcoord);
    vec4 ambient = mix(shadowColor, texColor, shadowLight);
    fragColor = mix(ambientColor, ambient, light);
    // fragColor = vec4(mix(0.0, 1.0, (1.0 - dot(normalize(v_normal), normalize(u_reverseLightDirection)))));
    // fragColor = texture(u_depthTexture, v_texcoord);
    // fragColor = texColor + vec4(0, 0, 0.25, 1);
}