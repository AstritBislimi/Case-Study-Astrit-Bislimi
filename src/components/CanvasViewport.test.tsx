import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanvasProvider } from "./CanvasProvider";
import { CanvasViewport } from "./CanvasViewport";

describe("CanvasViewport wheel zoom", () => {
  afterEach(cleanup);

  it("cancels browser pinch zoom and zooms the canvas instead", () => {
    const { container } = render(
      <CanvasProvider>
        <CanvasViewport />
      </CanvasProvider>
    );
    const initialImageTransform = container
      .querySelector<HTMLElement>(".canvas-image")
      ?.style.transform;
    const initialZoom = Number(
      initialImageTransform?.match(/scale\(([^)]+)\)/)?.[1]
    );
    const canvas = screen.getByRole("region", { name: "Image canvas" });
    const wheelEvent = createEvent.wheel(canvas, {
      deltaY: -100,
      ctrlKey: true,
      clientX: 500,
      clientY: 300,
      bubbles: true,
      cancelable: true,
    });

    fireEvent(canvas, wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(
      screen.getByText(`${Math.round(initialZoom * 1.1 * 100)}%`)
    ).toBeInTheDocument();
    const zoomedImageTransform = container
      .querySelector<HTMLElement>(".canvas-image")
      ?.style.transform;
    const zoomedValue = Number(
      zoomedImageTransform?.match(/scale\(([^)]+)\)/)?.[1]
    );
    expect(zoomedValue).toBeCloseTo(initialZoom * 1.1);
  });

  it("leaves ordinary wheel events alone", () => {
    const { container } = render(
      <CanvasProvider>
        <CanvasViewport />
      </CanvasProvider>
    );
    const initialImageTransform = container
      .querySelector<HTMLElement>(".canvas-image")
      ?.style.transform;
    const initialZoomLabel = screen.getByText(/\d+%/).textContent;
    const canvas = screen.getByRole("region", { name: "Image canvas" });
    const wheelEvent = createEvent.wheel(canvas, {
      deltaY: 100,
      ctrlKey: false,
      metaKey: false,
      bubbles: true,
      cancelable: true,
    });

    fireEvent(canvas, wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(false);
    expect(screen.getByText(initialZoomLabel ?? "")).toBeInTheDocument();
    expect(
      container.querySelector<HTMLElement>(".canvas-image")?.style.transform
    ).toBe(initialImageTransform);
  });

  it("shows a fallback and removes commenting controls when the image fails", () => {
    render(
      <CanvasProvider>
        <CanvasViewport>
          <button type="button">Place comment</button>
        </CanvasViewport>
      </CanvasProvider>
    );

    fireEvent.error(screen.getByRole("img", { name: "Mountain landscape" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The image couldn’t be loaded. Commenting is disabled."
    );
    expect(
      screen.queryByRole("button", { name: "Place comment" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Zoom in" })
    ).not.toBeInTheDocument();
  });
});

describe("CanvasViewport image clicks", () => {
  afterEach(cleanup);

  function setCanvasBounds(canvas: HTMLElement) {
    Object.defineProperty(canvas, "getBoundingClientRect", {
      value: () => new DOMRect(20, 30, 800, 600),
    });
    Object.defineProperty(canvas, "setPointerCapture", { value: vi.fn() });
    Object.defineProperty(canvas, "hasPointerCapture", {
      value: () => true,
    });
    Object.defineProperty(canvas, "releasePointerCapture", { value: vi.fn() });
    fireEvent(window, new Event("resize"));
  }

  it("reports a click below the drag threshold in canvas-relative coordinates", () => {
    const onImageClick = vi.fn();
    render(
      <CanvasProvider>
        <CanvasViewport onImageClick={onImageClick} />
      </CanvasProvider>
    );
    const canvas = screen.getByRole("region", { name: "Image canvas" });
    setCanvasBounds(canvas);
    const image = screen.getByRole("img", { name: "Mountain landscape" });

    fireEvent.pointerDown(image, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 400,
      clientY: 300,
    });
    fireEvent.pointerUp(image, {
      pointerId: 1,
      clientX: 402,
      clientY: 301,
    });

    expect(onImageClick).toHaveBeenCalledWith({ x: 382, y: 271 });
  });

  it("pans without reporting an image click after a drag", () => {
    const onImageClick = vi.fn();
    const { container } = render(
      <CanvasProvider>
        <CanvasViewport onImageClick={onImageClick} />
      </CanvasProvider>
    );
    const canvas = screen.getByRole("region", { name: "Image canvas" });
    setCanvasBounds(canvas);
    const image = screen.getByRole("img", { name: "Mountain landscape" });
    const initialTransform = container
      .querySelector(".canvas-image")
      ?.getAttribute("style");

    fireEvent.pointerDown(image, {
      pointerId: 2,
      isPrimary: true,
      button: 0,
      clientX: 400,
      clientY: 300,
    });
    fireEvent.pointerMove(image, {
      pointerId: 2,
      clientX: 405,
      clientY: 300,
    });
    fireEvent.pointerUp(image, {
      pointerId: 2,
      clientX: 405,
      clientY: 300,
    });

    expect(onImageClick).not.toHaveBeenCalled();
    expect(
      container.querySelector(".canvas-image")?.getAttribute("style")
    ).not.toBe(initialTransform);
  });

  it("does not report a click that starts outside the image bounds", () => {
    const onImageClick = vi.fn();
    render(
      <CanvasProvider>
        <CanvasViewport onImageClick={onImageClick} />
      </CanvasProvider>
    );
    const canvas = screen.getByRole("region", { name: "Image canvas" });
    setCanvasBounds(canvas);

    fireEvent.pointerDown(canvas, {
      pointerId: 3,
      isPrimary: true,
      button: 0,
      clientX: 40,
      clientY: 50,
    });
    fireEvent.pointerUp(canvas, {
      pointerId: 3,
      clientX: 40,
      clientY: 50,
    });

    expect(onImageClick).not.toHaveBeenCalled();
  });
});
