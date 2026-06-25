import { describe, expect, it } from 'vitest';
import {
  LARGE_EXPORT_PIXEL_WARNING,
  LARGE_IMAGE_PIXEL_WARNING,
  formatLargeCanvasWarning,
  isLargeCanvas
} from '../safeguards';

describe('save and export safeguards', () => {
  it('flags large image and export dimensions', () => {
    expect(isLargeCanvas(6000, 4000, LARGE_IMAGE_PIXEL_WARNING)).toBe(true);
    expect(isLargeCanvas(7000, 5000, LARGE_EXPORT_PIXEL_WARNING)).toBe(true);
    expect(isLargeCanvas(1000, 1000, LARGE_IMAGE_PIXEL_WARNING)).toBe(false);
  });

  it('formats a clear large canvas warning', () => {
    expect(formatLargeCanvasWarning('open', 6000, 4000)).toContain('6000 x 4000px (24 MP)');
  });
});
