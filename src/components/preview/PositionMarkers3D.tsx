import { useMemo, useRef, useEffect } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { SphereGeometry, MeshStandardMaterial, Color, Object3D } from "three";
import type { InstancedMesh } from "three";

/**
 * Renders position overlay points as instanced spheres in the 3D scene.
 * Y height is sampled from the density grid for correct vertical placement.
 */
export function PositionMarkers3D() {
  const showOverlay = usePreviewStore((s) => s.showPositionOverlay);
  const points = usePreviewStore((s) => s.positionOverlayPoints);
  const color = usePreviewStore((s) => s.positionOverlayColor);
  const dotSize = usePreviewStore((s) => s.positionOverlaySize);
  const values = usePreviewStore((s) => s.values);
  const resolution = usePreviewStore((s) => s.resolution);
  const heightScale3D = usePreviewStore((s) => s.heightScale3D);
  const minValue = usePreviewStore((s) => s.minValue);
  const maxValue = usePreviewStore((s) => s.maxValue);
  const rangeMin = usePreviewStore((s) => s.rangeMin);
  const rangeMax = usePreviewStore((s) => s.rangeMax);

  const meshRef = useRef<InstancedMesh>(null);

  const geometry = useMemo(() => new SphereGeometry(0.15, 8, 6), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(color),
        emissive: new Color(color),
        emissiveIntensity: 0.5,
      }),
    [color],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const visiblePoints = useMemo(() => {
    if (!showOverlay || points.length === 0) return [];
    return points;
  }, [showOverlay, points]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || visiblePoints.length === 0) return;

    const worldRange = rangeMax - rangeMin;
    const n = resolution;
    const range = maxValue - minValue || 1;
    const isFlat = maxValue === minValue;
    const dummy = new Object3D();
    const scl = dotSize * 0.5;

    for (let i = 0; i < visiblePoints.length; i++) {
      const pt = visiblePoints[i];

      // Convert world coords to 3D scene coords (matches Heightfield mapping)
      const normX = (pt.x - rangeMin) / worldRange;
      const normZ = (pt.z - rangeMin) / worldRange;
      const sceneX = (normX - 0.5) * 50;
      const sceneZ = (normZ - 0.5) * 50;

      // Sample Y height from density grid
      let sceneY = 0;
      if (values && n > 0) {
        const col = Math.floor(normX * n);
        const row = Math.floor(normZ * n);
        if (col >= 0 && col < n && row >= 0 && row < n) {
          const idx = row * n + col;
          const normalized = isFlat ? 0.5 : (values[idx] - minValue) / range;
          sceneY = normalized * heightScale3D + 0.3; // Slight offset above surface
        }
      }

      dummy.position.set(sceneX, sceneY, sceneZ);
      dummy.scale.set(scl, scl, scl);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = visiblePoints.length;
  }, [visiblePoints, values, resolution, heightScale3D, minValue, maxValue, rangeMin, rangeMax, dotSize]);

  if (!showOverlay || visiblePoints.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, visiblePoints.length]}
      frustumCulled={false}
    />
  );
}
