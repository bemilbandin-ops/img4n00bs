# AGENTS.md

Instructions for coding agents working on this repository.

## Project overview

This is a beginner-friendly browser image editor built with Vite, React, TypeScript, Tailwind, and the HTML canvas API. The app supports layered image editing, drawing, text, selections, transforms, filters, project save/load, and flattened export.

## Setup

- Use Node.js 22 or a compatible current Node runtime.
- Install dependencies with:

```bash
npm install
```

- Start the dev server with:

```bash
npm run dev
```

The dev server runs Vite on port `3000` and binds to `0.0.0.0`.

## Required checks

Before committing meaningful code changes, run:

```bash
npm run check
```

This runs TypeScript validation, Vitest tests, and the production Vite build.

For narrower checks, use:

```bash
npm run lint
npm run test
npm run build
npm run e2e
```

Notes:

- `npm run lint` is `tsc --noEmit`; there is no separate ESLint config.
- Vitest tests are picked up from `src/**/*.{test,spec}.{ts,tsx}`.
- The Vitest environment is `node` and uses `src/test/canvasMock.ts`.

## Important source layout

- `src/EditorApp.tsx` is the main editor shell and owns most editor state.
- `src/components/` contains UI panels, tool controls, canvas UI, and editor chrome.
- `src/types.ts` defines shared editor types.
- `src/utils/bitmapStore.ts` owns live bitmap canvas storage.
- `src/utils/renderComposite.ts` is the shared rendering path for preview and export.
- `src/utils/projectFile.ts` serializes and deserializes `.n00bs` project files.
- `src/utils/history.ts` handles bounded editor history/checkpoint state.
- `src/utils/layerTransforms.ts` handles layer transform math.
- `src/utils/selection.ts` handles selection geometry.
- `src/utils/imageFilters.ts` handles filters, text rendering, and shape rendering.

## Architecture rules

- Keep layer metadata serializable. Do not store live canvases, DOM nodes, images, or large base64 snapshots inside `EditorLayer` objects.
- Store per-layer pixel data in `BitmapStore`, keyed by `sourceId`.
- Use `renderComposite()` for any path that needs final compositing. Preview, full export, and selection export should not drift into separate rendering implementations.
- Keep layer transforms metadata-driven and undoable. Prefer updating `LayerTransform` instead of baking transforms into pixels unless the operation explicitly edits pixels.
- Preserve project compatibility in `projectFile.ts`. If the `.n00bs` format changes, add migration logic instead of silently rejecting older valid files.
- Keep history bounded. Do not reintroduce base64 canvas snapshots into history entries.
- Clone canvases intentionally when mutating pixel data so undo/redo and bitmap assets do not share mutable state accidentally.
- Validate image decode, file type, file size, canvas size, and export dimensions when adding import/export paths.

## TypeScript and React style

- The repo uses strict TypeScript with `noUnusedLocals` and `noUnusedParameters` enabled.
- Prefer explicit domain types from `src/types.ts` over ad hoc object shapes.
- Keep React state serializable where practical; use refs for mutable canvas/runtime state.
- Avoid broad `any`. Use `unknown` plus type guards for parsed project data or external input.
- Keep component props narrow and typed.
- Do not add new global state libraries unless the change clearly simplifies editor architecture.

## Canvas and image-editing guidance

- Treat canvas operations as potentially expensive. Avoid unnecessary full-canvas copies inside pointer-move loops.
- Keep large-image safeguards intact. Respect existing max canvas/export limits unless there is a deliberate UX change.
- When adding a tool, ensure it interacts correctly with active layer state, selection state, history commits, and export rendering.
- When adding pixel-editing behavior, create a history checkpoint at the correct boundary: usually before the first mutation and after finalization.
- When adding metadata-only edits such as opacity, blend mode, text settings, transforms, or filters, make sure they are undoable and persist in `.n00bs` files.

## Testing expectations

- Add or update Vitest coverage for pure utilities, serialization, transform math, history behavior, and validation logic.
- Use E2E tests for browser/editor flows that depend on pointer interactions, uploads, exports, or UI state across panels.
- When changing rendering behavior, test both preview assumptions and exported output assumptions where practical.

## Dependency policy

- Keep dependencies minimal. This project is a browser editor, not a server app.
- Do not add AI, backend, or server dependencies unless the project intentionally reintroduces that architecture.
- Prefer small utility functions over new runtime dependencies for simple math, validation, or formatting.

## Commit hygiene

- Keep commits focused: one feature, fix, or cleanup per commit.
- Do not commit `dist/`, local caches, logs, or generated temporary files.
- Update `README.md` when user-visible features, setup steps, verification commands, or known limitations change.
