struct Object {
  modelMatrix: mat4x4f,
  textureID: u32,
}

struct PhysicsSettings {
  bodyCount: u32,
  deltaTimeMs: f32,
  restitution: f32,
}

fn extractPosition(modelMatrix: ptr<storage, mat4x4f, read_write>) -> vec3f {
  return modelMatrix[3].xyz;
}
