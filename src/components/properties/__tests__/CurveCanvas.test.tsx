import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { CurveCanvas } from "../CurveCanvas";

beforeAll(() => {
  // jsdom lacks ResizeObserver — provide a minimal stub
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("CurveCanvas", () => {
  it("renders without crashing with empty points", () => {
    const { container } = render(<CurveCanvas points={[]} />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("renders with sample points", () => {
    const points = [[0, 0], [0.5, 0.5], [1, 1]];
    const { container } = render(
      <CurveCanvas points={points} onChange={() => {}} onCommit={() => {}} />,
    );
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("renders in evaluator mode", () => {
    const evaluator = (x: number) => x * x;
    const { container } = render(
      <CurveCanvas evaluator={evaluator} label="Preview (read-only)" />,
    );
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("shows interactive label when onChange is provided", () => {
    const { container } = render(
      <CurveCanvas
        points={[[0, 0], [1, 1]]}
        label="Points (2)"
        onChange={() => {}}
        onCommit={() => {}}
      />,
    );
    expect(container.textContent).toContain("Points (2)");
  });

  it("shows help text in interactive mode", () => {
    const { container } = render(
      <CurveCanvas points={[]} onChange={() => {}} onCommit={() => {}} />,
    );
    expect(container.textContent).toContain("Double-click to add");
    expect(container.textContent).toContain("Shift = snap");
  });

  it("shows preset buttons in interactive mode", () => {
    const { container } = render(
      <CurveCanvas points={[]} onChange={() => {}} onCommit={() => {}} />,
    );
    expect(container.textContent).toContain("Presets:");
    expect(container.textContent).toContain("Linear");
    expect(container.textContent).toContain("Ease In");
    expect(container.textContent).toContain("S-Curve");
  });

  it("renders in compact mode with minimal DOM", () => {
    const { container } = render(
      <CurveCanvas points={[[0, 0], [0.5, 0.5], [1, 1]]} compact />,
    );
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    // Compact mode should NOT show help text, presets, or labels
    expect(container.textContent).not.toContain("Double-click");
    expect(container.textContent).not.toContain("Presets:");
  });

  it("compact mode has correct height", () => {
    const { container } = render(
      <CurveCanvas evaluator={(x) => x} compact />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe("40px");
  });
});
