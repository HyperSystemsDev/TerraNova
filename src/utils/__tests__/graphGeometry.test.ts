import { describe, it, expect } from "vitest";
import type { Edge } from "@xyflow/react";
import {
  getDownstreamEdgeIds,
  getUpstreamEdgeIds,
  getBidirectionalEdgeIds,
} from "../graphGeometry";

/* ── Helpers ───────────────────────────────────────────────────────── */

function makeEdge(source: string, target: string, targetHandle?: string): Edge {
  return {
    id: `${source}-${target}-${targetHandle ?? ""}`,
    source,
    target,
    targetHandle: targetHandle ?? null,
  };
}

/* ── getDownstreamEdgeIds ─────────────────────────────────────────── */

describe("getDownstreamEdgeIds", () => {
  it("returns empty set for node with no outgoing edges", () => {
    const edges = [makeEdge("A", "B")];
    expect(getDownstreamEdgeIds("B", edges).size).toBe(0);
  });

  it("finds all downstream edges in a linear chain", () => {
    const edges = [makeEdge("A", "B"), makeEdge("B", "C"), makeEdge("C", "D")];
    const result = getDownstreamEdgeIds("B", edges);
    expect(result).toEqual(new Set(["B-C-", "C-D-"]));
  });
});

/* ── getUpstreamEdgeIds ───────────────────────────────────────────── */

describe("getUpstreamEdgeIds", () => {
  it("returns empty set for node with no incoming edges", () => {
    const edges = [makeEdge("A", "B")];
    expect(getUpstreamEdgeIds("A", edges).size).toBe(0);
  });

  it("finds all upstream edges in a linear chain", () => {
    const edges = [makeEdge("A", "B"), makeEdge("B", "C"), makeEdge("C", "D")];
    const result = getUpstreamEdgeIds("C", edges);
    expect(result).toEqual(new Set(["A-B-", "B-C-"]));
  });

  it("handles fan-in to a single node", () => {
    const edges = [makeEdge("A", "D"), makeEdge("B", "D"), makeEdge("C", "D")];
    const result = getUpstreamEdgeIds("D", edges);
    expect(result.size).toBe(3);
    expect(result).toContain("A-D-");
    expect(result).toContain("B-D-");
    expect(result).toContain("C-D-");
  });
});

/* ── getBidirectionalEdgeIds ──────────────────────────────────────── */

describe("getBidirectionalEdgeIds", () => {
  it("returns empty sets for node with no edges", () => {
    const { upstream, downstream } = getBidirectionalEdgeIds("A", []);
    expect(upstream.size).toBe(0);
    expect(downstream.size).toBe(0);
  });

  it("linear chain A→B→C→D: selecting B gives correct sets", () => {
    const edges = [makeEdge("A", "B"), makeEdge("B", "C"), makeEdge("C", "D")];
    const { upstream, downstream } = getBidirectionalEdgeIds("B", edges);
    expect(upstream).toEqual(new Set(["A-B-"]));
    expect(downstream).toEqual(new Set(["B-C-", "C-D-"]));
  });

  it("diamond A→B, A→C, B→D, C→D: selecting D gives all upstream", () => {
    const edges = [
      makeEdge("A", "B"),
      makeEdge("A", "C"),
      makeEdge("B", "D"),
      makeEdge("C", "D"),
    ];
    const { upstream, downstream } = getBidirectionalEdgeIds("D", edges);
    expect(upstream.size).toBe(4);
    expect(upstream).toContain("A-B-");
    expect(upstream).toContain("A-C-");
    expect(upstream).toContain("B-D-");
    expect(upstream).toContain("C-D-");
    expect(downstream.size).toBe(0);
  });

  it("fan-out from A: 0 upstream, N downstream", () => {
    const edges = [makeEdge("A", "B"), makeEdge("A", "C"), makeEdge("A", "D")];
    const { upstream, downstream } = getBidirectionalEdgeIds("A", edges);
    expect(upstream.size).toBe(0);
    expect(downstream.size).toBe(3);
  });

  it("fan-in to A: N upstream, 0 downstream", () => {
    const edges = [makeEdge("B", "A"), makeEdge("C", "A"), makeEdge("D", "A")];
    const { upstream, downstream } = getBidirectionalEdgeIds("A", edges);
    expect(upstream.size).toBe(3);
    expect(downstream.size).toBe(0);
  });

  it("single node not referenced by any edges", () => {
    const edges = [makeEdge("X", "Y")];
    const { upstream, downstream } = getBidirectionalEdgeIds("Z", edges);
    expect(upstream.size).toBe(0);
    expect(downstream.size).toBe(0);
  });
});
