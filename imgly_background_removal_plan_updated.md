# IMG.LY Background Removal Implementation Plan

Repository: `bemilbandin-ops/img4n00bs`  
Target app: Vite / React image editor  
Feature: **Remove Background**  
Goal: clean async IMG.LY integration using `@imgly/background-removal`

---

## 1. Current repo inspection summary

Current `main` state has already been inspected.

### Relevant current files

- `src/utils/backgroundRemoval.ts`
- `src/EditorApp.tsx`
- `src/components/LayersPanel.tsx`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `src/test/canvasMock.ts`

### Current implementation state

`src/utils/backgroundRemoval.ts` is still a synchronous heuristic implementation.

It currently:

- samples edge pixels,
- builds background color clusters,
- flood-fills edge-connected similar pixels,
- creates an alpha mask,
- returns `HTMLCanvasElement` synchronously.

This is not true AI background removal and should no longer be the default model path.

Current exported utility shape:

```ts
export function createBackgroundRemovalMask(
  source: HTMLCanvasElement,
  options?: BackgroundRemovalOptions
) {
  // returns HTMLCanvasElement synchronously
}
```

### Current React flow

`EditorApp.tsx` currently calls the utility synchronously:

```ts
const mask = createBackgroundRemovalMask(source);
bitmapStoreRef.current.setCanvas(maskId, mask);
```

Then it immediately:

- builds a preview canvas,
- sets `backgroundRemovalPreview`,
- opens the preview modal.

This flow must change because IMG.LY model inference is asynchronous.

### Current UI state

`LayersPanel.tsx` currently has:

```ts
onRemoveBackground: (id: string) => void;
```

There is no loading state passed into the layer panel and the **Remove Background** button is not disabled while work is running.

The preview modal only exists after `backgroundRemovalPreview` is set, and the `Apply Mask` button is currently enabled whenever the modal exists.

### Package state

`package.json` currently lists:

```json
"@imgly/background-removal": "^1.7.0"
```

But the top-level `package-lock.json` dependency block does not include `@imgly/background-removal`.

That means dependency state is inconsistent. The lockfile should be regenerated with `npm install`, not manually patched.

---

## 2. Non-goals and constraints

Do not:

- modify `main` directly,
- base the work on `imgly-bg-mask`,
- preserve the old synchronous API,
- return a fallback mask before IMG.LY finishes,
- mutate a previously returned mask later,
- query or mutate DOM from utility files,
- silently mix heuristic fallback into the IMG.LY path,
- preview or apply any mask before the model finishes.

Treat the old `imgly-bg-mask` branch as an anti-pattern.

---

## 3. Branching plan

Create a fresh branch from current `main`.

```bash
git checkout main && git pull
git checkout -b imgly-background-removal-async
```

Suggested branch name:

```text
imgly-background-removal-async
```

Do not reuse:

```text
imgly-bg-mask
```

---

## 4. Dependency plan

Run:

```bash
npm install
```

Expected outcome:

- `package-lock.json` is updated correctly.
- `@imgly/background-removal` appears in the root package lock dependency block.
- transitive dependencies are recorded by npm.
- peer dependency state for `onnxruntime-web` is validated.

Important notes:

- `@imgly/background-removal` declares `onnxruntime-web` as a peer dependency.
- The repo already has `onnxruntime-web`.
- Confirm the installed version satisfies the IMG.LY package version actually installed by npm.
- If npm reports a missing or incompatible peer dependency, install/pin the required `onnxruntime-web` version explicitly instead of ignoring the warning.

Do not hand-edit `package-lock.json` unless there is no alternative.

---

## 5. IMG.LY API usage

Use the import style that matches the installed package types. Preferred first attempt:

```ts
import imglyRemoveBackground from '@imgly/background-removal';
```

Only use a named import if the installed package types confirm it exists.

Expected IMG.LY flow:

```ts
const resultBlob = await imglyRemoveBackground(inputBlob, {
  output: {
    format: 'image/png'
  }
});
```

The IMG.LY function returns:

```ts
Promise<Blob>
```

The returned PNG is the cutout image, where the alpha channel represents the foreground mask.

---

## 6. Utility design

### Recommended public functions

Refactor `src/utils/backgroundRemoval.ts` to separate the AI path from fallback behavior.

Recommended exports:

