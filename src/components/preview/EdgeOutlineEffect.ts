import { Effect } from "postprocessing";
import { Vector2, Uniform } from "three";
import type { Vector2 as Vector2Type } from "three";

const fragmentShader = /* glsl */ `
uniform sampler2D depthBuffer;
uniform vec2 resolution;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 texel = 1.0 / resolution;

  // Sample depth at neighboring pixels
  float depthC = texture2D(depthBuffer, uv).r;
  float depthL = texture2D(depthBuffer, uv - vec2(texel.x, 0.0)).r;
  float depthR = texture2D(depthBuffer, uv + vec2(texel.x, 0.0)).r;
  float depthT = texture2D(depthBuffer, uv + vec2(0.0, texel.y)).r;
  float depthB = texture2D(depthBuffer, uv - vec2(0.0, texel.y)).r;

  // Compute depth discontinuity (Sobel-like)
  float dx = abs(depthR - depthL);
  float dy = abs(depthT - depthB);
  float edge = sqrt(dx * dx + dy * dy);

  // Threshold and scale for thin lines
  float edgeStrength = smoothstep(0.001, 0.005, edge);

  // Draw dark lines with low opacity
  vec3 edgeColor = vec3(0.0);
  float edgeOpacity = edgeStrength * 0.25;

  outputColor = vec4(
    mix(inputColor.rgb, edgeColor, edgeOpacity),
    inputColor.a
  );
}
`;

export class EdgeOutlineEffect extends Effect {
  constructor({ resolution = new Vector2(1, 1) } = {}) {
    super("EdgeOutlineEffect", fragmentShader, {
      uniforms: new Map([
        ["resolution", new Uniform(resolution)],
      ]),
    });
  }

  setSize(width: number, height: number) {
    const uniform = this.uniforms.get("resolution");
    if (uniform) {
      (uniform.value as Vector2Type).set(width, height);
    }
  }
}
