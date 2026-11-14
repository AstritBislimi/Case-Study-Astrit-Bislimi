"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  clampZoom,
  fitImageToViewport,
  zoomAtPoint as calculateZoomAtPoint,
} from "../lib/canvas/coordinates";
import type { ImageSize, Point, Viewport } from "../lib/canvas/coordinates";

const ZOOM_FACTOR = 1.2;

export type ViewportActions = {
  panBy: (delta: Point) => void;
  fitToViewport: (viewportSize: ImageSize, imageSize: ImageSize) => void;
  zoomAt: (screenPoint: Point, zoom: number) => void;
  zoomByAtPoint: (screenPoint: Point, factor: number) => void;
  zoomIn: (screenPoint: Point) => void;
  zoomOut: (screenPoint: Point) => void;
};

export type ViewportControls = ViewportActions & {
  viewport: Viewport;
};

export function useViewport(
  initialViewport: Viewport = { x: 0, y: 0, zoom: 1 }
): ViewportControls {
  const [viewport, setViewport] = useState(initialViewport);
  const hasInteracted = useRef(false);

  const panBy = useCallback((delta: Point) => {
    hasInteracted.current = true;
    setViewport((current) => ({
      ...current,
      x: current.x + delta.x,
      y: current.y + delta.y,
    }));
  }, []);

  const fitToViewport = useCallback(
    (viewportSize: ImageSize, imageSize: ImageSize) => {
      if (!hasInteracted.current) {
        setViewport(fitImageToViewport(viewportSize, imageSize));
      }
    },
    []
  );

  const zoomAt = useCallback((screenPoint: Point, zoom: number) => {
    hasInteracted.current = true;
    setViewport((current) =>
      calculateZoomAtPoint(current, screenPoint, clampZoom(zoom))
    );
  }, []);

  const zoomByAtPoint = useCallback(
    (screenPoint: Point, factor: number) => {
      hasInteracted.current = true;
      setViewport((current) =>
        calculateZoomAtPoint(
          current,
          screenPoint,
          clampZoom(current.zoom * factor)
        )
      );
    },
    []
  );

  const zoomIn = useCallback((screenPoint: Point) => {
    zoomByAtPoint(screenPoint, ZOOM_FACTOR);
  }, [zoomByAtPoint]);

  const zoomOut = useCallback((screenPoint: Point) => {
    zoomByAtPoint(screenPoint, 1 / ZOOM_FACTOR);
  }, [zoomByAtPoint]);

  return useMemo(
    () => ({
      viewport,
      panBy,
      fitToViewport,
      zoomAt,
      zoomByAtPoint,
      zoomIn,
      zoomOut,
    }),
    [viewport, panBy, fitToViewport, zoomAt, zoomByAtPoint, zoomIn, zoomOut]
  );
}
