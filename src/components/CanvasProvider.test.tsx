import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CanvasProvider,
  useCanvasActions,
  useCanvasViewport,
} from "./CanvasProvider";
import { CanvasViewport } from "./CanvasViewport";

describe("CanvasProvider context subscriptions", () => {
  it("does not rerender action-only consumers when the viewport changes", () => {
    let actionConsumerRenders = 0;

    function ActionConsumer() {
      actionConsumerRenders += 1;
      const { panBy } = useCanvasActions();

      return (
        <button type="button" onClick={() => panBy({ x: 5, y: 0 })}>
          Pan
        </button>
      );
    }

    function ViewportConsumer() {
      const viewport = useCanvasViewport();
      return <output>{viewport.x}</output>;
    }

    render(
      <CanvasProvider>
        <ActionConsumer />
        <ViewportConsumer />
      </CanvasProvider>
    );

    expect(screen.getByText("36")).toBeInTheDocument();
    expect(actionConsumerRenders).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Pan" }));

    expect(screen.getByText("41")).toBeInTheDocument();
    expect(actionConsumerRenders).toBe(1);
  });

  it("keeps canvas items from rerendering while the image pans", () => {
    let threadItemRenders = 0;

    function ThreadItem() {
      threadItemRenders += 1;
      return <div>Thread item</div>;
    }

    function PanControl() {
      const { panBy } = useCanvasActions();
      return (
        <button type="button" onClick={() => panBy({ x: 5, y: 0 })}>
          Pan canvas
        </button>
      );
    }

    render(
      <CanvasProvider>
        <CanvasViewport>
          <ThreadItem />
        </CanvasViewport>
        <PanControl />
      </CanvasProvider>
    );

    expect(threadItemRenders).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Pan canvas" }));

    expect(threadItemRenders).toBe(1);
  });
});
