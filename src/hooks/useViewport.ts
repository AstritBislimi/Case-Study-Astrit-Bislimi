"use client";

import { useCallback, useMemo, useState } from "react";
import { clampZoom, zoomAtPoint as calculateZoomAtPoint } from "../lib/canvas/coordinates";
import type { Point, Viewport } from "../lib/canvas/coordinates";

const ZOOM_FACTOR = 1.2;

export type ViewportActions = {
  panBy: (delta: Point) => void;
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

  const panBy = useCallback((delta: Point) => {
    setViewport((current) => ({
      ...current,
      x: current.x + delta.x,
      y: current.y + delta.y,
    }));
  }, []);

  const zoomAt = useCallback((screenPoint: Point, zoom: number) => {
    setViewport((current) =>
      calculateZoomAtPoint(current, screenPoint, clampZoom(zoom))
    );
  }, []);

  const zoomByAtPoint = useCallback(
    (screenPoint: Point, factor: number) => {
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
    () => ({ viewport, panBy, zoomAt, zoomByAtPoint, zoomIn, zoomOut }),
    [viewport, panBy, zoomAt, zoomByAtPoint, zoomIn, zoomOut]
  );
}
