import glsp from "./gl-sp";

/**
 * GL Application
 */
export default class glapp {
    gl = null;
    glsps = {}

    start = function(canvas_name = "glcanvas"){
        var canvas = document.getElementById(canvas_name);
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

    initWebGL = function(canvas) {
        var names = ["webgl2", "webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        for (var ii = 0; ii < names.length; ++ii) {
            try {
                this.gl = canvas.getContext(names[ii]);
            } catch(e) {
    
            }
            if (this.gl) {
                break;
            }
        }
        
        if (!this.gl) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
        
        }
    
        return this.gl;
    }

    main = function(){
        this.glsps["default"] = new glsp(gl).program
    
        this.use_sp();
    
        this.draw();
    }

    use_sp = function(sp_name = "default"){
        gl.useProgram(glsps["default"]);
    }

    draw = function(){
        
    }
}
