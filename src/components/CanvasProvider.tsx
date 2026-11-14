"use client";

import { createContext, PropsWithChildren, useContext } from "react";
import { useMemo } from "react";
import type { ViewportActions } from "../hooks/useViewport";
import { useViewport } from "../hooks/useViewport";
import type { Viewport } from "../lib/canvas/coordinates";
import { INITIAL_CANVAS_VIEWPORT } from "../lib/canvas/constants";

const CanvasViewportContext = createContext<Viewport | null>(null);
const CanvasActionsContext = createContext<ViewportActions | null>(null);

export function CanvasProvider({ children }: PropsWithChildren) {
  const {
    viewport,
    panBy,
    fitToViewport,
    zoomAt,
    zoomByAtPoint,
    zoomIn,
    zoomOut,
  } =
    useViewport(INITIAL_CANVAS_VIEWPORT);
  const actions = useMemo(
    () => ({ panBy, fitToViewport, zoomAt, zoomByAtPoint, zoomIn, zoomOut }),
    [panBy, fitToViewport, zoomAt, zoomByAtPoint, zoomIn, zoomOut]
  );

  return (
    <CanvasActionsContext.Provider value={actions}>
      <CanvasViewportContext.Provider value={viewport}>
        {children}
      </CanvasViewportContext.Provider>
    </CanvasActionsContext.Provider>
  );
}

export function useCanvasViewport(): Viewport {
  const viewport = useContext(CanvasViewportContext);

  if (!viewport) {
    throw new Error("useCanvasViewport must be used within a CanvasProvider");
  }

  return viewport;
}

export function useCanvasActions(): ViewportActions {
  const actions = useContext(CanvasActionsContext);

  if (!actions) {
    throw new Error("useCanvasActions must be used within a CanvasProvider");
  }

  return actions;
}
