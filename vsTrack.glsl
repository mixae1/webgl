# version 300 es
in vec3 aVertexPosition;
in vec3 aVertexColor;
in float aActive;

out vec3 v_color;

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;

void main() {
    v_color = aVertexColor;
    mat4 uMVMatrix = mView * mWorld;
    gl_Position = mProj * uMVMatrix * vec4(aVertexPosition, 1.0);
    gl_PointSize = 1.0;
    if(aActive < 0.5 && aActive > 0.0) gl_PointSize = 0.0;
}