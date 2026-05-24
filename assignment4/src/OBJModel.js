import Mesh from "./Mesh.js";

export default class OBJModel extends Mesh {
  static async load(gl, shaderVars, url) {
    const response = await fetch(url);
    const text = await response.text();
    const parsed = parseOBJ(text);
    return new OBJModel(gl, shaderVars, parsed.vertices, parsed.normals, parsed.uvs);
  }
}

function parseOBJ(text) {
  const positions = [[0, 0, 0]];
  const normals = [[0, 1, 0]];
  const texcoords = [[0, 0]];
  const vertices = [];
  const outNormals = [];
  const uvs = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);

    if (parts[0] === "v") {
      positions.push(parts.slice(1, 4).map(Number));
    } else if (parts[0] === "vn") {
      normals.push(parts.slice(1, 4).map(Number));
    } else if (parts[0] === "vt") {
      texcoords.push(parts.slice(1, 3).map(Number));
    } else if (parts[0] === "f") {
      const face = parts.slice(1).map(parseFaceVertex);
      for (let i = 1; i < face.length - 1; i++) {
        emit(face[0], face[i], face[i + 1], positions, normals, texcoords, vertices, outNormals, uvs);
      }
    }
  }

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(outNormals),
    uvs: new Float32Array(uvs),
  };
}

function parseFaceVertex(value) {
  const [v, vt, vn] = value.split("/").map((part) => part ? Number(part) : 0);
  return { v, vt, vn };
}

function emit(a, b, c, positions, normals, texcoords, vertices, outNormals, uvs) {
  const faceNormal = computeFaceNormal(positions[a.v], positions[b.v], positions[c.v]);
  for (const item of [a, b, c]) {
    const p = positions[item.v];
    const n = item.vn ? normals[item.vn] : faceNormal;
    const uv = item.vt ? texcoords[item.vt] : [0, 0];
    vertices.push(p[0], p[1], p[2]);
    outNormals.push(n[0], n[1], n[2]);
    uvs.push(uv[0], uv[1]);
  }
}

function computeFaceNormal(a, b, c) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return [nx / len, ny / len, nz / len];
}
