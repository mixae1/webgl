import { SparkEmitter } from "./Spark";
import { FireworkEmitter } from "./Firework";

const vsSpark = await (await fetch("vsSpark.glsl")).text();
const fsSpark = await (await fetch("fsSpark.glsl")).text();
const vsTrack = await (await fetch("vsTrack.glsl")).text();
const fsTrack = await (await fetch("fsTrack.glsl")).text();

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

const particles = []

var emitter = null
var firework = null
var spark = null
var track = null

var main = function(){ 
    spark = initSparkProgram(vsSpark, fsSpark)
    track = initTrackProgram(vsTrack, fsTrack)

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 

    const image = new Image()
    image.addEventListener('load', function() {
        // emitter = new SparkEmitter(gl, image, 200, spark, track)
        // emitter.position = [1.0, 0.0, -0.5]

        firework = new FireworkEmitter(gl, image, 400, spark, track)

        requestAnimationFrame(drawScene);
    });
    image.src = './spark.png'
}

function initSparkProgram(vsSource, fsSource) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);
    
    const shaderProgram = {}
    shaderProgram.program = gl.createProgram();
    gl.attachShader(shaderProgram.program, vertexShader);
    gl.attachShader(shaderProgram.program, fragmentShader);
    gl.linkProgram(shaderProgram.program);

    if (!gl.getProgramParameter(shaderProgram.program, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram.program));
        return null;
    }

    gl.useProgram(shaderProgram.program);
    shaderProgram.vPos = gl.getAttribLocation(shaderProgram.program, "aVertexPosition");
    shaderProgram.vActive = gl.getAttribLocation(shaderProgram.program, "aActive");
    
    shaderProgram.mProj = gl.getUniformLocation(shaderProgram.program, 'mProj');
    shaderProgram.mView = gl.getUniformLocation(shaderProgram.program, 'mView');
    shaderProgram.mWorld = gl.getUniformLocation(shaderProgram.program, 'mWorld');

    shaderProgram.texture0 = gl.getUniformLocation(shaderProgram.program, 'texture0');
    
    shaderProgram.viewMatrix = new Float32Array(16);
    shaderProgram.projMatrix = new Float32Array(16);

    mat4.lookAt(shaderProgram.viewMatrix, [0, 2, -6], [0, 0, 0], [0, 6, 2]);
    mat4.perspective(shaderProgram.projMatrix, glMatrix.toRadian(70), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(shaderProgram.mProj, gl.FALSE, shaderProgram.projMatrix);
    gl.uniformMatrix4fv(shaderProgram.mView, gl.FALSE, shaderProgram.viewMatrix);

    return shaderProgram;
}

function initTrackProgram(vsSource, fsSource){
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);
    
    const shaderProgram = {}
    shaderProgram.program = gl.createProgram();
    gl.attachShader(shaderProgram.program, vertexShader);
    gl.attachShader(shaderProgram.program, fragmentShader);
    gl.linkProgram(shaderProgram.program);

    if (!gl.getProgramParameter(shaderProgram.program, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram.program));
        return null;
    }

    gl.useProgram(shaderProgram.program);
    shaderProgram.vPos = gl.getAttribLocation(shaderProgram.program, "aVertexPosition");
    shaderProgram.vCol = gl.getAttribLocation(shaderProgram.program, "aVertexColor");
    shaderProgram.vActive = gl.getAttribLocation(shaderProgram.program, "aActive");
    
    shaderProgram.mProj = gl.getUniformLocation(shaderProgram.program, 'mProj');
    shaderProgram.mView = gl.getUniformLocation(shaderProgram.program, 'mView');
    shaderProgram.mWorld = gl.getUniformLocation(shaderProgram.program, 'mWorld');
    
    shaderProgram.viewMatrix = new Float32Array(16);
    shaderProgram.projMatrix = new Float32Array(16);

    mat4.lookAt(shaderProgram.viewMatrix, [0, 2, -6], [0, 0, 0], [0, 6, 2]);
    mat4.perspective(shaderProgram.projMatrix, glMatrix.toRadian(70), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(shaderProgram.mProj, gl.FALSE, shaderProgram.projMatrix);
    gl.uniformMatrix4fv(shaderProgram.mView, gl.FALSE, shaderProgram.viewMatrix);

    return shaderProgram;
}

function loadShader(type, source) {
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

        // emitter.move()
        // emitter.drawTracks(gl)
        // emitter.drawSparks(gl)

        firework.move()
        firework.drawTracks(gl)
        firework.drawSparks(gl)

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

window.onload = start()