struct Object {
  modelMatrix: mat4x4f,
  @align(16) colour: vec3f,
}

struct PhysicsSettings {
  bodyCount: u32,
  deltaTimeMs: f32,
}

fn extractPosition(modelMatrix: ptr<storage, mat4x4f, read_write>) -> vec3f {
  return modelMatrix[3].xyz;
}
