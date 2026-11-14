"use client";

import {
  memo,
  PointerEvent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCanvasActions, useCanvasViewport } from "./CanvasProvider";
import type { Point } from "../lib/canvas/coordinates";
import {
  CANVAS_IMAGE_SIZE,
  POINTER_DRAG_THRESHOLD,
} from "../lib/canvas/constants";

const IMAGE_URL =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&h=1125&q=85";

function CanvasImageLayer({ onError }: { onError: () => void }) {
  const viewport = useCanvasViewport();

  return (
    <div
      className="canvas-image"
      data-pan-image
      style={{
        width: CANVAS_IMAGE_SIZE.width,
        height: CANVAS_IMAGE_SIZE.height,
        transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`,
      }}
    >
      <img
        src={IMAGE_URL}
        alt="Mountain landscape"
        width={CANVAS_IMAGE_SIZE.width}
        height={CANVAS_IMAGE_SIZE.height}
        draggable={false}
        onError={onError}
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

function CanvasSurface({
  children,
  getCanvasCenter,
}: PropsWithChildren<{
  getCanvasCenter: () => { x: number; y: number };
}>) {
  const [imageError, setImageError] = useState(false);
  const handleImageError = useCallback(() => setImageError(true), []);

  return (
    <>
      <CanvasImageLayer onError={handleImageError} />
      {imageError ? (
        <div className="canvas-image-error" role="alert">
          The image couldn’t be loaded. Commenting is disabled.
        </div>
      ) : (
        <>
          <CanvasOverlayLayer>{children}</CanvasOverlayLayer>
          <CanvasZoomControls getCanvasCenter={getCanvasCenter} />
        </>
      )}
    </>
  );
}

export function CanvasViewport({
  children,
  onImageClick,
}: PropsWithChildren<{
  onImageClick?: (screenPoint: Point) => void;
}>) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<{
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const { panBy, fitToViewport, zoomByAtPoint } = useCanvasActions();

  const getCanvasCenter = useCallback(() => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    return bounds
      ? { x: bounds.width / 2, y: bounds.height / 2 }
      : { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const fitCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      fitToViewport(
        {
          width: bounds.width || window.innerWidth,
          height: bounds.height || window.innerHeight,
        },
        CANVAS_IMAGE_SIZE
      );
    };

    fitCanvas();
    window.addEventListener("resize", fitCanvas);

    return () => {
      window.removeEventListener("resize", fitCanvas);
    };
  }, [fitToViewport]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      !(target instanceof Element) ||
      !target.closest("[data-pan-image]")
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointer.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
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

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointer = activePointer.current;
    if (pointer?.id !== event.pointerId) {
      return;
    }
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const movement = Math.hypot(
      event.clientX - pointer.startX,
      event.clientY - pointer.startY
    );
    if (movement >= POINTER_DRAG_THRESHOLD) {
      return;
    }

    const bounds = canvasRef.current?.getBoundingClientRect();
    if (bounds) {
      onImageClick?.({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (activePointer.current?.id !== event.pointerId) {
      return;
    }
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const point = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomByAtPoint(point, factor);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoomByAtPoint]);

  return (
    <div
      ref={canvasRef}
      className="canvas-viewport"
      role="region"
      aria-label="Image canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <CanvasSurface getCanvasCenter={getCanvasCenter}>
        {children}
      </CanvasSurface>
    </div>
  );
}
