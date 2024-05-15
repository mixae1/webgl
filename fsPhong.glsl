# version 300 es
precision highp float;

in vec3 lightDirection;
in vec3 normal;
in vec3 vertexPositionEye3;

uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;
uniform float uAmbientPower;

float shininess = 16.0;

uniform vec3 uAmbientMaterialColor;
uniform vec3 uDiffuseMaterialColor;
uniform vec3 uSpecularMaterialColor;

out vec4 fragColor;

in float lightDist;

uniform float uQuadConst;
uniform float uQuadLin;
uniform float uQuadQuad;

uniform sampler2D texture0;
uniform sampler2D texture1;
in vec2 textureCord;

float normal_add() {
    float currH = texture(texture1, textureCord).x;
    float xH = texture(texture1, textureCord + dFdx(textureCord)).x - currH;
    float yH = texture(texture1, textureCord + dFdy(textureCord)).x - currH;
    return textureCord.x * xH + textureCord.y * yH;
}

void main(void) {
    vec3 newnormal = normal + normal_add();
    float diffuseLightDot = max(dot(newnormal, lightDirection), 0.0);

    vec3 reflectionVector = normalize(reflect(-lightDirection, newnormal));
    vec3 viewVectorEye = normalize(vertexPositionEye3);
    float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
    float specularLightParam = pow(specularLightDot, shininess);

    vec3 vLightWeighting = uDiffuseMaterialColor * uDiffuseLightColor * diffuseLightDot 
        + uAmbientMaterialColor * uAmbientLightColor * uAmbientPower
        + uSpecularMaterialColor * uSpecularLightColor * specularLightParam;

    float F = 1.0 / (uQuadConst + uQuadLin * lightDist + uQuadQuad * lightDist * lightDist);

    vec4 text0 = texture(texture0, textureCord);
    fragColor = vec4(vLightWeighting.rgb * F * text0.xyz, 1.0);
}