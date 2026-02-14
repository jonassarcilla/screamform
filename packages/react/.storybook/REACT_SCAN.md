# React Scan with Storybook

React Scan is wired so it runs inside the **preview iframe** (where stories render).

## In-iframe (automatic)

- The preview iframe loads `react-scan/dist/auto.global.js` first in `<head>` (see `main.ts` → `previewHead`).
- The Vite plugin `@react-scan/vite-plugin-react-scan` is enabled in Storybook’s `viteFinal` so the preview bundle gets display names and React Scan can show component names.

When you run Storybook and open a story, React Scan is already active in that iframe. Use the **React Scan browser extension** or the **CLI** to connect and see highlights.

## CLI (recommended)

1. Start Storybook:
   ```bash
   pnpm storybook
   ```
2. In the browser, open the story you want to profile (e.g. **FormContainer – Default**).
3. In another terminal, run React Scan against the **iframe** URL:
   ```bash
   npx react-scan@latest "http://localhost:6006/iframe.html?id=components-formcontainer--default"
   ```
   Replace the `id` with your story’s ID (you can copy it from the address bar when viewing the story in canvas-only mode, or use the pattern `components-formcontainer--<story-id>`).

React Scan will open a browser window, load that URL, and highlight components that re-render.

## Story ID examples

- Default: `components-formcontainer--default`
- Multiple Fields: `components-formcontainer--multiple-fields-30`
- With Debug: `components-formcontainer--with-debug`
