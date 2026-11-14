"use client";

import {
  memo,
  PointerEvent,
  PropsWithChildren,
  useCallback,
  useRef,
  WheelEvent,
} from "react";
import { useCanvasActions, useCanvasViewport } from "./CanvasProvider";

const IMAGE_WIDTH = 900;
const IMAGE_HEIGHT = 600;
const IMAGE_URL =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&h=800&q=85";

function CanvasImageLayer() {
  const viewport = useCanvasViewport();

  return (
    <div
      className="canvas-image"
      data-pan-image
      style={{
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
      }}
    >
      <img
        src={IMAGE_URL}
        alt="Mountain landscape"
        width={IMAGE_WIDTH}
        height={IMAGE_HEIGHT}
        draggable={false}
      />
    </div>
  );
}

function CanvasZoomControls({
  getCanvasCenter,
}: {
  getCanvasCenter: () => { x: number; y: number };
}) {
  const viewport = useCanvasViewport();
  const { zoomIn, zoomOut } = useCanvasActions();

  return (
    <div className="canvas-zoom-controls" aria-label="Canvas zoom controls">
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => zoomOut(getCanvasCenter())}
      >
        −
      </button>
      <span aria-live="polite">{Math.round(viewport.zoom * 100)}%</span>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => zoomIn(getCanvasCenter())}
      >
        +
      </button>
    </div>
  );
}

const CanvasOverlayLayer = memo(function CanvasOverlayLayer({
  children,
}: PropsWithChildren) {
  return <div className="canvas-overlays">{children}</div>;
});

export function CanvasViewport({ children }: PropsWithChildren) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);
  const { panBy, zoomByAtPoint } = useCanvasActions();

  const getCanvasCenter = useCallback(() => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    return bounds
      ? { x: bounds.width / 2, y: bounds.height / 2 }
      : { x: 0, y: 0 };
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("[data-pan-image]")) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = activePointer.current;
    if (!pointer || pointer.id !== event.pointerId) {
      return;
    }

    panBy({
      x: event.clientX - pointer.x,
      y: event.clientY - pointer.y,
    });
    activePointer.current = {
      ...pointer,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const finishPan = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointer.current?.id !== event.pointerId) {
      return;
    }
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    event.preventDefault();
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const point = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoomByAtPoint(point, factor);
  };

  return (
    <div
      ref={canvasRef}
      className="canvas-viewport"
      role="region"
      aria-label="Image canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPan}
      onPointerCancel={finishPan}
      onWheel={handleWheel}
    >
      <CanvasImageLayer />
      <CanvasOverlayLayer>{children}</CanvasOverlayLayer>
      <CanvasZoomControls getCanvasCenter={getCanvasCenter} />
    </div>
  );
}
