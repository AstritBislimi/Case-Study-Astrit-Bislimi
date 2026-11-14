import type { ThreadData } from "@liveblocks/client";
import { useThreads, useEditThreadMetadata } from "@liveblocks/react/suspense";
import { useCallback } from "react";
import { ThreadPlacement } from "./ThreadPlacement";
import { useMaxZIndex } from "../hooks";
import { CanvasProvider, useCanvasViewport } from "./CanvasProvider";
import { useCanComment } from "../hooks/useCanComment";
import { useThreadPlacement } from "../hooks/useThreadPlacement";
import { screenToImage } from "../lib/canvas/coordinates";
import type { Point } from "../lib/canvas/coordinates";
import { CANVAS_IMAGE_SIZE } from "../lib/canvas/constants";
import { CanvasViewport } from "./CanvasViewport";
import { ThreadLayer } from "./ThreadLayer";

export function CommentsCanvas() {
  return (
    <CanvasProvider>
      <CommentsCanvasContent />
    </CanvasProvider>
  );
}

function CommentsCanvasContent() {
  const { threads } = useThreads();
  const editThreadMetadata = useEditThreadMetadata();
  const maxZIndex = useMaxZIndex();
  const viewport = useCanvasViewport();
  const canComment = useCanComment();
  const placement = useThreadPlacement(canComment);

  const handleImageClick = useCallback(
    (screenPoint: Point) => {
      const imagePoint = screenToImage(
        screenPoint,
        viewport,
        CANVAS_IMAGE_SIZE
      );
      placement.placeAtImagePoint(imagePoint);
    },
    [placement.placeAtImagePoint, viewport]
  );

  // Persist the moved pin once its pointer drag ends.
  const handleDragEnd = useCallback(
    (thread: ThreadData, imagePoint: Point) => {
      editThreadMetadata({
        threadId: thread.id,
        metadata: {
          x: imagePoint.x,
          y: imagePoint.y,
          zIndex: maxZIndex + 1,
        },
      });
    },
    [editThreadMetadata, maxZIndex]
  );

  return (
    <CanvasViewport onImageClick={handleImageClick}>
      <ThreadLayer threads={threads} onDragEnd={handleDragEnd} />
      <ThreadPlacement
        state={placement.state}
        coords={placement.coords}
        canComment={canComment}
        startPlacing={placement.startPlacing}
        placeAtImagePoint={placement.placeAtImagePoint}
        reset={placement.reset}
      />
    </CanvasViewport>
  );
}
