#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform float u_Terrain;
uniform float u_Population;
uniform sampler2D u_TextureSampler;

in vec2 fs_Pos;
out vec4 out_Col;

void main() {
  // out_Col = vec4(0.5 * (fs_Pos + vec2(1.0)), 0.0, 1.0);
  vec2 xy = vec2(0.5 * (fs_Pos.x + 1.0), 0.5 * (fs_Pos.y + 1.0));
  vec4 texCol = texture(u_TextureSampler, xy);
  vec3 totalColor = vec3(0.0);

  if (u_Terrain == 1.0) {
    totalColor += texCol.rgb;
  }

  if (u_Population == 1.0) {
    totalColor += vec3(texCol.a);
  }

  if (u_Terrain == 0.0 && u_Population == 0.0) {
    totalColor = vec3(1.0);
  }
  out_Col = vec4(totalColor, 1.0);
}
