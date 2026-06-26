import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import '../../test/canvasMock';
import {
  createBackgroundRemovalMask,
  createHeuristicBackgroundRemovalMask,
  type RemoveBackgroundFn
} from '../backgroundRemoval';

const pixelAlpha = (canvas: HTMLCanvasElement, x: number, y: number) => (
  canvas.getContext('2d')?.getImageData(x, y, 1, 1).data[3] ?? -1
);

// ---------------------------------------------------------------------------
// Helper: build a mock removeBackground function that returns a cutout PNG
// with the specified alpha channel values.
// ---------------------------------------------------------------------------

/**
 * Creates a mock IMG.LY removeBackground function.
 * The mock returns a canvas encoded as a Blob whose alpha channel matches
 * the provided `alphas` array (row-major, one value per pixel).
 */
const makeMockRemoveBackground = (
  width: number,
  height: number,
  alphas: number[]
): RemoveBackgroundFn => {
  return async () => {
    // Build a canvas with white RGB and the specified alphas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    const imageData = new ImageData(width, height);
    for (let i = 0; i < width * height; i++) {
      const offset = i * 4;
      imageData.data[offset] = 255;
      imageData.data[offset + 1] = 255;
      imageData.data[offset + 2] = 255;
      imageData.data[offset + 3] = alphas[i] ?? 0;
    }
    ctx.putImageData(imageData, 0, 0);
    // Return a Blob-like object. In the test environment createImageBitmap
    // is not available, so we need to use a mock — but the utility uses
    // createImageBitmap which won't work in Node. We'll return the canvas
    // directly as the "blob" and mock createImageBitmap to pass it through.
    return canvas as unknown as Blob;
  };
};

// ---------------------------------------------------------------------------
// Heuristic fallback tests (original behavior)
// ---------------------------------------------------------------------------

describe('heuristic background removal', () => {
  it('hides a simple solid edge background and keeps the subject editable through a mask', () => {
    const source = document.createElement('canvas');
    source.width = 10;
    source.height = 10;
    const ctx = source.getContext('2d');
    if (!ctx) throw new Error('No test canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 10, 10);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(2, 2, 6, 6); // 36 pixels, > maxIslandArea of 16

    const mask = createHeuristicBackgroundRemovalMask(source, { featherRadius: 0 });

    expect(pixelAlpha(mask, 0, 0)).toBe(0);
    expect(pixelAlpha(mask, 5, 5)).toBe(255);
    expect(mask.getContext('2d')?.getImageData(5, 5, 1, 1).data[0]).toBe(255);
  });
});

// ---------------------------------------------------------------------------
// Async IMG.LY background removal tests
// ---------------------------------------------------------------------------

// Stub createImageBitmap globally for the Node test environment.
// The mock removeBackground returns a mock canvas (as Blob), so
// createImageBitmap just returns it unchanged for drawImage to use.
const originalCreateImageBitmap = globalThis.createImageBitmap;

describe('IMG.LY background removal', () => {
  beforeAll(() => {
    // Stub createImageBitmap: the mock removeBackground returns a mock canvas
    // (as Blob), so createImageBitmap just passes it through for drawImage.
    globalThis.createImageBitmap = (async (source: unknown) => source) as typeof createImageBitmap;
  });

  afterAll(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
  });

  it('returns a promise', async () => {
    const source = document.createElement('canvas');
    source.width = 2;
    source.height = 2;
    const mockFn = makeMockRemoveBackground(2, 2, [255, 255, 255, 255]);

    const result = createBackgroundRemovalMask(source, {}, mockFn);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeDefined();
  });

  it('mask dimensions match source', async () => {
    const source = document.createElement('canvas');
    source.width = 2;
    source.height = 2;
    const mockFn = makeMockRemoveBackground(2, 2, [255, 0, 128, 64]);

    const mask = await createBackgroundRemovalMask(source, {}, mockFn);
    expect(mask.width).toBe(2);
    expect(mask.height).toBe(2);
  });

  it('mask alpha comes from cutout alpha channel', async () => {
    const source = document.createElement('canvas');
    source.width = 2;
    source.height = 2;
    const expectedAlphas = [0, 128, 255, 64];
    const mockFn = makeMockRemoveBackground(2, 2, expectedAlphas);

    const mask = await createBackgroundRemovalMask(source, {}, mockFn);
    const ctx = mask.getContext('2d')!;
    const maskData = ctx.getImageData(0, 0, 2, 2);

    for (let i = 0; i < 4; i++) {
      const offset = i * 4;
      // RGB should be white (255)
      expect(maskData.data[offset]).toBe(255);
      expect(maskData.data[offset + 1]).toBe(255);
      expect(maskData.data[offset + 2]).toBe(255);
      // Alpha should match expected
      expect(maskData.data[offset + 3]).toBe(expectedAlphas[i]);
    }
  });

  it('rejects when IMG.LY errors — no heuristic fallback', async () => {
    const source = document.createElement('canvas');
    source.width = 2;
    source.height = 2;

    const failingFn: RemoveBackgroundFn = async () => {
      throw new Error('Model inference failed');
    };

    await expect(
      createBackgroundRemovalMask(source, {}, failingFn)
    ).rejects.toThrow('Model inference failed');
  });
});
