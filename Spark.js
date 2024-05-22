export function minus(v1, v2){
    return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]
}

function pluswise(a, b){
    const c = []
    for(let i = 0; i < a.length; i++){
        c.push(a[i]+b[i])
    }
    return c
}

export class SparkEmitter {
    constructor(gl, image, size, spark, track) {
        this.position = [0.0, 0.0, 0.0]
        this.positions = new Float32Array(size * 3)
        this.image = image
        this.spark = spark
        this.track = track
        this.size = size
        this.worldMatrix = new Float32Array(16)

        gl.useProgram(this.spark.program);
        this.texture0 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture0);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);

        mat4.identity(this.worldMatrix)
        gl.uniformMatrix4fv(this.spark.mWorld, gl.FALSE, this.worldMatrix)

        gl.useProgram(this.track.program);
        this.particles = []
        for(let i = 0; i < this.size; i++){
            this.particles.push(new Spark(gl, this, i, this.track))
        }
    }

    drawSparks(gl) {
        gl.useProgram(this.spark.program);
        // >>----- VAO
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(this.spark.vPos, 3, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(this.spark.vPos);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture0);
        // <<----- VAO

        gl.drawArrays(gl.POINTS, 0, this.size);
    }

    move() {
        this.particles.forEach(obj => {
            obj.move(performance.now())
        });
    }

    drawTracks(gl) {
        gl.useProgram(this.track.program);
        this.particles.forEach(obj => {
            obj.drawTrack(gl, this.track)
        });
    }
}

function randFloat(min, max) {
    return Math.random() * (max - min) + min
}

export class Spark {

    static FLOATSIZE = 4
    static DIST = 1
    static colorDest = [1.0, 0.64, 0.0]

    constructor(gl, parent, offset, shader) {
        this._offset = offset
        this.lastTime = performance.now()
        this.parent = parent
        this.shader = shader

        this.worldMatrix = new Float32Array(16)
        mat4.identity(this.worldMatrix)
        gl.uniformMatrix4fv(this.shader.mWorld, gl.FALSE, this.worldMatrix)

        this.init()
    }

    init() {
        this.speed = [randFloat(-0.01, 0.01), randFloat(-0.01, 0.01), randFloat(-0.01, 0.01)]
        this.color = [1.0,1.0,1.0]
        this.position = pluswise([randFloat(-0.02, 0.02), randFloat(-0.02, 0.02), randFloat(-0.02, 0.02)], this.parent.position)
        this.data = [...this.position, ...this.color]
        this.lives = 0
        for(let i = 0; i < 3; i++)
            this.parent.positions[this._offset * 3 + i] = 0.0
    }

    drawTrack(gl, shader) {
        // >>----- VAO
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.data), gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(shader.vPos, 3, gl.FLOAT, false, 6*4, 0);
        gl.vertexAttribPointer(shader.vCol, 3, gl.FLOAT, false, 6*4, 3*4);

        gl.enableVertexAttribArray(shader.vPos);
        gl.enableVertexAttribArray(shader.vCol);
        // <<----- VAO

        gl.drawArrays(gl.LINE_STRIP, 0, this.lives);
    }

    move(time) {
        const timeShift = (time - this.lastTime) / 3
        this.lastTime = time
        let dist = 0.0
        for(let i = 0; i < 3; i++){
            this.position[i] += (this.speed[i] * timeShift)
            this.parent.positions[this._offset * 3 + i] = this.position[i]
            dist += Math.pow(this.position[i] - this.parent.position[i], 2)
            this.color[i] -= (this.color[i] - Spark.colorDest[i]) / 20.0
        }

        this.lives++
        if(Math.sqrt(dist) >= Spark.DIST) this.init()
        else this.data.push(...this.position, ...this.color)
    }
}