document.addEventListener('keydown', onKeyDown, false);

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

var main = function(){
    program = initShaderProgram(gl, vs, fs);

    gl.useProgram(program);
    initStuff();

    drawScene();
}

const vs = 
`# version 300 es

uniform mat4 mProj;
uniform mat4 mView;
uniform mat4 mWorld;

uniform vec3 col;
uniform vec3 offset;
uniform float curr;
in vec3 vPos;

out vec4 color;

void main(void) {
    gl_Position = mProj * mView * mWorld * vec4(vPos, 3.0);
    color = vec4(col * curr, 1.0);
}
`;

const fs = 
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


const cube = [
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

var projMatrix, viewMatrix, worldMatrix, vPos, col, offset,mProj,mView,mWorld, curr

function initStuff() {
    vPos = gl.getAttribLocation(program, "vPos");
    col = gl.getUniformLocation(program, 'col');
    offset = gl.getUniformLocation(program, 'offset');
    curr = gl.getUniformLocation(program, 'curr');
    mProj = gl.getUniformLocation(program, 'mProj');
    mView = gl.getUniformLocation(program, 'mView');
    mWorld = gl.getUniformLocation(program, 'mWorld');
    
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);

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
    mat4.rotate(xRotationMatrix, identityMatrix, 0, [1, 0, 0]);
    mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
}

const offsets = [
    [1, 0, 0],
    [.25, 0, 0],
    [0.6, 1, -0.5],
    [0.5, 0, 1],
    [0, 0, 0] // common offset
]

const colors = [
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1]
]

function drawScene() {
    gl.uniformMatrix4fv(mProj, gl.FALSE, projMatrix);
    gl.uniformMatrix4fv(mView, gl.FALSE, viewMatrix);
    gl.uniformMatrix4fv(mWorld, gl.FALSE, worldMatrix);

    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 3; j++){
            offsets[4][j] += offsets[i][j]
        }
    }

    for(let j = 0; j < 3; j++){
        offsets[4][j] /= 4
    }

    var loop = function(){
        var t = (Math.sin(performance.now() / 200) * 0.5 + 0.5)

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if(currObj) gl.clearColor(0.5, 0.5, 0.5, 1)
        else gl.clearColor(t * 0.5 + 0.3, t * 0.5 + 0.3, t * 0.5 + 0.3, 1)


        for(let j = 0; j < 4; j++){
            const of = offsets[j]
            const cl = colors[j]
            gl.uniform3f(offset, of[0], of[1], of[2])
            gl.uniform3f(col, cl[0], cl[1], cl[2])
            gl.uniform1f(curr, (currObj == 1 || currObj - 2 == j) ? (Math.sin(t) * 0.5 + 0.5) : 1)

	        mat4.identity(worldMatrix)
            
            let cubesCenterOffset = minus(offsets[j], offsets[4])

            mat4.rotate(worldMatrix, worldMatrix, angles[0], [0, 1, 0]) // крутим себя относительно центра мира
            mat4.translate(worldMatrix, worldMatrix, minus(offsets[j], cubesCenterOffset)) // доходим до своей точки
            mat4.rotate(worldMatrix, worldMatrix, angles[1], [0, 1, 0]) // крутим себя относительно центра всех коробок
            mat4.translate(worldMatrix, worldMatrix, cubesCenterOffset) // двигаем на свою точку относительно центра всех коробок
            mat4.rotate(worldMatrix, worldMatrix, angles[j + 2], [0, 1, 0]) // мы на нуле, крутим себя
            
            gl.uniformMatrix4fv(mWorld, gl.FALSE, worldMatrix)

            for(let i = 0; i < 6; i++){
                gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4);
            }
        }

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

/**
 * 
 * @param {*} currObj 
 * 0 - everything\
 * 1 - all cubes\
 * 2-5 - cubes
 */
var currObj = 0;

const angles = [
    0, 0, 0, 0, 0, 0
]

function onKeyDown(event)
{
    if (event.key == ' ')
    {
        currObj = (currObj + 1) % 6
    }
    else if (event.key == 'ArrowLeft')
    {
        angles[currObj] += 0.05
    }
    else if (event.key == 'ArrowRight')
    {
        angles[currObj] -= 0.05
    }
}

function minus(v1, v2){
    return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]
}