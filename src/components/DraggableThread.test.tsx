import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ThreadData } from "@liveblocks/client";
import type { ComponentProps, CSSProperties, PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DraggableThread } from "./DraggableThread";

const mocks = vi.hoisted(() => ({
  floatingThreadRender: vi.fn(),
}));

vi.mock("@liveblocks/react-ui", () => ({
  FloatingThread: ({
    children,
    style,
    side,
  }: PropsWithChildren<{ style?: CSSProperties; side?: string }>) => {
    mocks.floatingThreadRender(side);
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
  afterEach(cleanup);

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

  it("opens a thread toward the image center near its right edge", () => {
    render(
      <DraggableThread
        thread={createThread("right-edge")}
        imageX={0.9}
        imageY={0.5}
        getZoom={() => 1}
        onDragEnd={vi.fn()}
      />
    );

    expect(mocks.floatingThreadRender).toHaveBeenCalledWith("left");
  });

  it("does not treat movement below the threshold as a drag", () => {
    const onDragEnd = vi.fn();
    render(
      <DraggableThread
        thread={createThread("click")}
        imageX={0.25}
        imageY={0.5}
        getZoom={() => 1}
        onDragEnd={onDragEnd}
      />
    );

    const pin = screen.getByRole("button", { name: "Pin" });
    Object.defineProperty(pin, "setPointerCapture", { value: vi.fn() });
    Object.defineProperty(pin, "hasPointerCapture", { value: () => true });
    Object.defineProperty(pin, "releasePointerCapture", { value: vi.fn() });

    fireEvent.pointerDown(pin, {
      pointerId: 2,
      isPrimary: true,
      button: 0,
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerMove(pin, {
      pointerId: 2,
      clientX: 12,
      clientY: 20,
    });
    fireEvent.pointerUp(pin, {
      pointerId: 2,
      clientX: 12,
      clientY: 20,
    });

    expect(onDragEnd).not.toHaveBeenCalled();
  });
});
