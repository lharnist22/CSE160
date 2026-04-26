let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotation;
let u_ProjMatrix;
let gAnimalGlobalRotation = 0;
let gFrontLegUpperAngle = 0;
let gFrontLegLowerAngle = 0;
let gBackLegUpperAngle = 0;
let gBackLegLowerAngle = 0;
let gHeadAngle = 0;
let gTailAngle = 0;
let gAnimationEnabled = false;
let gTime = 0;
let gMouseX = 0;
let gMouseY = 0;
let gMouseDown = false;
let gLastTime = 0;
let gFrameCount = 0;
let gFpsTime = 0;


var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotation;
  uniform mat4 u_ProjMatrix;
  void main() {
    gl_Position = u_ProjMatrix * u_GlobalRotation * u_ModelMatrix * a_Position;
  }
`;


var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

const CUBE_VERTICES = [
  // Front face
  -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
  -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
  // Back face
  -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
  -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
  // Top face
  -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
  // Bottom face
  -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
  -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
  // Right face
   0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
   0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
  // Left face
  -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
  -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
];

let cubeBuffer;

function setupWebGL() {
  canvas = document.getElementById('webgl');
  console.log("canvas =", canvas);

  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  console.log("gl =", gl);

  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ProjMatrix) {
    console.log('Failed to get storage location of u_ProjMatrix');
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
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get storage location of u_ModelMatrix');
    return;
  }
  u_GlobalRotation = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  if (!u_GlobalRotation) {
    console.log('Failed to get storage location of u_GlobalRotation');
    return;
  }
  cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(CUBE_VERTICES), gl.STATIC_DRAW);
}

function drawCube(M, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  let proj = new Matrix4();
  proj.setOrtho(-3, 3, -3, 3, -10, 10);
  gl.uniformMatrix4fv(u_ProjMatrix, false, proj.elements);
  let globalRot = new Matrix4();
  globalRot.rotate(gAnimalGlobalRotation + gMouseX, 0, 1, 0);
  globalRot.rotate(gMouseY, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRot.elements);
  
  const bodyColor = [1.0, 1.0, 1.0, 1.0];
  // White     
  const spotColor = [0.1, 0.1, 0.1, 1.0];
  // Black
  const legColor = [0.2, 0.2, 0.2, 1.0];
  // Dark legs
  const headColor = [1.0, 1.0, 1.0, 1.0];
  // White head
  const earColor = [0.1, 0.1, 0.1, 1.0];
  // Black ears
  const tailColor = [0.2, 0.2, 0.2, 1.0];
  // Dark tail, same color as legs because it looks good that way lol
  const noseColor = [1.0, 0.7, 0.8, 1.0];
  // Pink nose
  const hornColor = [0.9, 0.9, 0.7, 1.0];
  // Light horns
  const eyeColor = [0.1, 0.1, 0.1, 1.0];

  // Body matrix here
  let M = new Matrix4();
  M.scale(2.0, 1.0, 1.2);
  drawCube(M, bodyColor);
  let spot1 = new Matrix4(); spot1.translate(0.3, 0.2, 0.5); spot1.scale(0.4, 0.2, 0.2); drawCube(spot1, spotColor);
  let spot2 = new Matrix4(); spot2.translate(-0.5, -0.1, -0.6); spot2.scale(0.3, 0.2, 0.2); drawCube(spot2, spotColor);
  let spot3 = new Matrix4(); spot3.translate(0.7, -0.3, 0.2); spot3.scale(0.2, 0.15, 0.2); drawCube(spot3, spotColor);

  // Head Matrix stuff here
  let headMatrix = new Matrix4();
  headMatrix.translate(1.3, 0.3, 0);
  headMatrix.rotate(gHeadAngle, 0, 1, 0);
  headMatrix.scale(0.8, 0.8, 0.8);
  drawCube(headMatrix, headColor);

  // nose matrix stuff here
  let noseMatrix = new Matrix4();
  noseMatrix.translate(1.3, 0.3, 0);
  noseMatrix.rotate(gHeadAngle, 0, 1, 0);
  noseMatrix.translate(0.6, -0.1, 0);
  noseMatrix.scale(0.4, 0.3, 0.3);
  drawCube(noseMatrix, noseColor);

  // Nostrils matrix stuff here 
  let nostril1 = new Matrix4();
  nostril1.translate(1.3, 0.3, 0);
  nostril1.rotate(gHeadAngle, 0, 1, 0);
  nostril1.translate(0.8, -0.1, 0.08);
  nostril1.scale(0.07, 0.07, 0.07);
  drawCube(nostril1, spotColor);
  let nostril2 = new Matrix4();
  nostril2.translate(1.3, 0.3, 0);
  nostril2.rotate(gHeadAngle, 0, 1, 0);
  nostril2.translate(0.8, -0.1, -0.08);
  nostril2.scale(0.07, 0.07, 0.07);
  drawCube(nostril2, spotColor);

  // Eyes stuff here
  let eyeMatrix1 = new Matrix4();
  eyeMatrix1.translate(1.3, 0.3, 0);
  eyeMatrix1.rotate(gHeadAngle, 0, 1, 0);
  eyeMatrix1.translate(0.5, 0.2, 0.22);
  eyeMatrix1.scale(0.12, 0.12, 0.12);
  drawCube(eyeMatrix1, eyeColor);
  let eyeMatrix2 = new Matrix4();
  eyeMatrix2.translate(1.3, 0.3, 0);
  eyeMatrix2.rotate(gHeadAngle, 0, 1, 0);
  eyeMatrix2.translate(0.5, 0.2, -0.22);
  eyeMatrix2.scale(0.12, 0.12, 0.12);
  drawCube(eyeMatrix2, eyeColor);

  // Ears matrix here
  let earMatrix1 = new Matrix4();
  earMatrix1.translate(1.3, 0.3, 0);
  earMatrix1.rotate(gHeadAngle, 0, 1, 0);
  earMatrix1.translate(0.3, 0.5, 0.25);
  earMatrix1.rotate(-0.3, 0, 0, 1);
  earMatrix1.scale(0.15, 0.4, 0.1);
  drawCube(earMatrix1, earColor);
  let earMatrix2 = new Matrix4();
  earMatrix2.translate(1.3, 0.3, 0);
  earMatrix2.rotate(gHeadAngle, 0, 1, 0);
  earMatrix2.translate(0.3, 0.5, -0.25);
  earMatrix2.rotate(0.3, 0, 0, 1);
  earMatrix2.scale(0.15, 0.4, 0.1);
  drawCube(earMatrix2, earColor);

  // The horns matrix here
  let horn1 = new Matrix4();
  horn1.translate(1.3, 0.3, 0);
  horn1.rotate(gHeadAngle, 0, 1, 0);
  horn1.translate(0.2, 0.6, 0.18);
  horn1.rotate(-20, 0, 0, 1);
  horn1.scale(0.08, 0.25, 0.08);
  drawCube(horn1, hornColor);
  let horn2 = new Matrix4();
  horn2.translate(1.3, 0.3, 0);
  horn2.rotate(gHeadAngle, 0, 1, 0);
  horn2.translate(0.2, 0.6, -0.18);
  horn2.rotate(20, 0, 0, 1);
  horn2.scale(0.08, 0.25, 0.08);
  drawCube(horn2, hornColor);

  // Tail matrix stuff
  let tailMatrix = new Matrix4();
  tailMatrix.translate(-1.1, 0.2, 0);
  tailMatrix.rotate(gTailAngle, 0, 1, 0);
  tailMatrix.rotate(0.5, 0, 0, 1);
  tailMatrix.scale(0.6, 0.2, 0.2);
  drawCube(tailMatrix, tailColor);

  // Front leg matrix stuff
  let frThigh = new Matrix4();
  frThigh.translate(0.8, -0.6, 0.5);
  frThigh.rotate(gFrontLegUpperAngle, 0, 0, 1);
  frThigh.scale(0.3, 0.5, 0.3);
  drawCube(frThigh, legColor);
  let frCalf = new Matrix4();
  frCalf.translate(0.8, -0.6, 0.5);
  frCalf.rotate(gFrontLegUpperAngle, 0, 0, 1);
  frCalf.translate(0, -0.5, 0);
  frCalf.rotate(gFrontLegLowerAngle, 0, 1, 0);
  frCalf.scale(0.25, 0.5, 0.25);
  drawCube(frCalf, legColor);
  // Front right hoof
  let frHoof = new Matrix4();
  frHoof.translate(0.8, -0.6, 0.5);
  frHoof.rotate(gFrontLegUpperAngle, 0, 0, 1);
  frHoof.translate(0, -0.5, 0);
  frHoof.rotate(gFrontLegLowerAngle, 0, 1, 0);
  frHoof.translate(0, -0.5, 0);
  frHoof.scale(0.22, 0.12, 0.28);
  drawCube(frHoof, legColor);

  // Front left leg matrix here
  let flThigh = new Matrix4();
  flThigh.translate(0.8, -0.6, -0.5);
  flThigh.rotate(gFrontLegUpperAngle, 0, 0, 1);
  flThigh.scale(0.3, 0.5, 0.3);
  drawCube(flThigh, legColor);
  let flCalf = new Matrix4();
  flCalf.translate(0.8, -0.6, -0.5);
  flCalf.rotate(gFrontLegUpperAngle, 0, 0, 1);
  flCalf.translate(0, -0.5, 0);
  flCalf.rotate(gFrontLegLowerAngle, 0, 1, 0);
  flCalf.scale(0.25, 0.5, 0.25);
  drawCube(flCalf, legColor);
  // Front left hoof
  let flHoof = new Matrix4();
  flHoof.translate(0.8, -0.6, -0.5);
  flHoof.rotate(gFrontLegUpperAngle, 0, 0, 1);
  flHoof.translate(0, -0.5, 0);
  flHoof.rotate(gFrontLegLowerAngle, 0, 1, 0);
  flHoof.translate(0, -0.5, 0);
  flHoof.scale(0.22, 0.12, 0.28);
  drawCube(flHoof, legColor);

  // Back right leg matrix here
  let brThigh = new Matrix4();
  brThigh.translate(-0.8, -0.6, 0.5);
  brThigh.rotate(gBackLegUpperAngle, 0, 0, 1);
  brThigh.scale(0.35, 0.55, 0.35);
  drawCube(brThigh, legColor);
  let brCalf = new Matrix4();
  brCalf.translate(-0.8, -0.6, 0.5);
  brCalf.rotate(gBackLegUpperAngle, 0, 0, 1);
  brCalf.translate(0, -0.55, 0);
  brCalf.rotate(gBackLegLowerAngle, 0, 1, 0);
  brCalf.scale(0.3, 0.55, 0.3);
  drawCube(brCalf, legColor);
  // Back right hoof
  let brHoof = new Matrix4();
  brHoof.translate(-0.8, -0.6, 0.5);
  brHoof.rotate(gBackLegUpperAngle, 0, 0, 1);
  brHoof.translate(0, -0.55, 0);
  brHoof.rotate(gBackLegLowerAngle, 0, 1, 0);
  brHoof.translate(0, -0.55, 0);
  brHoof.scale(0.27, 0.13, 0.32);
  drawCube(brHoof, legColor);

  // Back left leg matrix here
  let blThigh = new Matrix4();
  blThigh.translate(-0.8, -0.6, -0.5);
  blThigh.rotate(gBackLegUpperAngle, 0, 0, 1);
  blThigh.scale(0.35, 0.55, 0.35);
  drawCube(blThigh, legColor);
  let blCalf = new Matrix4();
  blCalf.translate(-0.8, -0.6, -0.5);
  blCalf.rotate(gBackLegUpperAngle, 0, 0, 1);
  blCalf.translate(0, -0.55, 0);
  blCalf.rotate(gBackLegLowerAngle, 0, 1, 0);
  blCalf.scale(0.3, 0.55, 0.3);
  drawCube(blCalf, legColor);
  // Back left hoof
  let blHoof = new Matrix4();
  blHoof.translate(-0.8, -0.6, -0.5);
  blHoof.rotate(gBackLegUpperAngle, 0, 0, 1);
  blHoof.translate(0, -0.55, 0);
  blHoof.rotate(gBackLegLowerAngle, 0, 1, 0);
  blHoof.translate(0, -0.55, 0);
  blHoof.scale(0.27, 0.13, 0.32);
  drawCube(blHoof, legColor);
}

// Update animation angles, I used GPT here for some help with animation fluidity and timing
function updateAnimationAngles() {
  if (!gAnimationEnabled) return;

  gTime += 0.015;

  gFrontLegUpperAngle = Math.sin(gTime * 2) * 25;
  gFrontLegLowerAngle = Math.sin(gTime * 2 + 0.5) * 15 + 10;

  gBackLegUpperAngle = Math.sin(gTime * 2 + Math.PI - 0.7) * 25;
  gBackLegLowerAngle = Math.sin(gTime * 2 + Math.PI - 1.2) * 15 + 10;

  gHeadAngle = Math.sin(gTime * 0.5) * 20;
  gTailAngle = Math.sin(gTime * 3) * 30;

  document.getElementById('frontLegUpper').value = gFrontLegUpperAngle;
  document.getElementById('frontLegLower').value = gFrontLegLowerAngle;
  document.getElementById('backLegUpper').value = gBackLegUpperAngle;
  document.getElementById('backLegLower').value = gBackLegLowerAngle;
}

// Same thing here, I used GPT for help with the FPS calculation and timing logic in the animation loop
function tick() {
  let now = performance.now();
  let deltaTime = now - gLastTime;
  gLastTime = now;
  
  // FPS calculation
  gFrameCount++;
  if (now - gFpsTime >= 1000) {
    document.getElementById('fpsDisplay').textContent = gFrameCount;
    gFrameCount = 0;
    gFpsTime = now;
  }
  
  // Update animation
  updateAnimationAngles();
  
  // Render scene
  renderScene();
  
  // Request next frame
  requestAnimationFrame(tick);
}

function addActionsForHtmlUI() {
  document.getElementById('globalRotation').addEventListener('input', function() {
    gAnimalGlobalRotation = parseFloat(this.value);
  });
  
  document.getElementById('frontLegUpper').addEventListener('input', function() {
    gFrontLegUpperAngle = parseFloat(this.value);
  });
  
  document.getElementById('frontLegLower').addEventListener('input', function() {
    gFrontLegLowerAngle = parseFloat(this.value);
  });
  
  document.getElementById('backLegUpper').addEventListener('input', function() {
    gBackLegUpperAngle = parseFloat(this.value);
  });
  
  document.getElementById('backLegLower').addEventListener('input', function() {
    gBackLegLowerAngle = parseFloat(this.value);
  });
  
  document.getElementById('animateButton').addEventListener('click', function() {
    gAnimationEnabled = !gAnimationEnabled;
    this.textContent = gAnimationEnabled ? 'Stop Animation' : 'Start Animation';
  });
  
  document.getElementById('resetButton').addEventListener('click', function() {
    gAnimalGlobalRotation = 0;
    gMouseX = 0;
    gMouseY = 0;
    gFrontLegUpperAngle = 0;
    gFrontLegLowerAngle = 0;
    gBackLegUpperAngle = 0;
    gBackLegLowerAngle = 0;
    gHeadAngle = 0;
    gTailAngle = 0;
    document.getElementById('globalRotation').value = 0;
    document.getElementById('frontLegUpper').value = 0;
    document.getElementById('frontLegLower').value = 0;
    document.getElementById('backLegUpper').value = 0;
    document.getElementById('backLegLower').value = 0;
  });
  
  canvas.addEventListener('mousedown', function(ev) {
    gMouseDown = true;
  });
  
  canvas.addEventListener('mouseup', function(ev) {
    gMouseDown = false;
  });
  
  canvas.addEventListener('mousemove', function(ev) {
    if (gMouseDown) {
      let rect = canvas.getBoundingClientRect();
      gMouseX = ((ev.clientX - rect.left) / canvas.width - 0.5) * 180;
      gMouseY = ((ev.clientY - rect.top) / canvas.height - 0.5) * 90;
    }
  });
  
  canvas.addEventListener('mouseleave', function(ev) {
    gMouseDown = false;
  });
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gLastTime = performance.now();
  gFpsTime = gLastTime;
  tick();
}

main();