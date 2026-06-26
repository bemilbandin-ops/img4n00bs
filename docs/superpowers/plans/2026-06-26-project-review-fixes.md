# Project Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the review findings that currently break verification or produce wrong editor behavior, then clean up obvious repo bloat.

**Architecture:** Keep the current editor architecture: serializable `EditorLayer` metadata, per-layer canvases in `BitmapStore`, shared compositing through `renderComposite()`, and bounded history. Do not introduce new dependencies or broad refactors.

**Tech Stack:** Vite, React, TypeScript, Tailwind, Vitest, Playwright, HTML canvas.

---

## Context

Repository root:

```text
D:\Code\photoshop-for-n00bs-final-implemented\photoshop-for-n00bs-repaired
```

Read before editing:

- `AGENTS.md`
- `PROJECT_REVIEW.md`
- `src/EditorApp.tsx`
- `src/utils/bitmapStore.ts`
- `src/utils/history.ts`
- `tests/e2e/editor-workflow.spec.ts`
- `tsconfig.json`

Current known verification:

- `npm run test` passes.
- `npm run build` passes with large chunk warning.
- `npm run check` fails because root `tsc --noEmit` compiles `orb-arena`.
- `npm run e2e` fails one test due to a stale active-layer CSS assertion.

## Files

- Modify: `tsconfig.json`
  - Scope root TypeScript checks to the editor project and exclude nested/generated folders.
- Modify: `src/EditorApp.tsx`
  - Fix crop source coordinates.
  - Fix canvas-resize behavior for bitmap layer canvases.
  - Add export fallback error handling.
  - Lazy-load background removal.
- Modify: `src/components/LayersPanel.tsx`
  - Add stable active-layer marker for tests.
- Modify: `tests/e2e/editor-workflow.spec.ts`
  - Stop asserting theme classes.
  - Remove debug logs.
- Create or modify: focused tests under `src/utils/__tests__/` if helpers are extracted.
  - Prefer small extracted pure helpers only if they make crop/resize testable without Playwright.
- Remove from repo if tracked: `orb-arena/`, `dist/`, `test-results/`, `debug.log`.

---

## Task 1: Restore Root Verification Scope

**Files:**

- Modify: `tsconfig.json`
- Possibly delete: `orb-arena/`

- [ ] **Step 1: Inspect whether `orb-arena` is tracked**

Run:

```powershell
git ls-files orb-arena
```

Expected:

- If output is non-empty, `orb-arena` is tracked and should be removed unless the user says it is intentional.
- If output is empty, it is local debris and can be ignored by TypeScript plus deleted locally if desired.

- [ ] **Step 2: Add root TypeScript scope**

Modify `tsconfig.json` by adding root-level `include` and `exclude` next to `compilerOptions`:

```json
{
  "compilerOptions": {
    "...": "keep existing options"
  },
  "include": [
    "src",
    "tests",
    "scripts",
    "vite.config.ts",
    "playwright.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage",
    "test-results",
    "orb-arena"
  ]
}
```

Do not paste the `"..."` placeholder. Preserve the existing `compilerOptions` exactly and add only the two arrays.

- [ ] **Step 3: Run TypeScript check**

Run:

```powershell
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add tsconfig.json
git commit -m "fix: scope root TypeScript checks"
```

---

## Task 2: Fix E2E Active Layer Assertion

**Files:**

- Modify: `src/components/LayersPanel.tsx`
- Modify: `tests/e2e/editor-workflow.spec.ts`

- [ ] **Step 1: Add stable active marker**

In `src/components/LayersPanel.tsx`, update the layer card root `<div>` in the reversed layer map:

```tsx
<div
  key={layer.id}
  data-active={isActive ? 'true' : 'false'}
  className={`flex flex-col gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
    isActive
      ? 'ui-card border-panel-border text-text-primary shadow-md'
      : 'bg-black/20 border-zinc-900/60 text-text-secondary hover:border-panel-border'
  }`}
  onClick={() => {
    if (!isActive) onSelectLayer(layer.id);
  }}
  id={`layer-card-${layer.id}`}
>
```

- [ ] **Step 2: Update failing E2E assertion**

In `tests/e2e/editor-workflow.spec.ts`, replace the stale class assertion:

```ts
await expect(page.locator('#layers-stack-list [id^="layer-card-"]').filter({ hasText: 'eraser-fixture' })).toHaveClass(/text-white/);
```

with:

```ts
await expect(
  page.locator('#layers-stack-list [id^="layer-card-"]').filter({ hasText: 'eraser-fixture' })
).toHaveAttribute('data-active', 'true');
```

- [ ] **Step 3: Remove debug logs**

