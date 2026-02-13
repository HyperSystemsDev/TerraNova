import { memo } from "react";
import { Handle, type NodeProps } from "@xyflow/react";
import { INPUT_HANDLE_COLOR } from "@/nodes/shared/handles";
import { inputPosition } from "@/nodes/shared/nodeLayout";
import { useSettingsStore } from "@/stores/settingsStore";

const ROOT_COLOR = "#8B4450";

export const RootNode = memo(function RootNode({ selected }: NodeProps) {
  const flowDirection = useSettingsStore((s) => s.flowDirection);
  const inPos = inputPosition(flowDirection);

  return (
    <div
      className="rounded-md min-w-[140px]"
      style={{
        background: "#262320",
        boxShadow: selected
          ? `0 0 0 2px ${ROOT_COLOR}, 0 0 12px rgba(139,68,80,0.4), 0 2px 8px rgba(0,0,0,0.4)`
          : "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-1.5 text-xs font-semibold text-white text-left"
        style={{
          backgroundColor: ROOT_COLOR,
          borderRadius: "5px 5px 0 0",
        }}
      >
        ROOT
      </div>

      {/* Body with single input handle */}
      <div className="relative px-3 py-2">
        <Handle
          type="target"
          position={inPos}
          id="input"
          style={{
            background: INPUT_HANDLE_COLOR,
            width: 14,
            height: 14,
            border: "2px solid rgba(0,0,0,0.4)",
          }}
        />
        <span className="text-[10px] text-tn-text-muted ml-3">Graph Output</span>
      </div>
    </div>
  );
});
