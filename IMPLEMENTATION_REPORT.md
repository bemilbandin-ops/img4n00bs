# Implementation Report

Audit source: `photoshop_for_n00bs_project_audit(1).md`

## Completed in this batch

### 17. Command-based history

- Replaced the single all-snapshot history stack with mixed `HistoryEntry` records:
  - `command` entries for semantic metadata edits.
  - `checkpoint` entries for pixel-destructive edits.
- Added `src/utils/history.ts` for reusable history state cloning, checkpoint creation, bitmap asset capture/restore, and entry diagnostics.
- Added semantic history command types for:
  - add/delete/duplicate layer
  - visibility
  - opacity
  - blend mode
  - reorder
  - rename
  - adjustments
  - filters
  - text edits
  - shape edits
  - transforms
  - copy/paste selection layers
- Kept bitmap checkpoints for destructive pixel/canvas operations:
  - brush/eraser strokes
  - merge layers
  - crop
  - cut selection
  - fill/clear selection
  - rotate/flip
  - resize image/canvas
- Added before-checkpoint insertion for pixel-destructive edits when the current history entry is only semantic metadata. This preserves correct undo behavior across mixed command/checkpoint history.
- Added targeted bitmap asset capture for structural commands that create/remove sources, such as image-layer add, layer duplicate, layer delete, copy selection, and paste selection.
- Updated undo/redo traversal so:
  - undoing a command applies the command's `before` state.
  - redoing a command applies the command's `after` state.
  - undoing a checkpoint restores the previous entry's final state.
  - redo restores the target entry's final state.
- Text and shape commands restore editable metadata and re-render their bitmap sources instead of requiring full bitmap snapshots.

Verification before starting the final task:

```bash
npm run check
```

Passed. `npm run check` exited with code 0.

### 18. Unit test suite

- Added Vitest to the project.
- Added `npm run test`.
- Updated `npm run check` to run:
  1. TypeScript lint/type-check
  2. Unit tests
  3. Production build
- Added a minimal RGBA canvas test mock in `src/test/canvasMock.ts` so renderer/history tests can run in Node without a browser.
- Added unit tests for:
  - `BitmapStore` canvas creation, cloning, source cloning, and pruning.
  - `renderComposite()` layer order, visibility, opacity, export background, and default transform helpers.
  - History utilities: immutable semantic states, checkpoint pixel capture, command state extraction, bitmap asset restore, and diagnostics.
  - Selection utilities: inactive selections, inverted rectangles, canvas clamping, tiny-selection rejection, and lasso bounds.
  - Image filters/layer renderers: CSS filter generation, no-op filter output, sharpen dimensions, and text/shape renderer smoke tests.
- Extracted selection helpers into `src/utils/selection.ts` so they can be unit-tested and reused by the app.

Verification:

```bash
npm run check
```

Passed. `npm run check` exited with code 0.

Test result summary:

```text
Test Files  5 passed (5)
Tests       23 passed (23)
```

## Previously completed tasks

### 16. Export size/quality controls

- Added PNG/JPG/WebP export choices, output dimensions, aspect-ratio lock, JPEG/WebP quality, and export background controls.
- Export remains non-destructive and scales the flattened composite to requested dimensions.

Verification: `npm run check` passed.

### 15. Copy/cut/paste selection as a new layer

- Added copy, cut, and paste selection workflows.
- Added internal selection clipboard.
- New cutout layers remain standard editable image layers.

Verification: `npm run check` passed.

### 14. Eyedropper

- Added Pick Color tool with whole-image and active-layer sampling.
- Sampled color updates brush, text, and shape colors.

Verification: `npm run check` passed.

### 13. Shapes

- Added rectangle, ellipse, line, and arrow shape layers.
- Added shape styling controls and renderer/history/project support.

Verification: `npm run check` passed.

### 12. Resize image/canvas controls

- Added resize dialog with image-resize and canvas-resize modes.
- Added aspect-ratio locking and canvas anchoring.

Verification: `npm run check` passed.

### 11. Save/reopen layered project

- Added `.n00bs` layered project export/import preserving layers, sources, text, shapes, transforms, adjustments, and filters.

Verification: `npm run check` passed.

### 1–10. Earlier stabilization work

- Added shared renderer and DOM-independent export.
- Repaired bounded history checkpoints.
- Fixed undo commit paths for sliders/text/opacity/brush.
- Fixed text defaults.
- Improved crop/selection/touch/upload behavior.
- Cleaned unused dependencies and boilerplate.
- Split serializable layer model from live bitmap storage.
- Added Move tool and transform handles.

## Remaining core tasks

None from the current handoff list.

Potential later polish from the broader audit remains optional: background removal/cutout improvements, clone/heal tools, masks, accessibility pass, keyboard shortcut overlay, and broader end-to-end/manual browser testing.
