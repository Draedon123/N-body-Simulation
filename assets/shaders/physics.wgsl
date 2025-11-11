#!import shared

struct BodyState {
  @align(16) velocity: vec3f,
  acceleration: vec3f,
  mass: f32,
}

@group(0) @binding(0) var <uniform> settings: PhysicsSettings;
@group(0) @binding(1) var <storage, read_write> objects: array<Object>;
@group(0) @binding(2) var <storage, read_write> bodies: array<BodyState>;

const G: f32 = 6.6743e-11;

@compute
@workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let index: u32 = id.x;
  if(index >= settings.bodyCount){
    return;
  }

  var position: vec3f = extractPosition(&objects[index].modelMatrix);
  let deltaTime: f32 = settings.deltaTimeMs / 1000.0;

  var netForce: vec3f = vec3f(0.0);
  for(var i: u32 = 0; i < settings.bodyCount; i++){
    // F = GMm / r ^ 2

    if(i == index){
      continue;
    }

    let toBody: vec3f = extractPosition(&objects[i].modelMatrix) - position;
    netForce += normalize(toBody) * G * bodies[i].mass * bodies[index].mass / dot(toBody, toBody);
  }

  // F_net = ma
  bodies[index].acceleration = netForce / bodies[index].mass;
  bodies[index].velocity += bodies[index].acceleration * deltaTime;
  position += bodies[index].velocity * deltaTime;

  setPosition(&objects[index].modelMatrix, position);
}

fn setPosition(modelMatrix: ptr<storage, mat4x4f, read_write>, position: vec3f) {
  modelMatrix[3].x = position.x;
  modelMatrix[3].y = position.y;
  modelMatrix[3].z = position.z;
}
