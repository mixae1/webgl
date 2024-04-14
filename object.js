import OBJFile from 'obj-file-parser';

export function minus(v1, v2){
    return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]
}

export class glmesh {
    constructor(objname) {
        this.objname = objname
        this.data = []
    }

    async load() {
        fetch(this.objname)
        .then(response => response.text())
        .then(text => {
            const cache = new OBJFile(text).parse()
            cache.models[0].faces.forEach(face => {
                face.vertices.forEach(vert => {
                    this.data.push([
                                ...this.__xyz(cache.models[0].vertices[vert.vertexIndex - 1]),
                                ...this.__xyz(cache.models[0].vertexNormals[vert.vertexNormalIndex - 1]),
                                ...this.__uv(cache.models[0].textureCoords[vert.textureCoordsIndex - 1])
                            ])
                });
            });
        })
        .catch(e => console.error(e))
    }

    __xyz(obj) {
        return [obj.x, obj.y, obj.z]
    }

    __uv(obj) {
        return [obj.u, obj.v]
    }
} 

export class globject {

    FLOATSIZE = 4;

    constructor(params) {
        this.offset = [0, 0, 0]
        this.angle = params.angle
        this.worldMatrix = new Float32Array(16)
        this.needUpdate = false
        this.mesh = params.mesh
        this.images = params.images
        this.shader = params.shader
        this.color = params.color
        this.textMix = 0.5
        this.slider = document.getElementById(params.id)

        this.slider.oninput = () => {
            this.textMix = this.slider.value;
          }
    }

