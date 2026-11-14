export type Point = {
  x: number;
  y: number;
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type ImageSize = {
  width: number;
  height: number;
};

export function screenToImage(
  screenPoint: Point,
  viewport: Viewport,
  imageSize: ImageSize
): Point {
  return {
    x: (screenPoint.x - viewport.x) / (viewport.zoom * imageSize.width),
    y: (screenPoint.y - viewport.y) / (viewport.zoom * imageSize.height),
  };
}

export function imageToScreen(
  imagePoint: Point,
  viewport: Viewport,
  imageSize: ImageSize
): Point {
  return {
    x: viewport.x + imagePoint.x * imageSize.width * viewport.zoom,
    y: viewport.y + imagePoint.y * imageSize.height * viewport.zoom,
  };
}

export function zoomAtPoint(
  viewport: Viewport,
  screenPoint: Point,
  zoom: number
): Viewport {
  const imageX = (screenPoint.x - viewport.x) / viewport.zoom;
  const imageY = (screenPoint.y - viewport.y) / viewport.zoom;

  return {
    x: screenPoint.x - imageX * zoom,
    y: screenPoint.y - imageY * zoom,
    zoom,
  };
}

export function clampZoom(
  zoom: number,
  minZoom = 0.5,
  maxZoom = 3
): number {
  return Math.min(Math.max(zoom, minZoom), maxZoom);
}

export function getThreadSide(
  imageX: number,
  flipThreshold = 0.65
): "left" | "right" {
  return imageX >= flipThreshold ? "left" : "right";
}
