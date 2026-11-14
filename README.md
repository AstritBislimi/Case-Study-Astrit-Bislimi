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
- `ThreadLayer`, `DraggableThread`, `PlaceThreadButton`, and `ThreadPopover`
  separate pin rendering, movement, placement, and thread/composer display.
- `useCanComment` allows comment composition only while connected. During
  reconnecting, existing threads remain viewable, but adding comments and
  moving pins are unavailable.

## AI usage

- **Copilot SDK in VS Code** helped explore the example, implement and refine the
  canvas, and write focused tests and documentation.
- **PowerShell and npm** were used to run Vitest, TypeScript checks, and
  production builds. The local browser was used to review the canvas layout.
- AI suggestions needed review and correction:
  - An early pin-drag approach caused unnecessary rerenders; after review, drag
    state was localized to the active pin.
  - The connection banner initially missed the `connecting` state, and an open
    thread was initially closed during reconnects. Both were corrected so users
    get a status message and can keep reading existing threads.
  - A `ResizeObserver` was added defensively even though the canvas fills the
    viewport; it was removed in favor of the window resize listener.
