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

// IQ Voronoise: https://www.shadertoy.com/view/Xd23Dh
vec3 hash3( vec2 p )
{
    vec3 q = vec3( dot(p,vec2(127.1,311.7)), 
				   dot(p,vec2(269.5,183.3)), 
				   dot(p,vec2(419.2,371.9)) );
	return fract(sin(q)*43758.5453);
}

float worley( in vec2 x, float u, float v )
{
    vec2 p = floor(x);
    vec2 f = fract(x);
		
	float k = 1.0+63.0*pow(1.0-v,4.0);
	
	float va = 0.0;
	float wt = 0.0;
    for( int j=-2; j<=2; j++ )
    for( int i=-2; i<=2; i++ )
    {
        vec2 g = vec2( float(i),float(j) );
		vec3 o = hash3( p + g )*vec3(u,u,1.0);
		vec2 r = g - f + o.xy;
		float d = dot(r,r);
		float ww = pow( 1.0-smoothstep(0.0,1.414,sqrt(d)), k );
		va += o.z*ww;
		wt += ww;
    }
	
    return va/wt;
}

void main() {
  // out_Col = vec4(0.5 * (fs_Pos + vec2(1.0)), 0.0, 1.0);
  float x = fs_Pos.x;
  float y = fs_Pos.y;
  float height = 0.0;
  float population = 0.0;
  vec3 terrain = vec3(0.0);

  height = fbm(x * 4.0, y * 3.0) / 4.0;
  if (height < 0.2) {
    population = 1.0 - height * worley(vec2(70.0 * x, 70.0 * y), 50.0, 50.0);
    // population = 10.0;
  }
  
  vec3 water = vec3(73.0 / 255.0, 136.0 / 255.0, 237.0 / 255.0);
  vec3 land = vec3(21.0 / 255.0, 140.0 / 255.0, 19.0 / 255.0);

  if (height < 0.20) {
    terrain = water;
  } else {
    terrain = 5.0 * land * height;
  }
  out_Col = vec4(terrain, 0.3 * height);
}
