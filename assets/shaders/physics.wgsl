#!import shared

struct Body {
  position: vec3f,
}

@group(0) @binding(0) var <uniform> settings: PhysicsSettings;
@group(0) @binding(1) var <storage, read_write> bodies: array<Body>;

@compute
@workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let index: u32 = id.x;
  if(index >= settings.ballCount){
    return;
  }

  let ballIndex: u32 = index + settings.pegCount;
  let deltaTime: f32 = settings.deltaTimeMs / 1000.0;
}
