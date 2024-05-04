import OBJFile from 'obj-file-parser';

export function minus(v1, v2){
    return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]
}

export class glmesh {
    constructor(objname) {
        this.objname = objname
        this.data = []
        this.collision_box = [0, 0, 0, 0, 0, 0] //minx miny minz maxx maxy maxz
    }

    async load(fast = true) {
        fetch(this.objname)
        .then(response => response.text())
        .then(text => {
            const cache = new OBJFile(text).parse()
            cache.models[0].faces.forEach(face => {
                for(let i = 2; i < face.vertices.length; i++){
                    this.data.push([
                        ...this.__xyz(cache.models[0].vertices[face.vertices[0].vertexIndex - 1]),
                        ...this.__xyz(cache.models[0].vertexNormals[face.vertices[0].vertexNormalIndex - 1]),
                        ...this.__uv(cache.models[0].textureCoords[face.vertices[0].textureCoordsIndex - 1]),

                        ...this.__xyz(cache.models[0].vertices[face.vertices[i-1].vertexIndex - 1]),
                        ...this.__xyz(cache.models[0].vertexNormals[face.vertices[i-1].vertexNormalIndex - 1]),
                        ...this.__uv(cache.models[0].textureCoords[face.vertices[i-1].textureCoordsIndex - 1]),

                        ...this.__xyz(cache.models[0].vertices[face.vertices[i].vertexIndex - 1]),
                        ...this.__xyz(cache.models[0].vertexNormals[face.vertices[i].vertexNormalIndex - 1]),
                        ...this.__uv(cache.models[0].textureCoords[face.vertices[i].textureCoordsIndex - 1])
                    ])
                }
                face.vertices.forEach(vert => {
                    const temp = this.__xyz(cache.models[0].vertices[vert.vertexIndex - 1])
                    this.collision_box[0] = Math.min(this.collision_box[0], temp[0])
                    this.collision_box[1] = Math.min(this.collision_box[1], temp[1])
                    this.collision_box[2] = Math.min(this.collision_box[2], temp[2])
                    this.collision_box[3] = Math.max(this.collision_box[3], temp[0])
                    this.collision_box[4] = Math.max(this.collision_box[4], temp[1])
                    this.collision_box[5] = Math.max(this.collision_box[5], temp[2])
                })

                // face.vertices.forEach(vert => {
                //     this.data.push([
                //         ...this.__xyz(cache.models[0].vertices[vert.vertexIndex - 1]),
                //         ...this.__xyz(cache.models[0].vertexNormals[vert.vertexNormalIndex - 1]),
                //         ...this.__uv(cache.models[0].textureCoords[vert.textureCoordsIndex - 1])
                //     ])
                // });
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
        this.offset = params.offset
        this.angle = params.angle
        this.worldMatrix = new Float32Array(16)
        this.needUpdate = false
        this.mesh = params.mesh
        this.images = params.images
        this.shader = params.shader
        this.color = params.color
        this.len = this.mesh.data.flat().length
        this.scale = [params.scale, params.scale, params.scale]
        this.id = params.id
        this.gravity = params.id == "ground" ? 0 : -0.01
        this.speed = [0, 0, 0]

    }

    glinit(gl) {
        this.VBO = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.mesh.data.flat()), gl.STATIC_DRAW);
        
        this.texture0 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture0);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.images[0].width, this.images[0].height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.images[0]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        this.texture1 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.images[1].width, this.images[1].height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.images[1]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }

    draw(gl) {
        gl.useProgram(this.shader.program)

        var t = (Math.sin(performance.now() / 200) * 0.5 + 0.5) * 0.2
        
        gl.uniform3fv(this.shader.offset, this.offset)
        gl.uniform3fv(this.shader.col, this.color)
        gl.uniform1f(this.shader.curr, 0.0)
        gl.uniform1i(this.shader.texture0, 0);
        gl.uniform1i(this.shader.texture1, 1);

        mat4.identity(this.worldMatrix)
        // mat4.rotate(this.worldMatrix, this.worldMatrix, 0.5 + t, [0, 1, 0]) // крутим себя относительно центра мира
        mat4.translate(this.worldMatrix, this.worldMatrix, this.offset) // доходим до своей точки
        mat4.rotateX(this.worldMatrix, this.worldMatrix, this.angle[0])
        mat4.rotateY(this.worldMatrix, this.worldMatrix, this.angle[1])
        mat4.rotateZ(this.worldMatrix, this.worldMatrix, this.angle[2])
        mat4.scale(this.worldMatrix, this.worldMatrix, this.scale)
        // mat4.fromRotationTranslationScaleOrigin(this.worldMatrix, this.angle, this.offset, this.scale, [0, 0, 0])
            
        var normMatrix = new Float32Array(9);
        mat3.normalFromMat4(normMatrix, this.worldMatrix);

        gl.uniformMatrix4fv(this.shader.mWorld, gl.FALSE, this.worldMatrix)
        gl.uniformMatrix3fv(this.shader.nMatrix, gl.FALSE, normMatrix)

        gl.uniform3fv(this.shader.uAmbientMaterialColor, [1.0, 0.5, 0.31]);
        gl.uniform3fv(this.shader.uDiffuseMaterialColor, [1.0, 0.5, 0.31]);
        gl.uniform3fv(this.shader.uSpecularMaterialColor, [0.5, 0.5, 0.5]);

        // >>----- VAO
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);

        gl.vertexAttribPointer(this.shader.vPos, 3, gl.FLOAT, false, 8 * 4, 0);
        gl.vertexAttribPointer(this.shader.vNorm, 3, gl.FLOAT, false, 8 * 4, 3 * 4);
        gl.vertexAttribPointer(this.shader.vText, 2, gl.FLOAT, false, 8 * 4, 6 * 4);

        gl.enableVertexAttribArray(this.shader.vPos);
        gl.enableVertexAttribArray(this.shader.vNorm);
        gl.enableVertexAttribArray(this.shader.vText);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture1);
        // <<----- VAO

