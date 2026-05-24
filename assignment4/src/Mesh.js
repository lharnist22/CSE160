export default class Mesh {
  constructor(gl, shaderVars, vertices, normals, uvs = null) {
    this.gl = gl;
    this.shaderVars = shaderVars;
    this.color = [1, 1, 1, 1];
    this.textureNum = -1;
    this.matrix = new Matrix4();
    this.normalMatrix = new Matrix4();
    this.vertexCount = vertices.length / 3;
    this.vertexBuffer = createBuffer(gl, vertices);
    this.normalBuffer = createBuffer(gl, normals);
    this.uvBuffer = createBuffer(gl, uvs || new Float32Array((vertices.length / 3) * 2));
  }

  render() {
    const gl = this.gl;
    const s = this.shaderVars;

    this.normalMatrix.setInverseOf(this.matrix);
    this.normalMatrix.transpose();

    gl.uniformMatrix4fv(s.u_ModelMatrix, false, this.matrix.elements);
    gl.uniformMatrix4fv(s.u_NormalMatrix, false, this.normalMatrix.elements);
    gl.uniform4f(s.u_BaseColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(s.u_TexColorWeight, this.textureNum === -1 ? 0.0 : 1.0);

    bindAttribute(gl, s.a_Position, this.vertexBuffer, 3);
    bindAttribute(gl, s.a_Normal, this.normalBuffer, 3);
    bindAttribute(gl, s.a_UV, this.uvBuffer, 2);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
  }
}

function createBuffer(gl, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

function bindAttribute(gl, attribute, buffer, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attribute);
}
