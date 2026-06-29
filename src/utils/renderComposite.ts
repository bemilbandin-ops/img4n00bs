/**
 * Shared canvas renderer used by preview, export, selection export, and merge-like operations.
 */

import { EditorLayer, LayerTransform, Point } from '../types';
import { applySharpenToCanvas, getFilterString } from './imageFilters';
import { BitmapStore, createCanvas } from './bitmapStore';
import {
  applyLayerTransform,
  getDefaultLayerTransform,
  isDefaultLayerTransform,
  getLayerContentCenter,
  getBitmapRenderTransform
} from './layerTransforms';

export function getDefaultTransform(): LayerTransform {
  return getDefaultLayerTransform();
}

export function isDefaultTransform(transform?: LayerTransform): boolean {
  return isDefaultLayerTransform(transform);
}

function drawTransformedLayer(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  transform?: LayerTransform,
  center?: Point
) {
  ctx.save();
  applyLayerTransform(ctx, sourceCanvas, transform, center);
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.restore();
}

function createLayerEffectsCanvas(layer: EditorLayer, sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const output = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = output.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.filter = getFilterString(layer);
  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.filter = 'none';

  if (layer.adjustments.vignette > 0) {
    const alphaMask = createCanvas(output.width, output.height);
    alphaMask.getContext('2d')?.drawImage(output, 0, 0);
    const strength = layer.adjustments.vignette / 100;
    const cx = output.width / 2;
    const cy = output.height / 2;
    const innerRadius = Math.min(output.width, output.height) * 0.2;
    const outerRadius = Math.sqrt(cx * cx + cy * cy);
    const gradient = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);

    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${strength * 0.95})`);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(alphaMask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  return output;
}

function applyLayerMask(
  layer: EditorLayer,
  sourceCanvas: HTMLCanvasElement,
  bitmapStore: BitmapStore
): HTMLCanvasElement {
  if (!layer.mask?.enabled) return sourceCanvas;

  const maskCanvas = bitmapStore.getCanvas(layer.mask.bitmapId);
  if (!maskCanvas) return sourceCanvas;

  const output = createCanvas(sourceCanvas.width, sourceCanvas.height);
  const ctx = output.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height);
  ctx.globalCompositeOperation = 'source-over';
  return output;
}

interface RenderCompositeOptions {
  layers: EditorLayer[];
  bitmapStore: BitmapStore;
  width: number;
  height: number;
  targetCanvas?: HTMLCanvasElement;
  background?: string;
}

export function renderComposite({
  layers,
  bitmapStore,
  width,
  height,
  targetCanvas,
  background
}: RenderCompositeOptions): HTMLCanvasElement {
  const output = targetCanvas ?? createCanvas(width, height);
  output.width = width;
  output.height = height;

  const ctx = output.getContext('2d');
  if (!ctx) return output;

  ctx.clearRect(0, 0, width, height);

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }

  layers.forEach((layer) => {
    if (!layer.visible) return;

    const layerCanvas = bitmapStore.getCanvas(layer.sourceId);
    if (!layerCanvas) return;

    ctx.save();
    ctx.globalAlpha = layer.opacity;

    if (layer.blendMode && layer.blendMode !== 'source-over') {
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
    }

    const sourceCanvas = layer.filter === 'sharpen'
      ? applySharpenToCanvas(layerCanvas)
      : layerCanvas;
    const maskedCanvas = applyLayerMask(layer, sourceCanvas, bitmapStore);
    const effectsCanvas = createLayerEffectsCanvas(layer, maskedCanvas);

    const center = getLayerContentCenter(layer, width, height);
    drawTransformedLayer(ctx, effectsCanvas, getBitmapRenderTransform(layer), center);

    ctx.restore();
  });

  return output;
}
