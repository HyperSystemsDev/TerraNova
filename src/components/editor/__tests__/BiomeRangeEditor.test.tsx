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
    expect(screen.getByText("+ Add")).toBeTruthy();
  });

  it("renders biome names in the list from store state", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -1.0, Max: 1.0 },
      { Biome: "desert", Min: -0.5, Max: 0.5 },
    ]);

    render(<BiomeRangeEditor />);
    expect(screen.getByText("forest_hills")).toBeTruthy();
    expect(screen.getByText("desert")).toBeTruthy();
  });

  it("displays biome count in the header", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -0.5, Max: 0.5 },
      { Biome: "desert", Min: 0.1, Max: 0.8 },
    ]);

    render(<BiomeRangeEditor />);
    expect(screen.getByText("(2)")).toBeTruthy();
  });

  it("filters biomes by search query", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -1.0, Max: 0.0 },
      { Biome: "desert", Min: 0.0, Max: 1.0 },
    ]);

    render(<BiomeRangeEditor />);
    const searchInput = screen.getByPlaceholderText("Search...");
    fireEvent.change(searchInput, { target: { value: "forest" } });

    expect(screen.getByText("forest_hills")).toBeTruthy();
    expect(screen.queryByText("desert")).toBeNull();
  });

  it("adding a biome range increases list count", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -1.0, Max: 1.0 },
    ]);

    render(<BiomeRangeEditor />);
    expect(screen.getByText("forest_hills")).toBeTruthy();

    fireEvent.click(screen.getByText("+ Add"));

    expect(screen.getByText("new_biome")).toBeTruthy();
    expect(useEditorStore.getState().biomeRanges).toHaveLength(2);
  });

  it("removing a biome range decreases list count", () => {
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

  it("shows column headers for sorting", () => {
    render(<BiomeRangeEditor />);
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Range")).toBeTruthy();
    expect(screen.getByText("Min")).toBeTruthy();
    expect(screen.getByText("Max")).toBeTruthy();
  });

  it("selects a biome on click", () => {
    useEditorStore.getState().setBiomeRanges([
      { Biome: "forest_hills", Min: -1.0, Max: 0.0 },
      { Biome: "desert", Min: 0.0, Max: 1.0 },
    ]);

    render(<BiomeRangeEditor />);
    fireEvent.click(screen.getByText("forest_hills"));
    expect(useEditorStore.getState().selectedBiomeIndex).toBe(0);
  });
});
