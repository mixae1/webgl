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

const fs = 
`# version 300 es
precision highp float;

in vec3 vLightWeighting;
in vec4 vColor;

out vec4 fragColor;

void main(void) {
    fragColor = vec4(vLightWeighting.rgb * vColor.rgb, vColor.a);
}
`;


var cube = 
[ // X, Y, Z           normals 
    // Top
    -1.0, 1.0, -1.0, 0.0, 1.0, 0.0,
    -1.0, 1.0, 1.0, 0.0, 1.0, 0.0,
    1.0, 1.0, 1.0, 0.0, 1.0, 0.0,
    1.0, 1.0, -1.0, 0.0, 1.0, 0.0,

    // Left
    -1.0, 1.0, 1.0, -1.0, 0.0, 0.0,
    -1.0, -1.0, 1.0, -1.0, 0.0, 0.0,
    -1.0, -1.0, -1.0, -1.0, 0.0, 0.0,
    -1.0, 1.0, -1.0, -1.0, 0.0, 0.0,

    // Right
    1.0, 1.0, 1.0, 1.0, 0.0, 0.0,
    1.0, -1.0, 1.0, 1.0, 0.0, 0.0,
    1.0, -1.0, -1.0, 1.0, 0.0, 0.0,
    1.0, 1.0, -1.0, 1.0, 0.0, 0.0,

    // Front
    1.0, 1.0, 1.0, 0.0, 0.0, 1.0,
    1.0, -1.0, 1.0, 0.0, 0.0, 1.0,
    -1.0, -1.0, 1.0, 0.0, 0.0, 1.0,
    -1.0, 1.0, 1.0, 0.0, 0.0, 1.0,

    // Back
    1.0, 1.0, -1.0, 0.0, 0.0, -1.0,
    1.0, -1.0, -1.0, 0.0, 0.0, -1.0,
    -1.0, -1.0, -1.0, 0.0, 0.0, -1.0,
    -1.0, 1.0, -1.0, 0.0, 0.0, -1.0,

    // Bottom
    -1.0, -1.0, -1.0, 0.0, -1.0, 0.0,
    -1.0, -1.0, 1.0, 0.0, -1.0, 0.0,
    1.0, -1.0, 1.0, 0.0, -1.0, 0.0,
    1.0, -1.0, -1.0, 0.0, -1.0, 0.0,
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

function setupLights() {
    uLightPosition = gl.getUniformLocation(program, 'uLightPosition');
    uAmbientLightColor = gl.getUniformLocation(program, 'uAmbientLightColor');
    uDiffuseLightColor = gl.getUniformLocation(program, 'uDiffuseLightColor');
    uSpecularLightColor = gl.getUniformLocation(program, 'uSpecularLightColor');
    
    gl.uniform3fv(uLightPosition, [10.0, 10.0, -10.0]);
    gl.uniform3fv(uAmbientLightColor, [0.1, 0.1, 0.1]);
    gl.uniform3fv(uDiffuseLightColor, [0.7, 0.7, 0.7]);
    gl.uniform3fv(uSpecularLightColor, [1.0, 1.0, 1.0]);

    uAmbientMaterialColor = gl.getUniformLocation(program, 'uAmbientMaterialColor')
    uDiffuseMaterialColor = gl.getUniformLocation(program, 'uDiffuseMaterialColor')
    uSpecularMaterialColor = gl.getUniformLocation(program, 'uSpecularMaterialColor')

    gl.uniform3fv(uAmbientMaterialColor, [1.0, 0.5, 0.31]);
    gl.uniform3fv(uDiffuseMaterialColor, [1.0, 0.5, 0.31]);
    gl.uniform3fv(uSpecularMaterialColor, [0.5, 0.5, 0.5]);
}

var worldMatrix, normMatrix, mWorld, nMatrix, 
    vPos, vNorm, col, offset, curr

function initStuff() {
    vPos = gl.getAttribLocation(program, "aVertexPosition");
    vNorm = gl.getAttribLocation(program, "aVertexNormal");

    offset = gl.getUniformLocation(program, 'offset');
    curr = gl.getUniformLocation(program, 'curr');
    col = gl.getUniformLocation(program, 'uColor');
    
    mProj = gl.getUniformLocation(program, 'mProj');
    mView = gl.getUniformLocation(program, 'mView');
    mWorld = gl.getUniformLocation(program, 'mWorld');
    nMatrix = gl.getUniformLocation(program, 'nMatrix');
    
    const b1 = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, b1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube), gl.STATIC_DRAW);

    const b3 = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b3);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube_idx), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPos, 3, gl.FLOAT, false, 6 * 4, 0);
    gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
    
    gl.enableVertexAttribArray(vPos);
    gl.enableVertexAttribArray(vNorm);
    
	worldMatrix = new Float32Array(16);
	viewMatrix = new Float32Array(16);
	projMatrix = new Float32Array(16);
    normMatrix = new Float32Array(9);

	mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(projMatrix, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(mProj, gl.FALSE, projMatrix);
    gl.uniformMatrix4fv(mView, gl.FALSE, viewMatrix);

    setupLights();
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
    for(let i = 0; i < 4; i++){
        for(let j = 0; j < 3; j++){
            offsets[4][j] += offsets[i][j]
        }
    }

    for(let j = 0; j < 3; j++){
        offsets[4][j] /= 4
    }

    var loop = function(){
        var t = (Math.sin(performance.now() / 200) * 0.5 + 0.5) * 0.2

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if(currObj) gl.clearColor(0.5, 0.5, 0.5, 1)
        else gl.clearColor(0.5 + t, 0.5 + t, 0.5 + t, 1)


        for(let j = 0; j < 4; j++){
            gl.uniform3fv(offset, offsets[j])
            gl.uniform3fv(col, colors[j])
            gl.uniform1f(curr, (currObj == 1 || currObj - 2 == j) ? t : 0.0)

            let cubesCenterOffset = minus(offsets[j], offsets[4])
            
	        mat4.identity(worldMatrix)
            mat4.rotate(worldMatrix, worldMatrix, angles[0], [0, 1, 0]) // крутим себя относительно центра мира
            mat4.translate(worldMatrix, worldMatrix, minus(offsets[j], cubesCenterOffset)) // доходим до своей точки
            mat4.rotate(worldMatrix, worldMatrix, angles[1], [0, 1, 0]) // крутим себя относительно центра всех коробок
            mat4.translate(worldMatrix, worldMatrix, cubesCenterOffset) // двигаем на свою точку относительно центра всех коробок
            mat4.rotate(worldMatrix, worldMatrix, angles[j + 2], [0, 1, 0]) // мы на нуле, крутим себя
            
            mat3.normalFromMat4(normMatrix, worldMatrix);

            gl.uniformMatrix4fv(mWorld, gl.FALSE, worldMatrix)
            gl.uniformMatrix3fv(nMatrix, gl.FALSE, normMatrix)

            gl.drawElements(gl.TRIANGLES, cube_idx.length, gl.UNSIGNED_SHORT, 0);
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