Delete these `console.log(...)` lines from `tests/e2e/editor-workflow.spec.ts`:

```ts
console.log('goto');
console.log('upload');
console.log('text');
console.log('move rotate');
console.log('save project');
console.log('open project');
console.log('selection fill');
console.log('mask');
console.log('clone undo redo');
console.log('export');
```

- [ ] **Step 4: Run E2E**

Run:

```powershell
npm run e2e
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/LayersPanel.tsx tests/e2e/editor-workflow.spec.ts
git commit -m "test: stabilize active layer e2e assertion"
```

---

## Task 3: Fix Crop Source Coordinates

**Files:**

- Modify: `src/EditorApp.tsx`
- Test: add focused E2E coverage in `tests/e2e/editor-workflow.spec.ts` unless a tiny pure helper is extracted.

- [ ] **Step 1: Add a failing E2E crop regression**

Add this test to `tests/e2e/editor-workflow.spec.ts`:

```ts
test('crop to selection keeps the selected source pixels', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles({
    name: 'crop-fixture.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="50" height="100" fill="red"/>
        <rect x="50" width="50" height="100" fill="blue"/>
      </svg>
    `)
  });

  await page.locator('#btn-select-tool-select_rect').click();
  const box = await artboard(page).boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + 60, box!.y + 10);
  await page.mouse.down();
  await page.mouse.move(box!.x + 95, box!.y + 90);
  await page.mouse.up();

  await page.locator('#btn-crop-to-selection').click();

  await expect.poll(async () => {
    return page.locator('#active-drawing-canvas-element').evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.width,
      height: canvas.height,
      pixel: Array.from(canvas.getContext('2d')!.getImageData(5, 5, 1, 1).data)
    }));
  }).toEqual({
    width: 35,
    height: 80,
    pixel: [0, 0, 255, 255]
  });
});
```

Run:

```powershell
npm run e2e -- --grep "crop to selection keeps the selected source pixels"
```

Expected before fix: FAIL with red pixel or wrong dimensions.

- [ ] **Step 2: Apply minimal crop fix**

In `src/EditorApp.tsx`, inside `handleExecuteCropSelection()`, replace the bitmap draw source rectangle:

```ts
ctx.drawImage(
  sourceCanvas,
  cropOffset.x,
  cropOffset.y,
  targetW,
  targetH,
  0,
  0,
  targetW,
  targetH
);
```

with:

```ts
ctx.drawImage(
  sourceCanvas,
  sx,
  sy,
  targetW,
  targetH,
  0,
  0,
  targetW,
  targetH
);
```

Then delete the now-unused `cropOffset` constant if TypeScript reports it unused.

- [ ] **Step 3: Run crop regression**

Run:

```powershell
npm run e2e -- --grep "crop to selection keeps the selected source pixels"
```

Expected: PASS.

- [ ] **Step 4: Run full checks that are now relevant**

Run:

```powershell
npm run test
npm run e2e
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/EditorApp.tsx tests/e2e/editor-workflow.spec.ts
git commit -m "fix: crop selected source pixels"
```

---

## Task 4: Fix Canvas Resize For Bitmap Layers

**Files:**

- Modify: `src/EditorApp.tsx`
- Test: `tests/e2e/editor-workflow.spec.ts`

- [ ] **Step 1: Add failing E2E resize regression**

Add this test to `tests/e2e/editor-workflow.spec.ts`:

```ts
test('canvas resize center anchor moves bitmap pixels to the center', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles({
    name: 'resize-fixture.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100" height="100" fill="transparent"/>
        <rect x="0" y="0" width="10" height="10" fill="lime"/>
      </svg>
    `)
  });

  await page.locator('#btn-open-resize-dialog').click();
  await page.locator('#resize-mode-canvas').click();
  await page.locator('#resize-width-input').fill('200');
  await page.locator('#resize-height-input').fill('200');
  await page.locator('#resize-anchor-center').click();
  await page.locator('#btn-apply-resize').click();

  await expect.poll(async () => {
    return page.locator('#active-drawing-canvas-element').evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d')!;
      return {
        width: canvas.width,
        height: canvas.height,
        oldTopLeft: Array.from(ctx.getImageData(5, 5, 1, 1).data),
        centeredPixel: Array.from(ctx.getImageData(55, 55, 1, 1).data)
      };
    });
  }).toEqual({
    width: 200,
    height: 200,
    oldTopLeft: [0, 0, 0, 0],
    centeredPixel: [0, 255, 0, 255]
  });
});
```

Run:

```powershell
npm run e2e -- --grep "canvas resize center anchor moves bitmap pixels"
```

Expected before fix: FAIL because the green pixel remains at the old top-left.

- [ ] **Step 2: Implement bitmap canvas resize**

In `src/EditorApp.tsx`, inside `applyCanvasResize()`, update each bitmap source canvas before returning the layer:

```ts
if (updatedLayer.type === 'image' || updatedLayer.type === 'drawing') {
  const sourceCanvas = bitmapStoreRef.current.getCanvas(layer.sourceId);
  const resizedCanvas = createCanvas(targetW, targetH);
  const ctx = resizedCanvas.getContext('2d');

  if (ctx && sourceCanvas) {
    ctx.drawImage(sourceCanvas, offsetX, offsetY);
  }

  bitmapStoreRef.current.setCanvas(layer.sourceId, resizedCanvas);
}
```

Place this inside the `layers.map()` callback after `updatedLayer` is created and before returning it.

If the layer has a mask, resize that mask the same way:

```ts
if (updatedLayer.mask) {
  const sourceMask = bitmapStoreRef.current.getCanvas(updatedLayer.mask.bitmapId);
  const resizedMask = createCanvas(targetW, targetH);
  const maskCtx = resizedMask.getContext('2d');

  if (maskCtx && sourceMask) {
    maskCtx.drawImage(sourceMask, offsetX, offsetY);
  }

  bitmapStoreRef.current.setCanvas(updatedLayer.mask.bitmapId, resizedMask);
}
```

Keep existing text/shape rerendering.

- [ ] **Step 3: Run resize regression**

Run:

```powershell
npm run e2e -- --grep "canvas resize center anchor moves bitmap pixels"
```

Expected: PASS.

- [ ] **Step 4: Run full E2E**

Run:

```powershell
npm run e2e
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/EditorApp.tsx tests/e2e/editor-workflow.spec.ts
git commit -m "fix: resize bitmap layers with canvas"
```

---

## Task 5: Harden Project Import Boundaries

**Files:**

- Modify: `src/utils/projectFile.ts`
- Test: `src/utils/__tests__/projectFile.test.ts`

- [ ] **Step 1: Add failing project file tests**

Add tests to `src/utils/__tests__/projectFile.test.ts`:

```ts
it('rejects project bitmap sources that are not saved PNG data URLs', async () => {
  const raw = JSON.stringify({
    format: 'photoshop-for-n00bs-project',
    projectVersion: 1,
    createdAt: new Date().toISOString(),
    canvas: { width: 10, height: 10 },
    activeLayerId: 'layer-1',
    layers: [{
      id: 'layer-1',
      name: 'Layer 1',
      type: 'image',
      visible: true,
      opacity: 1,
      sourceId: 'src-1',
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hue: 0, blur: 0, vignette: 0 },
      filter: 'none'
    }],
    sources: {
      'src-1': { width: 10, height: 10, dataUrl: 'data:text/html;base64,PGgxPk5vPC9oMT4=' }
    }
  });

  await expect(deserializeProjectFile(raw)).rejects.toThrow(/bitmap source/i);
});

it('rejects impossible project canvas dimensions before decoding sources', async () => {
  const raw = JSON.stringify({
    format: 'photoshop-for-n00bs-project',
    projectVersion: 1,
    createdAt: new Date().toISOString(),
    canvas: { width: 100000, height: 100000 },
    activeLayerId: '',
    layers: [],
    sources: {}
  });

  await expect(deserializeProjectFile(raw)).rejects.toThrow(/canvas dimensions/i);
});
```

Run:

```powershell
npm run test -- src/utils/__tests__/projectFile.test.ts
```

Expected before fix: at least one test FAILS.

- [ ] **Step 2: Add minimal validation**

In `src/utils/projectFile.ts`, add constants near the project format constants:

```ts
const MAX_PROJECT_DIMENSION = 8000;
const MAX_SOURCE_DATA_URL_LENGTH = 40 * 1024 * 1024;
```

After reading `canvasWidth` and `canvasHeight`, add:

```ts
if (canvasWidth > MAX_PROJECT_DIMENSION || canvasHeight > MAX_PROJECT_DIMENSION) {
  throw new Error('Invalid project file: canvas dimensions exceed the supported limit.');
}
```

Before `readImageDataUrl(dataUrl)`, add:

```ts
if (!dataUrl.startsWith('data:image/png;base64,')) {
  throw new Error(`Invalid project file: source ${sourceId} bitmap source must be a PNG data URL.`);
}
if (dataUrl.length > MAX_SOURCE_DATA_URL_LENGTH) {
  throw new Error(`Invalid project file: source ${sourceId} bitmap source is too large.`);
}
```

After reading expected source dimensions and before accepting them, add:

```ts
if (
  expectedWidth <= 0 ||
  expectedHeight <= 0 ||
  expectedWidth > MAX_PROJECT_DIMENSION ||
  expectedHeight > MAX_PROJECT_DIMENSION
) {
  throw new Error(`Invalid project file: source ${sourceId} dimensions exceed the supported limit.`);
}
```

- [ ] **Step 3: Run project tests**

Run:

```powershell
npm run test -- src/utils/__tests__/projectFile.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/utils/projectFile.ts src/utils/__tests__/projectFile.test.ts
git commit -m "fix: validate project bitmap sources"
```

---

## Task 6: Harden Export Encoding Failure

**Files:**

- Modify: `src/EditorApp.tsx`

- [ ] **Step 1: Wrap export encode path**

In `handleExportFinishedImage()`, wrap the blob/fallback download code:

```ts
try {
  const blob = await canvasToBlob(exportCanvas, mime, quality);
  const link = document.createElement('a');
  link.download = `beginner_masterpiece_${targetW}x${targetH}_${Date.now()}.${ext}`;

  if (blob) {
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    link.href = exportCanvas.toDataURL(mime, quality);
    link.click();
  }
} catch {
  setUploadError('Export failed: the browser could not encode this image.');
  return;
}
```

Leave `setShowExportModal(false);` after this block so failed exports keep the modal open or visibly report the error.

- [ ] **Step 2: Run TypeScript and build**

Run:

```powershell
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add src/EditorApp.tsx
git commit -m "fix: report export encode failures"
```

---

## Task 7: Lazy-Load Background Removal

**Files:**

- Modify: `src/EditorApp.tsx`

- [ ] **Step 1: Remove static import**

Delete:

```ts
import { createBackgroundRemovalMask } from './utils/backgroundRemoval';
```

- [ ] **Step 2: Dynamic import in handler**

In `handlePreviewRemoveBackground()`, replace:

```ts
const mask = await createBackgroundRemovalMask(source);
```

with:

```ts
const { createBackgroundRemovalMask } = await import('./utils/backgroundRemoval');
const mask = await createBackgroundRemovalMask(source);
```

- [ ] **Step 3: Run build and compare output**

Run:

```powershell
npm run build
```

Expected:

- PASS.
- Main `index-*.js` chunk should shrink.
- Background-removal/ONNX chunks may still be large, but should be loaded separately.

- [ ] **Step 4: Run E2E smoke**

Run:

```powershell
npm run e2e
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/EditorApp.tsx
git commit -m "perf: lazy-load background removal"
```

---

## Task 8: Repo Cleanup

**Files:**

- Delete if tracked: `orb-arena/`
- Delete if tracked or present: `dist/`, `test-results/`, `debug.log`
- Modify if needed: `.gitignore`

- [ ] **Step 1: Check tracked cleanup candidates**

Run:

```powershell
git ls-files orb-arena dist test-results debug.log
```

Expected:

- Tracked generated/unrelated files should be removed.
- If nothing prints, no commit is needed for those files.

- [ ] **Step 2: Remove tracked debris**

Only remove paths that appeared in Step 1:

```powershell
git rm -r orb-arena
git rm -r dist
git rm -r test-results
git rm debug.log
```

If a command says the pathspec did not match, skip that path.

- [ ] **Step 3: Confirm ignore rules**

`.gitignore` should include:

```gitignore
node_modules/
build/
dist/
coverage/
.DS_Store
*.log
.env*
!.env.example
test-results/
```

Add `orb-arena/` only if the directory is expected to recur locally but remain outside the editor project.

- [ ] **Step 4: Commit cleanup**

```powershell
git add .gitignore
git commit -m "chore: remove generated project debris"
```

If only deletions were staged by `git rm`, use:

```powershell
git commit -m "chore: remove generated project debris"
```

---

## Final Verification

- [ ] **Step 1: Run required check**

```powershell
npm run check
```

Expected: PASS.

- [ ] **Step 2: Run E2E**

```powershell
npm run e2e
```

Expected: PASS.

- [ ] **Step 3: Inspect final diff**

```powershell
git status --short
git diff --stat HEAD
```

Expected:

- Only intended files changed.
- No `dist/`, `test-results/`, logs, or unrelated app files remain staged unless intentionally removed.

- [ ] **Step 4: Update review report if useful**

If this branch keeps `PROJECT_REVIEW.md`, add a short status note at the top:

```markdown
> Fix status: issues from this report were addressed in follow-up commits on this branch.
```

Skip this if the report is meant to remain a historical review artifact.