```ts
export async function createBackgroundRemovalMask(
  source: HTMLCanvasElement,
  options?: ImglyBackgroundRemovalOptions
): Promise<HTMLCanvasElement>;

export function createHeuristicBackgroundRemovalMask(
  source: HTMLCanvasElement,
  options?: HeuristicBackgroundRemovalOptions
): HTMLCanvasElement;
```

Alternative acceptable export:

```ts
export async function createBackgroundRemovalMask(
  source: HTMLCanvasElement,
  options?: {
    provider?: 'imgly';
  }
): Promise<HTMLCanvasElement>;

export function createHeuristicBackgroundRemovalMask(...): HTMLCanvasElement;
```

Do not allow a silent fallback inside `createBackgroundRemovalMask`.

### Proposed utility responsibilities

The IMG.LY utility should:

1. Validate source canvas dimensions.
2. Convert source canvas to a PNG `Blob`.
3. Await IMG.LY `removeBackground`.
4. Decode the returned cutout PNG.
5. Draw the cutout into a temporary same-size canvas.
6. Read `ImageData` from the cutout canvas.
7. Create a mask canvas.
8. Copy only the cutout alpha channel into the mask alpha channel.
9. Set mask RGB channels to white.
10. Return the finished mask canvas.

### Core mask construction logic

The key logic should look conceptually like this:

```ts
const cutoutImageData = cutoutCtx.getImageData(0, 0, width, height);
const maskImageData = new ImageData(width, height);

for (let i = 0; i < width * height; i++) {
  const offset = i * 4;
  const alpha = cutoutImageData.data[offset + 3];

  maskImageData.data[offset] = 255;
  maskImageData.data[offset + 1] = 255;
  maskImageData.data[offset + 2] = 255;
  maskImageData.data[offset + 3] = alpha;
}

maskCtx.putImageData(maskImageData, 0, 0);
```

This is the central requirement: **build the layer mask from the returned cutout PNG alpha channel**.

### Canvas to Blob helper

Add a helper:

```ts
const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type = 'image/png'
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Background removal failed: could not encode source canvas.'));
        return;
      }
      resolve(blob);
    }, type);
  });
```

### Blob decode helper

Use `createImageBitmap` if available:

```ts
const bitmap = await createImageBitmap(blob);
```

Then draw it to a canvas.

Fallback for browsers without `createImageBitmap` can be implemented with an object URL and `HTMLImageElement`, but keep that helper isolated and deterministic.

---

## 7. Fallback behavior

Keep heuristic fallback explicit.

Recommended function name:

```ts
createHeuristicBackgroundRemovalMask
```

Do not call it automatically from the IMG.LY function.

Bad pattern to avoid:

```ts
try {
  return await createImglyMask(source);
} catch {
  return createHeuristicMask(source);
}
```

Good pattern:

```ts
try {
  const mask = await createBackgroundRemovalMask(source);
  // preview/apply
} catch (error) {
  setBackgroundRemovalError('AI background removal failed. Try again or use manual masking.');
}
```

If a fallback UI is desired later, expose a separate button such as:

```text
Use basic edge-color fallback
```

But do not silently mix fallback into model failure.

---

## 8. React state changes

Add dedicated state in `EditorApp.tsx`.

Recommended shape:

```ts
type BackgroundRemovalStatus = 'idle' | 'running' | 'error';

const [backgroundRemovalStatus, setBackgroundRemovalStatus] =
  useState<BackgroundRemovalStatus>('idle');

const [backgroundRemovalLayerId, setBackgroundRemovalLayerId] =
  useState<string | null>(null);

const [backgroundRemovalError, setBackgroundRemovalError] =
  useState<string | null>(null);
```

Derived flag:

```ts
const isRemovingBackground = backgroundRemovalStatus === 'running';
```

---

## 9. Async handler plan

Convert:

```ts
const handlePreviewRemoveBackground = (id: string) => {
  ...
};
```

to:

```ts
const handlePreviewRemoveBackground = async (id: string) => {
  ...
};
```

### Handler sequence

1. Validate layer exists.
2. Validate layer type is `image` or `drawing`.
3. Validate layer has no existing mask.
4. Validate source canvas exists.
5. Set loading state:
   ```ts
   setBackgroundRemovalStatus('running');
   setBackgroundRemovalLayerId(id);
   setBackgroundRemovalError(null);
   setUploadError('');
   ```
