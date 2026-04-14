const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

/* Global variables to store the current settings for color, size, shape type, and segments for circles.
*/
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let g_shapesList = [];
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedType = POINT;
let g_selectedSegments = 10;


var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  console.log("canvas =", canvas);

  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  console.log("gl =", gl);

  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get storage location of u_Size');
    return;
  }
}

function click(ev) {
  let [x, y] = convertCoordinates(ev);

  let shape;

  if (g_selectedType == POINT) {
    shape = new Point();
  } else if (g_selectedType == TRIANGLE) {
    shape = new Triangle();
  } else {
    shape = new Circle();
  }

  shape.position = [x, y];
  shape.color = g_selectedColor.slice();
  shape.size = g_selectedSize;
  shape.segments = g_selectedSegments;
  g_shapesList.push(shape);

  renderAllShapes();
}

function convertCoordinates(ev) {
  let rect = ev.target.getBoundingClientRect();

  let x = ((ev.clientX - rect.left) - canvas.width / 2) / (canvas.width / 2);
  let y = (canvas.height / 2 - (ev.clientY - rect.top)) / (canvas.height / 2);

  return [x, y];
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  for (let i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
}

function drawTriangle(vertices) {
  let n = 3;

  let vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawPicture() {
  //This is my drawing of a house with a tree and a sun :)
  // I used Codex here to help me out a bit with the placement and to not have it be so tedious
  gl.clear(gl.COLOR_BUFFER_BIT);
  g_shapesList = [];

  gl.uniform4f(u_FragColor, 0.6, 0.3, 0.1, 1.0);
  drawTriangle([-0.4, -0.5,  0.0, -0.5, -0.4, -0.1]);
  drawTriangle([ 0.0, -0.5,  0.0, -0.1, -0.4, -0.1]);

  gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
  drawTriangle([-0.45, -0.1,  0.05, -0.1, -0.2, 0.25]);

  gl.uniform4f(u_FragColor, 0.3, 0.15, 0.05, 1.0);
  drawTriangle([-0.25, -0.5, -0.12, -0.5, -0.25, -0.25]);
  drawTriangle([-0.12, -0.5, -0.12, -0.25, -0.25, -0.25]);

  gl.uniform4f(u_FragColor, 0.2, 0.8, 1.0, 1.0);
  drawTriangle([-0.36, -0.28, -0.26, -0.28, -0.36, -0.18]);
  drawTriangle([-0.26, -0.28, -0.26, -0.18, -0.36, -0.18]);

  drawTriangle([-0.10, -0.28,  0.00, -0.28, -0.10, -0.18]);
  drawTriangle([ 0.00, -0.28,  0.00, -0.18, -0.10, -0.18]);

  gl.uniform4f(u_FragColor, 1.0, 1.0, 0.0, 1.0);
  drawTriangle([0.45, 0.65, 0.55, 0.65, 0.50, 0.80]);
  drawTriangle([0.45, 0.65, 0.55, 0.65, 0.50, 0.50]);
  drawTriangle([0.50, 0.80, 0.50, 0.50, 0.35, 0.65]);
  drawTriangle([0.50, 0.80, 0.50, 0.50, 0.65, 0.65]);

  gl.uniform4f(u_FragColor, 0.0, 0.8, 0.0, 1.0);
  drawTriangle([-1.0, -0.7, 1.0, -0.7, -1.0, -1.0]);
  drawTriangle([ 1.0, -0.7, 1.0, -1.0, -1.0, -1.0]);

  gl.uniform4f(u_FragColor, 0.0, 0.6, 0.0, 1.0);
  drawTriangle([0.25, -0.7, 0.35, -0.7, 0.30, -0.4]);
  drawTriangle([0.20, -0.55, 0.40, -0.55, 0.30, -0.25]);
  drawTriangle([0.15, -0.40, 0.45, -0.40, 0.30, -0.05]);

  gl.uniform4f(u_FragColor, 0.5, 0.25, 0.1, 1.0);
  drawTriangle([0.26, -0.7, 0.34, -0.7, 0.26, -0.5]);
  drawTriangle([0.34, -0.7, 0.34, -0.5, 0.26, -0.5]);

  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  drawTriangle([-0.95, 0.95, -0.95, 0.75, -0.90, 0.95]);
  drawTriangle([-0.95, 0.75, -0.90, 0.75, -0.90, 0.95]);
  drawTriangle([-0.95, 0.75, -0.95, 0.70, -0.80, 0.75]);
  drawTriangle([-0.95, 0.70, -0.80, 0.70, -0.80, 0.75]);
  drawTriangle([-0.75, 0.95, -0.75, 0.70, -0.70, 0.95]);
  drawTriangle([-0.75, 0.70, -0.70, 0.70, -0.70, 0.95]);
  drawTriangle([-0.65, 0.95, -0.65, 0.70, -0.60, 0.95]);
  drawTriangle([-0.65, 0.70, -0.60, 0.70, -0.60, 0.95]);
  drawTriangle([-0.75, 0.82, -0.60, 0.82, -0.75, 0.78]);
  drawTriangle([-0.60, 0.82, -0.60, 0.78, -0.75, 0.78]);
}

function addActionsForHtmlUI() {
  // I used Codex here to help me maake sure I added all of these properly
  document.getElementById('pointButton').onclick = function() {
    g_selectedType = POINT;
  };

  document.getElementById('segmentSlide').addEventListener('input', function() {
    g_selectedSegments = this.value;
  });

  document.getElementById('triButton').onclick = function() {
    g_selectedType = TRIANGLE;
  };

  document.getElementById('circleButton').onclick = function() {
    g_selectedType = CIRCLE;
  };

  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    renderAllShapes();
  };

  document.getElementById('drawingButton').onclick = function() {
    drawPicture();
  };

  document.getElementById('redSlide').addEventListener('input', function() {
    g_selectedColor[0] = this.value / 100;
  });

  document.getElementById('greenSlide').addEventListener('input', function() {
    g_selectedColor[1] = this.value / 100;
  });

  document.getElementById('blueSlide').addEventListener('input', function() {
    g_selectedColor[2] = this.value / 100;
  });

  document.getElementById('sizeSlide').addEventListener('input', function() {
    g_selectedSize = this.value;
  });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}



main();