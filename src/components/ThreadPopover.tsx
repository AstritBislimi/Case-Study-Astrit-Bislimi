"use client";

import { FloatingComposer, FloatingThread } from "@liveblocks/react-ui";
import type {
  FloatingComposerProps,
  FloatingThreadProps,
} from "@liveblocks/react-ui";
import type { ReactNode } from "react";
import { getThreadSide } from "../lib/canvas/coordinates";

type ComposerPopoverProps = Omit<FloatingComposerProps, "children" | "side"> & {
  mode: "composer";
  imageX: number;
  children: ReactNode;
};

type ThreadPopoverProps = Omit<FloatingThreadProps, "children" | "side"> & {
  mode: "thread";
  imageX: number;
  children: ReactNode;
};

type Props = ComposerPopoverProps | ThreadPopoverProps;

export function ThreadPopover(props: Props) {
  const side = getThreadSide(props.imageX);

  if (props.mode === "composer") {
    const { mode, imageX, children, ...composerProps } = props;
    return (
      <FloatingComposer {...composerProps} side={side}>
        {children}
      </FloatingComposer>
    );
  }

  const { mode, imageX, children, ...threadProps } = props;
  return (
    <FloatingThread {...threadProps} side={side}>
      {children}
    </FloatingThread>
  );
}