6. Create `maskId`.
7. Await:
   ```ts
   const mask = await createBackgroundRemovalMask(source);
   ```
8. After await, re-check:
   - layer still exists,
   - layer still has no mask,
   - source canvas still exists,
   - dimensions still match,
   - operation still belongs to the same layer.
9. Store mask in `BitmapStore`.
10. Build preview using `destination-in`.
11. Set `backgroundRemovalPreview`.
12. Clear loading state in `finally`.

### Stale async operation guard

Because the user can change the project while IMG.LY runs, add an operation token/ref.

Do not rely only on `layerId`, because the same layer could start multiple removal operations.

Example concept:

```ts
const operationId = crypto.randomUUID();
backgroundRemovalOperationRef.current = operationId;

const operationLayerId = id;
const sourceWidth = source.width;
const sourceHeight = source.height;

const mask = await createBackgroundRemovalMask(source);

const latestTarget = latestLayersRef.current.find(layer => layer.id === operationLayerId);
const latestSource = latestTarget
  ? bitmapStoreRef.current.getCanvas(latestTarget.sourceId)
  : null;

if (
  backgroundRemovalOperationRef.current !== operationId ||
  !latestTarget ||
  latestTarget.mask ||
  !latestSource ||
  latestSource.width !== sourceWidth ||
  latestSource.height !== sourceHeight
) {
  return;
}
```

If stale, do not show the modal and do not apply/store a mask permanently.

---

## 10. Preview behavior

Only create preview after IMG.LY finishes.

Current preview creation logic can mostly stay:

```ts
const preview = cloneCanvas(source);
const previewCtx = preview.getContext('2d');

if (previewCtx) {
  previewCtx.globalCompositeOperation = 'destination-in';
  previewCtx.drawImage(mask, 0, 0, preview.width, preview.height);
  previewCtx.globalCompositeOperation = 'source-over';
}
```

But this must happen only after:

```ts
await createBackgroundRemovalMask(source)
```

has resolved.

No placeholder mask.

No later mutation.

---

## 11. Apply behavior

`handleApplyRemoveBackground` can remain mostly synchronous because it applies an already-finished mask.

Update it to:

- do nothing while `isRemovingBackground` is true,
- validate preview still exists,
- validate mask canvas still exists,
- validate target layer still has no mask,
- save history as before.

Suggested guard:

```ts
if (isRemovingBackground) return;
```

The modal should generally not be visible while loading, but this guard prevents race bugs.

---

## 12. LayersPanel props changes

Change props from:

```ts
onRemoveBackground: (id: string) => void;
```

to:

```ts
onRemoveBackground: (id: string) => void | Promise<void>;
isRemovingBackground: boolean;
removingBackgroundLayerId: string | null;
```

In the layer card:

```ts
const isRemovingThisLayer =
  isRemovingBackground && removingBackgroundLayerId === layer.id;
```

Disable the Remove Background button:

```tsx
<button
  disabled={isRemovingBackground}
>
  {isRemovingThisLayer ? 'Removing…' : 'Remove Background'}
</button>
```

Use disabled styling:

```tsx
disabled:cursor-not-allowed disabled:opacity-50
```

or conditional classes consistent with the existing style.

Pass these props in both `LayersPanel` render sites inside `EditorApp.tsx`.

---

## 13. Error UI

Use existing `uploadError` if minimal change is preferred.

Better approach:

- keep upload errors for upload/project errors,
- keep `backgroundRemovalError` for model failures,
- render both as alert messages if present.

Recommended user-facing errors:

```text
Remove background failed: AI model could not process this image.
```

For missing source pixels:

```text
Remove background failed: layer pixels are missing.
```

For existing mask:

```text
Remove background creates a mask. Delete the current mask first.
```

---

## 14. Tests

Add or update tests under:

```text
src/utils/backgroundRemoval.test.ts
```

Use Vitest.

### Test 1: returns a promise

Verify the exported IMG.LY utility is async:

```ts
await expect(createBackgroundRemovalMask(source, testOptions)).resolves.toBeDefined();
```

### Test 2: mask dimensions match source

Given a source canvas of `2x2`, mocked IMG.LY output should generate a `2x2` mask.

Expected:

```ts
expect(mask.width).toBe(2);
expect(mask.height).toBe(2);
```

### Test 3: mask alpha comes from cutout alpha

Mock returned cutout alpha:

