import {
  cleanup,
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
    expect(screen.getByText("110%")).toBeInTheDocument();
    expect(
      container.querySelector(".canvas-image")?.getAttribute("style")
    ).toContain("scale(1.1)");
  });

  it("leaves ordinary wheel events alone", () => {
    render(
      <CanvasProvider>
        <CanvasViewport />
      </CanvasProvider>
    );
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
    expect(screen.getByText("100%")).toBeInTheDocument();
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
