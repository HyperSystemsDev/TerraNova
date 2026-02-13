import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useEditorStore } from "@/stores/editorStore";
import { BiomeRangeEditor } from "../BiomeRangeEditor";

beforeEach(() => {
  useEditorStore.getState().reset();
});

describe("BiomeRangeEditor", () => {
  it("renders the header and add button", () => {
    render(<BiomeRangeEditor />);
    expect(screen.getByText("Biome Ranges")).toBeTruthy();
    expect(screen.getByText("+ Add Biome")).toBeTruthy();
  });

  it("renders correct number of range blocks from store state", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -1.0, Max: 1.0 },
      { Biome: "desert", Min: -0.5, Max: 0.5 },
    ]);

    render(<BiomeRangeEditor />);
    expect(screen.getByText("forest_hills")).toBeTruthy();
    expect(screen.getByText("desert")).toBeTruthy();
  });

  it("detects overlapping ranges and shows warning", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -0.5, Max: 0.5 },
      { Biome: "desert", Min: 0.1, Max: 0.8 },
    ]);

    render(<BiomeRangeEditor />);
    expect(screen.getByText(/Overlap.*forest_hills.*desert/)).toBeTruthy();
  });

  it("does not show overlap warning for non-overlapping ranges", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -1.0, Max: 0.0 },
      { Biome: "desert", Min: 0.0, Max: 1.0 },
    ]);

    render(<BiomeRangeEditor />);
    expect(screen.queryByText(/Overlap/)).toBeNull();
  });

  it("adding a biome range increases block count", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -1.0, Max: 1.0 },
    ]);

    render(<BiomeRangeEditor />);
    expect(screen.getByText("forest_hills")).toBeTruthy();

    fireEvent.click(screen.getByText("+ Add Biome"));

    expect(screen.getByText("new_biome")).toBeTruthy();
    expect(useEditorStore.getState().biomeRanges).toHaveLength(2);
  });

  it("removing a biome range decreases block count", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -1.0, Max: 1.0 },
      { Biome: "desert", Min: -0.5, Max: 0.5 },
    ]);

    render(<BiomeRangeEditor />);

    const deleteButtons = screen.getAllByText("x");
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(useEditorStore.getState().biomeRanges).toHaveLength(1);
  });

  it("clamping: updateBiomeRange stores the value (UI clamps during drag)", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "test", Min: -0.5, Max: 0.5 },
    ]);

    useEditorStore.getState().updateBiomeRange(0, { Min: -2.0 });
    const ranges = useEditorStore.getState().biomeRanges;
    expect(ranges[0].Min).toBe(-2.0);
  });

  it("renders with empty ranges", () => {
    useEditorStore.getState().setBiomeRanges([]);
    render(<BiomeRangeEditor />);
    expect(screen.getByText("Biome Ranges")).toBeTruthy();
  });
});
