#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform float u_Density;

in vec2 fs_Pos;
out vec4 out_Col;

float random1( vec2 p , vec2 seed) {
  return fract(sin(dot(p + seed, vec2(127.1, 311.7))) * 43758.5453);
}

float interpNoise2D(float x, float y) { // from slides
    float intX = floor(x);
    float fractX = fract(x);
    float intY = floor(y);
    float fractY = fract(y);

    float v1 = random1(vec2(intX, intY), vec2(1.f, 1.f));
    float v2 = random1(vec2(intX + 1.0f, intY), vec2(1.f, 1.f));
    float v3 = random1(vec2(intX, intY + 1.0f), vec2(1.f, 1.f));
    float v4 = random1(vec2(intX + 1.0, intY + 1.0), vec2(1.f, 1.f));

    float i1 = mix(v1, v2, fractX);
    float i2 = mix(v3, v4, fractX);

    return mix(i1, i2, fractY);
}

float fbm(float x, float y) { // from slides
  float total = 0.0f;
  float persistence = 0.5f;
  float octaves = 10.0;

  for (float i = 0.0; i < octaves; i = i + 1.0) {
      float freq = pow(2.0f, i);
      float amp = pow(persistence, i);
      total += interpNoise2D(x * freq, y * freq) * amp;
  }
  return total;
}

vec4 skyColor() {
  vec3 skyColor, cloudColor;
  float clouds = fbm(fs_Pos.x + (u_Time / 300.0), fs_Pos.y);
  skyColor = vec3(121.0 / 255.0, 195.0 / 255.0, 249.0 / 255.0);
  cloudColor = vec3(1.0, 1.0, 1.0);
  clouds -= 0.5;
  return vec4(clouds * skyColor + (1.0 - clouds) * cloudColor, 1.0);
}

void main() {
  out_Col = skyColor();
}
