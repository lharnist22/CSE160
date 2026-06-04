Assignment 5 - Three.js Orbital Garden
======================================

Run this project from a local web server because it uses ES modules and loads a
local GLTF asset.

```powershell
cd assignment5
python -m http.server 8005
```

Then open http://localhost:8005/src/.

Rubric notes:

- More than 20 primary 3D shapes are created from boxes, spheres, cylinders,
  cones, torus rings, capsules, octahedrons, and a dome.
- The ground uses a repeated canvas texture.
- The local `assets/models/survey-drone.gltf` model is loaded with
  `GLTFLoader` and has an embedded checker texture.
- Ambient, directional, hemisphere, point, and spot lights are in the scene.
- The scene uses a textured cube skybox generated from canvas images.
- The camera is a `PerspectiveCamera` with `OrbitControls`.
- Wow point: clicking a glowing crystal retunes the station colors, animated
  lights, rings, crystals, and hovering drone.
