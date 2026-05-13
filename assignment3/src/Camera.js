export default class Camera {
  constructor(canvas) {
    this.fov = 60;

    this.eye = new Vector3([0, 2, 8]);
    this.at = new Vector3([0, 2, 7]);
    this.up = new Vector3([0, 1, 0]);

    this.speed = 0.3;
    this.panSpeed = 5;

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      1000
    );

    this.updateView();
  }

  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  }

panUpDown(amount) {
  this.at.elements[1] -= amount * 0.05;

  // Clamp vertical look
  if (this.at.elements[1] > this.eye.elements[1] + 10) {
    this.at.elements[1] = this.eye.elements[1] + 10;
  }

  if (this.at.elements[1] < this.eye.elements[1] - 10) {
    this.at.elements[1] = this.eye.elements[1] - 10;
  }

  this.updateView();
}

  getForward() {
    let f = new Vector3([
      this.at.elements[0] - this.eye.elements[0],
      this.at.elements[1] - this.eye.elements[1],
      this.at.elements[2] - this.eye.elements[2],
    ]);
    f.normalize();
    return f;
  }

  moveForward() {
  let dx = this.at.elements[0] - this.eye.elements[0];
  let dz = this.at.elements[2] - this.eye.elements[2];

  let length = Math.sqrt(dx * dx + dz * dz);
  dx /= length;
  dz /= length;

  this.eye.elements[0] += dx * this.speed;
  this.eye.elements[2] += dz * this.speed;
  this.at.elements[0] += dx * this.speed;
  this.at.elements[2] += dz * this.speed;

  this.updateView();
}

moveBackward() {
  let dx = this.at.elements[0] - this.eye.elements[0];
  let dz = this.at.elements[2] - this.eye.elements[2];

  let length = Math.sqrt(dx * dx + dz * dz);
  dx /= length;
  dz /= length;

  this.eye.elements[0] -= dx * this.speed;
  this.eye.elements[2] -= dz * this.speed;
  this.at.elements[0] -= dx * this.speed;
  this.at.elements[2] -= dz * this.speed;

  this.updateView();
}

moveLeft() {
  let dx = this.at.elements[0] - this.eye.elements[0];
  let dz = this.at.elements[2] - this.eye.elements[2];

  let length = Math.sqrt(dx * dx + dz * dz);
  dx /= length;
  dz /= length;

  this.eye.elements[0] += dz * this.speed;
  this.eye.elements[2] -= dx * this.speed;
  this.at.elements[0] += dz * this.speed;
  this.at.elements[2] -= dx * this.speed;

  this.updateView();
}

moveRight() {
  let dx = this.at.elements[0] - this.eye.elements[0];
  let dz = this.at.elements[2] - this.eye.elements[2];

  let length = Math.sqrt(dx * dx + dz * dz);
  dx /= length;
  dz /= length;

  this.eye.elements[0] -= dz * this.speed;
  this.eye.elements[2] += dx * this.speed;
  this.at.elements[0] -= dz * this.speed;
  this.at.elements[2] += dx * this.speed;

  this.updateView();
}

  panLeft(angle = this.panSpeed) {
    let f = new Vector3([
      this.at.elements[0] - this.eye.elements[0],
      this.at.elements[1] - this.eye.elements[1],
      this.at.elements[2] - this.eye.elements[2],
    ]);

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(angle, 0, 1, 0);

    let fPrime = rotationMatrix.multiplyVector3(f);

    this.at = new Vector3([
      this.eye.elements[0] + fPrime.elements[0],
      this.eye.elements[1] + fPrime.elements[1],
      this.eye.elements[2] + fPrime.elements[2],
    ]);

    this.updateView();
  }

  panRight(angle = this.panSpeed) {
    this.panLeft(-angle);
  }
}