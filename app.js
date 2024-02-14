var gl = null;
var start = function(){
    var canvas = document.getElementById("glcanvas");
    gl = initWebGL(canvas)

    if (gl) { 
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    }

    main();
}

function initWebGL(canvas) {
    var names = ["webgl2", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    for (var ii = 0; ii < names.length; ++ii) {
        try {
            gl = canvas.getContext(names[ii]);
        } catch(e) {

        }
        if (gl) {
            break;
        }
    }
    
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
    
    }

    return gl;
}
var program;
var main = function(){
    program = initShaderProgram(gl, vsSource, fsSource);

    initStuff();
    gl.useProgram(program);

    drawScene();
}

const vsSource = 
`# version 300 es
in vec3 vPos;
in vec3 vCol;
in vec3 vNorm;
uniform float time;
uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;
out vec4 color;
void main(void) {
    gl_Position = mProj * mView * mWorld * vec4(vPos, 1.0);
    color = vec4(vCol, dot(mWorld * vec4(vNorm, 1.0), vec4(-0.3, 0.1, 0.8, 1.0)));
}
`;

const fsSource = 
`# version 300 es
#ifdef GL_ES
precision highp float;
#endif
in vec4 color;
out vec4 fragColor;
void main(void) {
    fragColor = color;
}
`;

var cube_vert = 
[ // X, Y, Z           R, G, B 
    // Top
    -1.0, 1.0, -1.0,   0.9, 0.0, 0.0,
    -1.0, 1.0, 1.0,    0.9, 0.0, 0.0,
    1.0, 1.0, 1.0,     0.9, 0.0, 0.0,
    1.0, 1.0, -1.0,    0.9, 0.0, 0.0,

    // Left
    -1.0, 1.0, 1.0,    0.0, 0.9, 0.0,
    -1.0, -1.0, 1.0,   0.0, 0.9, 0.0,
    -1.0, -1.0, -1.0,  0.0, 0.9, 0.0,
    -1.0, 1.0, -1.0,   0.0, 0.9, 0.0,

    // Right
    1.0, 1.0, 1.0,    0.0, 0.0, 0.9,
    1.0, -1.0, 1.0,   0.0, 0.0, 0.9,
    1.0, -1.0, -1.0,  0.0, 0.0, 0.9,
    1.0, 1.0, -1.0,   0.0, 0.0, 0.9,

    // Front
    1.0, 1.0, 1.0,    0.9, 0.0, 0.0,
    1.0, -1.0, 1.0,    0.9, 0.0, 0.0,
    -1.0, -1.0, 1.0,    0.9, 0.0, 0.0,
    -1.0, 1.0, 1.0,    0.9, 0.0, 0.0,

    // Back
    1.0, 1.0, -1.0,    0.0, 0.9, 0.0,
    1.0, -1.0, -1.0,    0.0, 0.9, 0.0,
    -1.0, -1.0, -1.0,    0.0, 0.9, 0.0,
    -1.0, 1.0, -1.0,    0.0, 0.9, 0.0,

    // Bottom
    -1.0, -1.0, -1.0,   0.0, 0.0, 0.9,
    -1.0, -1.0, 1.0,    0.0, 0.0, 0.9,
    1.0, -1.0, 1.0,     0.0, 0.0, 0.9,
    1.0, -1.0, -1.0,    0.0, 0.0, 0.9,
];

var cube_idx =
[
    // Top
    0, 1, 2,
    0, 2, 3,

    // Left
    5, 4, 6,
    6, 4, 7,

    // Right
    8, 9, 10,
    8, 10, 11,

    // Front
    13, 12, 14,
    15, 14, 12,

    // Back
    16, 17, 18,
    16, 18, 19,

    // Bottom
    21, 20, 22,
    22, 20, 23
];

var normals = [
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,
];

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initStuff() {
    vPos = gl.getAttribLocation(program, "vPos");
    vCol = gl.getAttribLocation(program, "vCol");
    vNorm = gl.getAttribLocation(program, "vNorm");

    var buf1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube_vert), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 6 * 4, 0);
    gl.vertexAttribPointer(vCol, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
    
    var buf3 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf3);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, 3 * 4, 0);

    var buf2 = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf2);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube_idx), gl.STATIC_DRAW);
    

    
    gl.enableVertexAttribArray(vPos);
    gl.enableVertexAttribArray(vCol);
    gl.enableVertexAttribArray(vNorm);

    
}

function drawScene() {
	var mProj = gl.getUniformLocation(program, 'mProj');
	var mView = gl.getUniformLocation(program, 'mView');
    var mWorld = gl.getUniformLocation(program, 'mWorld');

	var worldMatrix = new Float32Array(16);
	var viewMatrix = new Float32Array(16);
	var projMatrix = new Float32Array(16);
	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

	gl.uniformMatrix4fv(mProj, gl.FALSE, projMatrix);
	gl.uniformMatrix4fv(mView, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(mWorld, gl.FALSE, worldMatrix);

	var xRotationMatrix = new Float32Array(16);
	var yRotationMatrix = new Float32Array(16);

	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);

    var time = gl.getUniformLocation(program, 'time');

    var loop = function(){
        angle = performance.now() / 3000 * 2 * Math.PI;
        gl.uniform1f(time, performance.now() / 500);
        mat4.rotate(yRotationMatrix, identityMatrix, angle, [0, 1, 0]);
        mat4.rotate(xRotationMatrix, identityMatrix, angle / 4, [1, 0, 0]);
        mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
        gl.uniformMatrix4fv(mWorld, gl.FALSE, worldMatrix);
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, cube_idx.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

