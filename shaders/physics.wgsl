#!import shared
#!import rkf45

struct BodyState {
  velocity: vec3f,
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

  bodies[index].velocity = rkf45(bodies[index].velocity, 0.0, deltaTime, vec3f(1e-7), vec3f(5e-3), index, 1);
  position = rkf45(position, 0.0, deltaTime, vec3f(1e-7), vec3f(5e-3), index, 0);

  setPosition(&objects[index].modelMatrix, position);
}

fn derivative(derivativeFunction: u32, index: u32, t: f32, state: vec3f) -> vec3f {
  switch(derivativeFunction){
    // dx/dt = v
    case 0: {
      return bodies[index].velocity;
    }
    // dv/dt = a
    case 1: {
      let position: vec3f = extractPosition(&objects[index].modelMatrix);
      var gravitationalFieldStrength: vec3f = vec3f(0.0);

      for(var i: u32 = 0; i < settings.bodyCount; i++){
        if(i == index){
          continue;
        }

        let toBody: vec3f = extractPosition(&objects[i].modelMatrix) - position;
        // g = GM / r ^ 2
        gravitationalFieldStrength += normalize(toBody) * bodies[i].mass / dot(toBody, toBody);
      }

      // factor out G from Newton's Universal Law of Gravitation
      return G * gravitationalFieldStrength;
    }
    default: {
      return vec3f(0.0);
    }
  }
}

fn setPosition(modelMatrix: ptr<storage, mat4x4f, read_write>, position: vec3f) {
  modelMatrix[3].x = position.x;
  modelMatrix[3].y = position.y;
  modelMatrix[3].z = position.z;
}
