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
var program = [];
var main = function(){
    program.push(initShaderProgram(gl, vs1, fs1));
    program.push(initShaderProgram(gl, vs2, fs1));
    program.push(initShaderProgram(gl, vs3, fs3));

    initStuff();

    drawScene();
}

const vs1 = 
`# version 300 es

in vec2 vPos;
uniform vec3 col;
out vec4 color;

void main(void) {
    gl_Position = vec4(vPos, 0.0, 2.0);
    color = vec4(col, 1.0);
}
`;

const fs1 = 
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

const vs2 = 
`# version 300 es

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;

uniform vec3 col;
in vec3 vPos;

out vec4 color;

void main(void) {
    gl_Position = mProj * mView * mWorld * vec4(vPos, 2.0);
    color = vec4(col, 1.0);
}
`;


const vs3 = 
`# version 300 es

in vec2 vPos;

out float x;

void main(void) {
    gl_Position = vec4(vPos, 0.0, 3.0);
    x = vPos.x;
}
`;

const fs3 = 
`# version 300 es
#ifdef GL_ES
precision highp float;
#endif

in float x;

out vec4 fragColor;

void main(void) {
    fragColor = vec4(tan(25.0 * x), 0.5, 0.5, 1.0);
}
`;


const lab2 = [
    
        Math.cos(2 * Math.PI * 1/5), Math.sin(2 * Math.PI * 1/5),
        Math.cos(2 * Math.PI * 2/5), Math.sin(2 * Math.PI * 2/5),
        Math.cos(2 * Math.PI * 3/5), Math.sin(2 * Math.PI * 3/5),
        Math.cos(2 * Math.PI * 4/5), Math.sin(2 * Math.PI * 4/5),
        Math.cos(2 * Math.PI * 5/5), Math.sin(2 * Math.PI * 5/5),

        -1, 1, 1,
        1, 1, 1,
        1, 1, -1,
        -1, 1, -1,
        
        -1, -1, 1,
        1, -1, 1,
        1, -1, -1,
        -1, -1, -1,

        -1, 1, 1,
        1, 1, 1,
        1, -1, 1,
        -1, -1, 1,

        -1, 1, -1,
        1, 1, -1,
        1, -1, -1,
        -1, -1, -1,

        1, 1, 1,
        1, -1, 1,
        1, -1, -1,
        1, 1, -1,

        -1, 1, 1,
        -1, -1, 1,
        -1, -1, -1,
        -1, 1, -1,

        -1, -1,
        1, -1,
        1, 1,
        -1, 1,
    
]

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

vPos = []
var projMatrix, viewMatrix, worldMatrix
function initStuff() {
    for(let i = 0; i < program.length; i++)
        vPos[i] = gl.getAttribLocation(program[i], "vPos");

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lab2), gl.STATIC_DRAW);

	worldMatrix = new Float32Array(16);
	viewMatrix = new Float32Array(16);
	projMatrix = new Float32Array(16);

	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

	var xRotationMatrix = new Float32Array(16);
	var yRotationMatrix = new Float32Array(16);

	var identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);

    mat4.rotate(yRotationMatrix, identityMatrix, 0.5, [0, 1, 0]);
    mat4.rotate(xRotationMatrix, identityMatrix, 0.34, [1, 0, 0]);
    mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
}

function useProgram(mode){
    gl.useProgram(program[mode]);
    var col = gl.getUniformLocation(program[mode], 'col');
    switch(mode){
        case 0:
            gl.vertexAttribPointer(vPos[mode], 2, gl.FLOAT, false, 0, 0);
            gl.uniform3f(col, 1.0, 0.0, 0.0);
            break;
        case 1:
            gl.vertexAttribPointer(vPos[mode], 3, gl.FLOAT, false, 0, 2 * 5 * 4);

            gl.uniform3f(col, 1.0, 0.7, 0.05);

            const mProj = gl.getUniformLocation(program[1], 'mProj');
            const mView = gl.getUniformLocation(program[1], 'mView');
            const mWorld = gl.getUniformLocation(program[1], 'mWorld');
            gl.uniformMatrix4fv(mProj, gl.FALSE, projMatrix);
            gl.uniformMatrix4fv(mView, gl.FALSE, viewMatrix);
            gl.uniformMatrix4fv(mWorld, gl.FALSE, worldMatrix);
            break;
        case 2:
            gl.vertexAttribPointer(vPos[mode], 2, gl.FLOAT, false, 0, 2 * 5 * 4 + 3 * 24 * 4);
            break;
        default:
            break;
    }
    gl.enableVertexAttribArray(vPos[mode]);
}

let mode = 0;
function drawScene() {
    console.log("mode = #   [0, 1 or 2]")
    var loop = function(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        useProgram(mode);
        switch (mode) {
            case 0:
                gl.drawArrays(gl.TRIANGLE_FAN, 0, 5);
                break;
            case 1:
                for(let i = 0; i < 6; i++)
                    gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4);
                break;
            case 2:
                gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
                break;
            default:
                break;
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

