import { memo, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, SSAO } from "@react-three/postprocessing";
import { usePreviewStore } from "@/stores/previewStore";
import { CameraPresets } from "./CameraPresets";
import { FluidPlane } from "./FluidPlane";
import { MaterialLegend } from "./MaterialLegend";
import { EdgeOutlineEffect } from "./EdgeOutlineEffect";
import { HytaleSky, HytaleFog, GroundShadow } from "./SceneEnvironment";
import type { VoxelData } from "@/utils/voxelExtractor";
import type { VoxelMeshData } from "@/utils/voxelMeshBuilder";
import { BufferGeometry, BufferAttribute, Vector2 } from "three";

/* ── Single merged mesh per material ─────────────────────────────── */

const VoxelMesh = memo(function VoxelMesh({
  data,
  wireframe,
}: {
  data: VoxelMeshData;
  wireframe: boolean;
}) {
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(data.positions, 3));
    geo.setAttribute("normal", new BufferAttribute(data.normals, 3));
    geo.setAttribute("color", new BufferAttribute(data.colors, 3));
    geo.setIndex(new BufferAttribute(data.indices, 1));
    geo.computeBoundingSphere();
    return geo;
  }, [data]);

  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors
        wireframe={wireframe}
        roughness={data.materialProperties?.roughness ?? 0.8}
        metalness={data.materialProperties?.metalness ?? 0.0}
        emissive={data.materialProperties?.emissive ?? "#000000"}
        emissiveIntensity={data.materialProperties?.emissiveIntensity ?? 0.0}
      />
    </mesh>
  );
});

/* ── Mesh group ──────────────────────────────────────────────────── */

const VoxelMeshGroup = memo(function VoxelMeshGroup({
  meshData,
  wireframe,
}: {
  meshData: VoxelMeshData[];
  wireframe: boolean;
}) {
  return (
    <>
      {meshData.map((data) => (
        <VoxelMesh key={data.materialIndex} data={data} wireframe={wireframe} />
      ))}
    </>
  );
});

/* ── Canvas ref capture ──────────────────────────────────────────── */

function CanvasRefCapture({ onCanvas }: { onCanvas: (el: HTMLCanvasElement) => void }) {
  const { gl } = useThree();
  useEffect(() => {
    onCanvas(gl.domElement);
  }, [gl, onCanvas]);
  return null;
}

/* ── Edge outline effect wrapper ─────────────────────────────────── */

function EdgeOutline() {
  const { size } = useThree();
  const effect = useMemo(() => {
    return new EdgeOutlineEffect({
      resolution: new Vector2(size.width, size.height),
    });
  }, []);

  useEffect(() => {
    effect.setSize(size.width, size.height);
  }, [size, effect]);

  useEffect(() => () => effect.dispose(), [effect]);

  return <primitive object={effect} />;
}

/* ── Post-processing ─────────────────────────────────────────────── */

function SSAOOnly() {
  return (
    <EffectComposer>
      <SSAO samples={8} radius={0.5} intensity={1.5} luminanceInfluence={0.5} />
    </EffectComposer>
  );
}

function EdgeOutlineOnly() {
  return (
    <EffectComposer>
      <EdgeOutline />
    </EffectComposer>
  );
}

function SSAOAndEdge() {
  return (
    <EffectComposer>
      <SSAO samples={8} radius={0.5} intensity={1.5} luminanceInfluence={0.5} />
      <EdgeOutline />
    </EffectComposer>
  );
}

function PostProcessing() {
  const showSSAO = usePreviewStore((s) => s.showSSAO);
  const showEdgeOutline = usePreviewStore((s) => s.showEdgeOutline);

  if (showSSAO && showEdgeOutline) return <SSAOAndEdge />;
  if (showSSAO) return <SSAOOnly />;
  if (showEdgeOutline) return <EdgeOutlineOnly />;
  return null;
}

/* ── Voxel Scene ─────────────────────────────────────────────────── */

const VoxelScene = memo(function VoxelScene({ wireframe }: { wireframe: boolean }) {
  const showWaterPlane = usePreviewStore((s) => s.showWaterPlane);
  const showFog3D = usePreviewStore((s) => s.showFog3D);
  const showSky3D = usePreviewStore((s) => s.showSky3D);
  const voxelMeshData = usePreviewStore((s) => s.voxelMeshData);

  return (
    <>
      {/* Hytale-style lighting */}
      <hemisphereLight args={["#87CEEB", "#8B7355", 0.4]} />
      <directionalLight
        position={[15, 30, 10]}
        intensity={0.8}
        color="#fff5e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
      />
      <directionalLight position={[-12, 15, -8]} intensity={0.2} color="#b0c4de" />

      {voxelMeshData && voxelMeshData.length > 0 && (
        <VoxelMeshGroup meshData={voxelMeshData} wireframe={wireframe} />
      )}

      <OrbitControls enableDamping dampingFactor={0.1} />
      <group position={[0, -25, 0]}>
        <gridHelper args={[50, 50, "#4a4438", "#312d28"]} />
      </group>
      <GroundShadow />
      {showWaterPlane && <FluidPlane />}
      {showFog3D && <HytaleFog />}
      {showSky3D && <HytaleSky />}
      <CameraPresets />

      <PostProcessing />
    </>
  );
});

/* ── Main export ──────────────────────────────────────────────────── */

export function VoxelPreview3D({ onCanvasRef }: { onCanvasRef?: (el: HTMLCanvasElement | null) => void }) {
  const showVoxelWireframe = usePreviewStore((s) => s.showVoxelWireframe);
  const showMaterialLegend = usePreviewStore((s) => s.showMaterialLegend);
  const isVoxelLoading = usePreviewStore((s) => s.isVoxelLoading);
  const voxelError = usePreviewStore((s) => s.voxelError);
  const voxelData = (usePreviewStore.getState() as any)._voxelData as VoxelData | undefined;

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [35, 30, 35], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
        shadows
      >
        <VoxelScene wireframe={showVoxelWireframe} />
        {onCanvasRef && <CanvasRefCapture onCanvas={onCanvasRef} />}
      </Canvas>

      {/* Loading indicator */}
      {isVoxelLoading && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 bg-tn-panel/90 rounded text-xs text-tn-text-muted">
          <span className="inline-block w-3 h-3 border-2 border-tn-accent border-t-transparent rounded-full animate-spin" />
          Evaluating volume...
        </div>
      )}

      {/* Voxel count */}
      {voxelData && (
        <div className="absolute bottom-2 left-2 z-10 px-2 py-1 bg-tn-panel/90 rounded text-[10px] text-tn-text-muted font-mono">
          {voxelData.count.toLocaleString()} surface voxels
        </div>
      )}

      {/* Error */}
      {voxelError && (
        <div className="absolute bottom-2 right-2 z-10 px-2 py-1 bg-red-900/80 rounded text-[10px] text-red-300">
          {voxelError}
        </div>
      )}

      {/* Material Legend */}
      {showMaterialLegend && voxelData && voxelData.materials.length > 0 && (
        <MaterialLegend materials={voxelData.materials} />
      )}
    </div>
  );
}