        //gl.drawElements(gl.TRIANGLES, this.mesh.indices.flat().length, gl.UNSIGNED_SHORT, 0)
        gl.drawArrays(gl.TRIANGLES, 0, this.len);
    }

    static to_xyz(a){
        return {
            x: a[0],
            y: a[1],
            z: a[2]
        }
    }

    collision(obj) {
        let t1 = [this.mesh.collision_box[0], this.mesh.collision_box[1], this.mesh.collision_box[2]]
        let t2 = [this.mesh.collision_box[3], this.mesh.collision_box[4], this.mesh.collision_box[5]]
        // for(let i = 0; i < 3; i++) cb1[i + 3] = cb1[i + 3] - cb1[i]

        let t3 = [obj.mesh.collision_box[0], obj.mesh.collision_box[1], obj.mesh.collision_box[2]]
        let t4 = [obj.mesh.collision_box[3], obj.mesh.collision_box[4], obj.mesh.collision_box[5]]
        // for(let i = 0; i < 3; i++) cb2[i + 3] = cb2[i + 3] - cb2[i]

        // console.log(this.id + " " + a)
        // console.log(obj.id + " " + b)

        var l1 = globject.to_xyz(vec3.transformMat4(t1, t1, this.worldMatrix)),
            u1 = globject.to_xyz(vec3.transformMat4(t2, t2, this.worldMatrix)),
            l2 = globject.to_xyz(vec3.transformMat4(t3, t3, obj.worldMatrix)),
            u2 = globject.to_xyz(vec3.transformMat4(t4, t4, obj.worldMatrix))
     
        //      l2        u2
        //      |---------|
        // |--------|
        // l1       u1
     
        return ((l2.x <= u1.x && u1.x <= u2.x) || (l1.x <= u2.x && u2.x <= u1.x)) &&
               ((l2.y <= u1.y && u1.y <= u2.y) || (l1.y <= u2.y && u2.y <= u1.y)) &&
               ((l2.z <= u1.z && u1.z <= u2.z) || (l1.z <= u2.z && u2.z <= u1.z));
    }
}