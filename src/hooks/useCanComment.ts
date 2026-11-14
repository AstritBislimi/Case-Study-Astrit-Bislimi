import { useStatus } from "@liveblocks/react";

export function useCanComment() {
  return useStatus() === "connected";
}
