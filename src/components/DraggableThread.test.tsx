import { fireEvent, render, screen } from "@testing-library/react";
import type { ThreadData } from "@liveblocks/client";
import type { ComponentProps, CSSProperties, PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DraggableThread } from "./DraggableThread";

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

function createThread(id: string): ThreadData {
  const now = new Date();
  return {
    type: "thread",
    id,
    roomId: "test-room",
    createdAt: now,
    updatedAt: now,
    comments: [],
    metadata: { x: 0.25, y: 0.5, zIndex: 1 },
    resolved: false,
    visibility: "public",
  };
}

describe("DraggableThread", () => {
  beforeEach(() => {
    mocks.floatingThreadRender.mockClear();
  });

  it("rerenders only the active thread while dragging", () => {
    const firstThread = createThread("first");
    const secondThread = createThread("second");
    const onDragEnd = vi.fn();
    const getZoom = () => 2;

    render(
      <>
        <DraggableThread
          thread={firstThread}
          imageX={0.25}
          imageY={0.5}
          getZoom={getZoom}
          onDragEnd={onDragEnd}
        />
        <DraggableThread
          thread={secondThread}
          imageX={0.25}
          imageY={0.5}
          getZoom={getZoom}
          onDragEnd={onDragEnd}
        />
      </>
    );

    expect(mocks.floatingThreadRender).toHaveBeenCalledTimes(2);

    const pin = screen.getAllByRole("button", { name: "Pin" })[0];
    Object.defineProperty(pin, "setPointerCapture", { value: vi.fn() });
    Object.defineProperty(pin, "hasPointerCapture", { value: () => true });
    Object.defineProperty(pin, "releasePointerCapture", { value: vi.fn() });

    fireEvent.pointerDown(pin, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerMove(pin, {
      pointerId: 1,
      clientX: 30,
      clientY: 20,
    });

    expect(mocks.floatingThreadRender).toHaveBeenCalledTimes(3);

    fireEvent.pointerUp(pin, {
      pointerId: 1,
      clientX: 30,
      clientY: 20,
    });

    expect(onDragEnd).toHaveBeenCalledWith(firstThread, {
      x: 0.25 + 10 / 900,
      y: 0.5,
    });
    expect(mocks.floatingThreadRender).toHaveBeenCalledTimes(4);
  });
});
