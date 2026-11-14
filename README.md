# Canvas Comments

An image-commenting canvas with pan and zoom. Comment pins stay anchored to the
image as the canvas moves.

## Run locally

Requirements: Node.js 20.9 or later, npm, and a
[Liveblocks account](https://liveblocks.io/dashboard).

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   On macOS or Linux, use `cp .env.example .env.local`.

3. Add your Liveblocks **secret** API key to `.env.local`:

   ```env
   LIVEBLOCKS_SECRET_KEY=sk_liveblocks_...
   ```

   Get the key from the
   [Liveblocks dashboard](https://liveblocks.io/dashboard/apikeys). Never
   commit `.env.local` or expose this key in client-side code.

4. Start the app and open [http://localhost:3000](http://localhost:3000):

   ```bash
   npm run dev
   ```

## Tests and checks

Run the tests once, type-check, and build the production app with:

```bash
npm test -- --run
npx tsc --noEmit
npm run build
```

Tests use Vitest and React Testing Library.

## Architecture

- `src/app/page.tsx` sets up the Liveblocks room, connection status, and
  retryable error boundary.
- `src/components/CommentsCanvas.tsx` reads threads and persists moved-pin
  metadata. Liveblocks stores threads and their normalized image positions.
- `src/components/CanvasViewport.tsx` renders the image, fits it to the viewport,
  and handles pan and zoom. `src/hooks/useViewport.ts` owns viewport state.
- `src/lib/canvas/coordinates.ts` contains the pure coordinate, zoom, and fit
  helpers. Pin metadata uses normalized `{ x, y }` values, so it remains
  anchored when the viewport changes.
- `ThreadLayer`, `DraggableThread`, `ThreadPlacement`, and `ThreadPopover`
  separate pin rendering, movement, placement, and thread/composer display.
- `useThreadPlacement` owns the click-to-comment flow. A direct click on the
  image and the "+" button both end in `placeAtImagePoint`, which ignores
  points outside the image and opens the composer at the chosen spot. Escape
  cancels placement.
- `useCanComment` allows comment composition only while connected. During
  reconnecting, existing threads remain viewable, but adding comments and
  moving pins are unavailable.
- A thread card opens to the left when its pin is at 65% of the image width or
  further right, otherwise to the right. The rule uses the pin's image
  position, so pins don't need to re-render while the canvas pans; the
  trade-off is that at extreme zoom a card can still run off the window.

## Error handling

- **Connection lost:** a banner shows "Connecting…" or "Reconnecting…", and
  "Couldn’t load comments" with a Retry button once disconnected. If loading
  threads fails, an error card with Retry replaces the canvas.
- **Commenting while reconnecting:** disabled. Existing threads stay readable,
  but new comments and pin moves are unavailable until connected.
- **Image fails to load:** a fallback message is shown and commenting is
  disabled.
- **Empty or whitespace-only comment:** blocked; the Liveblocks composer keeps
  its submit button disabled.
- **Click outside the image:** does nothing.
- **Drag:** never creates a comment. Pointer movement of 3 px or more counts as
  a drag, both for panning the image and for moving a pin.

## Optional features

- **Responsive:** the image is fitted to the viewport on load and on window
  resize (until you pan or zoom yourself).
- **Editing comments:** available through the Liveblocks `FloatingThread`
  comment menu.

## AI usage

- **Claude** was used throughout: planning the architecture, writing the build
  prompts for each step, drafting the initial `CLAUDE.md`, exploring the
  Liveblocks example, implementing and refining the canvas code, writing
  focused tests, and reviewing code.
- Things the AI got wrong or I changed:
  - An early pin-drag approach caused unnecessary rerenders; after review, drag
    state was localized to the active pin.
  - The connection banner initially missed the `connecting` state, and an open
    thread was initially closed during reconnects. Both were corrected so users
    get a status message and can keep reading existing threads.
  - A `ResizeObserver` was added defensively even though the canvas fills the
    viewport; it was removed in favor of the window resize listener.
  - The plan specified a compound `ThreadPopover` (Root / Anchor / Content) and
    a screen-based flip rule. Both were simplified: a `mode` prop on one
    component, and an image-space flip so pins don't re-render on every pan
    frame.
  - The first click-to-comment implementation passed the click around as state
    and reacted to it in an effect. I replaced it with a direct
    `placeAtImagePoint` call through `useThreadPlacement`.
