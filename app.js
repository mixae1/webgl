import { glmesh, globject } from "./object";

const vsPhong = await (await fetch("vsPhong.glsl")).text();
const fsPhong = await (await fetch("fsPhong.glsl")).text();

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

const house = new glmesh('./house/wooden watch tower2.obj')
const dog = new glmesh('./dog/13463_Australian_Cattle_Dog_v3.obj')
const cat = new glmesh('./cat/12221_Cat_v1_l3.obj')
const bird = new glmesh('./bird/12248_Bird_v1_L2.obj')
const grass = new glmesh('./grass/Trava Kolosok.obj')
const cube = new glmesh('./cube.obj')

await house.load()
await dog.load()
await cat.load()
await bird.load()
await grass.load()
await cube.load()

const images = [
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image(),
    new Image()
] 
images[0].src = './house/Wood_Tower_Col.jpg'
images[1].src = './house/Wood_Tower_Nor.jpg'

images[2].src = './dog/Australian_Cattle_Dog_dif.jpg'
images[3].src = './dog/Australian_Cattle_Dog_bump.jpg'

images[4].src = './cat/Cat_bump.jpg'
images[5].src = './cat/Cat_diffuse.jpg'

images[6].src = './bird/12248_Bird_v1_diff.jpg'

images[7].src = './grass/Trava Kolosok.jpg'
images[8].src = './grass/Trava Kolosok Cut.jpg'

images[9].src = './model.jpg'

await new Promise(r => setTimeout(r, 1000));

const objects = []
const PI = 3.14
const PI2 = 2 * PI

