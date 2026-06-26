import imglyRemoveBackground from '@imgly/background-removal';

import { createCanvas } from './bitmapStore';

export interface BackgroundRemovalOptions {
  /** Simple fallback tolerance used if the model cannot run. */
  threshold?: number;
}

type Rgb = [number, number, number];

const canvasToBlob = (canvas: HTMLCanvasElement) => (
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('The browser could not encode the canvas.'));
      }
    }, 'image/png');
  })
);

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
    if (data[offset + 3] < 12) return;
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

const createFallbackMask = (
  source: HTMLCanvasElement,
  { threshold = 42 }: BackgroundRemovalOptions = {}
) => {
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
    if (data[offset + 3] < 12 || colorDistance(data, offset, background) <= threshold) {
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

  const maskImage = new ImageData(width, height);
  for (let i = 0; i < removed.length; i++) {
    const offset = i * 4;
    maskImage.data[offset] = 255;
    maskImage.data[offset + 1] = 255;
    maskImage.data[offset + 2] = 255;
    maskImage.data[offset + 3] = removed[i] ? 0 : 255;
  }
  maskCtx.putImageData(maskImage, 0, 0);
  return mask;
};

const setApplyButtonState = (label: string, disabled: boolean) => {
  const applyButton = document.getElementById('btn-apply-remove-background') as HTMLButtonElement | null;
  if (!applyButton) return;

  applyButton.disabled = disabled;
  applyButton.textContent = label;
  applyButton.classList.toggle('opacity-50', disabled);
  applyButton.classList.toggle('cursor-wait', disabled);
};

const refreshPreviewImage = (source: HTMLCanvasElement, mask: HTMLCanvasElement) => {
  const preview = createCanvas(source.width, source.height);
  const previewCtx = preview.getContext('2d');
  if (!previewCtx) return;

  previewCtx.drawImage(source, 0, 0);
  previewCtx.globalCompositeOperation = 'destination-in';
  previewCtx.drawImage(mask, 0, 0, preview.width, preview.height);
  previewCtx.globalCompositeOperation = 'source-over';

  const previewImage = document.querySelector<HTMLImageElement>('#remove-background-preview img');
  if (previewImage) {
    previewImage.src = preview.toDataURL('image/png');
  }
};

const copyCanvas = (source: HTMLCanvasElement, target: HTMLCanvasElement) => {
  const ctx = target.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, target.width, target.height);
  ctx.drawImage(source, 0, 0, target.width, target.height);
};

const createMaskFromCutout = async (
  cutoutBlob: Blob,
  width: number,
  height: number
) => {
  const cutout = await createImageBitmap(cutoutBlob);
  const cutoutCanvas = createCanvas(width, height);
  const cutoutCtx = cutoutCanvas.getContext('2d');
  const mask = createCanvas(width, height);
  const maskCtx = mask.getContext('2d');

  if (!cutoutCtx || !maskCtx) return mask;

  cutoutCtx.drawImage(cutout, 0, 0, width, height);
  cutout.close();

  const cutoutPixels = cutoutCtx.getImageData(0, 0, width, height);
  const maskImage = new ImageData(width, height);

  for (let i = 0; i < cutoutPixels.data.length; i += 4) {
    maskImage.data[i] = 255;
    maskImage.data[i + 1] = 255;
    maskImage.data[i + 2] = 255;
    maskImage.data[i + 3] = cutoutPixels.data[i + 3];
  }

  maskCtx.putImageData(maskImage, 0, 0);
  return mask;
};

const upgradeMaskWithImgly = async (source: HTMLCanvasElement, liveMask: HTMLCanvasElement) => {
  const inputBlob = await canvasToBlob(source);
  const cutoutBlob = await imglyRemoveBackground(inputBlob, {
    model: 'isnet_fp16',
    output: {
      format: 'image/png',
      quality: 0.95,
      type: 'foreground'
    }
  });
  const modelMask = await createMaskFromCutout(cutoutBlob, source.width, source.height);
  copyCanvas(modelMask, liveMask);
  refreshPreviewImage(source, liveMask);
};

/**
 * Returns a mask immediately so the existing synchronous editor flow keeps working.
 * The IMG.LY model upgrades that same mask canvas asynchronously, then refreshes the preview modal.
 */
export function createBackgroundRemovalMask(
  source: HTMLCanvasElement,
  options: BackgroundRemovalOptions = {}
) {
  const mask = createFallbackMask(source, options);

  window.requestAnimationFrame(() => {
    setApplyButtonState('Removing...', true);
  });

  void upgradeMaskWithImgly(source, mask)
    .then(() => {
      setApplyButtonState('Apply Mask', false);
    })
    .catch(error => {
      console.error('IMG.LY background removal failed. Using fallback mask.', error);
      refreshPreviewImage(source, mask);
      setApplyButtonState('Apply Fallback Mask', false);
    });

  return mask;
}
