"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RoomProvider } from "@liveblocks/react/suspense";
import { Loading } from "../components/Loading";
import { ClientSideSuspense } from "@liveblocks/react";
import { ErrorBoundary } from "react-error-boundary";
import { CommentsCanvas } from "../components/CommentsCanvas";
import {
  CommentsErrorFallback,
  RoomConnectionStatus,
} from "../components/RoomConnectionStatus";

export default function Page() {
  const roomId = useExampleRoomId(
    "liveblocks:examples:nextjs-comments-canvas-image-v2"
  );

  return (
    <RoomProvider id={roomId}>
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

/**
 * This function is used when deploying an example on liveblocks.io.
 * You can ignore it completely if you run the example locally.
 */
function useExampleRoomId(roomId: string) {
  const params = useSearchParams();
  const exampleId = params?.get("exampleId");

  const exampleRoomId = useMemo(() => {
    return exampleId ? `${roomId}-${exampleId}` : roomId;
  }, [roomId, exampleId]);

  return exampleRoomId;
}
