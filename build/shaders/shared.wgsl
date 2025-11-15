struct Object {
  modelMatrix: mat4x4f,
  textureID: u32,
}

struct PhysicsSettings {
  bodyCount: u32,
  deltaTimeMs: f32,
  restitution: f32,
}
