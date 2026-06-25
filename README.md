# Photoshop for n00bs

A beginner-friendly browser image editor built with Vite, React, TypeScript, and canvas.

## Current features

- Upload a local image or start from a blank canvas/sample project.
- Use image, drawing, and text layers.
- Move, scale, and rotate the active layer non-destructively with the Move tool transform handles.
- Resize the whole image or resize the canvas bounds without scaling pixels.
- Toggle visibility, opacity, order, duplicate, merge, rename, and blend modes.
- Paint with brush/eraser tools.
- Add and edit text labels.
- Make rectangle, ellipse, and lasso selections.
- Fill, clear, crop, and export selected areas.
- Apply basic adjustments and filters.
- Export a flattened PNG or JPEG.
- Save and reopen editable `.n00bs` layered project files.

## Recent repair work

- Export and selection export use the same shared renderer as the preview canvas.
- Undo history is capped and no longer stores canvas snapshots as base64 strings.
- Filters, adjustments, opacity, and text edits now create history commits.
- Brush stroke finalization saves the latest layer state.
- Layer metadata is serializable and live pixel canvases are stored separately in `BitmapStore`.
- Layer transforms are metadata-driven, undoable, and respected by preview/export.
- `.n00bs` project save/reopen preserves canvas size, layer stack, text settings, transforms, adjustments, filters, and layer pixel data.
- Resize controls can resample all layers or change the canvas bounds while preserving layer editability.
- Crop rectangles are normalized and clamped to canvas bounds.
- Uploads now validate file type, size, and decode failures.
- Removed unused AI/server dependencies and AI Studio boilerplate metadata.

## Known limitations

This is still a prototype. The layer model is now split from bitmap storage, but history is still bounded snapshot/checkpoint history rather than command-based history.

Missing beginner-critical features include shapes, eyedropper, copy/cut/paste selection, and export quality/dimension controls.

## Development

Prerequisites: Node.js 22 or compatible.

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run build
npm run check
```

`npm run lint` currently runs TypeScript checks. `npm run build` runs the production Vite build.

## Architecture notes

- Layer metadata is held in React state and keyed by `sourceId`.
- Per-layer pixel canvases live in `BitmapStore`, not inside `EditorLayer`.
- `renderComposite()` is the shared rendering path for preview and export.
- Project persistence is handled by `src/utils/projectFile.ts` using serializable layer metadata plus PNG data URLs for bitmap sources inside a `.n00bs` JSON file.
- History is capped and stores `ImageData` checkpoints rather than base64 data URLs.
