"use client";

import { useCallback, useRef } from "react";
import type { CSSProperties } from "react";
import type { ThreadData } from "@liveblocks/client";
import type { Point } from "../lib/canvas/coordinates";
import { useCanvasViewport } from "./CanvasProvider";
import { DraggableThread } from "./DraggableThread";

type ThreadLayerProps = {
  threads: ThreadData[];
  onDragEnd: (thread: ThreadData, imagePoint: Point) => void;
};

export function ThreadLayer({
  threads,
  onDragEnd,
}: ThreadLayerProps) {
  const viewport = useCanvasViewport();
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;
  const getZoom = useCallback(() => viewportRef.current.zoom, []);
  const style: CSSProperties & { "--canvas-inverse-zoom": number } = {
    transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
    transformOrigin: "top left",
    "--canvas-inverse-zoom": 1 / viewport.zoom,
  };

  return (
    <div className="canvas-thread-layer" style={style}>
      {threads.map((thread) => (
        <DraggableThread
          key={thread.id}
          thread={thread}
          imageX={thread.metadata.x}
          imageY={thread.metadata.y}
          getZoom={getZoom}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}
