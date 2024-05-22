# version 300 es

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;

in vec3 aVertexPosition;
in float aActive;

void main(void) {
    mat4 uMVMatrix = mView * mWorld;
    gl_Position = mProj * uMVMatrix * vec4(aVertexPosition, 1.0);
    gl_PointSize = 32.0;
    if(aActive <= 0.5) gl_PointSize = 0.0;
}