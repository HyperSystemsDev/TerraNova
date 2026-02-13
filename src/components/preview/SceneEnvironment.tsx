import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ShaderMaterial, BackSide, FogExp2 } from "three";

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
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: skyVertShader,
        fragmentShader: skyFragShader,
        side: BackSide,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh>
      <sphereGeometry args={[200, 32, 16]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
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
  useEffect(() => {
    scene.fog = new FogExp2("#c0d8f0", 0.008);
    return () => {
      scene.fog = null;
    };
  }, [scene]);
  return null;
}
