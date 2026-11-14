import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, PropsWithChildren } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CanvasProvider } from "./CanvasProvider";
import { ThreadPlacement } from "./ThreadPlacement";

const mocks = vi.hoisted(() => ({
  floatingComposer: vi.fn(),
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

function renderPlacer(
  overrides: Partial<ComponentProps<typeof ThreadPlacement>> = {}
) {
  const props: ComponentProps<typeof ThreadPlacement> = {
    state: "initial",
    coords: { x: 0, y: 0 },
    canComment: true,
    startPlacing: vi.fn(),
    placeAtImagePoint: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };

  return {
    ...render(
      <CanvasProvider>
        <ThreadPlacement {...props} />
      </CanvasProvider>
    ),
    props,
  };
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

describe("ThreadPlacement", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.floatingComposer.mockClear();
  });

  it("renders the composer at the supplied normalized image point", () => {
    const { container } = renderPlacer({
      state: "placed",
      coords: { x: 800 / 900, y: 0.5 },
    });

    expect(mocks.floatingComposer).toHaveBeenCalledWith(
      expect.objectContaining({
        side: "left",
        metadata: { x: 800 / 900, y: 0.5, zIndex: 11 },
      })
    );
    expect(
      container.querySelector<HTMLButtonElement>(".lb-comment-pin")?.style
        .transform
    ).toBe("translate(836px, 588.5px)");
  });

  it("starts placement from the plus button", () => {
    const { props } = renderPlacer();

    fireEvent.click(screen.getByRole("button", { name: "Place comment" }));

    expect(props.startPlacing).toHaveBeenCalledOnce();
  });

  it("passes a valid placement click to the supplied callback", () => {
    const { props } = renderPlacer({ state: "placing" });

    placeAt(836, 588.5);

    expect(props.placeAtImagePoint).toHaveBeenCalledWith({
      x: 800 / 900,
      y: 0.5,
    });
  });

  it("does not place after a drag or at a point outside the image", () => {
    const { props } = renderPlacer({ state: "placing" });
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

    expect(props.placeAtImagePoint).not.toHaveBeenCalled();
    expect(props.reset).toHaveBeenCalledOnce();
  });

  it("disables placement and ignores clicks when commenting is unavailable", () => {
    const { props } = renderPlacer({ canComment: false });
    const button = screen.getByRole("button", { name: "Place comment" });

    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(props.startPlacing).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("comment-placement-layer")
    ).not.toBeInTheDocument();
  });
});
