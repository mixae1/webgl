/**
 * GL Shader Program
 */
export default class glsp {
    program = null
    
    constructor(gl) {
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.load_shader(gl, gl.VERTEX_SHADER, vs));
        gl.attachShader(this.program, this.load_shader(gl, gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(this.program);
    
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.program));
            return null;
        }

        this.init_stuff(gl);

        return program;
    }

    load_shader = function(gl, type, source) {
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

    worldMatrix = null
    
    vPos = null
    vNorm = null
    
    col = null
    curr = null
    offset = null

    mProj = null
    mView = null
    mWorld = null

    init_stuff = function(gl) {
        this.vPos = gl.getAttribLocation(this.this.program, "vPos");
        this.vNorm = gl.getAttribLocation(this.program, "vNorm");
    
        this.col = gl.getUniformLocation(this.program, 'col');
        this.offset = gl.getUniformLocation(this.program, 'offset');
        this.curr = gl.getUniformLocation(this.program, 'curr');
        
        this.mProj = gl.getUniformLocation(this.program, 'mProj');
        this.mView = gl.getUniformLocation(this.program, 'mView');
        this.mWorld = gl.getUniformLocation(this.program, 'mWorld');
        
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cube), gl.STATIC_DRAW);
        gl.vertexAttribPointer(this.vPos, 3, gl.FLOAT, false, 6 * 4, 0);
        gl.vertexAttribPointer(this.vNorm, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube_idx), gl.STATIC_DRAW);
        
        gl.enableVertexAttribArray(this.vPos);
        gl.enableVertexAttribArray(this.vNorm);
        
        this.worldMatrix = new Float32Array(16);
    }

    process = function(){

    }
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
in vec3 vNorm;

out vec3 v_color;
out vec3 v_normal;

void main(void) {
    gl_Position = mProj * mView * mWorld * vec4(vPos, 3.0);
    v_color = col * curr;
    v_normal = mat3(mWorld) * vNorm;
}
`;

const fs = 
`# version 300 es
precision highp float;

in vec3 v_color;
in vec3 v_normal;
out vec4 fragColor;

void main(void) {
    vec3 normal = normalize(v_normal);
    vec3 lDir = normalize(vec3(1.0, 0.4, -1.0));
    float lKoef = dot(lDir, normal) * .5 + .5;
    fragColor = vec4(v_color * lKoef, 1.0);
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
