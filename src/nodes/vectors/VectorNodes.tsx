import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { vectorInput, vectorOutput, densityInput } from "@/nodes/shared/handles";

// ── Hoisted handle arrays ───────────────────────────────────────────────
const VECTOR_OUTPUT_HANDLES = [vectorOutput()];
const DENSITY_GRADIENT_VECTOR_HANDLES = [densityInput("DensityFunction", "Density"), vectorOutput()];
const CACHE_VECTOR_HANDLES = [vectorInput("VectorProvider", "Vector"), vectorOutput()];
const EXPORTED_VECTOR_HANDLES = [vectorInput("Input", "Input"), vectorOutput()];

function formatVec3(v: unknown): string {
  if (v && typeof v === "object" && "x" in (v as Record<string, unknown>)) {
    const vec = v as { x: number; y: number; z: number };
    return `(${vec.x}, ${vec.y}, ${vec.z})`;
  }
  return "—";
}

export const ConstantVectorNode = memo(function ConstantVectorNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.VectorProvider} handles={VECTOR_OUTPUT_HANDLES}>
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Value</span>
        <span>{formatVec3(data.fields.Value)}</span>
      </div>
    </BaseNode>
  );
});

export const DensityGradientVectorNode = memo(function DensityGradientVectorNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.VectorProvider}
      handles={DENSITY_GRADIENT_VECTOR_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">Density gradient</div>
    </BaseNode>
  );
});

export const CacheVectorNode = memo(function CacheVectorNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.VectorProvider}
      handles={CACHE_VECTOR_HANDLES}
    >
      <div className="text-tn-text-muted text-center py-1">Cache</div>
    </BaseNode>
  );
});

export const ExportedVectorNode = memo(function ExportedVectorNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.VectorProvider}
      handles={EXPORTED_VECTOR_HANDLES}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Name</span>
        <span className="truncate max-w-[120px]">{data.fields.Name ?? ""}</span>
      </div>
    </BaseNode>
  );
});

export const ImportedVectorNode = memo(function ImportedVectorNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.VectorProvider} handles={VECTOR_OUTPUT_HANDLES}>
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Name</span>
        <span className="truncate max-w-[120px]">{data.fields.Name ?? ""}</span>
      </div>
    </BaseNode>
  );
});
