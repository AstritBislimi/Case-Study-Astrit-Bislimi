import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCanComment } from "./useCanComment";

const mocks = vi.hoisted(() => ({
  status: "connected" as string,
}));

vi.mock("@liveblocks/react", () => ({
  useStatus: () => mocks.status,
}));

describe("useCanComment", () => {
  afterEach(cleanup);

  it("allows commenting only while the room is connected", () => {
    const { result, rerender } = renderHook(() => useCanComment());

    expect(result.current).toBe(true);

    mocks.status = "reconnecting";
    rerender();
    expect(result.current).toBe(false);

    mocks.status = "connected";
    rerender();
    expect(result.current).toBe(true);
  });
});
