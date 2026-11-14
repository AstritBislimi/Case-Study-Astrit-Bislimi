import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useViewport } from "./useViewport";

describe("useViewport", () => {
  it("starts with the supplied viewport and pans by screen-space deltas", () => {
    const { result } = renderHook(() =>
      useViewport({ x: 10, y: 20, zoom: 1 })
    );

    expect(result.current.viewport).toEqual({ x: 10, y: 20, zoom: 1 });

    act(() => result.current.panBy({ x: 30, y: -8 }));

    expect(result.current.viewport).toEqual({ x: 40, y: 12, zoom: 1 });
  });

  it("zooms toward a screen point and clamps the requested zoom", () => {
    const { result } = renderHook(() =>
      useViewport({ x: 0, y: 0, zoom: 1 })
    );

    act(() => result.current.zoomAt({ x: 100, y: 80 }, 4));

    expect(result.current.viewport).toEqual({ x: -200, y: -160, zoom: 3 });
  });

  it("zooms in and out around the requested point", () => {
    const { result } = renderHook(() =>
      useViewport({ x: 20, y: 30, zoom: 1 })
    );
    const anchor = { x: 200, y: 150 };

    act(() => result.current.zoomIn(anchor));

    expect(result.current.viewport.zoom).toBeCloseTo(1.2);
    expect(
      result.current.viewport.x +
        ((anchor.x - 20) / 1) * result.current.viewport.zoom
    ).toBeCloseTo(anchor.x);
    expect(
      result.current.viewport.y +
        ((anchor.y - 30) / 1) * result.current.viewport.zoom
    ).toBeCloseTo(anchor.y);

    act(() => result.current.zoomOut(anchor));

    expect(result.current.viewport).toEqual({ x: 20, y: 30, zoom: 1 });
  });
});
