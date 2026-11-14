import {
  memo,
  MouseEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CommentPin } from "@liveblocks/react-ui";
import type { ThreadData } from "@liveblocks/client";
import {
  imagePointToPixels,
  offsetImagePoint,
  screenDeltaToImage,
} from "../lib/canvas/coordinates";
import type { Point } from "../lib/canvas/coordinates";
import {
  CANVAS_IMAGE_SIZE,
  POINTER_DRAG_THRESHOLD,
} from "../lib/canvas/constants";
import { useMaxZIndex } from "../hooks";
import { useCanComment } from "../hooks/useCanComment";
import { ThreadPopover } from "./ThreadPopover";

type DraggableThreadProps = {
  thread: ThreadData;
  imageX: number;
  imageY: number;
  getZoom: () => number;
  onDragEnd: (thread: ThreadData, imagePoint: Point) => void;
};

type ActivePointer = {
  id: number;
  startX: number;
  startY: number;
  zoom: number;
  delta: Point;
  isDragging: boolean;
};

export const DraggableThread = memo(function DraggableThread({
  thread,
  imageX,
  imageY,
  getZoom,
  onDragEnd,
}: DraggableThreadProps) {
  const canComment = useCanComment();
  // Open threads that have just been created
  const defaultOpen = useMemo(() => {
    return Number(new Date()) - Number(new Date(thread.createdAt)) <= 100;
  }, [thread.createdAt]);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [dragDelta, setDragDelta] = useState<Point | null>(null);
  const activePointer = useRef<ActivePointer | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    if (!canComment) {
      activePointer.current = null;
      setDragDelta(null);
    }
  }, [canComment]);

  // Used to set z-index higher than other threads when open or dragging
  const maxZIndex = useMaxZIndex();
  const currentZIndex =
    isOpen || dragDelta ? maxZIndex + 1 : thread.metadata?.zIndex || 0;
  const imagePosition = offsetImagePoint(
    { x: imageX, y: imageY },
    dragDelta ?? { x: 0, y: 0 },
    CANVAS_IMAGE_SIZE
  );
  const pinPosition = imagePointToPixels(imagePosition, CANVAS_IMAGE_SIZE);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!canComment || event.button !== 0 || !event.isPrimary) {
      return;
    }

    suppressClick.current = false;
    activePointer.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      zoom: getZoom(),
      delta: { x: 0, y: 0 },
      isDragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!canComment) {
      return;
    }

    const pointer = activePointer.current;
    if (!pointer || pointer.id !== event.pointerId) {
      return;
    }

    const screenDelta = {
      x: event.clientX - pointer.startX,
      y: event.clientY - pointer.startY,
    };
    if (
      !pointer.isDragging &&
      Math.hypot(screenDelta.x, screenDelta.y) < POINTER_DRAG_THRESHOLD
    ) {
      return;
    }

    pointer.isDragging = true;
    pointer.delta = screenDeltaToImage(screenDelta, pointer.zoom);
    event.preventDefault();
    setDragDelta(pointer.delta);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const pointer = activePointer.current;
    if (!pointer || pointer.id !== event.pointerId) {
      return;
    }

    activePointer.current = null;
    if (pointer.isDragging && canComment) {
      suppressClick.current = true;
      onDragEnd(
        thread,
        offsetImagePoint(
          { x: imageX, y: imageY },
          pointer.delta,
          CANVAS_IMAGE_SIZE
        )
      );
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
    <ThreadPopover
      mode="thread"
      thread={thread}
      imageX={imageX}
      open={isOpen}
      onOpenChange={setIsOpen}
      showComposer={canComment}
      defaultOpen={defaultOpen}
      style={{ pointerEvents: dragDelta ? "none" : "auto" }}
    >
      <div
        className="canvas-thread-anchor"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translate3d(${pinPosition.x}px, ${pinPosition.y}px, 0) scale(var(--canvas-inverse-zoom))`,
          transformOrigin: "top left",
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
    </ThreadPopover>
  );
});
