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
in vec2 aVertexTexure;

out vec3 lightDirection;
out vec3 normal;
out vec3 vertexPositionEye3;
out vec2 textureCord;

out float lightDist;

out vec4 vpos;

void main(void) {
    mat4 uMVMatrix = mView * mWorld;

    vec4 vertexPositionEye4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vertexPositionEye3 = vertexPositionEye4.xyz / vertexPositionEye4.w;

    lightDist = length(uLightPosition - vertexPositionEye3);
    lightDirection = normalize(uLightPosition - vertexPositionEye3);
    normal = normalize(nMatrix * normalize(aVertexNormal));

    vpos = mProj * uMVMatrix * vec4(aVertexPosition, 2.0);
    gl_Position = vpos;
    textureCord = aVertexTexure;
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

uniform sampler2D texture0;
uniform sampler2D texture1;
in vec2 textureCord;

uniform float textMix;

in vec4 vpos;

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

    vec3 vLightWeighting = uDiffuseMaterialColor * uDiffuseLightColor * diffuseLightDot;
    if(lambert == 0.0){
        vLightWeighting += uAmbientMaterialColor * uAmbientLightColor * uAmbientPower +
            uSpecularMaterialColor * uSpecularLightColor * specularLightParam;
    }

    float F = 1.0 / (uQuadConst + uQuadLin * lightDist + uQuadQuad * lightDist * lightDist);

    vec4 vColor = vec4(uColor + curr, 1.0);
    vec4 text0 = texture(texture0, textureCord);
    fragColor = vec4(vLightWeighting.rgb * F * text0.xyz, vColor.a);
}
`;

// document.addEventListener('keydown', onKeyDown, false);

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

const mesh = new glmesh('./orange.obj')
await mesh.load()

var image0 = new Image();
image0.src = './orangeC.jpg'

var image1 = new Image();
image1.src = './bump2.jpg';

image1.onload = await new Promise(r => setTimeout(r, 500));

await new Promise(r => setTimeout(r, 1000));

const cubes = []

var main = function(){ 
   
    for (let index = 0; index < 1; index++) {
        const Phong = {}
        Phong.program = initShaderProgram(gl, vsPhong, fsPhong)
        const params = {
            shader: Phong,
            mesh: mesh,
            images: [image0, image1],
            id: index.toString(),
            color: [0, 0, 0],
            angle: [0, 0, 0],
            offset: [0, 0, 0]
        }
        const temp = new globject(params)
        temp.glinit(gl)
        temp.setupLights(gl)
        cubes.push(temp)
    }

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

window.onload = start()