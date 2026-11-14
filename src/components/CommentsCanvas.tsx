import { ThreadData } from "@liveblocks/client";
import { useThreads, useEditThreadMetadata } from "@liveblocks/react/suspense";
import { useCallback } from "react";
import { PlaceThreadButton } from "./PlaceThreadButton";
import { DraggableThread } from "./DraggableThread";
import { useMaxZIndex } from "../hooks";
import { CanvasProvider } from "./CanvasProvider";
import { CanvasViewport } from "./CanvasViewport";
import type { Point } from "../lib/canvas/coordinates";

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
    (thread: ThreadData, delta: Point) => {
      editThreadMetadata({
        threadId: thread.id,
        metadata: {
          x: thread.metadata.x + delta.x,
          y: thread.metadata.y + delta.y,
          zIndex: maxZIndex + 1,
        },
      });
    },
    [editThreadMetadata, maxZIndex]
  );

  return (
    <CanvasViewport>
      <div className="canvas-thread-layer">
        {threads.map((thread) => (
          <DraggableThread
            key={thread.id}
            thread={thread}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
      <PlaceThreadButton />
    </CanvasViewport>
  );
}
