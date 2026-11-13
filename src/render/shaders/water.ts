/**
 * The water shader, in GLSL (WebGL) and WGSL (WebGPU) so it works whichever renderer Pixi picks.
 * Layered moving value noise for the swell, long swell lines, sparkles that appear only where the
 * beam or island glow falls (the light is worked out from the beam's numbers, the same shape as the
 * light map), a warm mottled brightening in the light, and a broken reflection of the lamp.
 *
 * Uniforms (all vec4, which keeps WebGPU's memory layout simple):
 *   uParams = time (s), scale (CSS px per world unit), noise layers (1–3), sparkles (0 or 1)
 *   uView   = island x, island y, screen width, screen height (CSS px)
 *   uBeam   = angle, half-angle, range, island glow radius (radians, world units)
 *   uLamp   = lamp x, lamp y (CSS px), reflection strength, island radius (world units)
 *   uBeam2  = the second lighthouse's angle, half-angle, range, glow radius (radians, world units)
 *   uLamp2  = the second lighthouse's x, y (world units), on (0 or 1), unused
 *   uDeep, uMid, uCrest = region colors (rgb)
 * It's drawn as one screen-sized mesh (a single pass), not a filter, which would first draw the sprite
 * into a texture of its own. Pixi binds resources by name, so the WGSL uniform variable must be called
 * `waterUniforms`, the same as the shader's resource key in water.ts.
 */

export const WATER_UNIFORM_NAMES = [
  'uParams',
  'uView',
  'uBeam',
  'uLamp',
  'uBeam2',
  'uLamp2',
  'uDeep',
  'uMid',
  'uCrest',
] as const;

export const WATER_VERTEX_GLSL = `in vec2 aPosition;
out vec2 vScreen;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main(void)
{
    vec3 screen = uWorldTransformMatrix * uTransformMatrix * vec3(aPosition, 1.0);
    vScreen = screen.xy;
    gl_Position = vec4((uProjectionMatrix * screen).xy, 0.0, 1.0);
}
`;

export const WATER_FRAGMENT_GLSL = `in vec2 vScreen;
out vec4 finalColor;

uniform vec4 uParams;
uniform vec4 uView;
uniform vec4 uBeam;
uniform vec4 uLamp;
uniform vec4 uBeam2;
uniform vec4 uLamp2;
uniform vec4 uDeep;
uniform vec4 uMid;
uniform vec4 uCrest;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float beamLight(vec2 w, vec4 beam) {
    float d = length(w);
    float a = atan(w.y, w.x) - beam.x;
    a = abs(atan(sin(a), cos(a)));
    float cone = (1.0 - smoothstep(beam.y * 0.8, beam.y * 1.15, a))
               * (1.0 - smoothstep(beam.z * 0.8, beam.z * 1.1, d));
    float glow = 1.0 - smoothstep(beam.w * 0.55, beam.w * 1.2, d);
    return max(cone, glow * 0.8);
}

float lightAt(vec2 w) {
    float light = beamLight(w, uBeam);
    if (uLamp2.z > 0.5) light = max(light, beamLight(w - uLamp2.xy, uBeam2));
    return light;
}

void main(void)
{
    vec2 screen = vScreen;
    float t = uParams.x;
    float scale = uParams.y;
    vec2 w = (screen - uView.xy) / scale;

    vec2 q = w * 0.022 + vec2(t * 0.025, t * 0.011);
    float n = vnoise(q);
    if (uParams.z > 1.5) {
        n = n * 0.62 + vnoise(mat2(0.8, -0.6, 0.6, 0.8) * q * 2.3 - vec2(t * 0.05, -t * 0.03)) * 0.38;
    }
    if (uParams.z > 2.5) {
        n = n * 0.8 + vnoise(q * 5.7 + vec2(-t * 0.09, t * 0.07)) * 0.2;
    }

    float depth = clamp(screen.y / uView.w, 0.0, 1.0);
    vec3 color = mix(uDeep.rgb, uMid.rgb, clamp(depth * 0.8 + 0.1 + (n - 0.5) * 0.7, 0.0, 1.0));

    float swell = sin(dot(w, vec2(0.05, 0.11)) + t * 0.7 + n * 5.0);
    float crest = smoothstep(0.86, 1.0, swell) * (0.4 + n);
    color += uCrest.rgb * crest * 0.07;

    float light = lightAt(w);
    if (uParams.w > 0.5) {
        vec2 cell = floor(w * 0.6);
        float h = hash(cell);
        float twinkle = pow(max(0.0, sin(t * (2.0 + h * 3.0) + h * 40.0)), 12.0);
        vec2 f = fract(w * 0.6) - 0.5;
        float shape = 1.0 - smoothstep(0.05, 0.25, length(f));
        float spark = step(0.93, h) * twinkle * shape * smoothstep(0.45, 0.75, n + crest * 0.5);
        color += vec3(1.0, 0.95, 0.85) * spark * light * 1.4;
    }
    color += (uCrest.rgb * (0.08 + crest * 0.25) + vec3(0.2, 0.14, 0.05)) * light * (0.55 + n * 0.7);

    float below = screen.y - (uView.y + uLamp.w * scale * 0.8);
    if (below > 0.0) {
        float span = uLamp.w * scale * 2.6;
        float width = scale * (3.0 + below / scale * 0.06);
        float k = (screen.x - uLamp.x) / width;
        float column = exp(-k * k);
        float broken = smoothstep(0.35, 0.75, vnoise(vec2(screen.x / scale * 0.6, screen.y / scale * 1.8 - t * 1.2)));
        color += vec3(1.0, 0.82, 0.48) * column * broken * (1.0 - smoothstep(0.0, span, below)) * 0.45 * uLamp.z;
    }

    finalColor = vec4(color, 1.0);
}
`;

