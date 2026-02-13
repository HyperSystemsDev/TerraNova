import { useCallback, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Vector3 } from "three";

const PRESETS: { label: string; position: [number, number, number] }[] = [
  { label: "Top", position: [0, 50, 0.01] },
  { label: "Iso", position: [30, 25, 30] },
  { label: "Front", position: [0, 10, 50] },
];

export function CameraPresets() {
  const { camera, controls } = useThree();
  const animRef = useRef<number | null>(null);

  const animateTo = useCallback(
    (target: [number, number, number]) => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }

      const start = camera.position.clone();
      const end = new Vector3(...target);
      const startTime = performance.now();
      const duration = 500;

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(1, elapsed / duration);
        // Smooth ease-out
        const ease = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(start, end, ease);
        camera.lookAt(0, 0, 0);

        if ((controls as any)?.update) {
          (controls as any).update();
        }

        if (t < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          animRef.current = null;
        }
      };

      animRef.current = requestAnimationFrame(animate);
    },
    [camera, controls],
  );

  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      <div className="absolute top-2 right-2 flex gap-1" style={{ pointerEvents: "auto" }}>
        {PRESETS.map(({ label, position }) => (
          <button
            key={label}
            onClick={() => animateTo(position)}
            className="px-1.5 py-0.5 text-[9px] rounded bg-tn-panel/80 text-tn-text-muted hover:text-tn-text border border-tn-border hover:bg-white/10 transition-colors"
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => animateTo([30, 25, 30])}
          className="px-1.5 py-0.5 text-[9px] rounded bg-tn-panel/80 text-tn-text-muted hover:text-tn-text border border-tn-border hover:bg-white/10 transition-colors"
        >
          Reset
        </button>
      </div>
    </Html>
  );
}
