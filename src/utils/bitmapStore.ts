import { EditorLayer } from '../types';

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function cloneCanvas(source: HTMLCanvasElement, width = source.width, height = source.height): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(source, 0, 0, width, height);
  }
  return canvas;
}

export class BitmapStore {
  private canvases = new Map<string, HTMLCanvasElement>();

  getCanvas(sourceId: string): HTMLCanvasElement | undefined {
    return this.canvases.get(sourceId);
  }

  setCanvas(sourceId: string, canvas: HTMLCanvasElement): void {
    this.canvases.set(sourceId, canvas);
  }

  createBlank(sourceId: string, width: number, height: number): HTMLCanvasElement {
    const canvas = createCanvas(width, height);
    this.setCanvas(sourceId, canvas);
    return canvas;
  }

  cloneTo(sourceId: string, newSourceId: string): HTMLCanvasElement | undefined {
    const source = this.getCanvas(sourceId);
    if (!source) return undefined;
    const canvas = cloneCanvas(source);
    this.setCanvas(newSourceId, canvas);
    return canvas;
  }

  delete(sourceId: string): void {
    this.canvases.delete(sourceId);
  }

  clear(): void {
    this.canvases.clear();
  }

  pruneToLayers(layers: Pick<EditorLayer, 'sourceId' | 'mask'>[]): void {
    const liveIds = new Set<string>();
    for (const layer of layers) {
      liveIds.add(layer.sourceId);
      if ('mask' in layer && layer.mask?.bitmapId) {
        liveIds.add(layer.mask.bitmapId);
      }
    }
    for (const sourceId of this.canvases.keys()) {
      if (!liveIds.has(sourceId)) {
        this.canvases.delete(sourceId);
      }
    }
  }

  getStats(layers: Pick<EditorLayer, 'sourceId' | 'mask'>[] = []) {
    const references: Record<string, number> = {};
    for (const layer of layers) {
      references[layer.sourceId] = (references[layer.sourceId] ?? 0) + 1;
      if ('mask' in layer && layer.mask?.bitmapId) {
        references[layer.mask.bitmapId] = (references[layer.mask.bitmapId] ?? 0) + 1;
      }
    }

    const referenced = Object.keys(references).filter((sourceId) => this.canvases.has(sourceId)).length;

    return {
      total: this.canvases.size,
      referenced,
      orphaned: this.canvases.size - referenced,
      references
    };
  }
}
