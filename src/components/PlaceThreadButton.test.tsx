import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasProvider } from "./CanvasProvider";
import { PlaceThreadButton } from "./PlaceThreadButton";

const mocks = vi.hoisted(() => ({
  floatingComposer: vi.fn(),
  canComment: true,
}));

vi.mock("@liveblocks/react-ui", () => ({
  FloatingComposer: (props: PropsWithChildren<Record<string, unknown>>) => {
    mocks.floatingComposer(props);
    return <div data-testid="floating-composer">{props.children}</div>;
  },
  CommentPin: ({
    userId,
    corner,
    ...buttonProps
  }: ComponentProps<"button"> & {
    userId?: string;
    corner?: string;
  }) => (
    <button className="lb-comment-pin" {...buttonProps}>
      Pin
    </button>
  ),
}));

vi.mock("@liveblocks/react", () => ({
  useSelf: (selector: (user: { id: string }) => string) =>
    selector({ id: "test-user" }),
}));

vi.mock("../hooks", () => ({
  useMaxZIndex: () => 10,
}));

vi.mock("../hooks/useCanComment", () => ({
  useCanComment: () => mocks.canComment,
}));

function renderPlacer() {
  return render(
    <CanvasProvider>
      <PlaceThreadButton />
    </CanvasProvider>
  );
}

function placeAt(x: number, y: number, pointerId = 1) {
  const layer = screen.getByTestId("comment-placement-layer");
  fireEvent.pointerDown(layer, {
    pointerId,
    isPrimary: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  fireEvent.pointerUp(layer, {
    pointerId,
    clientX: x,
    clientY: y,
  });
  fireEvent.click(layer, { clientX: x, clientY: y });
}

describe("PlaceThreadButton", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.floatingComposer.mockClear();
    mocks.canComment = true;
  });

  it("places a normalized comment and opens it inward near the image's right edge", () => {
    const { container } = renderPlacer();
    fireEvent.click(screen.getByRole("button", { name: "Place comment" }));
    placeAt(836, 326);

    expect(mocks.floatingComposer).toHaveBeenCalledWith(
      expect.objectContaining({
        side: "left",
        metadata: { x: 800 / 900, y: 0.5, zIndex: 11 },
      })
    );
    expect(
      container.querySelector<HTMLButtonElement>(".lb-comment-pin")?.style
        .transform
    ).toBe("translate(836px, 326px)");
  });

  it("does not place a comment after a drag or outside the image", () => {
    renderPlacer();
    fireEvent.click(screen.getByRole("button", { name: "Place comment" }));

    const layer = screen.getByTestId("comment-placement-layer");
    fireEvent.pointerDown(layer, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 396,
      clientY: 326,
    });
    fireEvent.pointerUp(layer, {
      pointerId: 1,
      clientX: 401,
      clientY: 326,
    });
    fireEvent.click(layer, { clientX: 401, clientY: 326 });
    placeAt(1000, 700, 2);

    expect(mocks.floatingComposer).not.toHaveBeenCalled();
  });

  it("cancels placement with Escape", () => {
    renderPlacer();
    fireEvent.click(screen.getByRole("button", { name: "Place comment" }));
    expect(screen.getByTestId("comment-placement-layer")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByTestId("comment-placement-layer")
    ).not.toBeInTheDocument();
  });

  it("disables new comment placement when the room is not connected", () => {
    mocks.canComment = false;
    renderPlacer();

    const button = screen.getByRole("button", { name: "Place comment" });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(
      screen.queryByTestId("comment-placement-layer")
    ).not.toBeInTheDocument();
    expect(mocks.floatingComposer).not.toHaveBeenCalled();
  });

  it("cancels an active placement when the room disconnects", () => {
    const { rerender } = renderPlacer();
    fireEvent.click(screen.getByRole("button", { name: "Place comment" }));
    expect(screen.getByTestId("comment-placement-layer")).toBeInTheDocument();

    mocks.canComment = false;
    rerender(
      <CanvasProvider>
        <PlaceThreadButton />
      </CanvasProvider>
    );

    expect(
      screen.queryByTestId("comment-placement-layer")
    ).not.toBeInTheDocument();
  });
});
