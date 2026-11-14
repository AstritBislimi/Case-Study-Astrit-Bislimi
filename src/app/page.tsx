"use client";

import { RoomProvider } from "@liveblocks/react/suspense";
import { Loading } from "../components/Loading";
import { ClientSideSuspense } from "@liveblocks/react";
import { ErrorBoundary } from "react-error-boundary";
import { CommentsCanvas } from "../components/CommentsCanvas";
import {
  CommentsErrorFallback,
  RoomConnectionStatus,
} from "../components/RoomConnectionStatus";

const ROOM_ID = "liveblocks:examples:nextjs-comments-canvas-image-v2";

export default function Page() {
  return (
    <RoomProvider id={ROOM_ID}>
      <RoomConnectionStatus />
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => (
          <CommentsErrorFallback resetErrorBoundary={resetErrorBoundary} />
        )}
      >
        <ClientSideSuspense fallback={<Loading />}>
          <CommentsCanvas />
        </ClientSideSuspense>
      </ErrorBoundary>
    </RoomProvider>
  );
}
