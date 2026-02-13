import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Node } from "@xyflow/react";
import { PropPlacementGrid } from "../PropPlacementGrid";
import { usePropPlacementStore } from "@/stores/propPlacementStore";

beforeAll(() => {
  // jsdom lacks ResizeObserver — provide a minimal stub
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  usePropPlacementStore.getState().reset();
});

function makeNode(
  id: string,
  type: string,
  fields: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: { type, fields, ...extra },
  };
}

// function makeEdge(source: string, target: string, targetHandle?: string): Edge {
//   return {
//     id: `${source}-${target}`,
//     source,
//     target,
//     targetHandle: targetHandle ?? null,
//   };
// }

describe("PropPlacementGrid", () => {
  it("renders without crash with empty arrays", () => {
    const { container } = render(<PropPlacementGrid nodes={[]} edges={[]} />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("renders canvas element", () => {
    const nodes = [
      makeNode("root", "Mesh2D", { Resolution: 16 }, { _biomeField: "Positions" }),
    ];
    const { container } = render(<PropPlacementGrid nodes={nodes} edges={[]} />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("shows Grid checkbox control", () => {
    render(<PropPlacementGrid nodes={[]} edges={[]} />);
    expect(screen.getByText("Grid")).toBeTruthy();
  });

  it("shows Density checkbox control", () => {
    render(<PropPlacementGrid nodes={[]} edges={[]} />);
    expect(screen.getByText("Density")).toBeTruthy();
  });

  it("shows Range dropdown", () => {
    render(<PropPlacementGrid nodes={[]} edges={[]} />);
    expect(screen.getByText("Range:")).toBeTruthy();
  });

  it("shows position count text", () => {
    render(<PropPlacementGrid nodes={[]} edges={[]} />);
    expect(screen.getByText(/positions/)).toBeTruthy();
  });
});
