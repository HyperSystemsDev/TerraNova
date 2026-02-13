import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { usePreviewStore } from "@/stores/previewStore";
import { ShaderMaterial, DoubleSide } from "three";
import type { ShaderMaterial as ShaderMaterialType } from "three";

/* ── Water shader material ───────────────────────────────────────── */

const waterVertShader = `
uniform float uTime;
varying vec3 vWorldPos;

void main() {
  vec3 pos = position;
  // Sine wave displacement
  float wave1 = sin(pos.x * 0.8 + uTime * 1.2) * 0.15;
  float wave2 = sin(pos.y * 0.6 + uTime * 0.9) * 0.12;
  float wave3 = sin((pos.x + pos.y) * 0.5 + uTime * 0.7) * 0.08;
  pos.z += wave1 + wave2 + wave3;
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
}
`;

const waterFragShader = `
varying vec3 vWorldPos;

void main() {
  // Hytale-style blue water with slight depth variation
  float depth = clamp(vWorldPos.y * 0.02 + 0.5, 0.0, 1.0);
  vec3 shallowColor = vec3(0.118, 0.565, 1.0); // #1e90ff
  vec3 deepColor = vec3(0.0, 0.275, 0.580);     // #0046A4
  vec3 color = mix(deepColor, shallowColor, depth);
  gl_FragColor = vec4(color, 0.35);
}
`;

/* ── Water plane component ───────────────────────────────────────── */

function WaterSurface({ yPosition }: { yPosition: number }) {
  const materialRef = useRef<ShaderMaterialType>(null);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: waterVertShader,
        fragmentShader: waterFragShader,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
        },
      }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
  });

  return (
    <mesh position={[0, yPosition, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50, 32, 32]} />
      <primitive object={material} attach="material" ref={materialRef} />
    </mesh>
  );
}

/* ── Lava plane component ────────────────────────────────────────── */

function LavaSurface({ yPosition, size = 50 }: { yPosition: number; size?: number }) {
  return (
    <mesh position={[0, yPosition, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        color="#ff4500"
        emissive="#ff2200"
        emissiveIntensity={1.5}
        transparent
        opacity={0.7}
        side={DoubleSide}
        roughness={0.3}
      />
    </mesh>
  );
}

/* ── Unified FluidPlane component ────────────────────────────────── */

export function FluidPlane() {
  const fluidPlaneConfig = usePreviewStore((s) => s.fluidPlaneConfig);
  const waterPlaneLevel = usePreviewStore((s) => s.waterPlaneLevel);
  const heightScale3D = usePreviewStore((s) => s.heightScale3D);

  // If biome provides fluid config, use it; otherwise fall back to manual water plane
  if (fluidPlaneConfig) {
    if (fluidPlaneConfig.type === "lava") {
      return <LavaSurface yPosition={fluidPlaneConfig.yPosition} size={fluidPlaneConfig.size} />;
    }
    return <WaterSurface yPosition={fluidPlaneConfig.yPosition} />;
  }

  // Fallback: manual water plane (same behavior as old WaterPlane)
  const y = waterPlaneLevel * heightScale3D;
  return <WaterSurface yPosition={y} />;
}

// Keep backward-compatible export
export { FluidPlane as WaterPlane };
