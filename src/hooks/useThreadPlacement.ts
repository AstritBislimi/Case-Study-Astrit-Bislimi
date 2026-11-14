import { useCallback, useEffect, useState } from "react";
import { isImagePoint } from "../lib/canvas/coordinates";
import type { Point } from "../lib/canvas/coordinates";

export type ThreadPlacementState = "initial" | "placing" | "placed";

export function useThreadPlacement(canComment: boolean) {
  const [state, setState] = useState<ThreadPlacementState>("initial");
  const [coords, setCoords] = useState<Point>({ x: 0, y: 0 });

  const reset = useCallback(() => {
    setState("initial");
    setCoords({ x: 0, y: 0 });
  }, []);

  const startPlacing = useCallback(() => {
    if (canComment) {
      setState("placing");
    }
  }, [canComment]);

  const placeAtImagePoint = useCallback(
    (imagePoint: Point) => {
      if (!canComment || !isImagePoint(imagePoint)) {
        return;
      }

      setCoords(imagePoint);
      setState("placed");
    },
    [canComment]
  );

  useEffect(() => {
    if (!canComment) {
      reset();
    }
  }, [canComment, reset]);

  useEffect(() => {
    if (state === "initial") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        reset();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [reset, state]);

  return { state, coords, startPlacing, placeAtImagePoint, reset };
}
