import { useMemo } from "react";
import { useEdges } from "@xyflow/react";
import type { HandleDef } from "@/nodes/shared/handles";
import { categoryInput } from "@/nodes/shared/handles";
import { COMPOUND_PORTS } from "@/nodes/shared/compoundPorts";
import { getHandles } from "@/nodes/handleRegistry";

/**
 * For compound-eligible nodes, dynamically resolves handles by inspecting
 * current edges. An empty slot is always appended after the last connected
 * index so users can drag-connect additional inputs.
 *
 * Non-compound handles (outputs, differently-categorized inputs like Factor)
 * are preserved in their original positions.
 */
export function useCompoundHandles(nodeId: string, nodeType: string): HandleDef[] {
  const allEdges = useEdges();
  const config = COMPOUND_PORTS[nodeType];

  return useMemo(() => {
    const staticHandles = getHandles(nodeType);
    if (!config) return staticHandles;

    const { arrayBase, label, category, minSlots } = config;
    const pattern = new RegExp(`^${arrayBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\[(\\d+)\\]$`);

    // Find connected indices for this node's compound port
    const connectedIndices = new Set<number>();
    for (const e of allEdges) {
      if (e.target !== nodeId) continue;
      const match = pattern.exec(e.targetHandle ?? "");
      if (match) connectedIndices.add(parseInt(match[1]));
    }

    const maxConnected = connectedIndices.size > 0
      ? Math.max(...connectedIndices)
      : -1;

    // Number of slots: max(minSlots, maxConnectedIndex + 2)
    // The +2 ensures one empty slot after the highest connected index
    const slotCount = Math.max(minSlots, maxConnected + 2);

    // Build compound input handles
    const compoundHandles: HandleDef[] = [];
    for (let i = 0; i < slotCount; i++) {
      compoundHandles.push(
        categoryInput(`${arrayBase}[${i}]`, `${label} ${i}`, category),
      );
    }

    // Collect non-compound handles (outputs + non-matching inputs)
    const nonCompound = staticHandles.filter((h) => {
      if (h.type === "source") return true; // outputs always preserved
      return !pattern.test(h.id);
    });

    // Build final array: compound inputs first, then other inputs, then outputs
    const otherInputs = nonCompound.filter((h) => h.type === "target");
    const outputs = nonCompound.filter((h) => h.type === "source");

    return [...compoundHandles, ...otherInputs, ...outputs];
  }, [nodeId, nodeType, config, allEdges]);
}
