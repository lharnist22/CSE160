class Circle {
  constructor() {
    this.type = 'circle';
    this.position = [0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = 10;
  }

  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size;
    let segments = this.segments;

    let d = size / 200.0;

    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    let angleStep = 360 / segments;

    for (let angle = 0; angle < 360; angle += angleStep) {
      let rad1 = angle * Math.PI / 180;
      let rad2 = (angle + angleStep) * Math.PI / 180;

      let x1 = xy[0] + d * Math.cos(rad1);
      let y1 = xy[1] + d * Math.sin(rad1);

      let x2 = xy[0] + d * Math.cos(rad2);
      let y2 = xy[1] + d * Math.sin(rad2);

      drawTriangle([
        xy[0], xy[1],
        x1, y1,
        x2, y2
      ]);
    }
  }
}