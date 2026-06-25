# Implementation Report 2

Source plan: `implementation-plan.md`

## Completed in this batch

### Phase 1 item 1 - transformed layer editing

- Added shared transform helpers in `src/utils/layerTransforms.ts`.
- Reused the helpers in the renderer and selection fill/clear paths.
- Updated crop, rotate, flip, and canvas resize so editable text/shape layers are not flattened.
- Added guards so destructive selection fill/clear does not silently rasterize text or shape layers.
- Added regression coverage for transform coordinate round-tripping and transform remapping.

Verification:

- Targeted TypeScript compile passed for the touched production files.
- Vitest could not run because the local `vitest` binary is missing in this workspace.

### Phase 1 item 2 - adjustment reset

- Replaced separate reset calls from `AdjustmentsPanel` with one atomic App-level reset.
- Added `resetLayerAdjustments(layerId)` behavior in `src/App.tsx`.
- Reset now restores adjustment sliders and filter state together as one history command.

Verification:

- Targeted TypeScript compile passed for `src/App.tsx` and `src/components/AdjustmentsPanel.tsx`.

### Phase 1 item 3 - vignette rendering

- Moved vignette rendering into an offscreen layer buffer in `src/utils/renderComposite.ts`.
- Clipped vignette output to the target layer alpha before compositing.
- Preserved existing layer opacity and blend mode behavior.
- Extended the canvas mock enough to cover multiply, destination-in, and simple gradient behavior.
- Added a regression test that verifies vignette does not darken unrelated layers.

Verification:

- Targeted TypeScript compile passed for `src/utils/renderComposite.ts`.
- `npm.cmd run test` could not run because `vitest` is not available as a local command.
- `npm.cmd run build` could not run because `vite` is not available as a local command.

### Phase 1 item 4 - bitmap memory/history cleanup

- Added `BitmapStore.getStats()` for cleanup diagnostics.
- Made bitmap pruning mask-aware.
- Added cleanup after delete layer, undo/redo restore, merge, and project open.
- Fixed delete cleanup ordering so undo can still restore deleted bitmap assets.
- Added bitmap-store regression coverage for stats and pruning.

Verification:

- Targeted TypeScript compile passed for `src/utils/bitmapStore.ts` and `src/App.tsx`.
- Vitest remained blocked by the missing local binary.

### Phase 2 item 5 - layer masks

- Extended the layer model with:

```ts
mask?: {
  bitmapId: string;
  enabled: boolean;
  linked: boolean;
}
```

- Added reveal-all, hide-all, and selection-based mask creation.
- Added mask enable/disable, delete, and active-mask selection from the Layers panel.
- Updated rendering so masks apply as alpha masks.
- Updated history checkpoints so mask image data is restored with layer image data.
- Updated project save/load so mask bitmaps persist in `.n00bs` files.
- Allowed brush/eraser edits on the active mask: brush reveals, eraser hides.
- Updated bitmap cleanup to retain mask bitmaps while masks reference them.

Verification:

- Targeted TypeScript compile passed for the mask path:
  `src/types.ts`, `src/utils/history.ts`, `src/utils/bitmapStore.ts`, `src/utils/projectFile.ts`, `src/utils/renderComposite.ts`, `src/components/LayersPanel.tsx`, and `src/App.tsx`.
- Vitest remained blocked by the missing local binary.

### Phase 2 item 6 - clone/heal tool foundation

- Added `cloneStamp` and `healingBrush` tool types.
- Added toolbar entries and tool options.
- Added Alt-click source point picking.
- Implemented clone painting on visible bitmap layers.
- Implemented a simple healing pass using the clone operation with softer alpha.
- Added guards so clone/heal do not affect hidden, text, or shape layers.

Verification:

- Targeted TypeScript compile passed for:
  `src/types.ts`, `src/components/Toolbar.tsx`, `src/components/ToolOptions.tsx`, `src/components/CanvasArea.tsx`, and `src/App.tsx`.
- A production-source TypeScript compile across `src` excluding tests passed with `--allowImportingTsExtensions`.

### Phase 1 item 1 - background removal

- Added browser-safe solid-background removal in `src/utils/backgroundRemoval.ts`.
- Generates an editable layer mask instead of deleting original pixels.
- Added preview-before-apply UI from the active image/drawing layer.
- Reused existing mask painting for manual cleanup.
- Added regression coverage for simple solid-color background removal.

Verification:

- `npm.cmd run check` passed after tooling repair.

### Phase 1 item 2 - swatches and eyedropper history

- Added recent sampled color history from the eyedropper.
- Added project swatches in the tool panel.
- Added swatch add, remove, and click-to-apply behavior for brush/text/shape colors.
- Persisted swatches in `.n00bs` project files.
- Added project swatch persistence coverage.

Verification:

- Touched-source TypeScript check passed before tooling repair.
- `npm.cmd run check` passed after tooling repair.

### Phase 2 item 3 - App split

- Moved the editor implementation to `src/EditorApp.tsx`.
- Reduced `src/App.tsx` to a small wrapper around `EditorApp`.
- Preserved existing behavior during the split.

Verification:

- `src/App.tsx` line count is now 4.
- `npm.cmd run check` passed after tooling repair.

### Phase 3 item 5 - local Vite/Vitest tooling repair

- Repaired the local package install so package scripts can find Vite, Vitest, and TypeScript.
- The lockfile pointed tarball downloads at a timing-out internal gateway, so install was completed with `--package-lock=false` and the public npm registry.
- Confirmed normal package scripts now run from the workspace.

Verification:

- `npm.cmd run test` passed: 8 files, 32 tests.
- `npm.cmd run build` passed.
- `npm.cmd run check` passed.

### Phase 3 item 6 - fragile unit test coverage

- Added transform coverage for canvas offset behavior.
- Expanded bitmap-store tests so pruning preserves mask bitmap references.
- Added `src/utils/__tests__/projectFile.test.ts` for swatch and mask project persistence.
- Extended the canvas mock with `toDataURL()` for project save tests.

Verification:

- Targeted tests passed:
  `npm.cmd run test -- src/utils/__tests__/layerTransforms.test.ts src/utils/__tests__/bitmapStore.test.ts src/utils/__tests__/projectFile.test.ts`
- Full `npm.cmd run check` passed: 9 files, 35 tests, production build passed.

## Current status

- `npm.cmd run check` passes end to end.
- Browser workflow tests are started but not complete; the Playwright workflow spec still needs cleanup and a passing verification run.
- Remaining plan work is now tracked in `implementation-plan.md`.
