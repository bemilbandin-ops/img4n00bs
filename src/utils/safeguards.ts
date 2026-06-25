export const LARGE_IMAGE_PIXEL_WARNING = 24_000_000;
export const LARGE_EXPORT_PIXEL_WARNING = 32_000_000;

export const isLargeCanvas = (width: number, height: number, threshold: number) => (
  Number.isFinite(width) &&
  Number.isFinite(height) &&
  Math.max(0, Math.round(width)) * Math.max(0, Math.round(height)) >= threshold
);

export const formatLargeCanvasWarning = (action: string, width: number, height: number) => {
  const w = Math.round(width);
  const h = Math.round(height);
  const megapixels = Math.round((w * h) / 1_000_000);
  return `This ${action} is ${w} x ${h}px (${megapixels} MP). It may be slow or fail in this browser. Continue?`;
};
