import {
  memo,
  MouseEvent,
  PointerEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { FloatingThread, CommentPin } from "@liveblocks/react-ui";
import type { ThreadData } from "@liveblocks/client";
import type { Point } from "../lib/canvas/coordinates";
import { useMaxZIndex } from "../hooks";

const DRAG_THRESHOLD = 3;

type DraggableThreadProps = {
  thread: ThreadData;
  onDragEnd: (thread: ThreadData, delta: Point) => void;
};

type ActivePointer = {
  id: number;
  startX: number;
  startY: number;
  delta: Point;
  isDragging: boolean;
};

export const DraggableThread = memo(function DraggableThread({
  thread,
  onDragEnd,
}: DraggableThreadProps) {
  // Open threads that have just been created
  const defaultOpen = useMemo(() => {
    return Number(new Date()) - Number(new Date(thread.createdAt)) <= 100;
  }, [thread.createdAt]);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [dragDelta, setDragDelta] = useState<Point | null>(null);
  const activePointer = useRef<ActivePointer | null>(null);
  const suppressClick = useRef(false);

  // Used to set z-index higher than other threads when open or dragging
  const maxZIndex = useMaxZIndex();
  const currentZIndex =
    isOpen || dragDelta ? maxZIndex + 1 : thread.metadata?.zIndex || 0;

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !event.isPrimary) {
      return;
    }

    suppressClick.current = false;
    activePointer.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      delta: { x: 0, y: 0 },
      isDragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const pointer = activePointer.current;
    if (!pointer || pointer.id !== event.pointerId) {
      return;
    }

    const delta = {
      x: event.clientX - pointer.startX,
      y: event.clientY - pointer.startY,
    };
    if (!pointer.isDragging && Math.hypot(delta.x, delta.y) < DRAG_THRESHOLD) {
      return;
    }

    pointer.isDragging = true;
    pointer.delta = delta;
    event.preventDefault();
    setDragDelta(delta);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const pointer = activePointer.current;
    if (!pointer || pointer.id !== event.pointerId) {
      return;
    }

    activePointer.current = null;
    if (pointer.isDragging) {
      suppressClick.current = true;
      onDragEnd(thread, pointer.delta);
    }
    setDragDelta(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = () => {
    activePointer.current = null;
    suppressClick.current = false;
    setDragDelta(null);
  };

  const handleClickCapture = (event: MouseEvent<HTMLButtonElement>) => {
    if (!suppressClick.current) {
      return;
    }

    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <FloatingThread
      thread={thread}
      open={isOpen}
      onOpenChange={setIsOpen}
      defaultOpen={defaultOpen}
      side="right"
      style={{ pointerEvents: dragDelta ? "none" : "auto" }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translate3d(${thread.metadata.x + (dragDelta?.x ?? 0)}px, ${
            thread.metadata.y + (dragDelta?.y ?? 0)
          }px, 0)`,
          zIndex: currentZIndex,
        }}
      >
        <CommentPin
          userId={thread.comments[0]?.userId}
          corner="top-left"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onClickCapture={handleClickCapture}
        />
      </div>
    </FloatingThread>
  );
});
