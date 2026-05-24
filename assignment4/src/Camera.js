export default class Camera {
  constructor(canvas) {
    this.fov = 60;
    this.eye = new Vector3([0, 2.2, 8]);
    this.at = new Vector3([0, 1.8, 7]);
    this.up = new Vector3([0, 1, 0]);
    this.speed = 0.35;
    this.panSpeed = 5;
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
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
    this.at.elements[1] = Math.max(this.eye.elements[1] - 10, Math.min(this.eye.elements[1] + 10, this.at.elements[1]));
    this.updateView();
  }

  moveForward() {
    this.moveFlat(1);
  }

  moveBackward() {
    this.moveFlat(-1);
  }

  moveLeft() {
    this.strafe(1);
  }

  moveRight() {
    this.strafe(-1);
  }

  moveFlat(sign) {
    let dx = this.at.elements[0] - this.eye.elements[0];
    let dz = this.at.elements[2] - this.eye.elements[2];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    this.eye.elements[0] += dx * this.speed * sign;
    this.eye.elements[2] += dz * this.speed * sign;
    this.at.elements[0] += dx * this.speed * sign;
    this.at.elements[2] += dz * this.speed * sign;
    this.updateView();
  }

  strafe(sign) {
    let dx = this.at.elements[0] - this.eye.elements[0];
    let dz = this.at.elements[2] - this.eye.elements[2];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    this.eye.elements[0] += dz * this.speed * sign;
    this.eye.elements[2] -= dx * this.speed * sign;
    this.at.elements[0] += dz * this.speed * sign;
    this.at.elements[2] -= dx * this.speed * sign;
    this.updateView();
  }

  panLeft(angle = this.panSpeed) {
    const f = new Vector3([
      this.at.elements[0] - this.eye.elements[0],
      this.at.elements[1] - this.eye.elements[1],
      this.at.elements[2] - this.eye.elements[2],
    ]);
    const rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(angle, 0, 1, 0);
    const fPrime = rotationMatrix.multiplyVector3(f);
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
