import { describe, expect, it } from 'vitest';
import type { BitmapEditorLayer, EditorLayer } from '../../types';
import { BitmapStore } from '../bitmapStore';
import { applySharpenToCanvas, getFilterString, renderShapeToLayer, renderTextToLayer } from '../imageFilters';
import { getDefaultTransform } from '../renderComposite';

const baseAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  hue: 0,
  blur: 0,
  vignette: 0
};

const makeLayer = (patch: Partial<BitmapEditorLayer> = {}): BitmapEditorLayer => ({
  id: 'layer',
  name: 'Layer',
  type: 'image',
  visible: true,
  opacity: 1,
  sourceId: 'src',
  transform: getDefaultTransform(),
  adjustments: baseAdjustments,
  filter: 'none',
  ...patch
});

describe('image filters and layer renderers', () => {
  it('builds CSS filter strings from adjustments and filters', () => {
    const filter = getFilterString(makeLayer({
      adjustments: { ...baseAdjustments, brightness: 10, contrast: -20, saturation: 30, hue: 45, blur: 2 },
      filter: 'sepia'
    }));

    expect(filter).toContain('brightness(110%)');
    expect(filter).toContain('contrast(80%)');
    expect(filter).toContain('saturate(130%)');
    expect(filter).toContain('hue-rotate(45deg)');
    expect(filter).toContain('blur(2px)');
    expect(filter).toContain('sepia(100%)');
  });

  it('returns none when no filter is active', () => {
    expect(getFilterString(makeLayer())).toBe('none');
  });

  it('returns a canvas from sharpen without changing dimensions', () => {
    const store = new BitmapStore();
    const canvas = store.createBlank('src', 4, 4);

    const sharpened = applySharpenToCanvas(canvas);

    expect(sharpened.width).toBe(4);
    expect(sharpened.height).toBe(4);
  });

  it('renders shape and text layers without throwing', () => {
    const store = new BitmapStore();
    store.createBlank('shape-src', 80, 60);
    store.createBlank('text-src', 80, 60);

    const shapeLayer: EditorLayer = {
      ...makeLayer({ sourceId: 'shape-src' }),
      type: 'shape',
      shapeData: {
        kind: 'rectangle',
        x1: 10,
        y1: 10,
        x2: 40,
        y2: 30,
        fillColor: '#ff0000',
        strokeColor: '#000000',
        strokeWidth: 2,
        fillEnabled: true,
        strokeEnabled: true
      }
    };
    renderShapeToLayer(shapeLayer, store);

    const textLayer: EditorLayer = {
      ...makeLayer({ sourceId: 'text-src' }),
      type: 'text',
      textData: {
        text: 'Hi',
        fontSize: 12,
        color: '#000000',
        fontFamily: 'system-ui',
        x: 20,
        y: 20
      }
    };
    renderTextToLayer(textLayer, store);

    expect(store.getCanvas('shape-src')).toBeDefined();
    expect(store.getCanvas('text-src')).toBeDefined();
  });
});
