import { fireEvent, render, screen } from "@testing-library/react";
import type { ThreadData } from "@liveblocks/client";
import type { ComponentProps, CSSProperties, PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { CanvasProvider, useCanvasActions } from "./CanvasProvider";
import { ThreadLayer } from "./ThreadLayer";

const mocks = vi.hoisted(() => ({
  floatingThreadRender: vi.fn(),
}));

vi.mock("@liveblocks/react-ui", () => ({
  FloatingThread: ({
    children,
    style,
  }: PropsWithChildren<{ style?: CSSProperties }>) => {
    mocks.floatingThreadRender();
    return <div style={style}>{children}</div>;
  },
  CommentPin: ({
    userId,
    corner,
    ...buttonProps
  }: ComponentProps<"button"> & {
    userId?: string;
    corner?: string;
  }) => <button {...buttonProps}>Pin</button>,
}));

vi.mock("../hooks", () => ({
  useMaxZIndex: () => 10,
}));

function createThread(): ThreadData {
  const now = new Date();
  return {
    type: "thread",
    id: "thread-1",
    roomId: "test-room",
    createdAt: now,
    updatedAt: now,
    comments: [],
    metadata: { x: 0.25, y: 0.75, zIndex: 1 },
    resolved: false,
    visibility: "public",
  };
}

function ZoomControl() {
  const { zoomAt } = useCanvasActions();
  return (
    <button type="button" onClick={() => zoomAt({ x: 0, y: 0 }, 2)}>
      Zoom
    </button>
  );
}

describe("ThreadLayer", () => {
  it("moves with the viewport, inversely scales pins, and avoids rerendering them", () => {
    mocks.floatingThreadRender.mockClear();
    const thread = createThread();
    const onDragEnd = vi.fn();
    const { container } = render(
      <CanvasProvider>
        <ThreadLayer threads={[thread]} onDragEnd={onDragEnd} />
        <ZoomControl />
      </CanvasProvider>
    );

    const layer = container.querySelector<HTMLDivElement>(
      ".canvas-thread-layer"
    );
    const pin = container.querySelector<HTMLDivElement>(
      ".canvas-thread-anchor"
    );
    if (!layer || !pin) {
      throw new Error("Expected the thread layer and pin anchor to render");
    }

    expect(layer.style.transform).toBe("translate3d(36px, 26px, 0px) scale(1)");
    expect(layer.style.getPropertyValue("--canvas-inverse-zoom")).toBe("1");
    expect(pin.style.transform).toContain("scale(var(--canvas-inverse-zoom))");
    expect(mocks.floatingThreadRender).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Zoom" }));

    expect(layer.style.transform).toBe("translate3d(72px, 52px, 0px) scale(2)");
    expect(layer.style.getPropertyValue("--canvas-inverse-zoom")).toBe("0.5");
    expect(mocks.floatingThreadRender).toHaveBeenCalledTimes(1);
  });
});
