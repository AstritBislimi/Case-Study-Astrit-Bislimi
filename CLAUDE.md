# CLAUDE.md

Standing instructions for AI assistants working in this repo. The task brief is in docs/BRIEF.md, Part B (original: https://github.com/limitlessoutsourcing/case-study). This repo's README.md contains setup instructions and project notes.

## Project

Figma-style image commenting app: click on an image to leave a comment pinned to that spot, pan and zoom the image, and pins stay anchored. Built on the Liveblocks `nextjs-comments-canvas` example (Next.js, React, TypeScript). Liveblocks Comments stores threads and their metadata, so there is no custom backend.

## Commands

- `npm run dev`: start the app at http://localhost:3000
- `npm test`: run tests (Vitest + React Testing Library, once set up)
- `npm run lint` / `npx tsc --noEmit`: lint and type-check before suggesting a commit

## Working with me

- I must explain every line in a live review. Clarity beats cleverness.
- Work in small steps and stop for my review after each one.
- After each step: explain the non-obvious lines (especially coordinate math) and suggest a short conventional commit message. Don't commit unless I ask.
- Ask before installing any dependency (an icon library is fine).
- If something in the existing code conflicts with these rules, tell me instead of working around it silently.

## Architecture

**Coordinates**

- Pin positions are stored in thread metadata as normalized image coordinates `{ x, y }` in the range 0–1 (fraction of image width and height). Never store screen pixels.
- All screen ↔ image conversion goes through pure functions in `lib/canvas/` (`screenToImage`, `imageToScreen`, `zoomAtPoint`, `clampZoom`, `getThreadSide`). No coordinate math inside components.
- Pins and thread cards do not scale with zoom.

**Layers**

- Pure functions: logic, no React.
- Hooks (e.g. `useViewport`): own state and call the pure functions.
- One container component at the top talks to Liveblocks (`useThreads`, `useCreateThread`, `useStatus`, …) and passes plain data down. Nothing below it imports Liveblocks.
- UI components receive data via props or children and may read the canvas context. No data fetching or business logic in them.

**Composition (shadcn-style)**

- Prefer `children` and slots over components with many config props.
- Shared canvas state (viewport) lives in a small context: `CanvasProvider` / `useCanvas()`. Keep its value minimal and memoised.
- `ThreadPopover` is composable (Root / Anchor / Content or similar). The left/right flip logic lives in one place; the content (new-comment composer or existing thread) is swappable.
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
- Hooks are tested with `renderHook`. Compound components are tested via a `renderWithCanvas()` helper that wraps the provider.
- Interaction tests are added once the UI is stable, focused on the main flow and the error cases.

## Never

- Commit, print or log `.env.local` or the Liveblocks secret key.
- Add libraries without asking.
- Rewrite large parts of the code without explaining why first.
