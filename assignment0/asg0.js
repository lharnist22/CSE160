let canvas;
let ctx;

function handleDrawEvent() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x1 = parseFloat(document.getElementById('v1x').value);
  let y1 = parseFloat(document.getElementById('v1y').value);
  let v1 = new Vector3([x1, y1, 0]);

  let x2 = parseFloat(document.getElementById('v2x').value);
  let y2 = parseFloat(document.getElementById('v2y').value);
  let v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, 'red');
  drawVector(v2, 'blue');
}

function handleDrawOperationEvent() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x1 = parseFloat(document.getElementById('v1x').value);
  let y1 = parseFloat(document.getElementById('v1y').value);
  let v1 = new Vector3([x1, y1, 0]);

  let x2 = parseFloat(document.getElementById('v2x').value);
  let y2 = parseFloat(document.getElementById('v2y').value);
  let v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, 'red');
  drawVector(v2, 'blue');

  let op = document.getElementById('operation').value;
  let scalar = parseFloat(document.getElementById('scalar').value);

    if (op === 'add') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.add(v2);
    drawVector(v3, 'green');

  } else if (op === 'sub') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    v3.sub(v2);
    drawVector(v3, 'green');

  } else if (op === 'mul') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    let v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');

  } else if (op === 'div') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    let v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, 'green');
    drawVector(v4, 'green');

  } else if (op === 'magnitude') {
    console.log('Magnitude v1:', v1.magnitude());
    console.log('Magnitude v2:', v2.magnitude());

  } else if (op === 'normalize') {
    let v3 = new Vector3([v1.elements[0], v1.elements[1], v1.elements[2]]);
    let v4 = new Vector3([v2.elements[0], v2.elements[1], v2.elements[2]]);
    v3.normalize();
    v4.normalize();
    drawVector(v3, 'green');
    drawVector(v4, 'green');
    console.log("Normalized v1:", v3.elements);
    console.log("Normalized v2:", v4.elements);
  } else if (op === 'angle') {
    if (v1.magnitude() === 0 || v2.magnitude() === 0) {
      console.log("Angle undefined (zero vector)");
      return;
    }

    let angle = angleBetween(v1, v2);
    console.log("Angle between v1 and v2:", angle);
  } else if (op === 'area') {
    let area = areaTriangle(v1, v2);
    console.log("Area of triangle:", area);
  }
  
}

function drawVector(v, color) {
  let cx = canvas.width / 2;
  let cy = canvas.height / 2;

  let x = v.elements[0] * 20;
  let y = v.elements[1] * 20;

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + x, cy - y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function angleBetween(v1, v2) {
  let dot = Vector3.dot(v1, v2);
  let mag1 = v1.magnitude();
  let mag2 = v2.magnitude();

  let cosTheta = dot / (mag1 * mag2);

  cosTheta = Math.max(-1, Math.min(1, cosTheta));

  let radians = Math.acos(cosTheta);
  let degrees = radians * (180 / Math.PI);

  return degrees;
}

function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);
  let area = cross.magnitude() / 2;
  return area;
}

function main() {
  canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.log('Failed to get the 2D context');
    return;
  }

  handleDrawEvent();
}