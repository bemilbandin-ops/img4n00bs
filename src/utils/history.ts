/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BitmapHistoryAsset,
  EditorLayer,
  HistoryEntry,
  HistoryStep,
  ProjectHistoryState
} from '../types';
import { BitmapStore, createCanvas } from './bitmapStore';

const cloneLayerBase = (layer: EditorLayer) => ({
  id: layer.id,
  name: layer.name,
  visible: layer.visible,
  opacity: layer.opacity,
  sourceId: layer.sourceId,
  transform: { ...layer.transform },
  adjustments: { ...layer.adjustments },
  filter: layer.filter,
  blendMode: layer.blendMode,
  mask: layer.mask ? { ...layer.mask } : undefined
});

export const cloneLayer = (layer: EditorLayer): EditorLayer => {
  const base = cloneLayerBase(layer);
  if (layer.type === 'text') {
    return { ...base, type: 'text', textData: { ...layer.textData } };
  }
  if (layer.type === 'shape') {
    return { ...base, type: 'shape', shapeData: { ...layer.shapeData } };
  }
  return { ...base, type: layer.type };
};

export const cloneLayers = (layers: EditorLayer[]) => layers.map(cloneLayer);

export const createProjectHistoryState = (
  layers: EditorLayer[],
  canvasWidth: number,
  canvasHeight: number,
  activeLayerId: string
): ProjectHistoryState => ({
  layers: cloneLayers(layers),
  canvasWidth,
  canvasHeight,
  activeLayerId
});

export const createHistoryStep = (
  currentLayers: EditorLayer[],
  bitmapStore: BitmapStore,
  w: number,
  h: number,
  activeId: string
): HistoryStep => ({
  layers: currentLayers.map((layer) => {
    const cacheCanvas = createCanvas(w, h);
    const ctx = cacheCanvas.getContext('2d');
    let imageData: ImageData;

    if (ctx) {
      const layerCanvas = bitmapStore.getCanvas(layer.sourceId);
      if (layerCanvas) {
        ctx.drawImage(layerCanvas, 0, 0);
      }
      imageData = ctx.getImageData(0, 0, w, h);
    } else {
      imageData = new ImageData(w, h);
    }

    const maskCanvas = layer.mask ? bitmapStore.getCanvas(layer.mask.bitmapId) : undefined;
    const maskCtx = maskCanvas?.getContext('2d');

    return {
      ...cloneLayer(layer),
      imageData,
      maskImageData: maskCanvas && maskCtx
        ? maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
        : undefined
    };
  }),
  canvasWidth: w,
  canvasHeight: h,
  activeLayerId: activeId
});

export const createCheckpointEntry = (
  label: string,
  layers: EditorLayer[],
  bitmapStore: BitmapStore,
  canvasWidth: number,
  canvasHeight: number,
  activeLayerId: string
): HistoryEntry => ({
  kind: 'checkpoint',
  label,
  step: createHistoryStep(layers, bitmapStore, canvasWidth, canvasHeight, activeLayerId)
});

export const historyStepToState = (step: HistoryStep): ProjectHistoryState => ({
  layers: step.layers.map(({ imageData: _imageData, ...layer }) => cloneLayer(layer)),
  canvasWidth: step.canvasWidth,
  canvasHeight: step.canvasHeight,
  activeLayerId: step.activeLayerId
});

export const getHistoryEntryState = (entry: HistoryEntry): ProjectHistoryState => (
  entry.kind === 'checkpoint' ? historyStepToState(entry.step) : entry.command.after
);

export const captureBitmapAssets = (
  sourceIds: string[],
  bitmapStore: BitmapStore
): BitmapHistoryAsset[] => {
  const seen = new Set<string>();
  const assets: BitmapHistoryAsset[] = [];

  for (const sourceId of sourceIds) {
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);

    const sourceCanvas = bitmapStore.getCanvas(sourceId);
    const ctx = sourceCanvas?.getContext('2d');
    if (!sourceCanvas || !ctx) continue;

    assets.push({
      sourceId,
      imageData: ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height),
      width: sourceCanvas.width,
      height: sourceCanvas.height
    });
  }

  return assets;
};

export const restoreBitmapAssets = (
  assets: BitmapHistoryAsset[] | undefined,
  bitmapStore: BitmapStore
) => {
  if (!assets) return;

  for (const asset of assets) {
    const canvas = createCanvas(asset.width, asset.height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(asset.imageData, 0, 0);
    }
    bitmapStore.setCanvas(asset.sourceId, canvas);
  }
};

export const entrySummary = (entry: HistoryEntry) => ({
  kind: entry.kind,
  label: entry.label,
  canvasWidth: entry.kind === 'checkpoint' ? entry.step.canvasWidth : entry.command.after.canvasWidth,
  canvasHeight: entry.kind === 'checkpoint' ? entry.step.canvasHeight : entry.command.after.canvasHeight,
  layerCount: entry.kind === 'checkpoint' ? entry.step.layers.length : entry.command.after.layers.length
});