    glinit(gl) {
        gl.useProgram(this.shader.program);
        this.shader.vPos = gl.getAttribLocation(this.shader.program, "aVertexPosition");
        this.shader.vNorm = gl.getAttribLocation(this.shader.program, "aVertexNormal");
        this.shader.vText = gl.getAttribLocation(this.shader.program, "aVertexTexure");

        this.shader.offset = gl.getUniformLocation(this.shader.program, 'offset');
        this.shader.curr = gl.getUniformLocation(this.shader.program, 'curr');
        this.shader.col = gl.getUniformLocation(this.shader.program, 'uColor');
        
        this.shader.mProj = gl.getUniformLocation(this.shader.program, 'mProj');
        this.shader.mView = gl.getUniformLocation(this.shader.program, 'mView');
        this.shader.mWorld = gl.getUniformLocation(this.shader.program, 'mWorld');
        this.shader.nMatrix = gl.getUniformLocation(this.shader.program, 'nMatrix');

        this.shader.texture0 = gl.getUniformLocation(this.shader.program, 'texture0');
        this.shader.texture1 = gl.getUniformLocation(this.shader.program, 'texture1');

        this.shader.textMix = gl.getUniformLocation(this.shader.program, 'textMix');
        
        this.VBO = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.data.flat()), gl.STATIC_DRAW);
        
        gl.vertexAttribPointer(this.shader.vPos, 3, gl.FLOAT, false, 8 * 4, 0);
        gl.enableVertexAttribArray(this.shader.vPos);

        gl.vertexAttribPointer(this.shader.vNorm, 3, gl.FLOAT, false, 8 * 4, 3 * 4);
        gl.enableVertexAttribArray(this.shader.vNorm);

        gl.vertexAttribPointer(this.shader.vText, 2, gl.FLOAT, false, 8 * 4, 6 * 4);
        gl.enableVertexAttribArray(this.shader.vText);
        

        // const b4 = gl.createBuffer()
        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b4);
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.models[0].faces, gl.STATIC_DRAW);
        
        this.shader.viewMatrix = new Float32Array(16);
        this.shader.projMatrix = new Float32Array(16);

        mat4.lookAt(this.shader.viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(this.shader.projMatrix, glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 1000.0);

        gl.uniformMatrix4fv(this.shader.mProj, gl.FALSE, this.shader.projMatrix);
        gl.uniformMatrix4fv(this.shader.mView, gl.FALSE, this.shader.viewMatrix);

        this.texture0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.images[0].width, this.images[0].height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.images[0]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        this.texture1 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.images[1].width, this.images[1].height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.images[1]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        gl.uniform1f(this.shader.textMix, 0.5);
    }

    setupLights(gl) {
        gl.useProgram(this.shader.program);
        this.shader.uLightPosition = gl.getUniformLocation(this.shader.program, 'uLightPosition');
        this.shader.uAmbientLightColor = gl.getUniformLocation(this.shader.program, 'uAmbientLightColor');
        this.shader.uDiffuseLightColor = gl.getUniformLocation(this.shader.program, 'uDiffuseLightColor');
        this.shader.uSpecularLightColor = gl.getUniformLocation(this.shader.program, 'uSpecularLightColor');
        
        gl.uniform3fv(this.shader.uLightPosition, [-10.0, 3.0, -10.0]);
    
        gl.uniform3fv(this.shader.uAmbientLightColor, [0.1, 0.1, 0.1]);
        gl.uniform3fv(this.shader.uDiffuseLightColor, [0.7, 0.7, 0.7]);
        gl.uniform3fv(this.shader.uSpecularLightColor, [1.0, 1.0, 1.0]);
    
        this.shader.uAmbientMaterialColor = gl.getUniformLocation(this.shader.program, 'uAmbientMaterialColor')
        this.shader.uDiffuseMaterialColor = gl.getUniformLocation(this.shader.program, 'uDiffuseMaterialColor')
        this.shader.uSpecularMaterialColor = gl.getUniformLocation(this.shader.program, 'uSpecularMaterialColor')
    
        gl.uniform3fv(this.shader.uAmbientMaterialColor, [1.0, 0.5, 0.31]);
        gl.uniform3fv(this.shader.uDiffuseMaterialColor, [1.0, 0.5, 0.31]);
        gl.uniform3fv(this.shader.uSpecularMaterialColor, [0.5, 0.5, 0.5]);
    
        this.shader.lambert = gl.getUniformLocation(this.shader.program, 'lambert')
        gl.uniform1f(this.shader.lambert, 0)
    
        this.shader.uAmbientPower = gl.getUniformLocation(this.shader.program, 'uAmbientPower')
        gl.uniform1f(this.shader.uAmbientPower, 0.5)
       
        this.shader.uQuadConst = gl.getUniformLocation(this.shader.program, 'uQuadConst')
        this.shader.uQuadLin = gl.getUniformLocation(this.shader.program, 'uQuadLin')
        this.shader.uQuadQuad = gl.getUniformLocation(this.shader.program, 'uQuadQuad')
    
        gl.uniform1f(this.shader.uQuadConst, 1)
        gl.uniform1f(this.shader.uQuadLin, 0.01)
        gl.uniform1f(this.shader.uQuadQuad, 0.0001)
    }

    draw(gl) {
        gl.useProgram(this.shader.program)
        var t = (Math.sin(performance.now() / 200) * 0.5 + 0.5) * 0.2
        
        gl.uniform3fv(this.shader.offset, this.offset)
        gl.uniform3fv(this.shader.col, this.color)
        gl.uniform1f(this.shader.curr, 0.0)
        gl.uniform1i(this.shader.texture0, 0);
        gl.uniform1i(this.shader.texture1, 1);
        gl.uniform1f(this.shader.textMix, this.textMix);

        mat4.identity(this.worldMatrix)
        mat4.rotate(this.worldMatrix, this.worldMatrix, 0.5 + t, [0, 1, 0]) // крутим себя относительно центра мира
        mat4.translate(this.worldMatrix, this.worldMatrix, this.offset) // доходим до своей точки
        mat4.rotateX(this.worldMatrix, this.worldMatrix, this.angle[0])
        mat4.rotateY(this.worldMatrix, this.worldMatrix, this.angle[1])
        mat4.rotateZ(this.worldMatrix, this.worldMatrix, this.angle[2])
            
        var normMatrix = new Float32Array(9);
        mat3.normalFromMat4(normMatrix, this.worldMatrix);

        gl.uniformMatrix4fv(this.shader.mWorld, gl.FALSE, this.worldMatrix)
        gl.uniformMatrix3fv(this.shader.nMatrix, gl.FALSE, normMatrix)

        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.data.length);
    }
}