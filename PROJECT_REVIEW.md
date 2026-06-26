# Project Review

Date: 2026-06-26

Scope: full repository review of the Photoshop for n00bs editor, with correctness, test health, additions, and simplification opportunities.

## Executive Summary

The editor has a solid core shape: serializable layer metadata, bitmap storage outside layer objects, shared composite rendering, and decent utility coverage. The biggest problems are not architectural rewrites. They are smaller, fixable issues:

- `npm run check` is currently broken because the root TypeScript config compiles the nested `orb-arena` app.
- Crop uses the wrong source coordinates, so crop-to-selection/crop-rectangle can crop the wrong pixels.
- Canvas resize does not resize/reposition bitmap layer canvases, so image/drawing layers do not honor the selected anchor.
- E2E has one failing test and leftover debug logging.
- The repo contains unrelated/generated debris that should not live in the project tree.

## Verification Results

| Command | Result | Notes |
| --- | --- | --- |
| `npm run check` | Failed | `tsc --noEmit` compiles `orb-arena/src/App.tsx` and cannot resolve `./assets/*.svg` / `hero.png`. |
| `npm run test` | Passed | 14 test files, 51 tests passed. |
| `npm run build` | Passed with warning | Main JS chunk is 601.49 kB; ONNX/WASM background-removal assets are large. |
| `npm run e2e` | Failed | 3 passed, 1 failed: eraser selected-layer test expects stale active-layer class. |

## Bugs And Risks

### High: Root Check Command Is Broken

`npm run check` fails before tests/build because `tsconfig.json` has no `include`/`exclude`, so `tsc --noEmit` walks into `orb-arena`.

Evidence:

- `package.json`: `lint` is `tsc --noEmit`.
- `tsconfig.json`: no root `include`/`exclude`.
- Failure: `orb-arena/src/App.tsx` cannot resolve `./assets/react.svg`, `./assets/vite.svg`, `./assets/hero.png`.

Fix: remove `orb-arena` from this repo, or add a root `include` for `src`, `tests`, config files and exclude `orb-arena`, `dist`, `test-results`, `node_modules`.

### High: Crop Uses The Wrong Source Region

`handleExecuteCropSelection()` computes `sx`/`sy`, then ignores them when drawing bitmap layer pixels. It uses `cropOffset` instead:

- `src/EditorApp.tsx:1713-1723` computes crop/selection origin.
- `src/EditorApp.tsx:1737-1741` computes center offset.
- `src/EditorApp.tsx:1749-1752` passes `cropOffset.x`, `cropOffset.y` to `drawImage()`.

That means a crop to a selection at `(10, 10)` can read from a centered region instead of `(10, 10)`.

Fix: use `sx`, `sy` as the source rectangle for bitmap pixels. Keep transform adjustment separate.

### High: Canvas Resize Does Not Move Bitmap Pixels Correctly

`applyCanvasResize()` updates layer transforms and text/shape metadata, but it does not create resized canvases for image/drawing layer sources.

- `src/EditorApp.tsx:2280` starts `applyCanvasResize`.
- `src/EditorApp.tsx:2281-2288` computes anchor offset.
- The function never draws old bitmap canvases into a new `targetW x targetH` canvas.

Result: expanding canvas with "center" keeps image/drawing pixels at the old top-left instead of centered. Top-left placement can also drift because the bitmap canvas dimensions and transform center no longer match the project canvas.

Fix: for bitmap layers, create `targetW x targetH` canvases and draw the old source at `offsetX`, `offsetY`; leave metadata transform alone unless the layer already has a non-default transform that must be remapped.

### Medium: E2E Test Is Failing Against Current UI Classes

The failed test asserts the active layer card has `/text-white/`, but active cards now use `text-text-primary`.

- `tests/e2e/editor-workflow.spec.ts:122`
- Current active class comes from `src/components/LayersPanel.tsx:237-241`.

Fix: assert a stable behavior or stable test id/state instead of a theme class. The useful behavior in that test is already "no Drawing Layer was created" plus "alpha changed".

### Medium: Project File Decode Is Looser Than The Repo Rules

