# version 300 es

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;
uniform mat3 nMatrix;

uniform vec3 uLightPosition;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec2 aVertexTexure;

out vec3 lightDirection;
out vec3 normal;
out vec3 vertexPositionEye3;
out vec2 textureCord;

out float lightDist;

uniform vec3 lb;
uniform vec3 ub;

out vec4 lb_;
out vec4 ub_;
out vec4 vpos;

void main(void) {
    mat4 uMVMatrix = mView * mWorld;

    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

    lightDist = length(uLightPosition - vertexPositionEye3);
    lightDirection = normalize(uLightPosition - vertexPositionEye3);
    normal = normalize(nMatrix * normalize(aVertexNormal));

    gl_Position = mProj * uMVMatrix * vec4(aVertexPosition, 1.0);
    textureCord = aVertexTexure;

}