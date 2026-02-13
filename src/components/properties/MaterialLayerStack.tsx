import { useEditorStore } from "@/stores/editorStore";
import {
  extractMaterialLayers,
  findSpaceAndDepthNode,
} from "@/utils/biomeSectionUtils";
import { V2LayerEditor } from "./layers/V2LayerEditor";
import { V1ReadOnlyView } from "./layers/V1ReadOnlyView";

export function MaterialLayerStack() {
  const biomeSections = useEditorStore((s) => s.biomeSections);
  const setSelectedNodeId = useEditorStore((s) => s.setSelectedNodeId);

  const section = biomeSections?.MaterialProvider;
  if (!section) return null;

  const sadInfo = findSpaceAndDepthNode(section.nodes, section.edges);
  const layers = extractMaterialLayers(section.nodes, section.edges);

  // V2 interactive mode
  if (sadInfo?.isV2) {
    return (
      <V2LayerEditor
        sadNodeId={sadInfo.node.id}
        layers={layers}
        onSelectNode={setSelectedNodeId}
      />
    );
  }

  // V1 read-only fallback
  return <V1ReadOnlyView layers={layers} onSelectNode={setSelectedNodeId} />;
}
