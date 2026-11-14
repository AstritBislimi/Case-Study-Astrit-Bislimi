import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommentsErrorFallback,
  RoomConnectionStatus,
} from "./RoomConnectionStatus";

const mocks = vi.hoisted(() => ({
  status: "connected" as string,
  reconnect: vi.fn(),
}));

vi.mock("@liveblocks/react", () => ({
  useRoom: () => ({ reconnect: mocks.reconnect }),
  useStatus: () => mocks.status,
}));

describe("RoomConnectionStatus", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.status = "connected";
    mocks.reconnect.mockClear();
  });

  it("shows a reconnecting message", () => {
    mocks.status = "reconnecting";

    render(<RoomConnectionStatus />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Reconnecting to comments. You can view existing threads, but adding comments and moving pins are unavailable until the connection is restored."
    );
  });

  it("shows a connecting message", () => {
    mocks.status = "connecting";

    render(<RoomConnectionStatus />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Connecting to comments…"
    );
  });

  it("offers a retry when comments are disconnected", () => {
    mocks.status = "disconnected";

    render(<RoomConnectionStatus />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn’t load comments."
    );
    expect(mocks.reconnect).toHaveBeenCalledOnce();
  });

  it("reconnects and resets the error boundary when retrying a load error", () => {
    const resetErrorBoundary = vi.fn();

    render(<CommentsErrorFallback resetErrorBoundary={resetErrorBoundary} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(mocks.reconnect).toHaveBeenCalledOnce();
    expect(resetErrorBoundary).toHaveBeenCalledOnce();
  });
});
