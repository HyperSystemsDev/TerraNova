import { usePreviewStore } from "@/stores/previewStore";
import { DoubleSide } from "three";

export function WaterPlane() {
  const waterPlaneLevel = usePreviewStore((s) => s.waterPlaneLevel);
  const heightScale3D = usePreviewStore((s) => s.heightScale3D);

  const y = waterPlaneLevel * heightScale3D;

  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial
        color="#1e90ff"
        transparent
        opacity={0.3}
        side={DoubleSide}
      />
    </mesh>
  );
}
