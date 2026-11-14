import type { ThreadData } from "@liveblocks/client";
import { useThreads, useEditThreadMetadata } from "@liveblocks/react/suspense";
import { useCallback } from "react";
import { PlaceThreadButton } from "./PlaceThreadButton";
import { useMaxZIndex } from "../hooks";
import { CanvasProvider } from "./CanvasProvider";
import { CanvasViewport } from "./CanvasViewport";
import type { Point } from "../lib/canvas/coordinates";
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
    <CanvasViewport>
      <ThreadLayer
        threads={threads}
        onDragEnd={handleDragEnd}
      />
      <PlaceThreadButton />
    </CanvasViewport>
  );
}
