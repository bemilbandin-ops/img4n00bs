import { describe, expect, it } from 'vitest';
import type { BitmapEditorLayer } from '../../types';
import { BitmapStore, createCanvas } from '../bitmapStore';
import {
  captureBitmapAssets,
  createCheckpointEntry,
  createProjectHistoryState,
  entrySummary,
  getHistoryEntryState,
  restoreBitmapAssets
} from '../history';
import { getDefaultTransform } from '../renderComposite';

const adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  hue: 0,
  blur: 0,
  vignette: 0
};

const makeLayer = (patch: Partial<BitmapEditorLayer> = {}): BitmapEditorLayer => ({
  id: 'layer-1',
  name: 'Layer 1',
  type: 'image',
  visible: true,
  opacity: 1,
  sourceId: 'src-1',
  transform: getDefaultTransform(),
  adjustments,
  filter: 'none',
  blendMode: 'source-over',
  ...patch
});

const fillCanvas = (canvas: HTMLCanvasElement, color: string) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No test canvas context');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

describe('history utilities', () => {
  it('creates immutable semantic project states', () => {
    const sourceLayer = makeLayer({ name: 'Original' });
    const state = createProjectHistoryState([sourceLayer], 10, 20, sourceLayer.id);

    sourceLayer.name = 'Mutated later';
    sourceLayer.transform.x = 99;

    expect(state.canvasWidth).toBe(10);
    expect(state.canvasHeight).toBe(20);
    expect(state.layers[0].name).toBe('Original');
    expect(state.layers[0].transform.x).toBe(0);
  });

  it('captures checkpoint entries with pixel data for every layer', () => {
    const store = new BitmapStore();
    const canvas = store.createBlank('src-1', 2, 2);
    fillCanvas(canvas, '#ff0000');

    const entry = createCheckpointEntry('Initial checkpoint', [makeLayer()], store, 2, 2, 'layer-1');
    expect(entry.kind).toBe('checkpoint');
    if (entry.kind !== 'checkpoint') throw new Error('Expected checkpoint entry');
    const pixel = entry.step.layers[0].imageData.data.slice(0, 4);

    expect(entry.label).toBe('Initial checkpoint');
    expect(Array.from(pixel)).toEqual([255, 0, 0, 255]);
  });

  it('extracts the current state from command entries', () => {
    const before = createProjectHistoryState([makeLayer({ opacity: 1 })], 2, 2, 'layer-1');
    const after = createProjectHistoryState([makeLayer({ opacity: 0.5 })], 2, 2, 'layer-1');

    const state = getHistoryEntryState({
      kind: 'command',
      label: 'Change layer opacity',
      command: {
        type: 'layer:opacity',
        label: 'Change layer opacity',
        before,
        after
      }
    });

    expect(state.layers[0].opacity).toBe(0.5);
  });

  it('captures and restores bitmap assets for command history', () => {
    const store = new BitmapStore();
    const canvas = store.createBlank('src-1', 2, 2);
    fillCanvas(canvas, '#00ff00');

    const assets = captureBitmapAssets(['src-1'], store);
    store.clear();
    restoreBitmapAssets(assets, store);

    const restored = store.getCanvas('src-1');
    const data = restored?.getContext('2d')?.getImageData(0, 0, 1, 1).data;

    expect(assets).toHaveLength(1);
    expect(Array.from(data ?? [])).toEqual([0, 255, 0, 255]);
  });

  it('summarizes command and checkpoint entries for diagnostics', () => {
    const store = new BitmapStore();
    store.setCanvas('src-1', createCanvas(3, 4));
    const checkpoint = createCheckpointEntry('Checkpoint', [makeLayer()], store, 3, 4, 'layer-1');

    expect(entrySummary(checkpoint)).toEqual({
      kind: 'checkpoint',
      label: 'Checkpoint',
      canvasWidth: 3,
      canvasHeight: 4,
      layerCount: 1
    });
  });
});
