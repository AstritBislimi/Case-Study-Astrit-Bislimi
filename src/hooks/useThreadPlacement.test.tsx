import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useThreadPlacement } from "./useThreadPlacement";

describe("useThreadPlacement", () => {
  it("starts, places and resets, and clears placement on Escape or disconnect", () => {
    const { result, rerender } = renderHook(
      ({ canComment }) => useThreadPlacement(canComment),
      { initialProps: { canComment: true } }
    );

    act(() => result.current.startPlacing());
    expect(result.current.state).toBe("placing");

    act(() => result.current.placeAtImagePoint({ x: 0.25, y: 0.75 }));
    expect(result.current).toMatchObject({
      state: "placed",
      coords: { x: 0.25, y: 0.75 },
    });

    act(() => result.current.reset());
    expect(result.current).toMatchObject({
      state: "initial",
      coords: { x: 0, y: 0 },
    });

    act(() => result.current.startPlacing());
    act(() => fireEvent.keyDown(document, { key: "Escape" }));
    expect(result.current.state).toBe("initial");

    act(() => result.current.startPlacing());
    rerender({ canComment: false });
    expect(result.current.state).toBe("initial");
  });
});
