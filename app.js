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

    gl.useProgram(program);
    initStuff(); //  initAttr(); initBuffers();

    drawScene();
}

const vsSource = 
`# version 300 es
in vec2 vPos;
in vec3 vCol;
uniform mat2 mRot;
out vec4 color;

void main(void) {
    gl_Position = vec4(mRot * vPos, 1.0, 1.0);
    color = vec4(vCol, 1.0);
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


const lab1 = [
    -0.5, -0.5, 0.4, 1.0, 0.8,
    0.5, -0.5, 0.4, 1.0, 0.8,
    0.5, 0.5, 0.4, 1.0, 0.8,
    -0.5, 0.5, 0.4, 1.0, 0.8,

    Math.cos(2 * Math.PI * 1/3) * 0.4, Math.sin(2 * Math.PI * 1/3) * 0.4, 1, 0, 0,
    Math.cos(2 * Math.PI * 2/3) * 0.4, Math.sin(2 * Math.PI * 2/3) * 0.4, 0, 1, 0,
    Math.cos(2 * Math.PI * 3/3) * 0.4, Math.sin(2 * Math.PI * 3/3) * 0.4, 0, 0, 1,
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

function initStuff() {
    vPos = gl.getAttribLocation(program, "vPos");
    vCol = gl.getAttribLocation(program, "vCol");

    var buf1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lab1), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 5 * 4, 0);
    gl.enableVertexAttribArray(vPos);
    
    gl.vertexAttribPointer(vCol, 3, gl.FLOAT, false, 5 * 4, 2 * 4);
    gl.enableVertexAttribArray(vCol);
}

function drawScene() {
    var mRot = gl.getUniformLocation(program, 'mRot');

    var loop = function(){
        let angle = performance.now() / 3000 * 2 * Math.PI;

        //mat2.copy([Math.cos(angle), -Math.sin(angle), Math.sin(angle), Math.cos(angle)])
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.uniformMatrix2fv(mRot, gl.FALSE, [1, 0, 0, 1]);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        
        gl.uniformMatrix2fv(mRot, gl.FALSE, [Math.cos(angle), -Math.sin(angle), Math.sin(angle), Math.cos(angle)]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 4, 3);
        
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

