"use client";

import { useRoom, useStatus } from "@liveblocks/react";
import type { FallbackProps } from "react-error-boundary";

export function RoomConnectionStatus() {
  const status = useStatus();
  const room = useRoom();

  if (status === "connecting") {
    return (
      <div className="canvas-connection-status" role="status">
        Connecting to comments…
      </div>
    );
  }

  if (status === "reconnecting") {
    return (
      <div className="canvas-connection-status" role="status">
        Reconnecting to comments. You can view existing threads, but adding
        comments and moving pins are unavailable until the connection is
        restored.
      </div>
    );
  }

  if (status === "disconnected") {
    return (
      <div className="canvas-connection-status" role="alert">
        <span>Couldn’t load comments.</span>
        <button type="button" onClick={() => room.reconnect()}>
          Retry
        </button>
      </div>
    );
  }

  return null;
}

export function CommentsErrorFallback({
  resetErrorBoundary,
}: Pick<FallbackProps, "resetErrorBoundary">) {
  const room = useRoom();

  const retry = () => {
    room.reconnect();
    resetErrorBoundary();
  };

  return (
    <div className="comments-error" role="alert">
      <div className="comments-error-card">
        <h1>Comments unavailable</h1>
        <p>
          We couldn’t load your comments. Check your connection and try again.
        </p>
        <button type="button" onClick={retry}>
          Retry
        </button>
      </div>
    </div>
  );
}
