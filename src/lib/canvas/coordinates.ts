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

export function fitImageToViewport(
  viewportSize: ImageSize,
  imageSize: ImageSize,
  padding = 24
): Viewport {
  if (
    viewportSize.width <= 0 ||
    viewportSize.height <= 0 ||
    imageSize.width <= 0 ||
    imageSize.height <= 0
  ) {
    return { x: 0, y: 0, zoom: 1 };
  }

  const availableWidth = Math.max(0, viewportSize.width - padding * 2);
  const availableHeight = Math.max(0, viewportSize.height - padding * 2);
  const zoom = clampZoom(
    Math.min(
      1,
      availableWidth / imageSize.width,
      availableHeight / imageSize.height
    ),
    0.25,
    1
  );

  return {
    x: (viewportSize.width - imageSize.width * zoom) / 2,
    y: (viewportSize.height - imageSize.height * zoom) / 2,
    zoom,
  };
}

export function isImagePoint(point: Point): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  );
}

export function imagePointToPixels(
  imagePoint: Point,
  imageSize: ImageSize
): Point {
  return {
    x: imagePoint.x * imageSize.width,
    y: imagePoint.y * imageSize.height,
  };
}

export function screenDeltaToImage(delta: Point, zoom: number): Point {
  return {
    x: delta.x / zoom,
    y: delta.y / zoom,
  };
}

export function offsetImagePoint(
  imagePoint: Point,
  imageDelta: Point,
  imageSize: ImageSize
): Point {
  return {
    x: Math.min(1, Math.max(0, imagePoint.x + imageDelta.x / imageSize.width)),
    y: Math.min(1, Math.max(0, imagePoint.y + imageDelta.y / imageSize.height)),
  };
}

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

export function clampZoom(zoom: number, minZoom = 0.25, maxZoom = 3): number {
  return Math.min(Math.max(zoom, minZoom), maxZoom);
}

export function getThreadSide(
  imageX: number,
  flipThreshold = 0.65
): "left" | "right" {
  return imageX >= flipThreshold ? "left" : "right";
}
