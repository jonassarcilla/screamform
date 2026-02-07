# @screamform/react

React bindings for Screamform: config-driven forms with fine-grained reactivity.

## Production build

From the repo root:

```bash
bun run build
```

Or from this package:

```bash
bun run build
```

This runs `vite build`, emits TypeScript declarations, and copies `src/styles/global.css` to `dist/global.css`.

## Styling (required)

For correct styling, the app **must** import the theme once (e.g. in the root layout or `_app`):

```ts
import '@screamform/react/global.css';
```

Ensure your app’s Tailwind (or PostCSS) includes the library in `content` so utility classes used by the library are generated, or use the same Tailwind v4 setup as in `global.css`.

## Development

- `bun run storybook` — Storybook
- `bun test` — tests
