
export default class Cube {
  constructor(gl, shaderVars) {
    this.gl = gl;
    this.shaderVars = shaderVars;

    this.color = [1, 1, 1, 1];
    this.textureNum = -1;
    this.matrix = new Matrix4();
  }

  render() {
    const gl = this.gl;
    const {
      a_Position,
      a_UV,
      u_ModelMatrix,
      u_BaseColor,
      u_TexColorWeight,
    } = this.shaderVars;

    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(
      u_BaseColor,
      this.color[0],
      this.color[1],
      this.color[2],
      this.color[3]
    );

    if (this.textureNum === -1) {
      gl.uniform1f(u_TexColorWeight, 0.0);
    } else {
      gl.uniform1f(u_TexColorWeight, 1.0);
    }

    drawCube(gl, a_Position, a_UV);
  }
}

function drawCube(gl, a_Position, a_UV) {
  const verticesUV = new Float32Array([
    // Front face
    0, 0, 1, 0, 0,
    1, 0, 1, 1, 0,
    1, 1, 1, 1, 1,
    0, 0, 1, 0, 0,
    1, 1, 1, 1, 1,
    0, 1, 1, 0, 1,

    // Back face
    1, 0, 0, 0, 0,
    0, 0, 0, 1, 0,
    0, 1, 0, 1, 1,
    1, 0, 0, 0, 0,
    0, 1, 0, 1, 1,
    1, 1, 0, 0, 1,

    // Top face
    0, 1, 1, 0, 0,
    1, 1, 1, 1, 0,
    1, 1, 0, 1, 1,
    0, 1, 1, 0, 0,
    1, 1, 0, 1, 1,
    0, 1, 0, 0, 1,

    // Bottom face
    0, 0, 0, 0, 0,
    1, 0, 0, 1, 0,
    1, 0, 1, 1, 1,
    0, 0, 0, 0, 0,
    1, 0, 1, 1, 1,
    0, 0, 1, 0, 1,

    // Right face
    1, 0, 1, 0, 0,
    1, 0, 0, 1, 0,
    1, 1, 0, 1, 1,
    1, 0, 1, 0, 0,
    1, 1, 0, 1, 1,
    1, 1, 1, 0, 1,

    // Left face
    0, 0, 0, 0, 0,
    0, 0, 1, 1, 0,
    0, 1, 1, 1, 1,
    0, 0, 0, 0, 0,
    0, 1, 1, 1, 1,
    0, 1, 0, 0, 1,
  ]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesUV, gl.STATIC_DRAW);

  const FSIZE = verticesUV.BYTES_PER_ELEMENT;

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}