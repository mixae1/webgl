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

out vec3 lightDirection;
out vec3 normal;
out vec3 vertexPositionEye3;

out float lightDist;

void main(void) {
    mat4 uMVMatrix = mView * mWorld;

    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

    lightDist = length(uLightPosition - vertexPositionEye3);
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
uniform float uAmbientPower;

float shininess = 16.0;

uniform vec3 uAmbientMaterialColor;
uniform vec3 uDiffuseMaterialColor;
uniform vec3 uSpecularMaterialColor;

uniform vec3 uColor;
uniform float curr;
out vec4 fragColor;

in float lightDist;
uniform float uLinDist;

uniform float lambert;

uniform float quad;
uniform float uQuadConst;
uniform float uQuadLin;
uniform float uQuadQuad;

void main(void) {
    float diffuseLightDot = max(dot(normal, lightDirection), 0.0);

    vec3 reflectionVector = normalize(reflect(-lightDirection, normal));
    vec3 viewVectorEye = normalize(vertexPositionEye3);
    float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
    float specularLightParam = pow(specularLightDot, shininess);

    vec3 vLightWeighting = uDiffuseMaterialColor * uDiffuseLightColor * diffuseLightDot;
    if(lambert == 0.0){
        vLightWeighting += uAmbientMaterialColor * uAmbientLightColor * uAmbientPower +
            uSpecularMaterialColor * uSpecularLightColor * specularLightParam;
    }

    float F = 0.0;
    if(quad == 0.0){
        F = min(lightDist / uLinDist, 1.0);
    } else {
        F = 1.0 / (uQuadConst + uQuadLin * lightDist + uQuadQuad * lightDist * lightDist);
    }

    vec4 vColor = vec4(uColor + curr, 1.0);
    fragColor = vec4(vLightWeighting.rgb * vColor.rgb * F, vColor.a);
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
uniform float uAmbientPower;

in vec3 aVertexPosition;
in vec3 aVertexNormal;

out vec3 vLightWeighting;
uniform vec3 uColor;
out vec4 vColor;

float shininess = 16.0;

uniform vec3 uAmbientMaterialColor;
uniform vec3 uDiffuseMaterialColor;
uniform vec3 uSpecularMaterialColor;

uniform float lambert;

out float lightDist;

void main(void) {
    mat4 uMVMatrix = mView * mWorld;

    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vec3 vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

    lightDist = length(uLightPosition - vertexPositionEye3);
    vec3 lightDirection = normalize(uLightPosition - vertexPositionEye3);
    vec3 normal = normalize(nMatrix * aVertexNormal);
    float diffuseLightDot = max(dot(normal, lightDirection), 0.0);

    vec3 reflectionVector = normalize(reflect(-lightDirection, normal));
    vec3 viewVectorEye = normalize(vertexPositionEye3);
    float specularLightDot = max(dot(reflectionVector, viewVectorEye), 0.0);
    float specularLightParam = pow(specularLightDot, shininess);

    vLightWeighting = uDiffuseMaterialColor * uDiffuseLightColor * diffuseLightDot;
    if(lambert == 0.0){
        vLightWeighting += uAmbientMaterialColor * uAmbientLightColor * uAmbientPower +
            uSpecularMaterialColor * uSpecularLightColor * specularLightParam;
    }

    gl_Position = mProj * uMVMatrix * vec4(aVertexPosition, 3.0);
    vColor = vec4(uColor + curr, 1.0);
}
`;

const fsGouraud = 
`# version 300 es
precision highp float;

in vec3 vLightWeighting;
in vec4 vColor;
in float lightDist;

uniform float uLinDist;

out vec4 fragColor;

uniform float quad;
uniform float uQuadConst;
uniform float uQuadLin;
uniform float uQuadQuad;

void main(void) {
    float F = 0.0;
    if(quad == 0.0){
        F = min(lightDist / uLinDist, 1.0);
    } else {
        F = 1.0 / (uQuadConst + uQuadLin * lightDist + uQuadQuad * lightDist * lightDist);
    }
    fragColor = vec4(vLightWeighting.rgb * vColor.rgb * F, vColor.a);
}
`;

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

var currentShader = null
var Gourand = {}
var Phong = {}

var main = function(){
    Gourand.useNorm = 1
    Phong.useNorm = 2

    Gourand.program = initShaderProgram(gl, vsGouraud, fsGouraud);
    gl.useProgram(Gourand.program);
    initStuff(Gourand)
    
    Phong.program = initShaderProgram(gl, vsPhong, fsPhong)
    gl.useProgram(Phong.program);
    initStuff(Phong)
    
    currentShader = Gourand
    gl.useProgram(currentShader.program)

    drawScene();
}

var cube = 
[ // X, Y, Z             goure          phong
    // Top
    -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // Left
    -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, -0.5, 0.0, 0.5,
    -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, -0.5, 0.0, 0.5,
    -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, -0.5, 0.0, -0.5,
    -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, -0.5, 0.0, -0.5,

    // Right
    1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.5, 0.0, 0.5,
    1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 0.5, 0.0, 0.5,
    1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.5, 0.0, -0.5,
    1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 0.5, 0.0, -0.5,

    // Front
    1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.0, 0.5,
    1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.5, 0.0, 0.5,
    -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, -0.5, 0.0, 0.5,
    -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, -0.5, 0.0, 0.5,

    // Back
    1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 0.5, 0.0, -0.5,
    1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.5, 0.0, -0.5,
    -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, -0.5, 0.0, -0.5,
    -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, -0.5, 0.0, -0.5,

    // Bottom
    -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0,
    -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0,
    1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0,
    1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0, 0.0,
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
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
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

function setupLights(shader) {
    shader.uLightPosition = gl.getUniformLocation(shader.program, 'uLightPosition');
    shader.uAmbientLightColor = gl.getUniformLocation(shader.program, 'uAmbientLightColor');
    shader.uDiffuseLightColor = gl.getUniformLocation(shader.program, 'uDiffuseLightColor');
    shader.uSpecularLightColor = gl.getUniformLocation(shader.program, 'uSpecularLightColor');
    
    gl.uniform3fv(shader.uLightPosition, [-10.0, 3.0, -10.0]);

    gl.uniform3fv(shader.uAmbientLightColor, [0.1, 0.1, 0.1]);
    gl.uniform3fv(shader.uDiffuseLightColor, [0.7, 0.7, 0.7]);
    gl.uniform3fv(shader.uSpecularLightColor, [1.0, 1.0, 1.0]);

    shader.uAmbientMaterialColor = gl.getUniformLocation(shader.program, 'uAmbientMaterialColor')
    shader.uDiffuseMaterialColor = gl.getUniformLocation(shader.program, 'uDiffuseMaterialColor')
    shader.uSpecularMaterialColor = gl.getUniformLocation(shader.program, 'uSpecularMaterialColor')

    gl.uniform3fv(shader.uAmbientMaterialColor, [1.0, 0.5, 0.31]);
    gl.uniform3fv(shader.uDiffuseMaterialColor, [1.0, 0.5, 0.31]);
    gl.uniform3fv(shader.uSpecularMaterialColor, [0.5, 0.5, 0.5]);

    shader.lambert = gl.getUniformLocation(shader.program, 'lambert')
    gl.uniform1f(shader.lambert, 0.0)

    shader.uAmbientPower = gl.getUniformLocation(shader.program, 'uAmbientPower')
    gl.uniform1f(shader.uAmbientPower, 0.5)

    shader.uLinDist = gl.getUniformLocation(shader.program, 'uLinDist')
    gl.uniform1f(shader.uLinDist, 10)

    shader.uQuadConst = gl.getUniformLocation(shader.program, 'uQuadConst')
    shader.uQuadLin = gl.getUniformLocation(shader.program, 'uQuadLin')
    shader.uQuadQuad = gl.getUniformLocation(shader.program, 'uQuadQuad')
    shader.quad = gl.getUniformLocation(shader.program, 'quad')

    gl.uniform1f(shader.uQuadConst, 10)
    gl.uniform1f(shader.uQuadLin, 10)
    gl.uniform1f(shader.uQuadQuad, 10)
    gl.uniform1f(shader.quad, 0)
}

function initStuff(shader) {
    shader.vPos = gl.getAttribLocation(shader.program, "aVertexPosition");
    shader.vNorm = gl.getAttribLocation(shader.program, "aVertexNormal");

    shader.offset = gl.getUniformLocation(shader.program, 'offset');
    shader.curr = gl.getUniformLocation(shader.program, 'curr');
    shader.col = gl.getUniformLocation(shader.program, 'uColor');
    
    shader.mProj = gl.getUniformLocation(shader.program, 'mProj');
    shader.mView = gl.getUniformLocation(shader.program, 'mView');
    shader.mWorld = gl.getUniformLocation(shader.program, 'mWorld');
    shader.nMatrix = gl.getUniformLocation(shader.program, 'nMatrix');
    
    const b1 = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, b1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube), gl.STATIC_DRAW);

    const b3 = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b3);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube_idx), gl.STATIC_DRAW);
    gl.vertexAttribPointer(shader.vPos, 3, gl.FLOAT, false, 9 * 4, 0);
    switch (shader.useNorm) {
        case 1:
            gl.vertexAttribPointer(shader.vNorm, 3, gl.FLOAT, false, 9 * 4, 3 * 4);
            break;
        case 2:
            gl.vertexAttribPointer(shader.vNorm, 3, gl.FLOAT, false, 9 * 4, 6 * 4);
            break;
    
        default:
            break;
    }
    
    gl.enableVertexAttribArray(shader.vPos);
    gl.enableVertexAttribArray(shader.vNorm);
    
	shader.viewMatrix = new Float32Array(16);
	shader.projMatrix = new Float32Array(16);

	mat4.lookAt(shader.viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(shader.projMatrix, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(shader.mProj, gl.FALSE, shader.projMatrix);
    gl.uniformMatrix4fv(shader.mView, gl.FALSE, shader.viewMatrix);

    setupLights(shader);
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

    var worldMatrix = new Float32Array(16)
    var normMatrix = new Float32Array(9);

    var loop = function(){
        var t = (Math.sin(performance.now() / 200) * 0.5 + 0.5) * 0.2

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        if(currObj) gl.clearColor(0.5, 0.5, 0.5, 1)
        else gl.clearColor(0.5 + t, 0.5 + t, 0.5 + t, 1)

        gl.uniform1f(currentShader.uLinDist, linDistance)

        for(let j = 0; j < 4; j++){
            gl.uniform3fv(currentShader.offset, offsets[j])
            gl.uniform3fv(currentShader.col, colors[j])
            gl.uniform1f(currentShader.curr, (currObj == 1 || currObj - 2 == j) ? t : 0.0)

            let cubesCenterOffset = minus(offsets[j], offsets[4])

	        mat4.identity(worldMatrix)
            mat4.rotate(worldMatrix, worldMatrix, angles[0], [0, 1, 0]) // крутим себя относительно центра мира
            mat4.translate(worldMatrix, worldMatrix, minus(offsets[j], cubesCenterOffset)) // доходим до своей точки
            mat4.rotate(worldMatrix, worldMatrix, angles[1], [0, 1, 0]) // крутим себя относительно центра всех коробок
            mat4.translate(worldMatrix, worldMatrix, cubesCenterOffset) // двигаем на свою точку относительно центра всех коробок
            mat4.rotate(worldMatrix, worldMatrix, angles[j + 2], [0, 1, 0]) // мы на нуле, крутим себя
            
            mat3.normalFromMat4(normMatrix, worldMatrix);

            gl.uniformMatrix4fv(currentShader.mWorld, gl.FALSE, worldMatrix)
            gl.uniformMatrix3fv(currentShader.nMatrix, gl.FALSE, normMatrix)

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

var ambientPower = 0.5
var linDistance = 10
var quadConst = 10, quadLin = 10, quadQuad = 10
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
    else if (event.key == 'P'){
        currentShader = Phong
        gl.useProgram(currentShader.program)
    }
    else if (event.key == 'G'){
        currentShader = Gourand
        gl.useProgram(currentShader.program)
    }
    else if (event.key == 'l'){
        gl.uniform1f(currentShader.lambert, 0)
    }
    else if (event.key == 'L'){
        gl.uniform1f(currentShader.lambert, 1)
    }
    else if (event.key == 'q'){
        gl.uniform1f(currentShader.quad, 0)
    }
    else if (event.key == 'Q'){
        gl.uniform1f(currentShader.quad, 1)
    }
    else if (event.key == 'ArrowUp'){
        ambientPower = Math.min(ambientPower + 0.05, 1.0)
    }
    else if (event.key == 'ArrowDown'){
        ambientPower = Math.max(ambientPower - 0.05, 0.0)
    }

    gl.uniform1f(currentShader.uAmbientPower, ambientPower)
    gl.uniform1f(currentShader.uQuadConst, quadConst)
    gl.uniform1f(currentShader.uQuadLin, quadLin)
    gl.uniform1f(currentShader.uQuadQuad, quadQuad)
}

function minus(v1, v2){
    return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]
}