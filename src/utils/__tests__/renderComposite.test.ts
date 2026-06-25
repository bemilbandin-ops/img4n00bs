import { describe, expect, it } from 'vitest';
import type { BitmapEditorLayer } from '../../types';
import { BitmapStore } from '../bitmapStore';
import { renderComposite, getDefaultTransform, isDefaultTransform } from '../renderComposite';

const adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  hue: 0,
  blur: 0,
  vignette: 0
};

const makeLayer = (id: string, sourceId: string, patch: Partial<BitmapEditorLayer> = {}): BitmapEditorLayer => ({
  id,
  name: id,
  type: 'image',
  visible: true,
  opacity: 1,
  sourceId,
  transform: getDefaultTransform(),
  adjustments,
  filter: 'none',
  blendMode: 'source-over',
  ...patch
});

const makeSolidLayer = (store: BitmapStore, sourceId: string, color: string) => {
  const canvas = store.createBlank(sourceId, 2, 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No test canvas context');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 2, 2);
};

const firstPixel = (canvas: HTMLCanvasElement) => {
  const data = canvas.getContext('2d')?.getImageData(0, 0, 1, 1).data;
  return Array.from(data ?? []);
};

describe('renderComposite', () => {
  it('draws visible layers in stack order', () => {
    const store = new BitmapStore();
    makeSolidLayer(store, 'bottom', '#ff0000');
    makeSolidLayer(store, 'top', '#0000ff');

    const output = renderComposite({
      layers: [makeLayer('bottom-layer', 'bottom'), makeLayer('top-layer', 'top')],
      bitmapStore: store,
      width: 2,
      height: 2
    });

    expect(firstPixel(output)).toEqual([0, 0, 255, 255]);
  });

  it('skips hidden layers', () => {
    const store = new BitmapStore();
    makeSolidLayer(store, 'bottom', '#ff0000');
    makeSolidLayer(store, 'top', '#0000ff');

    const output = renderComposite({
      layers: [
        makeLayer('bottom-layer', 'bottom'),
        makeLayer('top-layer', 'top', { visible: false })
      ],
      bitmapStore: store,
      width: 2,
      height: 2
    });

    expect(firstPixel(output)).toEqual([255, 0, 0, 255]);
  });

  it('applies layer opacity during source-over compositing', () => {
    const store = new BitmapStore();
    makeSolidLayer(store, 'bottom', '#ff0000');
    makeSolidLayer(store, 'top', '#0000ff');

    const output = renderComposite({
      layers: [
        makeLayer('bottom-layer', 'bottom'),
        makeLayer('top-layer', 'top', { opacity: 0.5 })
      ],
      bitmapStore: store,
      width: 2,
      height: 2
    });

    expect(firstPixel(output)).toEqual([128, 0, 128, 255]);
  });

  it('paints an export background before layers', () => {
    const store = new BitmapStore();

    const output = renderComposite({
      layers: [],
      bitmapStore: store,
      width: 2,
      height: 2,
      background: '#ffffff'
    });

    expect(firstPixel(output)).toEqual([255, 255, 255, 255]);
  });

  it('keeps vignette clipped to the target layer pixels', () => {
    const store = new BitmapStore();
    makeSolidLayer(store, 'bottom', '#ff0000');
    store.createBlank('top', 2, 2);

    const output = renderComposite({
      layers: [
        makeLayer('bottom-layer', 'bottom'),
        makeLayer('top-layer', 'top', {
          adjustments: {
            ...adjustments,
            vignette: 100
          }
        })
      ],
      bitmapStore: store,
      width: 2,
      height: 2
    });

    expect(firstPixel(output)).toEqual([255, 0, 0, 255]);
  });

  it('identifies default transforms', () => {
    expect(isDefaultTransform(getDefaultTransform())).toBe(true);
    expect(isDefaultTransform({ ...getDefaultTransform(), x: 1 })).toBe(false);
  });
});
