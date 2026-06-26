import { removeBackground } from '@imgly/background-removal';
import { createCanvas } from './bitmapStore';

type Rgb = [number, number, number];

type EdgeSide = 'top' | 'right' | 'bottom' | 'left';

interface Cluster {
  center: Rgb;
  count: number;
  sides: Set<EdgeSide>;
  distances: number[];
  tolerance: number;
}

export interface HeuristicBackgroundRemovalOptions {
  /** Base color tolerance for edge-connected background matching. */
  threshold?: number;
  /** Softens the generated alpha mask. */
  featherRadius?: number;
  /** Maximum edge color clusters treated as possible background. */
  clusterCount?: number;
}

/** Options for the async IMG.LY background removal path. */
export interface ImglyBackgroundRemovalOptions {
  /** Reserved for future IMG.LY config overrides. */
  provider?: 'imgly';
}

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const colorDistance = (a: Rgb, b: Rgb) => {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const lumaA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
  const lumaB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
  const dl = lumaA - lumaB;

  return Math.sqrt(
    dr * dr * 0.7 +
    dg * dg * 1.0 +
    db * db * 1.1 +
    dl * dl * 0.6
  );
};

const pixelAt = (data: Uint8ClampedArray, offset: number): Rgb => [
  data[offset],
  data[offset + 1],
  data[offset + 2]
];

const sampleEdgePixels = (image: ImageData) => {
  const { width, height, data } = image;
  const samples: Array<{ color: Rgb; side: EdgeSide }> = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 220));

  const add = (x: number, y: number, side: EdgeSide) => {
    const offset = (y * width + x) * 4;
    if (data[offset + 3] < 12) return;
    samples.push({ color: pixelAt(data, offset), side });
  };

  for (let x = 0; x < width; x += step) {
    add(x, 0, 'top');
    if (height > 1) add(x, height - 1, 'bottom');
  }
  for (let y = step; y < height - step; y += step) {
    add(0, y, 'left');
    if (width > 1) add(width - 1, y, 'right');
  }

  return samples;
};

const nearestClusterIndex = (color: Rgb, centers: Rgb[]) => {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  centers.forEach((center, index) => {
    const distance = colorDistance(color, center);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
};

const buildEdgeClusters = (
  samples: Array<{ color: Rgb; side: EdgeSide }>,
  clusterCount: number,
  baseTolerance: number
) => {
  if (samples.length === 0) return [];

  const sorted = [...samples].sort((a, b) => (
    a.color[0] + a.color[1] + a.color[2]
  ) - (
    b.color[0] + b.color[1] + b.color[2]
  ));
  const count = Math.min(clusterCount, sorted.length);
  let centers: Rgb[] = Array.from({ length: count }, (_, index) => {
    const sampleIndex = Math.round((index / Math.max(1, count - 1)) * (sorted.length - 1));
    return [...sorted[sampleIndex].color] as Rgb;
  });

  for (let iteration = 0; iteration < 8; iteration++) {
    const totals = centers.map(() => [0, 0, 0, 0]);

    for (const sample of samples) {
      const index = nearestClusterIndex(sample.color, centers);
      totals[index][0] += sample.color[0];
      totals[index][1] += sample.color[1];
      totals[index][2] += sample.color[2];
      totals[index][3] += 1;
    }

    centers = centers.map((center, index) => {
      const total = totals[index];
      if (total[3] === 0) return center;
      return [
        clampByte(total[0] / total[3]),
        clampByte(total[1] / total[3]),
        clampByte(total[2] / total[3])
      ];
    });
  }

  const clusters: Cluster[] = centers.map(center => ({
    center,
    count: 0,
    sides: new Set<EdgeSide>(),
    distances: [],
    tolerance: baseTolerance
  }));

  for (const sample of samples) {
    const index = nearestClusterIndex(sample.color, centers);
    const cluster = clusters[index];
    cluster.count += 1;
    cluster.sides.add(sample.side);
    cluster.distances.push(colorDistance(sample.color, cluster.center));
  }

  const minimumEdgeShare = Math.max(8, samples.length * 0.035);
  return clusters
    .filter(cluster => cluster.count >= minimumEdgeShare || cluster.sides.size >= 3)
    .map(cluster => {
      const mean = cluster.distances.reduce((sum, value) => sum + value, 0) / Math.max(1, cluster.distances.length);
      const variance = cluster.distances.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, cluster.distances.length);
      cluster.tolerance = Math.max(baseTolerance, Math.min(96, mean + Math.sqrt(variance) * 2.4 + 18));
      return cluster;
    })
    .sort((a, b) => b.count - a.count);
};

const findMatchingCluster = (color: Rgb, clusters: Cluster[]) => {
  let best: Cluster | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const cluster of clusters) {
    const distance = colorDistance(color, cluster.center);
    if (distance <= cluster.tolerance && distance < bestDistance) {
      best = cluster;
      bestDistance = distance;
    }
  }

  return best;
};

const blurAlpha = (alpha: Uint8ClampedArray, width: number, height: number, radius: number) => {
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

const softenBackgroundEdge = (alpha: Uint8ClampedArray, width: number, height: number) => {
  const next = new Uint8ClampedArray(alpha);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      if (alpha[index] !== 255) continue;

      const touchesRemoved =
        alpha[index - 1] === 0 ||
        alpha[index + 1] === 0 ||
        alpha[index - width] === 0 ||
        alpha[index + width] === 0;

      if (touchesRemoved) {
        next[index] = 210;
      }
    }
  }

  return next;
};

