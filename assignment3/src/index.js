import Camera from "../src/Camera.js";
import Cube from "../src/Cube.js";

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec2 v_UV;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;

  uniform vec4 u_BaseColor;
  uniform sampler2D u_Sampler0;
  uniform float u_TexColorWeight;

  void main() {
    vec4 texColor = texture2D(u_Sampler0, v_UV);
    gl_FragColor = (1.0 - u_TexColorWeight) * u_BaseColor 
                 + u_TexColorWeight * texColor;
  }
`;

let canvas;
let gl;
let camera;
let shaderVars;

let g_map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,0,1,1,1,0,0,0,2,0,0,0,0,3,0,0,0,1,1,1,0,0,0,0,2,0,1],
  [1,0,2,0,0,0,0,1,0,1,0,0,0,2,0,0,0,0,3,0,0,0,1,0,1,0,0,0,0,2,0,1],
  [1,0,2,2,2,0,0,1,0,1,0,0,0,2,2,2,0,0,3,3,3,0,1,0,1,0,0,2,2,2,0,1],
  [1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,1,0,4,4,4,4,0,0,1,1,1,1,0,1,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,0,1,0,4,0,0,4,0,0,1,0,0,1,0,1,0,1,0,1,1,1,1,0,1],
  [1,0,1,0,0,1,0,0,0,0,0,4,0,0,4,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,1],
  [1,0,1,0,0,1,0,0,0,0,0,4,4,4,4,0,0,1,1,1,1,0,0,0,0,0,1,0,0,1,0,1],
  [1,0,1,1,1,1,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,2,2,0,0,1,1,1,1,1,1,1,1,0,0,2,2,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,3,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,3,3,3,0,0,0,1],
  [1,0,0,0,3,0,3,0,0,0,0,0,1,0,4,4,4,4,0,1,0,0,0,0,0,3,0,3,0,0,0,1],
  [1,0,0,0,3,3,3,0,0,1,1,0,1,0,4,0,0,4,0,1,0,1,1,0,0,3,3,3,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,1,0,1,0,4,4,4,4,0,1,0,1,1,0,0,0,0,0,0,0,0,1],
  [1,0,2,2,2,2,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,2,2,2,2,0,0,0,1],
  [1,0,2,0,0,2,0,0,0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0,2,0,0,2,0,0,0,1],
  [1,0,2,0,0,2,0,0,3,3,3,0,0,0,0,0,0,0,0,0,0,3,3,3,0,2,0,0,2,0,0,1],
  [1,0,2,2,2,2,0,0,3,0,3,0,0,0,0,0,0,0,0,0,0,3,0,3,0,2,2,2,2,0,0,1],
  [1,0,0,0,0,0,0,0,3,3,3,0,0,1,1,1,1,1,1,0,0,3,3,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,1,1,1,0,0,0,1,0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,1],
  [1,0,4,4,4,0,1,0,0,1,0,0,0,1,0,2,2,0,1,0,0,0,1,0,0,1,0,4,4,4,0,1],
  [1,0,4,0,4,0,1,0,0,1,0,0,0,1,0,2,2,0,1,0,0,0,1,0,0,1,0,4,0,4,0,1],
  [1,0,4,4,4,0,1,1,1,1,0,0,0,1,0,0,0,0,1,0,0,0,1,1,1,1,0,4,4,4,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,1,1,1,1,1,0,0,1],
  [1,0,1,0,0,0,1,0,0,0,2,0,2,0,0,0,0,0,2,0,2,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,1,1,1,1,1,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,1,1,1,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function main() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get WebGL context.");
    return;
  }

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  shaderVars = connectVariablesToGLSL();

  camera = new Camera(canvas);

  document.addEventListener("keydown", keydown);

  canvas.onmousemove = mouseMove;

  initTextures();

  gl.clearColor(0.5, 0.7, 1.0, 1.0);

  requestAnimationFrame(tick);
}

function connectVariablesToGLSL() {
  const vars = {};

  vars.a_Position = gl.getAttribLocation(gl.program, "a_Position");
  vars.a_UV = gl.getAttribLocation(gl.program, "a_UV");

  vars.u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  vars.u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  vars.u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");

  vars.u_BaseColor = gl.getUniformLocation(gl.program, "u_BaseColor");
  vars.u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  vars.u_TexColorWeight = gl.getUniformLocation(gl.program, "u_TexColorWeight");

  return vars;
}

function initTextures() {
  const image = new Image();

  image.onload = function () {
    sendTextureToGLSL(image);
  };

  image.src = "../textures/wall.jpg";
}

function sendTextureToGLSL(image) {
  const texture = gl.createTexture();

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGB,
    gl.RGB,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.uniform1i(shaderVars.u_Sampler0, 0);
}

function keydown(ev) {
  ev.preventDefault();

  const key = ev.key.toLowerCase();

  if (key === "w") {
    camera.moveForward();
  } else if (key === "s") {
    camera.moveBackward();
  } else if (key === "a") {
    camera.moveLeft();
  } else if (key === "d") {
    camera.moveRight();
  } else if (key === "q") {
    camera.panLeft();
  } else if (key === "e") {
    camera.panRight();
  } else if (ev.key === "f" || ev.key === "F") {
  addBlockInFront();
  } else if (ev.key === "r" || ev.key === "R") {
    removeBlockInFront();
  }
}

let lastMouseX = null;
let lastMouseY = null;

function getBlockInFront() {
  let dx = camera.at.elements[0] - camera.eye.elements[0];
  let dz = camera.at.elements[2] - camera.eye.elements[2];

  let length = Math.sqrt(dx * dx + dz * dz);
  dx /= length;
  dz /= length;

  let worldX = camera.eye.elements[0] + dx * 2;
  let worldZ = camera.eye.elements[2] + dz * 2;

  let mapX = Math.floor(worldX + 16);
  let mapZ = Math.floor(worldZ + 16);

  if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) {
    return null;
  }

  return { x: mapX, z: mapZ };
}

function addBlockInFront() {
  let block = getBlockInFront();

  if (block === null) return;

  if (g_map[block.x][block.z] < 4) {
    g_map[block.x][block.z]++;
  }
}

function removeBlockInFront() {
  let block = getBlockInFront();

  if (block === null) return;

  if (g_map[block.x][block.z] > 0) {
    g_map[block.x][block.z]--;
  }
}

function mouseMove(ev) {
  if (ev.buttons !== 1) {
    lastMouseX = null;
    lastMouseY = null;
    return;
  }

  if (lastMouseX === null || lastMouseY === null) {
    lastMouseX = ev.clientX;
    lastMouseY = ev.clientY;
    return;
  }

  let dx = ev.clientX - lastMouseX;
  let dy = ev.clientY - lastMouseY;

  camera.panRight(dx * 0.3);
  camera.panUpDown(dy * 0.1);

  lastMouseX = ev.clientX;
  lastMouseY = ev.clientY;
}

function tick() {
  renderScene();
  requestAnimationFrame(tick);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(
    shaderVars.u_ViewMatrix,
    false,
    camera.viewMatrix.elements
  );

  gl.uniformMatrix4fv(
    shaderVars.u_ProjectionMatrix,
    false,
    camera.projectionMatrix.elements
  );

  //drawSky();
  drawGround();
  drawMap();
}

function drawSky() {
  gl.disable(gl.DEPTH_TEST);

  let sky = new Cube(gl, shaderVars);

  sky.color = [0.4, 0.7, 1.0, 1.0];
  sky.textureNum = -1;

  sky.matrix.scale(1000, 1000, 1000);
  sky.matrix.translate(-0.5, -0.5, -0.5);

  sky.render();

  gl.enable(gl.DEPTH_TEST);
}

function drawGround() {
  let ground = new Cube(gl, shaderVars);

  ground.color = [0.3, 0.8, 0.3, 1.0];
  ground.textureNum = -1;

  ground.matrix.translate(0, -0.55, 0);
  ground.matrix.scale(32, 0.1, 32);
  ground.matrix.translate(-0.5, 0, -0.5);

  ground.render();
}

function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      let height = g_map[x][z];

      for (let y = 0; y < height; y++) {
        let wall = new Cube(gl, shaderVars);

        wall.color = [1, 1, 1, 1];
        wall.textureNum = 0;

        wall.matrix.translate(x - 16, y - 0.5, z - 16);

        wall.render();
      }
    }
  }
}

main();