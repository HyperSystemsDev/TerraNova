import { memo } from "react";
import { useEdges } from "@xyflow/react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { materialInput, materialOutput, densityInput } from "@/nodes/shared/handles";
import { safeDisplay } from "@/nodes/shared/displayUtils";
import { useCompoundHandles } from "@/hooks/useCompoundHandles";

/* ── Hoisted static handle arrays ──────────────────────────────────── */

const HANDLES_MAT_OUT = [materialOutput()];

const HANDLES_MAT_IN_OUT = [materialInput("Input", "Input"), materialOutput()];

const HANDLES_MAT_MATERIAL_OUT = [materialInput("Material", "Material"), materialOutput()];


const HANDLES_CONDITIONAL = [
  densityInput("Condition", "Condition"),
  materialInput("TrueInput", "True"),
  materialInput("FalseInput", "False"),
  materialOutput(),
];

const HANDLES_BLEND = [
  materialInput("InputA", "Input A"),
  materialInput("InputB", "Input B"),
  densityInput("Factor", "Factor"),
  materialOutput(),
];

const HANDLES_HEIGHT_GRADIENT = [
  materialInput("Low", "Low"),
  materialInput("High", "High"),
  materialOutput(),
];


const HANDLES_NOISE_THICKNESS = [
  densityInput("ThicknessFunctionXZ", "Noise"),
  materialInput("Material", "Material"),
  materialOutput(),
];

/* ── Components ────────────────────────────────────────────────────── */

export const ConstantMaterialNode = memo(function ConstantMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.MaterialProvider} handles={HANDLES_MAT_OUT}>
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Material</span>
        <span className="truncate max-w-[120px]">{safeDisplay(data.fields.Material, "stone")}</span>
      </div>
    </BaseNode>
  );
});

export const SpaceAndDepthMaterialNode = memo(function SpaceAndDepthMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  const allEdges = useEdges();

  // Detect V2 mode: check for Layers[i] edges or LayerContext field
  const layerEdges = allEdges.filter(
    (e) => e.target === props.id && /^Layers\[\d+\]$/.test(e.targetHandle ?? ""),
  );
  const isV2 = layerEdges.length > 0 || data.fields.LayerContext != null;

  if (isV2) {
    // V2: Dynamic Layers[] handles
    const layerHandles = layerEdges
      .map((e) => {
        const idx = parseInt(/\[(\d+)\]/.exec(e.targetHandle!)![1]);
        return { idx, handle: e.targetHandle! };
      })
      .sort((a, b) => a.idx - b.idx)
      .map(({ idx, handle }) => materialInput(handle, `Layer ${idx}`));

    if (layerHandles.length === 0) {
      // No layers yet — show an empty first slot
      layerHandles.push(materialInput("Layers[0]", "Layer 0"));
    } else {
      // Show an extra empty slot so users can drag-connect new layers
      const maxIdx = Math.max(...layerEdges.map((e) => parseInt(/\[(\d+)\]/.exec(e.targetHandle!)![1])));
      layerHandles.push(materialInput(`Layers[${maxIdx + 1}]`, `Layer ${maxIdx + 1}`));
    }

    const context = String(data.fields.LayerContext ?? "DEPTH_INTO_FLOOR").replace(/_/g, " ").toLowerCase();

    return (
      <BaseNode
        {...props}
        category={AssetCategory.MaterialProvider}
        handles={[...layerHandles, materialOutput()]}
      >
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-tn-text-muted">Context</span>
            <span className="text-[10px] truncate max-w-[100px]">{context}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-tn-text-muted">Max Depth</span>
            <span>{safeDisplay(data.fields.MaxExpectedDepth, 16)}</span>
          </div>
        </div>
      </BaseNode>
    );
  }

  // V1: Solid/Empty handles
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={[
        materialInput("Solid", "Solid"),
        materialInput("Empty", "Empty"),
        materialOutput(),
      ]}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Depth</span>
        <span>{safeDisplay(data.fields.DepthThreshold, 3)}</span>
      </div>
    </BaseNode>
  );
});

export const WeightedRandomMaterialNode = memo(function WeightedRandomMaterialNode(props: TypedNodeProps) {
  const handles = useCompoundHandles(props.id, "Material:WeightedRandom");
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={handles}
    >
      <div className="text-tn-text-muted text-center py-1">Weighted random</div>
    </BaseNode>
  );
});

export const ConditionalMaterialNode = memo(function ConditionalMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_CONDITIONAL}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Threshold</span>
        <span>{safeDisplay(data.fields.Threshold, 0.5)}</span>
      </div>
    </BaseNode>
  );
});

export const BlendMaterialNode = memo(function BlendMaterialNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_BLEND}
    >
      <div className="text-tn-text-muted text-center py-1">Blend A↔B</div>
    </BaseNode>
  );
});

