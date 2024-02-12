export const FRAG_LIGHTDIRECTIONAL =
    `vec3 normal = normalize(v_normal);
return dot(normal, u_reverseLightDirection) * u_intensity;`;

export const FRAG_SHADOWLIGHT =
    `vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
float currentDepth = projectedTexcoord.z + u_lightDirectionalShadowBias;

bool inRange = projectedTexcoord.x >= 0.0 && projectedTexcoord.x <= 1.0 && projectedTexcoord.y >= 0.0 && projectedTexcoord.y <= 1.0;
vec4 projectedTexColor = vec4(texture(u_depthTexture, projectedTexcoord.xy).rrr, 1);
float projectedDepth = texture(u_depthTexture, projectedTexcoord.xy).r;
return (inRange && projectedDepth <= currentDepth) ? 0.1 : 1.0;`;

export const VERT_DEFAULT_OUTPUT = 
    `    worldPosition = u_objectMatrix * vec4(a_position, 1);
    v_texcoord = a_texcoord;
    v_normal = transpose(inverse(mat3(u_objectMatrix))) * a_normal;
`;

export const VERT_GET_BONE_MATRIX = 
    `    return mat4(
        texelFetch(u_jointTexture, ivec2(0, jointNdx), 0),
        texelFetch(u_jointTexture, ivec2(1, jointNdx), 0),
        texelFetch(u_jointTexture, ivec2(2, jointNdx), 0),
        texelFetch(u_jointTexture, ivec2(3, jointNdx), 0));`

export const VERT_SKIN_MATRIX = 
    `    return getBoneMatrix(int(a_joints[0])) * a_weights[0] +
        getBoneMatrix(int(a_joints[1])) * a_weights[1] +
        getBoneMatrix(int(a_joints[2])) * a_weights[2] +
        getBoneMatrix(int(a_joints[3])) * a_weights[3];
`

export const VERT_ARMATURE_OUTPUT = 
    `    mat4 skinnedObjectMatrix = u_objectMatrix * skinMatrix();
    worldPosition = skinnedObjectMatrix * vec4(a_position, 1);
    v_texcoord = a_texcoord;
    v_normal = transpose(inverse(mat3(skinnedObjectMatrix))) * a_normal;
`;