```text
[0, 128, 255, 64]
```

Expected mask alpha should match exactly.

### Test 4: IMG.LY errors reject

If mocked `removeBackground` rejects, the utility should reject.

It should not return a heuristic mask.

### Testability suggestion

To avoid brittle module mocking, structure utility with an internal dependency injection point:

```ts
type RemoveBackgroundFn = typeof imglyRemoveBackground;

export async function createBackgroundRemovalMask(
  source: HTMLCanvasElement,
  options: ImglyBackgroundRemovalOptions = {},
  removeBackgroundFn: RemoveBackgroundFn = imglyRemoveBackground
): Promise<HTMLCanvasElement> {
  ...
}
```

If public API cleanliness matters, make this a private helper and test that helper.

---

## 15. Build and validation commands

Run:

```bash
npm install
npm run lint
```

Then run:

```bash
npm run build
npm run test
```

Also run:

```bash
npm run check
```

If any command fails, fix before opening the PR.

---

## 16. Manual browser QA

Test these cases manually:

1. Simple product/object on plain background.
2. Person or animal on complex background.
3. Already-transparent PNG.
4. Image layer with existing mask.
5. Drawing layer with visible pixels.
6. Blank drawing layer.
7. Cancel preview.
8. Apply preview.
9. Undo after apply.
10. Redo after undo.
11. Delete layer while IMG.LY is running.
12. Switch active layer while IMG.LY is running.
13. Upload/open another project while IMG.LY is running.
14. Very large image near the app’s current limit.

Expected behavior:

- loading state appears,
- Remove Background is disabled while running,
- Apply is unavailable until preview exists,
- preview appears only after IMG.LY finishes,
- no blank page,
- no import error,
- no full-image removal unless IMG.LY itself returns a fully transparent cutout,
- failure shows a clear error.

---

## 17. Licensing and dependency review before merge

Treat IMG.LY as experimental/personal-project code for now.

No need to contact IMG.LY before implementing this branch.

If this app later becomes a real public/commercial product, revisit IMG.LY licensing before shipping seriously.

PR should include:

```text
Dependency/licensing note:
This PR adds/uses @imgly/background-removal for browser-side AI background removal.
For now this is treated as experimental/personal-project code. Revisit licensing if the app becomes a real public/commercial product.
```

Also document asset-loading behavior:

- IMG.LY’s default config uses a public path for model/wasm assets.
- If the app needs fully self-contained or offline behavior, configure and host those assets explicitly.

---

## 18. Expected changed files

Expected files to modify:

```text
src/utils/backgroundRemoval.ts
src/EditorApp.tsx
src/components/LayersPanel.tsx
src/utils/backgroundRemoval.test.ts
package-lock.json
```

Possibly modified:

```text
package.json
```

Only modify `package.json` if dependency versions need correction after `npm install`.

---

## 19. Suggested PR title

```text
Implement async IMG.LY background removal mask workflow
```

---

## 20. Suggested PR checklist

```md
## Summary

- Replaces synchronous heuristic background-removal flow with async IMG.LY workflow.
- Builds layer mask from IMG.LY cutout PNG alpha channel.
- Adds loading/error state.
- Disables Remove Background / Apply while processing.
- Keeps heuristic fallback explicit and separate.

## Validation

- [ ] npm install
- [ ] npm run lint
- [ ] npm run build
- [ ] npm run test
- [ ] npm run check
- [ ] Manual browser test: simple background
- [ ] Manual browser test: complex background
- [ ] Manual browser test: cancel/apply/undo/redo
- [ ] Manual browser test: stale async operation

## Dependency / licensing

- [ ] Treat `@imgly/background-removal` as experimental/personal-project code for now.
- [ ] Revisit licensing only if the app becomes a real public/commercial product.
- [ ] Confirm model/wasm asset loading path is acceptable for deployment.
```

---

## 21. Implementation order

Recommended order:

1. Create branch.
2. Run `npm install`.
3. Refactor utility into explicit async IMG.LY path plus explicit heuristic fallback.
4. Add unit tests for utility behavior.
5. Convert `EditorApp.tsx` handler to async.
6. Add loading/error state in `EditorApp.tsx`.
7. Pass loading props into both `LayersPanel` instances.
8. Disable Remove Background and Apply buttons during processing.
9. Run lint/test/build/check.
10. Manual QA.
11. Open PR with licensing note.