`deserializeProjectFile()` validates structure and source dimensions after decode, but it does not validate source data URL type, encoded size, or max decoded dimensions before attempting image decode.

- `src/utils/projectFile.ts:96` creates an `Image`.
- `src/utils/projectFile.ts:155` validates positive canvas size.
- `src/utils/projectFile.ts:314-315` validates dimensions only after decode.

Fix: add a small boundary check before decode: require `data:image/png;base64,` for saved sources, cap data URL length, and cap canvas/source dimensions using existing safeguards.

### Medium: Background Removal Makes The Main Build Heavy

`@imgly/background-removal` and `onnxruntime-web` are imported in the normal app path:

- `src/utils/backgroundRemoval.ts:1`
- `src/EditorApp.tsx:57`

Build output includes a 601.49 kB main JS chunk and multiple ONNX/WASM assets, including a 23.9 MB WASM file. That is a lot for users who never click "Remove background".

Fix: dynamic-import the background-removal utility inside `handlePreviewRemoveBackground()`. Keep the dependency if the feature matters; just load it lazily.

### Low: Export Fallback Can Still Throw

`canvasToBlob()` returning `null` falls back to `exportCanvas.toDataURL(...)`.

- `src/EditorApp.tsx:2483-2487`
- `src/EditorApp.tsx:2541-2552`

For very large canvases or unsupported formats, `toDataURL()` can also fail or return an unusable result. The user then gets no clear error.

Fix: wrap the fallback and show `Export failed: the browser could not encode this image.`

### Low: Text/Shape Edit History Can Create No-Op Entries

Several commit handlers push history on blur or button/key release without checking whether metadata changed:

- `src/EditorApp.tsx:1468-1471`
- `src/EditorApp.tsx:1580-1583`
- `src/EditorApp.tsx:1197-1203`

Fix: compare previous committed state to next state before pushing a command. Skip no-op history entries.

## Suggested Additions

1. Add tests for crop source coordinates.
   A tiny utility-level test would catch the `cropOffset` bug without needing Playwright.

2. Add tests for canvas resize anchors.
   One bitmap layer with a colored pixel is enough: resize larger with `center`, assert the pixel moved by the expected offset.

3. Add project import boundary tests.
   Cover oversized canvas metadata, non-PNG source data URLs, and missing/huge source payloads.

4. Add export encode failure handling.
   Mock `toBlob()` returning `null` and `toDataURL()` throwing.

5. Add a stable active-layer marker for E2E.
   Example: `data-active={isActive}` on layer cards. Tests should not depend on theme class names.

## Simplifications

Ranked biggest cut first:

- `delete:` remove `orb-arena/`. It is a separate Vite starter app and breaks root checks. Replacement: separate repo or delete. `orb-arena/`
- `delete:` remove generated/local files from the working tree. Replacement: regenerate when needed. `dist/`, `test-results/`, `debug.log`
- `shrink:` delete E2E `console.log()` progress noise. Replacement: Playwright step names or no logging. `tests/e2e/editor-workflow.spec.ts:131-215`
- `shrink:` use one shared "is text entry" helper for the duplicate keyboard guards. Replacement: local utility function. `src/EditorApp.tsx:274-291`, `src/components/CanvasArea.tsx:147-164`
- `yagni:` remove `ImglyBackgroundRemovalOptions.provider` until it has a second value or behavior. Replacement: no options argument. `src/utils/backgroundRemoval.ts:27-30`
- `shrink:` make `canvasToBlob()` one shared helper instead of duplicating it in export and background removal. Replacement: `utils/canvasBlob.ts`. `src/EditorApp.tsx:2483`, `src/utils/backgroundRemoval.ts:267`

Potential net: thousands of files/lines if `orb-arena`, `dist`, and `test-results` are removed; otherwise roughly -40 to -80 source/test lines.

## Cleanup Priority

1. Fix root `npm run check` by deleting/excluding `orb-arena`.
2. Fix crop source coordinates.
3. Fix bitmap behavior in canvas resize.
4. Update the failing E2E assertion.
5. Lazy-load background removal.
6. Add the small regression tests above.

