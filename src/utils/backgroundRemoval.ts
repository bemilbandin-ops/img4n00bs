import { createCanvas } from './bitmapStore';

type Rgb = [number, number, number];

export interface BackgroundRemovalOptions {
  threshold?: number;
  featherRadius?: number;
}

const colorDistance = (data: Uint8ClampedArray, offset: number, color: Rgb) => {
  const dr = data[offset] - color[0];
  const dg = data[offset + 1] - color[1];
  const db = data[offset + 2] - color[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const sampleEdgeColor = (image: ImageData): Rgb => {
  const { width, height, data } = image;
  const totals = [0, 0, 0];
  let count = 0;

  const add = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    totals[0] += data[offset];
    totals[1] += data[offset + 1];
    totals[2] += data[offset + 2];
    count++;
  };

  for (let x = 0; x < width; x++) {
    add(x, 0);
    if (height > 1) add(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    add(0, y);
    if (width > 1) add(width - 1, y);
  }

  return totals.map(value => Math.round(value / Math.max(1, count))) as Rgb;
};

const feather = (alpha: Uint8ClampedArray, width: number, height: number, radius: number) => {
  if (radius <= 0) return alpha;
  const next = new Uint8ClampedArray(alpha);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let total = 0;
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px < 0 || py < 0 || px >= width || py >= height) continue;
          total += alpha[py * width + px];
          count++;
        }
      }
      next[y * width + x] = Math.round(total / count);
    }
  }

  return next;
};

export function createBackgroundRemovalMask(
  source: HTMLCanvasElement,
  { threshold = 38, featherRadius = 1 }: BackgroundRemovalOptions = {}
) {
  const mask = createCanvas(source.width, source.height);
  const sourceCtx = source.getContext('2d');
  const maskCtx = mask.getContext('2d');
  if (!sourceCtx || !maskCtx || source.width === 0 || source.height === 0) return mask;

  const image = sourceCtx.getImageData(0, 0, source.width, source.height);
  const background = sampleEdgeColor(image);
  const { width, height, data } = image;
  const removed = new Uint8Array(width * height);
  const queue: number[] = [];

  const enqueue = (x: number, y: number) => {
    const index = y * width + x;
    if (removed[index]) return;
    const offset = index * 4;
    if (data[offset + 3] === 0 || colorDistance(data, offset, background) <= threshold) {
      removed[index] = 1;
      queue.push(index);
    }
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(x - 1, y);
    if (x < width - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < height - 1) enqueue(x, y + 1);
  }

  let alpha = new Uint8ClampedArray(width * height);
  for (let i = 0; i < alpha.length; i++) {
    alpha[i] = removed[i] ? 0 : 255;
  }
  alpha = feather(alpha, width, height, Math.max(0, Math.round(featherRadius)));

  const maskImage = new ImageData(width, height);
  for (let i = 0; i < alpha.length; i++) {
    const offset = i * 4;
    maskImage.data[offset] = 255;
    maskImage.data[offset + 1] = 255;
    maskImage.data[offset + 2] = 255;
    maskImage.data[offset + 3] = alpha[i];
  }
  maskCtx.putImageData(maskImage, 0, 0);
  return mask;
}
