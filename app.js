import { glmesh, globject } from "./object";

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

    gl_Position = mProj * uMVMatrix * vec4(aVertexPosition, 1.0);
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

uniform float lambert;

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

    float F = 1.0 / (uQuadConst + uQuadLin * lightDist + uQuadQuad * lightDist * lightDist);

    vec4 vColor = vec4(uColor + curr, 1.0);
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

const mesh = new glmesh('./cube.obj')
await mesh.load()

await new Promise(r => setTimeout(r, 1000));

console.log(mesh.data)

const cubes = []

var main = function(){ 
   
    for (let index = 0; index < 4; index++) {
        const Phong = {}
        Phong.program = initShaderProgram(gl, vsPhong, fsPhong)
        const temp = new globject(mesh, Phong)
        temp.glinit(gl)
        temp.setupLights(gl)
        cubes.push(new globject(mesh, Phong))
    }

    cubes[0].offset = [-2, 0, 0]
    cubes[1].offset = [0, 0, 0]
    cubes[2].offset = [2, 0, 0]
    cubes[3].offset = [0, 2, 0]

    drawScene();
}

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

function drawScene() {
    var loop = function(){
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.clearColor(0.5, 0.5, 0.5, 1)

        cubes.forEach(cube => {
            cube.draw(gl)
        });

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function onKeyDown(event)
{
}

window.onload = start()