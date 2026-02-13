import type { Node } from "@xyflow/react";
import { NODE_WIDTH, NODE_HEIGHT } from "@/constants";

export type AlignDirection = "left" | "right" | "top" | "bottom" | "centerH" | "centerV";

export function alignNodes(nodes: Node[], direction: AlignDirection): Node[] {
  if (nodes.length < 2) return nodes;

  let target: number;

  switch (direction) {
    case "left":
      target = Math.min(...nodes.map((n) => n.position.x));
      return nodes.map((n) => ({ ...n, position: { ...n.position, x: target } }));
    case "right":
      target = Math.max(...nodes.map((n) => n.position.x + NODE_WIDTH));
      return nodes.map((n) => ({ ...n, position: { ...n.position, x: target - NODE_WIDTH } }));
    case "top":
      target = Math.min(...nodes.map((n) => n.position.y));
      return nodes.map((n) => ({ ...n, position: { ...n.position, y: target } }));
    case "bottom":
      target = Math.max(...nodes.map((n) => n.position.y + NODE_HEIGHT));
      return nodes.map((n) => ({ ...n, position: { ...n.position, y: target - NODE_HEIGHT } }));
    case "centerH": {
      const centerX =
        nodes.reduce((sum, n) => sum + n.position.x + NODE_WIDTH / 2, 0) / nodes.length;
      return nodes.map((n) => ({
        ...n,
        position: { ...n.position, x: centerX - NODE_WIDTH / 2 },
      }));
    }
    case "centerV": {
      const centerY =
        nodes.reduce((sum, n) => sum + n.position.y + NODE_HEIGHT / 2, 0) / nodes.length;
      return nodes.map((n) => ({
        ...n,
        position: { ...n.position, y: centerY - NODE_HEIGHT / 2 },
      }));
    }
  }
}

export function distributeNodes(nodes: Node[], axis: "horizontal" | "vertical"): Node[] {
  if (nodes.length < 3) return nodes;

  const sorted = [...nodes].sort((a, b) =>
    axis === "horizontal"
      ? a.position.x - b.position.x
      : a.position.y - b.position.y,
  );

  const key = axis === "horizontal" ? "x" : "y";

  const first = sorted[0].position[key];
  const last = sorted[sorted.length - 1].position[key];
  const totalSpace = last - first;
  const gap = totalSpace / (sorted.length - 1);

  return sorted.map((node, i) => ({
    ...node,
    position: {
      ...node.position,
      [key]: first + i * gap,
    },
  }));
}
