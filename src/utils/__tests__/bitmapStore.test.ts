import { describe, expect, it } from 'vitest';
import { BitmapStore, cloneCanvas, createCanvas } from '../bitmapStore';

const firstPixel = (canvas: HTMLCanvasElement) => Array.from(canvas.getContext('2d')?.getImageData(0, 0, 1, 1).data ?? []);

const fill = (canvas: HTMLCanvasElement, color: string) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No test context');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

describe('BitmapStore', () => {
  it('creates and retrieves blank canvases by source id', () => {
    const store = new BitmapStore();
    const canvas = store.createBlank('src', 4, 3);

    expect(store.getCanvas('src')).toBe(canvas);
    expect(canvas.width).toBe(4);
    expect(canvas.height).toBe(3);
  });

  it('clones canvas pixels', () => {
    const source = createCanvas(2, 2);
    fill(source, '#ff0000');

    const cloned = cloneCanvas(source);
    fill(source, '#0000ff');

    expect(firstPixel(cloned)).toEqual([255, 0, 0, 255]);
    expect(firstPixel(source)).toEqual([0, 0, 255, 255]);
  });

  it('clones an existing source to a new source id', () => {
    const store = new BitmapStore();
    const source = store.createBlank('src-1', 2, 2);
    fill(source, '#00ff00');

    const clone = store.cloneTo('src-1', 'src-2');

    expect(clone).toBe(store.getCanvas('src-2'));
    expect(firstPixel(clone as HTMLCanvasElement)).toEqual([0, 255, 0, 255]);
  });

  it('prunes canvases that are no longer referenced by layers', () => {
    const store = new BitmapStore();
    store.createBlank('keep', 1, 1);
    store.createBlank('mask', 1, 1);
    store.createBlank('drop', 1, 1);

    store.pruneToLayers([{ sourceId: 'keep', mask: { bitmapId: 'mask', enabled: true, linked: true } }]);

    expect(store.getCanvas('keep')).toBeDefined();
    expect(store.getCanvas('mask')).toBeDefined();
    expect(store.getCanvas('drop')).toBeUndefined();
  });

  it('reports bitmap reference stats for cleanup diagnostics', () => {
    const store = new BitmapStore();
    store.createBlank('keep', 1, 1);
    store.createBlank('drop', 1, 1);

    expect(store.getStats([{ sourceId: 'keep' }, { sourceId: 'keep' }])).toEqual({
      total: 2,
      referenced: 1,
      orphaned: 1,
      references: {
        keep: 2
      }
    });
  });
});
