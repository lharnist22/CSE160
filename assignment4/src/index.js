import Camera from "./Camera.js";
import Cube from "./Cube.js";
import Sphere from "./Sphere.js";
import OBJModel from "./OBJModel.js";

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  attribute vec2 a_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  varying vec3 v_Normal;
  varying vec3 v_WorldPos;
  varying vec2 v_UV;

  void main() {
    vec4 worldPos = u_ModelMatrix * a_Position;
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * worldPos;
    v_WorldPos = worldPos.xyz;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
    v_UV = a_UV;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;

  varying vec3 v_Normal;
  varying vec3 v_WorldPos;
  varying vec2 v_UV;

  uniform vec4 u_BaseColor;
  uniform sampler2D u_Sampler0;
  uniform float u_TexColorWeight;

  uniform vec3 u_CameraPos;
  uniform vec3 u_PointLightPos;
  uniform vec3 u_PointLightColor;
  uniform int u_PointLightOn;
  uniform vec3 u_SpotLightPos;
  uniform vec3 u_SpotLightDir;
  uniform float u_SpotCutoff;
  uniform int u_SpotLightOn;
  uniform int u_LightingOn;
  uniform int u_NormalOn;

  vec3 phong(vec3 lightPos, vec3 lightColor, float strength) {
    vec3 normal = normalize(v_Normal);
    vec3 lightDir = normalize(lightPos - v_WorldPos);
    vec3 viewDir = normalize(u_CameraPos - v_WorldPos);
    vec3 reflectDir = reflect(-lightDir, normal);

    float diffuse = max(dot(normal, lightDir), 0.0);
    float specular = 0.0;
    if (diffuse > 0.0) {
      specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    }

    float distance = length(lightPos - v_WorldPos);
    float attenuation = 1.0 / (1.0 + 0.035 * distance + 0.01 * distance * distance);
    return lightColor * strength * attenuation * (0.75 * diffuse + 0.65 * specular);
  }

  void main() {
    vec4 texColor = texture2D(u_Sampler0, v_UV);
    vec4 base = (1.0 - u_TexColorWeight) * u_BaseColor + u_TexColorWeight * texColor;

    if (u_NormalOn == 1) {
      gl_FragColor = vec4(normalize(v_Normal) * 0.5 + 0.5, 1.0);
      return;
    }

    if (u_LightingOn == 0) {
      gl_FragColor = base;
      return;
    }

    vec3 lighting = vec3(0.18, 0.18, 0.2);

    if (u_PointLightOn == 1) {
      lighting += phong(u_PointLightPos, u_PointLightColor, 1.0);
    }

    if (u_SpotLightOn == 1) {
      vec3 spotToFrag = normalize(v_WorldPos - u_SpotLightPos);
      float spotEffect = dot(spotToFrag, normalize(u_SpotLightDir));
      if (spotEffect > u_SpotCutoff) {
        float edge = smoothstep(u_SpotCutoff, min(u_SpotCutoff + 0.08, 1.0), spotEffect);
        lighting += phong(u_SpotLightPos, vec3(0.55, 0.72, 1.0), 1.65 * edge);
      }
    }

    gl_FragColor = vec4(base.rgb * lighting, base.a);
  }
`;

const MAP = [
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

let canvas;
let gl;
let camera;
let shaderVars;
let objModel = null;
let lastMouseX = null;
let lastMouseY = null;
let startTime = performance.now();

const state = {
  normalOn: false,
  lightingOn: true,
  pointLightOn: true,
  spotLightOn: true,
  lightPos: [3, 4, 2],
  lightColor: [1, 0.93, 0.82],
  spotAimX: 0,
  spotCutoffDegrees: 20,
};

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
  initControls();
  initTextures();

  OBJModel.load(gl, shaderVars, "../models/low_poly_ship.obj")
    .then((model) => {
      objModel = model;
      objModel.color = [0.9, 0.65, 0.32, 1.0];
    })
    .catch((err) => console.log("OBJ load failed:", err));

  document.addEventListener("keydown", keydown);
  canvas.onmousemove = mouseMove;
  gl.clearColor(0.5, 0.7, 1.0, 1.0);
  requestAnimationFrame(tick);
}

function connectVariablesToGLSL() {
  const vars = {};
  vars.a_Position = gl.getAttribLocation(gl.program, "a_Position");
  vars.a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  vars.a_UV = gl.getAttribLocation(gl.program, "a_UV");
  vars.u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  vars.u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  vars.u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  vars.u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  vars.u_BaseColor = gl.getUniformLocation(gl.program, "u_BaseColor");
  vars.u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  vars.u_TexColorWeight = gl.getUniformLocation(gl.program, "u_TexColorWeight");
  vars.u_CameraPos = gl.getUniformLocation(gl.program, "u_CameraPos");
  vars.u_PointLightPos = gl.getUniformLocation(gl.program, "u_PointLightPos");
  vars.u_PointLightColor = gl.getUniformLocation(gl.program, "u_PointLightColor");
  vars.u_PointLightOn = gl.getUniformLocation(gl.program, "u_PointLightOn");
  vars.u_SpotLightPos = gl.getUniformLocation(gl.program, "u_SpotLightPos");
  vars.u_SpotLightDir = gl.getUniformLocation(gl.program, "u_SpotLightDir");
  vars.u_SpotCutoff = gl.getUniformLocation(gl.program, "u_SpotCutoff");
  vars.u_SpotLightOn = gl.getUniformLocation(gl.program, "u_SpotLightOn");
  vars.u_LightingOn = gl.getUniformLocation(gl.program, "u_LightingOn");
  vars.u_NormalOn = gl.getUniformLocation(gl.program, "u_NormalOn");
  return vars;
}

function initControls() {
  wireToggle("normalToggle", "normalOn", "Normal Visualization");
  wireToggle("lightingToggle", "lightingOn", "Lighting");
  wireToggle("pointToggle", "pointLightOn", "Point Light");
  wireToggle("spotToggle", "spotLightOn", "Spot Light");

  wireSlider("lightX", (v) => state.lightPos[0] = v);
  wireSlider("lightY", (v) => state.lightPos[1] = v);
  wireSlider("lightZ", (v) => state.lightPos[2] = v);
  wireSlider("lightR", (v) => state.lightColor[0] = v);
  wireSlider("lightG", (v) => state.lightColor[1] = v);
  wireSlider("lightB", (v) => state.lightColor[2] = v);
  wireSlider("spotX", (v) => state.spotAimX = v);
  wireSlider("spotCutoff", (v) => state.spotCutoffDegrees = v);
}

function wireToggle(id, key, label) {
  const button = document.getElementById(id);
  button.onclick = () => {
    state[key] = !state[key];
    button.textContent = `${label}: ${state[key] ? "On" : "Off"}`;
  };
}

function wireSlider(id, setter) {
  const el = document.getElementById(id);
  setter(Number(el.value));
  el.oninput = () => setter(Number(el.value));
}

function initTextures() {
  const image = new Image();
  image.onload = () => sendTextureToGLSL(image);
  image.src = "../textures/wall.jpg";
}

function sendTextureToGLSL(image) {
  const texture = gl.createTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(shaderVars.u_Sampler0, 0);
}

function keydown(ev) {
  ev.preventDefault();
  const key = ev.key.toLowerCase();
  if (key === "w") camera.moveForward();
  if (key === "s") camera.moveBackward();
  if (key === "a") camera.moveLeft();
  if (key === "d") camera.moveRight();
  if (key === "q") camera.panLeft();
  if (key === "e") camera.panRight();
  if (key === "f") addBlockInFront();
  if (key === "r") removeBlockInFront();
}

function getBlockInFront() {
  let dx = camera.at.elements[0] - camera.eye.elements[0];
  let dz = camera.at.elements[2] - camera.eye.elements[2];
  const length = Math.hypot(dx, dz) || 1;
  dx /= length;
  dz /= length;
  const mapX = Math.floor(camera.eye.elements[0] + dx * 2 + 16);
  const mapZ = Math.floor(camera.eye.elements[2] + dz * 2 + 16);
  if (mapX < 0 || mapX >= 32 || mapZ < 0 || mapZ >= 32) return null;
  return { x: mapX, z: mapZ };
}

function addBlockInFront() {
  const block = getBlockInFront();
  if (block && MAP[block.x][block.z] < 4) MAP[block.x][block.z]++;
}

function removeBlockInFront() {
  const block = getBlockInFront();
  if (block && MAP[block.x][block.z] > 0) MAP[block.x][block.z]--;
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
  camera.panRight((ev.clientX - lastMouseX) * 0.3);
  camera.panUpDown((ev.clientY - lastMouseY) * 0.1);
  lastMouseX = ev.clientX;
  lastMouseY = ev.clientY;
}

function tick() {
  const elapsed = (performance.now() - startTime) / 1000;
  const sliderX = Number(document.getElementById("lightX").value);
  state.lightPos[0] = sliderX + Math.sin(elapsed) * 1.5;
  renderScene();
  requestAnimationFrame(tick);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(shaderVars.u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(shaderVars.u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.uniform3f(shaderVars.u_CameraPos, camera.eye.elements[0], camera.eye.elements[1], camera.eye.elements[2]);
  gl.uniform3f(shaderVars.u_PointLightPos, state.lightPos[0], state.lightPos[1], state.lightPos[2]);
  gl.uniform3f(shaderVars.u_PointLightColor, state.lightColor[0], state.lightColor[1], state.lightColor[2]);
  gl.uniform1i(shaderVars.u_PointLightOn, state.pointLightOn ? 1 : 0);
  gl.uniform1i(shaderVars.u_SpotLightOn, state.spotLightOn ? 1 : 0);
  gl.uniform1i(shaderVars.u_LightingOn, state.lightingOn ? 1 : 0);
  gl.uniform1i(shaderVars.u_NormalOn, state.normalOn ? 1 : 0);

  const spotPos = [-4, 6, 4];
  const spotTarget = [state.spotAimX, 0, 0];
  const spotDir = normalize([
    spotTarget[0] - spotPos[0],
    spotTarget[1] - spotPos[1],
    spotTarget[2] - spotPos[2],
  ]);
  gl.uniform3f(shaderVars.u_SpotLightPos, spotPos[0], spotPos[1], spotPos[2]);
  gl.uniform3f(shaderVars.u_SpotLightDir, spotDir[0], spotDir[1], spotDir[2]);
  gl.uniform1f(shaderVars.u_SpotCutoff, Math.cos(state.spotCutoffDegrees * Math.PI / 180));

  drawGround();
  drawMap();
  drawSpheres();
  drawOBJDisplayPad();
  drawOBJ();
  drawLightCubes(spotPos);
}

function drawGround() {
  const ground = new Cube(gl, shaderVars);
  ground.color = [0.28, 0.62, 0.31, 1.0];
  ground.matrix.translate(0, -0.55, 0);
  ground.matrix.scale(32, 0.1, 32);
  ground.matrix.translate(-0.5, 0, -0.5);
  ground.render();
}

function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      for (let y = 0; y < MAP[x][z]; y++) {
        const wall = new Cube(gl, shaderVars);
        wall.color = [1, 1, 1, 1];
        wall.textureNum = 0;
        wall.matrix.translate(x - 16, y - 0.5, z - 16);
        wall.render();
      }
    }
  }
}

function drawSpheres() {
  const sphereA = new Sphere(gl, shaderVars);
  sphereA.color = [0.85, 0.2, 0.28, 1];
  sphereA.matrix.translate(0.9, 0.45, 1.2);
  sphereA.matrix.scale(0.9, 0.9, 0.9);
  sphereA.render();

  const sphereB = new Sphere(gl, shaderVars);
  sphereB.color = [0.22, 0.52, 0.9, 1];
  sphereB.matrix.translate(2.6, 0.45, 1.2);
  sphereB.matrix.scale(1.2, 1.2, 1.2);
  sphereB.render();
}

function drawOBJDisplayPad() {
  const pad = new Cube(gl, shaderVars);
  pad.color = [0.34, 0.34, 0.36, 1.0];
  pad.matrix.translate(20.0, -0.48, 4.0);
  pad.matrix.scale(4.0, 0.12, 4.0);
  pad.matrix.translate(-0.5, 0, -0.5);
  pad.render();
}

function drawOBJ() {
  if (!objModel) return;
  objModel.matrix = new Matrix4();
  objModel.matrix.translate(20.0, 0.22, 4.0);
  objModel.matrix.rotate(35, 0, 1, 0);
  objModel.matrix.scale(0.95, 0.95, 0.95);
  objModel.render();
}

function drawLightCubes(spotPos) {
  const point = new Cube(gl, shaderVars);
  point.color = [state.lightColor[0], state.lightColor[1], state.lightColor[2], 1];
  point.matrix.translate(state.lightPos[0], state.lightPos[1], state.lightPos[2]);
  point.matrix.scale(0.25, 0.25, 0.25);
  point.matrix.translate(-0.5, -0.5, -0.5);
  point.render();

  const spot = new Cube(gl, shaderVars);
  spot.color = [0.55, 0.72, 1.0, 1];
  spot.matrix.translate(spotPos[0], spotPos[1], spotPos[2]);
  spot.matrix.scale(0.28, 0.28, 0.28);
  spot.matrix.translate(-0.5, -0.5, -0.5);
  spot.render();
}

function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

main();
