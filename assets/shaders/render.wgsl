#!import shared

struct Vertex {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @builtin(instance_index) index: u32,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) uv: vec2f,
}

struct Parameters {
  objectOffset: u32,
}

struct TextureAtlasData {
  textureWidth: u32,
  textureHeight: u32,
  columns: u32,
  rows: u32,
}

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f;
@group(0) @binding(1) var <storage> objects: array<Object>;
@group(0) @binding(2) var <uniform> parameters: Parameters;
@group(0) @binding(3) var skybox: texture_cube<f32>;
@group(0) @binding(4) var textureSampler: sampler;
@group(0) @binding(5) var textureAtlas: texture_2d<f32>;
@group(0) @binding(6) var <uniform> textureAtlasData: TextureAtlasData;

const LIGHT_DIRECTION_1: vec3f = normalize(vec3f(-0.25, 1.0, 0.35));
const LIGHT_DIRECTION_2: vec3f = normalize(vec3f(0.5, -0.2, -0.75));
const AMBIENT_STRENGTH: f32 = 0.1;
const AMBIENT_COLOUR: vec3f = vec3f(1.0);

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  var object = objects[vertex.index + parameters.objectOffset];

  output.position = perspectiveViewMatrix * object.modelMatrix * vec4f(vertex.position, 1.0);
  output.normal = vertex.normal;
  output.uv = vertex.uv;

  return output;
}

@fragment
fn fragmentMain(vertex: VertexOutput) -> @location(0) vec4f {
  let diffuseStrength_1: f32 = max(dot(vertex.normal, LIGHT_DIRECTION_1), 0.0);
  let diffuseStrength_2: f32 = max(dot(vertex.normal, LIGHT_DIRECTION_2), 0.0);
  let diffuse: vec3f = vec3f(min(0.75 * (diffuseStrength_1 + diffuseStrength_2), 1.0));
  let ambient: vec3f = AMBIENT_STRENGTH * AMBIENT_COLOUR;
  let skyboxColour: vec3f = textureSample(skybox, textureSampler, vertex.normal).xyz;

  return vec4f(diffuse + ambient + 0.25 * skyboxColour, 1.0);
  // return vec4f((vertex.normal + 1.0) / 2.0, 1.0);
}