export const HeightGradientMaterialNode = memo(function HeightGradientMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  const range = data.fields.Range as { Min?: number; Max?: number } | undefined;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_HEIGHT_GRADIENT}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Range</span>
        <span>
          {range ? `[${range.Min ?? 0}, ${range.Max ?? 256}]` : "—"}
        </span>
      </div>
    </BaseNode>
  );
});

export const NoiseSelectorMaterialNode = memo(function NoiseSelectorMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  const handles = useCompoundHandles(props.id, "Material:NoiseSelector");
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={handles}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Freq</span>
          <span>{safeDisplay(data.fields.Frequency, 0.01)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Threshold</span>
          <span>{safeDisplay(data.fields.Threshold, 0.5)}</span>
        </div>
      </div>
    </BaseNode>
  );
});

export const SolidMaterialNode = memo(function SolidMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.MaterialProvider} handles={HANDLES_MAT_OUT}>
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Material</span>
        <span className="truncate max-w-[120px]">{safeDisplay(data.fields.Material, "stone")}</span>
      </div>
    </BaseNode>
  );
});

export const EmptyMaterialNode = memo(function EmptyMaterialNode(props: TypedNodeProps) {
  return (
    <BaseNode {...props} category={AssetCategory.MaterialProvider} handles={HANDLES_MAT_OUT}>
      <div className="text-tn-text-muted text-center py-1">Empty (air)</div>
    </BaseNode>
  );
});

export const SurfaceMaterialNode = memo(function SurfaceMaterialNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_MAT_IN_OUT}
    >
      <div className="text-tn-text-muted text-center py-1">Surface material</div>
    </BaseNode>
  );
});

export const CaveMaterialNode = memo(function CaveMaterialNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_MAT_IN_OUT}
    >
      <div className="text-tn-text-muted text-center py-1">Cave material</div>
    </BaseNode>
  );
});

export const ClusterMaterialNode = memo(function ClusterMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_MAT_IN_OUT}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Radius</span>
        <span>{safeDisplay(data.fields.Radius, 3)}</span>
      </div>
    </BaseNode>
  );
});

export const ImportedMaterialNode = memo(function ImportedMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.MaterialProvider} handles={HANDLES_MAT_OUT}>
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Name</span>
        <span className="truncate max-w-[120px]">{safeDisplay(data.fields.Name, "")}</span>
      </div>
    </BaseNode>
  );
});

export const ExportedMaterialNode = memo(function ExportedMaterialNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_MAT_IN_OUT}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Name</span>
        <span className="truncate max-w-[120px]">{safeDisplay(data.fields.Name, "")}</span>
      </div>
    </BaseNode>
  );
});

/* ── Layer sub-asset nodes (SpaceAndDepth V2) ──────────────────────── */

export const ConstantThicknessNode = memo(function ConstantThicknessNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_MAT_MATERIAL_OUT}
    >
      <div className="flex justify-between">
        <span className="text-tn-text-muted">Thickness</span>
        <span>{safeDisplay(data.fields.Thickness, 0)}</span>
      </div>
    </BaseNode>
  );
});

export const NoiseThicknessNode = memo(function NoiseThicknessNode(props: TypedNodeProps) {
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_NOISE_THICKNESS}
    >
      <div className="text-tn-text-muted text-center py-1">Noise-driven thickness</div>
    </BaseNode>
  );
});

export const RangeThicknessNode = memo(function RangeThicknessNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_MAT_MATERIAL_OUT}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Range</span>
          <span>{safeDisplay(data.fields.RangeMin, 0)}–{safeDisplay(data.fields.RangeMax, 0)}</span>
        </div>
        {data.fields.Seed != null ? (
          <div className="flex justify-between">
            <span className="text-tn-text-muted">Seed</span>
            <span className="truncate max-w-[80px]">{data.fields.Seed}</span>
          </div>
        ) : null}
      </div>
    </BaseNode>
  );
});

export const WeightedThicknessNode = memo(function WeightedThicknessNode(props: TypedNodeProps) {
  const data = props.data;
  const entries = (data.fields.PossibleThicknesses as Array<{ Weight: number; Thickness: number }>) ?? [];
  return (
    <BaseNode
      {...props}
      category={AssetCategory.MaterialProvider}
      handles={HANDLES_MAT_MATERIAL_OUT}
    >
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-tn-text-muted">Entries</span>
          <span>{entries.length}</span>
        </div>
        {data.fields.Seed != null ? (
          <div className="flex justify-between">
            <span className="text-tn-text-muted">Seed</span>
            <span className="truncate max-w-[80px]">{data.fields.Seed}</span>
          </div>
        ) : null}
      </div>
    </BaseNode>
  );
});
