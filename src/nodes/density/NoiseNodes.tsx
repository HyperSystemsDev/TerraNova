import { memo } from "react";
import { BaseNode, type TypedNodeProps } from "@/nodes/shared/BaseNode";
import { AssetCategory } from "@/schema/types";
import { densityOutput } from "@/nodes/shared/handles";

const OUTPUT_ONLY_HANDLES = [densityOutput()];

function NoiseNodeBody({ data, fields }: { data: { fields: Record<string, any> }; fields: string[] }) {
  const labels: Record<string, string> = {
    Frequency: "Freq",
    Amplitude: "Amp",
    Seed: "Seed",
    Octaves: "Oct",
    Lacunarity: "Lac",
    Gain: "Gain",
  };
  return (
    <div className="space-y-1">
      {fields.map((f) => (
        <div key={f} className="flex justify-between">
          <span className="text-tn-text-muted">{labels[f] ?? f}</span>
          <span>{typeof data.fields[f] === "object" ? JSON.stringify(data.fields[f]) : (data.fields[f] ?? "—")}</span>
        </div>
      ))}
    </div>
  );
}

export const SimplexNoise3DNode = memo(function SimplexNoise3DNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.Density} handles={OUTPUT_ONLY_HANDLES}>
      <NoiseNodeBody data={data} fields={["Frequency", "Amplitude", "Seed"]} />
    </BaseNode>
  );
});

export const SimplexRidgeNoise2DNode = memo(function SimplexRidgeNoise2DNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.Density} handles={OUTPUT_ONLY_HANDLES}>
      <NoiseNodeBody data={data} fields={["Frequency", "Amplitude", "Seed"]} />
    </BaseNode>
  );
});

export const SimplexRidgeNoise3DNode = memo(function SimplexRidgeNoise3DNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.Density} handles={OUTPUT_ONLY_HANDLES}>
      <NoiseNodeBody data={data} fields={["Frequency", "Amplitude", "Seed"]} />
    </BaseNode>
  );
});

export const VoronoiNoise2DNode = memo(function VoronoiNoise2DNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.Density} handles={OUTPUT_ONLY_HANDLES}>
      <NoiseNodeBody data={data} fields={["Frequency", "Seed"]} />
    </BaseNode>
  );
});

export const VoronoiNoise3DNode = memo(function VoronoiNoise3DNode(props: TypedNodeProps) {
  const data = props.data;
  return (
    <BaseNode {...props} category={AssetCategory.Density} handles={OUTPUT_ONLY_HANDLES}>
      <NoiseNodeBody data={data} fields={["Frequency", "Seed"]} />
    </BaseNode>
  );
});
