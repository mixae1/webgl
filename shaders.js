
export {vsGouraud, vsPhong, fsGouraud, fsPhong};
const vsPhong = 
`# version 300 es

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;
uniform mat3 nMatrix;

uniform vec3 offset;
uniform vec3 uLightPosition;

in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec3 aVertexNormal2;

out vec3 lightDirection;
out vec3 normal;
out vec3 vertexPositionEye3;

void main(void) {
    mat4 uMVMatrix = mView * mWorld;

    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

    lightDirection = normalize(uLightPosition - vertexPositionEye3);
    normal = normalize(nMatrix * normalize(aVertexNormal));

    gl_Position = mProj * uMVMatrix * vec4(aVertexPosition, 3.0);
}
`;

const fsPhong = 
`# version 300 es
precision highp float;

in vec3 lightDirection;
in vec3 normal;
in vec3 vertexPositionEye3;

uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;

float shininess = 16.0;

uniform vec3 uAmbientMaterialColor;
uniform vec3 uDiffuseMaterialColor;
uniform vec3 uSpecularMaterialColor;

uniform vec3 uColor;
uniform float curr;
out vec4 fragColor;

void main(void) {
    float diffuseLightDot = max(dot(normal, lightDirection), 0.0);

    vec3 reflectionVector = normalize(reflect(-lightDirection, normal));
    vec3 viewVectorEye = -normalize(vertexPositionEye3);
    float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
    float specularLightParam = pow(specularLightDot, shininess);

    vec3 vLightWeighting = uAmbientMaterialColor * uAmbientLightColor +
                    uDiffuseMaterialColor * uDiffuseLightColor * diffuseLightDot +
                    uSpecularMaterialColor * uSpecularLightColor * specularLightParam;

    vec4 vColor = vec4(uColor + curr, 1.0);
    fragColor = vec4(vLightWeighting.rgb * vColor.rgb, vColor.a);
}
`;


const vsGouraud = 
`# version 300 es

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;
uniform mat3 nMatrix;

uniform vec3 offset;
uniform float curr;

uniform vec3 uLightPosition;
uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;

in vec3 aVertexPosition;
in vec3 aVertexNormal;

out vec3 vLightWeighting;
uniform vec3 uColor;
out vec4 vColor;

float shininess = 16.0;

uniform vec3 uAmbientMaterialColor;
uniform vec3 uDiffuseMaterialColor;
uniform vec3 uSpecularMaterialColor;

void main(void) {
    mat4 uMVMatrix = mView * mWorld;

    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

    vec3 lightDirection = normalize(uLightPosition - vertexPositionEye3);
    vec3 normal = normalize(nMatrix * aVertexNormal);
    float diffuseLightDot = max(dot(normal, lightDirection), 0.0);

    vec3 reflectionVector = normalize(reflect(-lightDirection, normal));
    vec3 viewVectorEye = -normalize(vertexPositionEye3);
    float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
    float specularLightParam = pow(specularLightDot, shininess);

    vLightWeighting = uAmbientMaterialColor * uAmbientLightColor +
                    uDiffuseMaterialColor * uDiffuseLightColor * diffuseLightDot +
                    uSpecularMaterialColor * uSpecularLightColor * specularLightParam;

    gl_Position = mProj * uMVMatrix * vec4(aVertexPosition, 3.0);
    vColor = vec4(uColor + curr, 1.0);
}
`;

const fsGouraud = 
`# version 300 es
precision highp float;

in vec3 vLightWeighting;
in vec4 vColor;

out vec4 fragColor;

void main(void) {
    fragColor = vec4(vLightWeighting.rgb * vColor.rgb, vColor.a);
}
`;
