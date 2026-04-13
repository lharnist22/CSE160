class Triangle {
  constructor() {
    this.type = 'triangle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

    render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size;

    let d = size / 200.0;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    drawTriangle([
      xy[0], xy[1],
      xy[0] + d, xy[1],
      xy[0], xy[1] + d
    ]);
  }
}