import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = makeSkybox();

const camera = new THREE.PerspectiveCamera(55, 2, 0.1, 160);
camera.position.set(13, 9, 16);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 1.3, 0);

const clock = new THREE.Clock();
const animated = [];
const clickable = [];
const pulseColors = [0x8ee0c2, 0xffc857, 0xff6b6b, 0xa78bfa];
let colorIndex = 0;

addLights();
addGardenWorld();
loadDroneModel();

window.addEventListener("resize", resizeRenderer);
window.addEventListener("pointerdown", retuneCrystals);
resizeRenderer();
requestAnimationFrame(render);

function addLights() {
  const ambient = new THREE.AmbientLight(0x91a6ff, 0.34);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff2d0, 2.4);
  sun.position.set(-8, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const hemi = new THREE.HemisphereLight(0xaec6ff, 0x284c38, 1.2);
  scene.add(hemi);

  const beacon = new THREE.PointLight(pulseColors[0], 3.4, 20);
  beacon.position.set(0, 4.3, 0);
  scene.add(beacon);
  animated.push({ kind: "beacon", light: beacon });

  const spot = new THREE.SpotLight(0xffd38a, 4, 30, Math.PI / 7, 0.45, 1.4);
  spot.position.set(7, 9, -5);
  spot.target.position.set(0, 0, 0);
  spot.castShadow = true;
  scene.add(spot, spot.target);
}

function addGardenWorld() {
  const groundTexture = makeGridTexture("#214538", "#7bd8a2", 512);
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(5, 5);

  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(10.5, 10.5, 0.5, 96),
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      color: 0x476f5f,
      roughness: 0.78,
      metalness: 0.08,
    }),
  );
  ground.receiveShadow = true;
  ground.position.y = -0.3;
  scene.add(ground);

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xb7f4dc,
    emissive: 0x18362d,
    roughness: 0.42,
    metalness: 0.45,
  });
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.4 + i * 2.15, 0.045, 12, 128),
      ringMaterial.clone(),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08 + i * 0.06;
    scene.add(ring);
    animated.push({ kind: "ring", mesh: ring, speed: 0.18 + i * 0.11 });
  }

  addPlanterBeds();
  addTrees();
  addCrystals();
  addStationParts();
}

function addPlanterBeds() {
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0x7a6155, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x9bcf8d, roughness: 0.7 }),
  ];

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.45, 2.6), materials[0]);
    bed.position.set(Math.cos(angle) * 5.1, 0.12, Math.sin(angle) * 5.1);
    bed.rotation.y = -angle;
    bed.castShadow = true;
    bed.receiveShadow = true;
    scene.add(bed);

    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), materials[1]);
    leaves.position.set(Math.cos(angle) * 5.1, 0.9, Math.sin(angle) * 5.1);
    leaves.scale.set(1.3, 0.7, 1);
    leaves.castShadow = true;
    scene.add(leaves);
  }
}

function addTrees() {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6f4b3e, roughness: 0.8 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3fa968, roughness: 0.62 });

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.35;
    const radius = 7.3;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.5, 12), trunkMat);
    trunk.position.set(Math.cos(angle) * radius, 0.6, Math.sin(angle) * radius);
    trunk.castShadow = true;
    scene.add(trunk);

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.8, 18), leafMat);
    crown.position.set(trunk.position.x, 1.9, trunk.position.z);
    crown.castShadow = true;
    scene.add(crown);
  }
}

function addCrystals() {
  const crystalGeometry = new THREE.OctahedronGeometry(0.55, 0);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const mat = new THREE.MeshStandardMaterial({
      color: pulseColors[i],
      emissive: pulseColors[i],
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.22,
    });
    const crystal = new THREE.Mesh(crystalGeometry, mat);
    crystal.position.set(Math.cos(angle) * 2.2, 1.1, Math.sin(angle) * 2.2);
    crystal.castShadow = true;
    scene.add(crystal);
    clickable.push(crystal);
    animated.push({ kind: "crystal", mesh: crystal, offset: i });
  }
}

function addStationParts() {
  const metal = new THREE.MeshStandardMaterial({ color: 0x9ea7ad, roughness: 0.34, metalness: 0.72 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xaadbf1,
    transmission: 0.35,
    opacity: 0.55,
    transparent: true,
    roughness: 0.08,
  });

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 4.3, 20), metal);
  mast.position.y = 2;
  mast.castShadow = true;
  scene.add(mast);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.8, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  dome.position.y = 0.05;
  dome.castShadow = true;
  scene.add(dome);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.85, 8, 16), metal);
    pod.position.set(Math.cos(angle) * 8.9, 0.65, Math.sin(angle) * 8.9);
    pod.rotation.z = Math.PI / 2;
    pod.rotation.y = -angle;
    pod.castShadow = true;
    scene.add(pod);
  }
}

function loadDroneModel() {
  const loader = new GLTFLoader();
  loader.load(
    "../assets/models/survey-drone.gltf",
    (gltf) => {
      const drone = gltf.scene;
      drone.name = "Loaded textured survey drone";
      drone.position.set(-2.8, 3.3, -1.7);
      drone.scale.setScalar(0.8);
      drone.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(drone);
      animated.push({ kind: "drone", mesh: drone });
    },
    undefined,
    (error) => {
      console.error("Could not load GLTF model", error);
    },
  );
}

function makeSkybox() {
  const loader = new THREE.CubeTextureLoader();
  return loader.load([
    makeSkyFace("right"),
    makeSkyFace("left"),
    makeSkyFace("top"),
    makeSkyFace("bottom"),
    makeSkyFace("front"),
    makeSkyFace("back"),
  ]);
}

function makeSkyFace(label) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(0.65, "#102f39");
  gradient.addColorStop(1, label === "bottom" ? "#244634" : "#f0b35e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 360;
    const s = Math.random() * 1.8 + 0.5;
    ctx.fillRect(x, y, s, s);
  }
  ctx.fillStyle = "rgba(142,224,194,0.28)";
  ctx.fillRect(0, 410, 512, 5);
  return canvas.toDataURL("image/png");
}

function makeGridTexture(base, line, size) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  for (let i = 0; i <= size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function retuneCrystals(event) {
  const rect = canvas.getBoundingClientRect();
  const pointer = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.intersectObjects(clickable).length === 0) return;

  colorIndex = (colorIndex + 1) % pulseColors.length;
  clickable.forEach((crystal, i) => {
    const color = pulseColors[(colorIndex + i) % pulseColors.length];
    crystal.material.color.setHex(color);
    crystal.material.emissive.setHex(color);
  });
}

function resizeRenderer() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function render() {
  const elapsed = clock.getElapsedTime();
  for (const item of animated) {
    if (item.kind === "ring") {
      item.mesh.rotation.z = elapsed * item.speed;
    } else if (item.kind === "crystal") {
      item.mesh.rotation.y = elapsed * 0.7 + item.offset;
      item.mesh.position.y = 1.1 + Math.sin(elapsed * 1.7 + item.offset) * 0.12;
    } else if (item.kind === "beacon") {
      item.light.color.setHex(pulseColors[colorIndex]);
      item.light.intensity = 2.5 + Math.sin(elapsed * 3) * 0.75;
    } else if (item.kind === "drone") {
      item.mesh.rotation.y = elapsed * 0.8;
      item.mesh.position.y = 3.25 + Math.sin(elapsed * 1.4) * 0.32;
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
