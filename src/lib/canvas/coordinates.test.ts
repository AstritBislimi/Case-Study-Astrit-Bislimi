import { describe, expect, it } from "vitest";
import {
  clampZoom,
  getThreadSide,
  imageToScreen,
  screenToImage,
  zoomAtPoint,
} from "./coordinates";

describe("screenToImage and imageToScreen", () => {
  const viewport = { x: 100, y: 50, zoom: 2 };
  const imageSize = { width: 400, height: 200 };

  it("converts screen coordinates to normalized image coordinates", () => {
    expect(
      screenToImage({ x: 500, y: 250 }, viewport, imageSize)
    ).toEqual({ x: 0.5, y: 0.5 });
  });

  it("maps image corners to the corresponding screen corners", () => {
    expect(imageToScreen({ x: 0, y: 0 }, viewport, imageSize)).toEqual({
      x: 100,
      y: 50,
    });
    expect(imageToScreen({ x: 1, y: 1 }, viewport, imageSize)).toEqual({
      x: 900,
      y: 450,
    });
  });

  it("round-trips an image point through screen coordinates", () => {
    const imagePoint = { x: 0.25, y: 0.75 };
    expect(
      screenToImage(imageToScreen(imagePoint, viewport, imageSize), viewport, imageSize)
    ).toEqual(imagePoint);
  });
});

describe("zoomAtPoint", () => {
  it("keeps the image point under the cursor stationary while zooming", () => {
    const viewport = { x: 100, y: 60, zoom: 1.5 };
    const cursor = { x: 300, y: 210 };
    const nextViewport = zoomAtPoint(viewport, cursor, 3);

    expect(nextViewport).toEqual({ x: -100, y: -90, zoom: 3 });
    expect(
      imageToScreen(
        screenToImage(cursor, viewport, { width: 1000, height: 1000 }),
        nextViewport,
        { width: 1000, height: 1000 }
      )
    ).toEqual(cursor);
  });
});

describe("clampZoom", () => {
  it("clamps zoom below and above the allowed range", () => {
    expect(clampZoom(0.1)).toBe(0.5);
    expect(clampZoom(4)).toBe(3);
  });

  it("keeps zoom values inside the allowed range unchanged", () => {
    expect(clampZoom(1.25)).toBe(1.25);
  });
});

describe("getThreadSide", () => {
  it("opens threads toward the center near the image's right edge", () => {
    expect(getThreadSide(0.64)).toBe("right");
    expect(getThreadSide(0.65)).toBe("left");
    expect(getThreadSide(0.9)).toBe("left");
  });
});
