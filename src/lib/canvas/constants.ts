import type { ImageSize, Viewport } from "./coordinates";

export const POINTER_DRAG_THRESHOLD = 3;

export const CANVAS_IMAGE_SIZE: ImageSize = {
  width: 900,
  height: 1125,
};

export const INITIAL_CANVAS_VIEWPORT: Viewport = {
  x: 36,
  y: 26,
  zoom: 1,
};
