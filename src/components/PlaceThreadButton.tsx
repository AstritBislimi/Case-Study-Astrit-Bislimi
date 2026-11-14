import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent } from "react";
import { CommentPin } from "@liveblocks/react-ui";
import { useSelf } from "@liveblocks/react";
import { useMaxZIndex } from "../hooks";
import { useCanComment } from "../hooks/useCanComment";
import {
  imageToScreen,
  isImagePoint,
  screenToImage,
} from "../lib/canvas/coordinates";
import { CANVAS_IMAGE_SIZE } from "../lib/canvas/constants";
import { useCanvasViewport } from "./CanvasProvider";
import { ThreadPopover } from "./ThreadPopover";

const PLACEMENT_DRAG_THRESHOLD = 3;

export function PlaceThreadButton() {
  const canComment = useCanComment();
  const [state, setState] = useState<"initial" | "placing" | "placed">(
    "initial"
  );
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const viewport = useCanvasViewport();
  const placementPointer = useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const shouldPlaceOnClick = useRef(false);

  const reset = useCallback(() => {
    setState("initial");
    setCoords({ x: 0, y: 0 });
    placementPointer.current = null;
    shouldPlaceOnClick.current = false;
  }, []);

  useEffect(() => {
    if (!canComment) {
      reset();
    }
  }, [canComment, reset]);

  useEffect(() => {
    if (state === "initial") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        reset();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [reset, state]);

  const handlePlacementPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canComment || event.button !== 0 || !event.isPrimary) {
      return;
    }

    placementPointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePlacementPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!canComment) {
      return;
    }

    const pointer = placementPointer.current;
    if (!pointer || pointer.id !== event.pointerId) {
      return;
    }
    placementPointer.current = null;

    const movement = Math.hypot(
      event.clientX - pointer.x,
      event.clientY - pointer.y
    );
    shouldPlaceOnClick.current = movement < PLACEMENT_DRAG_THRESHOLD;
  };

  const handlePlacementClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!canComment) {
      reset();
      return;
    }

    if (!shouldPlaceOnClick.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    shouldPlaceOnClick.current = false;

    const imagePoint = screenToImage(
      { x: event.clientX, y: event.clientY },
      viewport,
      CANVAS_IMAGE_SIZE
    );
    if (!isImagePoint(imagePoint)) {
      reset();
      return;
    }

    setCoords(imagePoint);
    setState("placed");
  };

  return (
    <>
      {/* Allows you to place floating composers */}
      <div className="canvas-place-comment-control">
        <button
          className="canvas-place-comment-button"
          type="button"
          aria-label="Place comment"
          disabled={!canComment}
          onClick={() => {
            if (canComment) {
              setState("placing");
            }
          }}
          style={{ cursor: state === "placing" ? "none" : undefined }}
        >
          +
        </button>
      </div>

      {/* Overlay that lets you click and cancel placing */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          background: "rgba(0, 0, 0, 0.2)",
          pointerEvents: state === "initial" ? "none" : undefined,
          opacity: state !== "initial" ? 1 : 0,
        }}
        onClick={reset}
        onContextMenu={(e) => {
          e.preventDefault();
          reset();
        }}
      />

      {/* The visible cursor when you're placing */}
      {state === "placing" ? (
        <div
          className="canvas-comment-placement"
          data-testid="comment-placement-layer"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: "none",
          }}
          onPointerDown={handlePlacementPointerDown}
          onPointerUp={handlePlacementPointerUp}
          onPointerCancel={() => {
            placementPointer.current = null;
            shouldPlaceOnClick.current = false;
          }}
          onClick={handlePlacementClick}
          onContextMenu={(e) => {
            e.preventDefault();
            reset();
          }}
        >
          <NewThreadCursor />
        </div>
      ) : null}

      {/* When cursor placed, show a composer on the canvas */}
      {state === "placed" && canComment ? (
        <ThreadComposer coords={coords} onClose={reset} />
      ) : null}
    </>
  );
}

function ThreadComposer({
  coords,
  onClose,
}: {
  coords: { x: number; y: number };
  onClose: () => void;
}) {
  // Get the current user
  const creatorId = useSelf((me) => me.id);
  // Create thread above other threads
  const maxZIndex = useMaxZIndex();
  const viewport = useCanvasViewport();
  const screenPosition = imageToScreen(coords, viewport, CANVAS_IMAGE_SIZE);

  return (
    <ThreadPopover
      mode="composer"
      imageX={coords.x}
      defaultOpen={true}
      metadata={{
        x: coords.x,
        y: coords.y,
        zIndex: maxZIndex + 1,
      }}
      onComposerSubmit={onClose}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <CommentPin
        userId={creatorId ?? undefined}
        corner="top-left"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translate(${screenPosition.x}px, ${screenPosition.y}px)`,
        }}
      />
    </ThreadPopover>
  );
}

// Render the new thread component over the current user's cursor
function NewThreadCursor() {
  const [coords, setCoords] = useState({
    x: -10000,
    y: -10000,
  });

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setCoords({
        x: e.clientX,
        y: e.clientY,
      });
    };

    document.addEventListener("mousemove", updatePosition, false);
    document.addEventListener("mouseenter", updatePosition, false);

    return () => {
      document.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mouseenter", updatePosition);
    };
  }, []);

  return (
    <CommentPin
      corner="top-left"
      aria-hidden="true"
      tabIndex={-1}
      style={{
        cursor: "none",
        position: "fixed",
        top: 0,
        left: 0,
        transform: `translate(${coords.x}px, ${coords.y}px)`,
        zIndex: 99999999999,
        pointerEvents: "none",
      }}
    />
  );
}
