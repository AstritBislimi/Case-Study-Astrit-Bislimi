# CLAUDE.md

Standing instructions for AI assistants working in this repo. The task brief is in docs/BRIEF.md, Part B (original: https://github.com/limitlessoutsourcing/case-study). This repo's README.md contains setup instructions and project notes.

## Project

Figma-style image commenting app: click on an image to leave a comment pinned to that spot, pan and zoom the image, and pins stay anchored. Built on the Liveblocks `nextjs-comments-canvas` example (Next.js, React, TypeScript). Liveblocks Comments stores threads and their metadata, so there is no custom backend.

## Commands

- `npm run dev`: start the app at http://localhost:3000
- `npm test -- --run`: run the tests once (Vitest + React Testing Library)
- `npx tsc --noEmit`: type-check before suggesting a commit

## Working with me

- I must explain every line in a live review. Clarity beats cleverness.
- Work in small steps and stop for my review after each one.
- After each step: explain the non-obvious lines (especially coordinate math) and suggest a short conventional commit message. Don't commit unless I ask.
- Ask before installing any dependency (an icon library is fine).
- If something in the existing code conflicts with these rules, tell me instead of working around it silently.

## Architecture

**Coordinates**

- Pin positions are stored in thread metadata as normalized image coordinates `{ x, y }` in the range 0–1 (fraction of image width and height). Never store screen pixels.
- All screen ↔ image conversion goes through pure functions in `src/lib/canvas/coordinates.ts` (`screenToImage`, `imageToScreen`, `screenDeltaToImage`, `offsetImagePoint`, `zoomAtPoint`, `clampZoom`, `fitImageToViewport`, `getThreadSide`). No coordinate math inside components.
- Shared values live in `src/lib/canvas/constants.ts`: image size, initial viewport and `POINTER_DRAG_THRESHOLD` (3 px). Both the image click (`CanvasViewport`) and the pin drag (`DraggableThread`) use that threshold, so a press that moves 3 px or more counts as a drag, not a click.
- `getThreadSide(imageX, flipThreshold = 0.65)` returns `"left"` when `imageX >= flipThreshold`, otherwise `"right"`. The side is derived from the pin's image-space position, so it is stable and pins don't have to subscribe to the viewport (no re-render per pin per pan frame). Trade-off: at extreme zoom a card can still run off the window.
- Pins and thread cards do not scale with zoom.

**Layers**

- Pure functions: logic, no React.
- Hooks own state and call the pure functions:
  - `useViewport`: pan/zoom state. It fits the image to the canvas with `fitImageToViewport` on load and on window resize, until the first user interaction (pan or zoom); after that, resizing no longer refits.
  - `useThreadPlacement`: placement state (`initial` → `placing` → `placed`) and the chosen image point. Escape resets it, and it resets when commenting becomes unavailable (disconnect). Both ways to start a comment go through it: a direct click on the image calls `placeAtImagePoint`; the "+" button calls `startPlacing` and the next click on the overlay calls `placeAtImagePoint`.
  - `useCanComment`: `true` only while the room status is `connected`.
- `CommentsCanvas` is the container: it reads threads (`useThreads`), persists moved pins (`useEditThreadMetadata`) and passes plain data down. `page.tsx` owns the `RoomProvider`, connection banner and error boundary. Exceptions below the container: `DraggableThread` and the composer call `useCanComment` and `useMaxZIndex` (which reads `useThreads`), the composer calls `useSelf`, and the Liveblocks UI components (`CommentPin`, `FloatingThread`, `FloatingComposer`) are rendered where they are used.
- UI components receive data via props or children and may read the canvas context. No data fetching or business logic in them.

**Composition (shadcn-style)**

- Prefer `children` and slots over components with many config props.
- Shared canvas state lives in `CanvasProvider`, split into two contexts so action-only consumers don't re-render on pan/zoom: `useCanvasViewport()` (the viewport value) and `useCanvasActions()` (memoised, stable callbacks). Keep both minimal.
- `ThreadPopover` takes a `mode` prop (`"composer"` renders `FloatingComposer`, `"thread"` renders `FloatingThread`), forwards the rest of the Liveblocks props, and uses `children` as the anchor (the pin). The left/right flip (`getThreadSide`) is computed only here. A single component with a discriminated `mode` was chosen over a Root/Anchor/Content compound component because the Liveblocks floating components already own the popover structure, so a compound API would only re-wrap them.
- Only split a component when it's reused or makes the code easier to read or test.

## Code style

- TypeScript strict. No `any`, no non-null assertions without a comment explaining why.
- Small components, descriptive names, no dead code or commented-out code.
- Accessible controls: buttons are `<button>`, icon buttons have `aria-label`, Escape closes popovers.

## Error handling (graded)

- Connection problems: show a clear "reconnecting…" / "couldn't load comments" state, with retry where possible.
- Empty or whitespace-only comments cannot be submitted.
- If the image fails to load, show a fallback and disable commenting.
- Clicks outside the image never create a comment; dragging never creates a comment (movement threshold).

## Testing

- Small, meaningful set. Don't chase coverage and don't test Liveblocks' own components.
- Pure functions are written test-first and cover edge cases (zoom limits, image corners, flip threshold, screen→image→screen round trip).
- Hooks are tested with `renderHook`. Components that read the canvas context are rendered inside `<CanvasProvider>` directly.
- Interaction tests are added once the UI is stable, focused on the main flow and the error cases.

## Never

- Commit, print or log `.env.local` or the Liveblocks secret key.
- Add libraries without asking.
- Rewrite large parts of the code without explaining why first.
