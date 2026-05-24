import Mesh from "./Mesh.js";

export default class Sphere extends Mesh {
  constructor(gl, shaderVars, latBands = 24, lonBands = 32) {
    const vertices = [];
    const normals = [];
    const uvs = [];

    for (let lat = 0; lat < latBands; lat++) {
      const theta1 = lat * Math.PI / latBands;
      const theta2 = (lat + 1) * Math.PI / latBands;

      for (let lon = 0; lon < lonBands; lon++) {
        const phi1 = lon * 2 * Math.PI / lonBands;
        const phi2 = (lon + 1) * 2 * Math.PI / lonBands;
        pushQuad(vertices, normals, uvs,
          point(theta1, phi1), point(theta2, phi1), point(theta2, phi2), point(theta1, phi2),
          lon / lonBands, lat / latBands, (lon + 1) / lonBands, (lat + 1) / latBands
        );
      }
    }

    super(gl, shaderVars, new Float32Array(vertices), new Float32Array(normals), new Float32Array(uvs));
  }
}

function point(theta, phi) {
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.cos(theta);
  const z = Math.sin(theta) * Math.sin(phi);
  return [x, y, z];
}

function pushVertex(vertices, normals, uvs, p, u, v) {
  vertices.push(p[0], p[1], p[2]);
  normals.push(p[0], p[1], p[2]);
  uvs.push(u, v);
}

function pushQuad(vertices, normals, uvs, a, b, c, d, u1, v1, u2, v2) {
  pushVertex(vertices, normals, uvs, a, u1, v1);
  pushVertex(vertices, normals, uvs, b, u1, v2);
  pushVertex(vertices, normals, uvs, c, u2, v2);
  pushVertex(vertices, normals, uvs, a, u1, v1);
  pushVertex(vertices, normals, uvs, c, u2, v2);
  pushVertex(vertices, normals, uvs, d, u2, v1);
}
