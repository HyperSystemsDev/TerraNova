import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ShaderMaterial, BackSide, FogExp2 } from "three";
import { usePreviewStore } from "@/stores/previewStore";

/* ── Hytale-style sky dome ───────────────────────────────────────── */

const skyVertShader = `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const skyFragShader = `
varying vec3 vWorldPos;
void main() {
  float h = normalize(vWorldPos).y;
  float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
  vec3 horizon = vec3(0.290, 0.565, 0.769); // #4A90C4
  vec3 zenith  = vec3(0.529, 0.808, 0.922); // #87CEEB
  gl_FragColor = vec4(mix(horizon, zenith, t), 1.0);
}
`;

export function HytaleSky() {
  const ambientSkyColor = usePreviewStore((s) => s.ambientSkyColor);
  const ambientGroundColor = usePreviewStore((s) => s.ambientGroundColor);

  // Create a shader material with dynamic colors by injecting the colors into the fragment shader
  const material = useMemo(() => {
    const frag = skyFragShader
      .replace('vec3 horizon = vec3(0.290, 0.565, 0.769); // #4A90C4', `vec3 horizon = vec3(${hexToRgbStr(ambientGroundColor)});`)
      .replace('vec3 zenith  = vec3(0.529, 0.808, 0.922); // #87CEEB', `vec3 zenith  = vec3(${hexToRgbStr(ambientSkyColor)});`);
    return new ShaderMaterial({
      vertexShader: skyVertShader,
      fragmentShader: frag,
      side: BackSide,
      depthWrite: false,
    });
  }, [ambientSkyColor, ambientGroundColor]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh>
      <sphereGeometry args={[200, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// Small helper: convert '#rrggbb' → 'r,g,b' normalized 0..1 string
function hexToRgbStr(hex: string) {
  try {
    if (!hex || typeof hex !== "string") return '0.529, 0.808, 0.922';
    let c = hex.replace('#', '').trim();
    if (c.length === 3) {
      // expand shorthand like 'abc' -> 'aabbcc'
      c = c.split('').map((ch) => ch + ch).join('');
    }
    if (!/^[0-9a-fA-F]{6}$/.test(c)) return '0.529, 0.808, 0.922';
    const r = parseInt(c.substring(0, 2), 16) / 255;
    const g = parseInt(c.substring(2, 4), 16) / 255;
    const b = parseInt(c.substring(4, 6), 16) / 255;
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return '0.529, 0.808, 0.922';
    return `${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}`;
  } catch (e) {
    return '0.529, 0.808, 0.922';
  }
}

/* ── Ground shadow plane ─────────────────────────────────────────── */

export function GroundShadow() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -25.5, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <shadowMaterial opacity={0.25} />
    </mesh>
  );
}

/* ── Hytale-style fog ────────────────────────────────────────────── */

export function HytaleFog() {
  const { scene } = useThree();
  const fogColor = usePreviewStore((s) => s.fogColor);
  const fogDensity = usePreviewStore((s) => s.fogDensity);

  useEffect(() => {
    scene.fog = new FogExp2(fogColor ?? "#c0d8f0", fogDensity ?? 0.008);
    return () => {
      scene.fog = null;
    };
  }, [scene, fogColor, fogDensity]);
  return null;
}