const fillTinyForegroundIslands = (alpha: Uint8ClampedArray, width: number, height: number) => {
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  const maxIslandArea = Math.max(16, Math.round(width * height * 0.00035));

  for (let start = 0; start < alpha.length; start++) {
    if (visited[start] || alpha[start] < 255) continue;

    queue.length = 0;
    const component: number[] = [];
    visited[start] = 1;
    queue.push(start);
    let touchesEdge = false;

    for (let cursor = 0; cursor < queue.length; cursor++) {
      const index = queue[cursor];
      component.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      touchesEdge ||= x === 0 || y === 0 || x === width - 1 || y === height - 1;

      const neighbors = [index - 1, index + 1, index - width, index + width];
      for (const next of neighbors) {
        if (next < 0 || next >= alpha.length || visited[next] || alpha[next] < 255) continue;
        const nx = next % width;
        const ny = Math.floor(next / width);
        if (Math.abs(nx - x) + Math.abs(ny - y) !== 1) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }

    if (!touchesEdge && component.length <= maxIslandArea) {
      for (const index of component) {
        alpha[index] = 0;
      }
    }
  }

  return alpha;
};

// ---------------------------------------------------------------------------
// Canvas ↔ Blob helpers (no DOM queries — pure canvas API)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Async IMG.LY AI background removal
// ---------------------------------------------------------------------------

/** Signature matching the IMG.LY `removeBackground` function for DI in tests. */
export type RemoveBackgroundFn = (image: Blob, config?: { output?: { format?: string } }) => Promise<Blob>;

/**
 * Creates a white-RGB mask canvas whose alpha channel represents the
 * foreground detected by the IMG.LY AI model.
 *
 * The returned Promise resolves to a canvas of the same dimensions as `source`.
 * Errors from the IMG.LY model propagate — no silent heuristic fallback.
 *
 * @param removeBackgroundFn  Injectable for tests; defaults to the real IMG.LY export.
 */
export async function createBackgroundRemovalMask(
  source: HTMLCanvasElement,
  _options: ImglyBackgroundRemovalOptions = {},
  removeBackgroundFn: RemoveBackgroundFn = removeBackground as RemoveBackgroundFn
): Promise<HTMLCanvasElement> {
  const { width, height } = source;
  if (width === 0 || height === 0) {
    throw new Error('Background removal failed: source canvas has zero dimensions.');
  }

  // 1. Convert source to Blob
  const sourceBlob = await canvasToBlob(source, 'image/png');

  // 2. Run IMG.LY model
  const resultBlob = await removeBackgroundFn(sourceBlob, {
    output: { format: 'image/png' }
  });

  // 3. Decode the returned cutout PNG
  const bitmap = await createImageBitmap(resultBlob);

  // 4. Draw cutout to a temporary canvas to read pixel data
  const cutoutCanvas = createCanvas(width, height);
  const cutoutCtx = cutoutCanvas.getContext('2d');
  if (!cutoutCtx) {
    throw new Error('Background removal failed: could not create cutout canvas context.');
  }
  cutoutCtx.drawImage(bitmap, 0, 0, width, height);

  // 5. Extract alpha channel from cutout and build a white mask
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

  // 6. Write mask and return
  const mask = createCanvas(width, height);
  const maskCtx = mask.getContext('2d');
  if (!maskCtx) {
    throw new Error('Background removal failed: could not create mask canvas context.');
  }
  maskCtx.putImageData(maskImageData, 0, 0);
  return mask;
}

// ---------------------------------------------------------------------------
// Synchronous heuristic fallback (explicit, never called automatically)
// ---------------------------------------------------------------------------

/**
 * Creates a background-removal mask using edge-color heuristics.
 * This is the original synchronous implementation — kept as an explicit
 * fallback that the caller must choose deliberately.
 */
export function createHeuristicBackgroundRemovalMask(
  source: HTMLCanvasElement,
  { threshold = 42, featherRadius = 1, clusterCount = 7 }: HeuristicBackgroundRemovalOptions = {}
) {
  const mask = createCanvas(source.width, source.height);
  const sourceCtx = source.getContext('2d');
  const maskCtx = mask.getContext('2d');
  if (!sourceCtx || !maskCtx || source.width === 0 || source.height === 0) return mask;

  const image = sourceCtx.getImageData(0, 0, source.width, source.height);
  const { width, height, data } = image;
  const edgeSamples = sampleEdgePixels(image);
  const clusters = buildEdgeClusters(edgeSamples, clusterCount, threshold);
  const removed = new Uint8Array(width * height);
  const queue: number[] = [];

  const enqueue = (x: number, y: number) => {
    const index = y * width + x;
    if (removed[index]) return;
    const offset = index * 4;

    if (data[offset + 3] < 12) {
      removed[index] = 1;
      queue.push(index);
      return;
    }

    if (findMatchingCluster(pixelAt(data, offset), clusters)) {
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

  alpha = fillTinyForegroundIslands(alpha, width, height);
  alpha = softenBackgroundEdge(alpha, width, height);
  alpha = blurAlpha(alpha, width, height, Math.max(0, Math.round(featherRadius)));

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
