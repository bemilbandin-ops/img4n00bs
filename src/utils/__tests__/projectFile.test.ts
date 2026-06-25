import { describe, expect, it, vi } from 'vitest';
import '../../test/canvasMock';
import type { BitmapEditorLayer } from '../../types';
import { BitmapStore } from '../bitmapStore';
import { deserializeProjectFile, serializeProjectFile } from '../projectFile';
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
  ...patch
});

describe('projectFile', () => {
  it('saves swatches and mask bitmap references', () => {
    const store = new BitmapStore();
    store.createBlank('src-1', 2, 2);
    store.createBlank('mask-1', 2, 2);

    const raw = serializeProjectFile(
      [makeLayer({ mask: { bitmapId: 'mask-1', enabled: true, linked: true } })],
      store,
      2,
      2,
      'layer-1',
      ['#ff0000']
    );
    const parsed = JSON.parse(raw);

    expect(parsed.projectVersion).toBe(1);
    expect(parsed.version).toBeUndefined();
    expect(parsed.swatches).toEqual(['#ff0000']);
    expect(parsed.layers[0].mask.bitmapId).toBe('mask-1');
    expect(parsed.sources['mask-1']).toBeDefined();
  });

  it('migrates legacy project files without projectVersion', async () => {
    const raw = JSON.stringify({
      format: 'photoshop-for-n00bs-project',
      version: 1,
      createdAt: new Date().toISOString(),
      swatches: ['#123456'],
      canvas: { width: 2, height: 3 },
      activeLayerId: '',
      layers: [],
      sources: {}
    });

    const project = await deserializeProjectFile(raw);

    expect(project.canvasWidth).toBe(2);
    expect(project.canvasHeight).toBe(3);
    expect(project.swatches).toEqual(['#123456']);
  });

  it('rejects unsupported project versions clearly', async () => {
    const raw = JSON.stringify({
      format: 'photoshop-for-n00bs-project',
      projectVersion: 99,
      createdAt: new Date().toISOString(),
      canvas: { width: 1, height: 1 },
      activeLayerId: '',
      layers: [],
      sources: {}
    });

    await expect(deserializeProjectFile(raw)).rejects.toThrow('Unsupported project file version 99');
  });

  it('rejects a project layer that references missing mask data', async () => {
    vi.stubGlobal('Image', class {
      width = 1;
      height = 1;
      onload: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    });

    const raw = JSON.stringify({
      format: 'photoshop-for-n00bs-project',
      version: 1,
      createdAt: new Date().toISOString(),
      swatches: [],
      canvas: { width: 1, height: 1 },
      activeLayerId: 'layer-1',
      layers: [makeLayer({ mask: { bitmapId: 'missing-mask', enabled: true, linked: true } })],
      sources: {
        'src-1': { width: 1, height: 1, dataUrl: 'data:image/png;base64,test' }
      }
    });

    await expect(deserializeProjectFile(raw)).rejects.toThrow('missing mask bitmap data');
  });
});
