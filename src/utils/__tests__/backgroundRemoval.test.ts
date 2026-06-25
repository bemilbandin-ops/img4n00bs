import { describe, expect, it } from 'vitest';
import '../../test/canvasMock';
import { createBackgroundRemovalMask } from '../backgroundRemoval';

const pixelAlpha = (canvas: HTMLCanvasElement, x: number, y: number) => (
  canvas.getContext('2d')?.getImageData(x, y, 1, 1).data[3] ?? -1
);

describe('background removal', () => {
  it('hides a simple solid edge background and keeps the subject editable through a mask', () => {
    const source = document.createElement('canvas');
    source.width = 3;
    source.height = 3;
    const ctx = source.getContext('2d');
    if (!ctx) throw new Error('No test canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 3, 3);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(1, 1, 1, 1);

    const mask = createBackgroundRemovalMask(source, { featherRadius: 0 });

    expect(pixelAlpha(mask, 0, 0)).toBe(0);
    expect(pixelAlpha(mask, 1, 1)).toBe(255);
    expect(mask.getContext('2d')?.getImageData(1, 1, 1, 1).data[0]).toBe(255);
  });
});
