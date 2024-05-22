# version 300 es
precision mediump float;

uniform sampler2D texture0;
out vec4 fragColor;

void main(void) {
    fragColor = texture(texture0, gl_PointCoord);
}