var main = function(){ 
    const Phong = initShaderProgram(gl, vsPhong, fsPhong)
    let params = {}, temp = null

    if(true){
        params = {
            shader: Phong,
            mesh: cube,
            images: [images[9], images[9]],
            id: "ground",
            color: [0, 0, 0],
            angle: [0, 0, 0, 1],
            offset: [0, -10, 0],
            scale: 10
        }
        temp = new globject(params)
        temp.glinit(gl)
        objects.push(temp)
    }

    // house
    if(true){
        params = {
            shader: Phong,
            mesh: house,
            images: [images[0], images[1]],
            id: "house",
            color: [0, 0, 0],
            angle: [0, 0, 0, 1],
            offset: [0, 1, 0],
            scale: 0.5
        }
        temp = new globject(params)
        temp.glinit(gl)
        objects.push(temp)
    }

    // dog
    if(true){
        params = {
            shader: Phong,
            mesh: dog,
            images: [images[2], images[3]],
            id: "dog",
            color: [0, 0, 0],
            angle: [-PI/2, 0, -PI, 1],
            offset: [3, 4, 0],
            scale: 0.05
        }
        temp = new globject(params)
        temp.glinit(gl)
        objects.push(temp)
    }

    // cat
    if(true){
        params = {
            shader: Phong,
            mesh: cat,
            images: [images[4], images[5]],
            id: "cat",
            color: [0, 0, 0],
            angle: [-PI/2, 0, -PI, 1],
            offset: [-3, 4, 0],
            scale: 0.035
        }
        temp = new globject(params)
        temp.glinit(gl)
        objects.push(temp)
    }

    // bird
    if(true){
        params = {
            shader: Phong,
            mesh: bird,
            images: [images[6], 0],
            id: "bird",
            color: [0, 0, 0],
            angle: [-PI/2, 0, -PI, 1],
            offset: [0, 4, -3],
            scale: 0.02
        }
        temp = new globject(params)
        temp.glinit(gl)
        objects.push(temp)
    }

    // grass
    if(false){
        params = {
            shader: Phong,
            mesh: grass,
            images: [images[7], images[8]],
            id: "grass",
            color: [0, 0, 0],
            angle: [0, 0, 0, 1],
            offset: [0, -1, 0],
            scale: 0.001
        }
        temp = new globject(params)
        temp.glinit(gl)
        objects.push(temp)
    }


    drawScene();
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
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
    shaderProgram.vNorm = gl.getAttribLocation(shaderProgram.program, "aVertexNormal");
    shaderProgram.vText = gl.getAttribLocation(shaderProgram.program, "aVertexTexure");
    
    shaderProgram.mProj = gl.getUniformLocation(shaderProgram.program, 'mProj');
    shaderProgram.mView = gl.getUniformLocation(shaderProgram.program, 'mView');
    shaderProgram.mWorld = gl.getUniformLocation(shaderProgram.program, 'mWorld');
    shaderProgram.nMatrix = gl.getUniformLocation(shaderProgram.program, 'nMatrix');

    shaderProgram.texture0 = gl.getUniformLocation(shaderProgram.program, 'texture0');
    shaderProgram.texture1 = gl.getUniformLocation(shaderProgram.program, 'texture1');
    
    shaderProgram.viewMatrix = new Float32Array(16);
    shaderProgram.projMatrix = new Float32Array(16);

    mat4.lookAt(shaderProgram.viewMatrix, [0, 2, -6], [0, 0, 0], [0, 6, 2]);
    mat4.perspective(shaderProgram.projMatrix, glMatrix.toRadian(70), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

    gl.uniformMatrix4fv(shaderProgram.mProj, gl.FALSE, shaderProgram.projMatrix);
    gl.uniformMatrix4fv(shaderProgram.mView, gl.FALSE, shaderProgram.viewMatrix);

    shaderProgram.uLightPosition = gl.getUniformLocation(shaderProgram.program, 'uLightPosition');
    shaderProgram.uAmbientLightColor = gl.getUniformLocation(shaderProgram.program, 'uAmbientLightColor');
    shaderProgram.uDiffuseLightColor = gl.getUniformLocation(shaderProgram.program, 'uDiffuseLightColor');
    shaderProgram.uSpecularLightColor = gl.getUniformLocation(shaderProgram.program, 'uSpecularLightColor');
    
    gl.uniform3fv(shaderProgram.uLightPosition, [-12.0, 8.0, -8.0]);

    gl.uniform3fv(shaderProgram.uAmbientLightColor, [0.5, 0.5, 0.5]);
    gl.uniform3fv(shaderProgram.uDiffuseLightColor, [0.7, 0.7, 0.7]);
    gl.uniform3fv(shaderProgram.uSpecularLightColor, [1.0, 1.0, 1.0]);

    shaderProgram.uAmbientMaterialColor = gl.getUniformLocation(shaderProgram.program, 'uAmbientMaterialColor')
    shaderProgram.uDiffuseMaterialColor = gl.getUniformLocation(shaderProgram.program, 'uDiffuseMaterialColor')
    shaderProgram.uSpecularMaterialColor = gl.getUniformLocation(shaderProgram.program, 'uSpecularMaterialColor')

    shaderProgram.uAmbientPower = gl.getUniformLocation(shaderProgram.program, 'uAmbientPower')
    gl.uniform1f(shaderProgram.uAmbientPower, 0.5)
    
    shaderProgram.uQuadConst = gl.getUniformLocation(shaderProgram.program, 'uQuadConst')
    shaderProgram.uQuadLin = gl.getUniformLocation(shaderProgram.program, 'uQuadLin')
    shaderProgram.uQuadQuad = gl.getUniformLocation(shaderProgram.program, 'uQuadQuad')

    gl.uniform1f(shaderProgram.uQuadConst, 1)
    gl.uniform1f(shaderProgram.uQuadLin, 0.01)
    gl.uniform1f(shaderProgram.uQuadQuad, 0.0001)

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

        if(bools[0]){
            character.speed[0] = Math.sin(character.angle[2]) / 100
            character.speed[2] = Math.cos(character.angle[2]) / 100
        } else if(bools[2]){
            character.speed[0] = -Math.sin(character.angle[2]) / 100
            character.speed[2] = -Math.cos(character.angle[2]) / 100
        } else {
            character.speed[0] = 0
            character.speed[2] = 0
        }
        
        if(bools[1]){
            character.angle[2] += 0.01
        }else if(bools[3]) {
            character.angle[2] -= 0.01
        }

        switch(catState[0]) {
            case 0:
                // forward
                if(catState[1] == 0) {
                    catState[0] = 1;
                    catState[1] = 100;
                }
                else {
                    catState[1]--;
                    catty.speed[0] = Math.sin(catty.angle[2]) / 100
                    catty.speed[2] = Math.cos(catty.angle[2]) / 100
                } 
                
                break;
            case 1:
                // rotate
                if(catState[1] == 0) {
                    catState[0] = 0;
                    catState[1] = 400;
                }
                else {
                    catty.angle[2] += PI / 100
                    catState[1]--;
                    catty.speed[0] = 0
                    catty.speed[2] = 0
                }
                break;
        }

        objects.forEach(obj => {
            obj.offset[1] += obj.gravity
            for(let i = 0; i < 3; i++) obj.offset[i] += obj.speed[i]
        });

        for(let j = 0; j < objects.length; j++){
            for(let i = j + 1; i < objects.length; i++){
                if(objects[j].collision(objects[i])){
                    if(objects[i].id == "ground" || objects[j].id == "ground"){
                        objects[i].offset[1] -= objects[i].gravity
                        objects[j].offset[1] -= objects[j].gravity
                    }
                    else{
                        for(let k = 0; k < 3; k++){
                            character.offset[k] -= character.speed[k] * 2
                        }
                    }
                }
            }
        }

        objects.forEach(obj => {
            obj.draw(gl)
        });

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

window.onload = start()

document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);

const character = objects.filter(obj => obj.id == "bird")[0]
const catty = objects.filter(obj => obj.id == "cat")[0]

const bools = [false, false, false, false]
let catState = [0, 200]

function onKeyDown(event)
{
    if (event.key == 'ArrowUp')
    {
        bools[0] = true
    }
    if (event.key == 'ArrowLeft')
    {
        bools[1] = true
    }
    if (event.key == 'ArrowDown')
    {
        bools[2] = true
    }
    if (event.key == 'ArrowRight')
    {
        bools[3] = true
    }
}

function onKeyUp(event)
{
    if (event.key == 'ArrowUp')
    {
        bools[0] = false
    }
    if (event.key == 'ArrowLeft')
    {
        bools[1] = false
    }
    if (event.key == 'ArrowDown')
    {
        bools[2] = false
    }
    if (event.key == 'ArrowRight')
    {
        bools[3] = false
    }
}