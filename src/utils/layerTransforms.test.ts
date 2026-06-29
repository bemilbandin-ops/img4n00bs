import { describe, expect, it } from 'vitest';
import type { EditorLayer, LayerTransform } from '../types';
import { cropLayerTransform, getBitmapRenderTransform } from './layerTransforms';

const baseTransform: LayerTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0
};

const makeBitmapLayer = (transform: LayerTransform): EditorLayer => ({
  id: 'layer-1',
  name: 'Layer',
  type: 'image',
  visible: true,
  opacity: 1,
  sourceId: 'source-1',
  transform,
  adjustments: {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    exposure: 0,
    hue: 0,
    blur: 0,
    vignette: 0
  },
  filter: 'none'
});

describe('layer crop transforms', () => {
  it('removes crop-baked translation when rendering bitmap layers', () => {
    const cropped = cropLayerTransform(
      baseTransform,
      { width: 800, height: 600 },
      { width: 400, height: 300 },
      { x: 100, y: 50 }
    );

    expect(cropped.x).toBe(100);
    expect(cropped.y).toBe(100);
    expect(getBitmapRenderTransform(makeBitmapLayer(cropped))).toMatchObject({
      x: 0,
      y: 0
    });
  });

  it('keeps later user movement after a crop', () => {
    const cropped = cropLayerTransform(
      baseTransform,
      { width: 800, height: 600 },
      { width: 400, height: 300 },
      { x: 100, y: 50 }
    );
    const moved = {
      ...cropped,
      x: cropped.x + 25,
      y: cropped.y - 10
    };

    expect(getBitmapRenderTransform(makeBitmapLayer(moved))).toMatchObject({
      x: 25,
      y: -10
    });
  });
});