export const WATER_WGSL = `
struct GlobalUniforms {
  uProjectionMatrix: mat3x3<f32>,
  uWorldTransformMatrix: mat3x3<f32>,
  uWorldColorAlpha: vec4<f32>,
  uResolution: vec2<f32>,
};

struct LocalUniforms {
  uTransformMatrix: mat3x3<f32>,
  uColor: vec4<f32>,
  uRound: f32,
};

struct WaterUniforms {
  uParams: vec4<f32>,
  uView: vec4<f32>,
  uBeam: vec4<f32>,
  uLamp: vec4<f32>,
  uBeam2: vec4<f32>,
  uLamp2: vec4<f32>,
  uDeep: vec4<f32>,
  uMid: vec4<f32>,
  uCrest: vec4<f32>,
};

@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms: LocalUniforms;
@group(2) @binding(0) var<uniform> waterUniforms: WaterUniforms;

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) screen: vec2<f32>,
};

@vertex
fn mainVertex(@location(0) aPosition: vec2<f32>) -> VSOutput {
  let screen = globalUniforms.uWorldTransformMatrix * localUniforms.uTransformMatrix * vec3<f32>(aPosition, 1.0);
  let clip = globalUniforms.uProjectionMatrix * screen;
  return VSOutput(vec4<f32>(clip.xy, 0.0, 1.0), screen.xy);
}

fn hash(pIn: vec2<f32>) -> f32 {
  var p = fract(pIn * vec2<f32>(123.34, 456.21));
  p = p + dot(p, p + 45.32);
  return fract(p.x * p.y);
}

fn vnoise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2<f32>(1.0, 0.0)), u.x),
             mix(hash(i + vec2<f32>(0.0, 1.0)), hash(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}

fn beamLight(w: vec2<f32>, beam: vec4<f32>) -> f32 {
  let d = length(w);
  var a = atan2(w.y, w.x) - beam.x;
  a = abs(atan2(sin(a), cos(a)));
  let cone = (1.0 - smoothstep(beam.y * 0.8, beam.y * 1.15, a))
           * (1.0 - smoothstep(beam.z * 0.8, beam.z * 1.1, d));
  let glow = 1.0 - smoothstep(beam.w * 0.55, beam.w * 1.2, d);
  return max(cone, glow * 0.8);
}

fn lightAt(w: vec2<f32>) -> f32 {
  var light = beamLight(w, waterUniforms.uBeam);
  if (waterUniforms.uLamp2.z > 0.5) {
    light = max(light, beamLight(w - waterUniforms.uLamp2.xy, waterUniforms.uBeam2));
  }
  return light;
}

@fragment
fn mainFragment(@location(0) screen: vec2<f32>) -> @location(0) vec4<f32> {
  let t = waterUniforms.uParams.x;
  let scale = waterUniforms.uParams.y;
  let w = (screen - waterUniforms.uView.xy) / scale;

  let q = w * 0.022 + vec2<f32>(t * 0.025, t * 0.011);
  var n = vnoise(q);
  if (waterUniforms.uParams.z > 1.5) {
    n = n * 0.62 + vnoise(mat2x2<f32>(0.8, -0.6, 0.6, 0.8) * q * 2.3 - vec2<f32>(t * 0.05, -t * 0.03)) * 0.38;
  }
  if (waterUniforms.uParams.z > 2.5) {
    n = n * 0.8 + vnoise(q * 5.7 + vec2<f32>(-t * 0.09, t * 0.07)) * 0.2;
  }

  let depth = clamp(screen.y / waterUniforms.uView.w, 0.0, 1.0);
  var color = mix(waterUniforms.uDeep.rgb, waterUniforms.uMid.rgb, clamp(depth * 0.8 + 0.1 + (n - 0.5) * 0.7, 0.0, 1.0));

  let swell = sin(dot(w, vec2<f32>(0.05, 0.11)) + t * 0.7 + n * 5.0);
  let crest = smoothstep(0.86, 1.0, swell) * (0.4 + n);
  color = color + waterUniforms.uCrest.rgb * crest * 0.07;

  let light = lightAt(w);
  if (waterUniforms.uParams.w > 0.5) {
    let cell = floor(w * 0.6);
    let h = hash(cell);
    let twinkle = pow(max(0.0, sin(t * (2.0 + h * 3.0) + h * 40.0)), 12.0);
    let f = fract(w * 0.6) - 0.5;
    let shape = 1.0 - smoothstep(0.05, 0.25, length(f));
    let spark = step(0.93, h) * twinkle * shape * smoothstep(0.45, 0.75, n + crest * 0.5);
    color = color + vec3<f32>(1.0, 0.95, 0.85) * spark * light * 1.4;
  }
  color = color + (waterUniforms.uCrest.rgb * (0.08 + crest * 0.25) + vec3<f32>(0.2, 0.14, 0.05)) * light * (0.55 + n * 0.7);

  let below = screen.y - (waterUniforms.uView.y + waterUniforms.uLamp.w * scale * 0.8);
  if (below > 0.0) {
    let span = waterUniforms.uLamp.w * scale * 2.6;
    let width = scale * (3.0 + below / scale * 0.06);
    let k = (screen.x - waterUniforms.uLamp.x) / width;
    let column = exp(-k * k);
    let broken = smoothstep(0.35, 0.75, vnoise(vec2<f32>(screen.x / scale * 0.6, screen.y / scale * 1.8 - t * 1.2)));
    color = color + vec3<f32>(1.0, 0.82, 0.48) * column * broken * (1.0 - smoothstep(0.0, span, below)) * 0.45 * waterUniforms.uLamp.z;
  }

  return vec4<f32>(color, 1.0);
}
`;
