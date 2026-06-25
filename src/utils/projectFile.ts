import { EditorAdjustments, EditorLayer, FilterType, LayerTransform, ShapeData, ShapeKind, TextData } from '../types';
import { BitmapStore, createCanvas } from './bitmapStore';

const PROJECT_FORMAT = 'photoshop-for-n00bs-project';
const PROJECT_VERSION = 1;

interface SavedBitmapSource {
  width: number;
  height: number;
  dataUrl: string;
}

interface SavedLayer {
  id: string;
  name: string;
  type: EditorLayer['type'];
  visible: boolean;
  opacity: number;
  sourceId: string;
  transform: LayerTransform;
  adjustments: EditorAdjustments;
  filter: FilterType;
  blendMode?: string;
  textData?: TextData;
  shapeData?: ShapeData;
  mask?: EditorLayer['mask'];
}

interface SavedProjectFile {
  format: typeof PROJECT_FORMAT;
  projectVersion: typeof PROJECT_VERSION;
  createdAt: string;
  swatches?: string[];
  canvas: {
    width: number;
    height: number;
  };
  activeLayerId: string;
  layers: SavedLayer[];
  sources: Record<string, SavedBitmapSource>;
}

export interface LoadedProject {
  canvasWidth: number;
  canvasHeight: number;
  activeLayerId: string;
  swatches: string[];
  layers: EditorLayer[];
  sources: Array<{
    sourceId: string;
    canvas: HTMLCanvasElement;
  }>;
}

const cloneLayerForSave = (layer: EditorLayer): SavedLayer => ({
  id: layer.id,
  name: layer.name,
  type: layer.type,
  visible: layer.visible,
  opacity: layer.opacity,
  sourceId: layer.sourceId,
  transform: { ...layer.transform },
  adjustments: { ...layer.adjustments },
  filter: layer.filter,
  blendMode: layer.blendMode,
  textData: layer.textData ? { ...layer.textData } : undefined,
  shapeData: layer.shapeData ? { ...layer.shapeData } : undefined,
  mask: layer.mask ? { ...layer.mask } : undefined
});

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const requireString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string') {
    throw new Error(`Invalid project file: ${fieldName} is missing.`);
  }
  return value;
};

const requireNumber = (value: unknown, fieldName: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid project file: ${fieldName} is missing.`);
  }
  return value;
};

const requireBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid project file: ${fieldName} is missing.`);
  }
  return value;
};

const readImageDataUrl = (dataUrl: string): Promise<HTMLCanvasElement> => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => {
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('The browser could not create a canvas for this project source.'));
      return;
    }
    ctx.drawImage(img, 0, 0);
    resolve(canvas);
  };
  img.onerror = () => reject(new Error('Invalid project file: a bitmap source could not be decoded.'));
  img.src = dataUrl;
});

const migrateProjectFile = (parsed: Record<string, unknown>): Record<string, unknown> => {
  if (parsed.format !== PROJECT_FORMAT) {
    throw new Error('Unsupported project file. Expected a Photoshop for n00bs .n00bs project.');
  }

  const rawVersion = parsed.projectVersion ?? parsed.version ?? PROJECT_VERSION;
  if (typeof rawVersion !== 'number' || !Number.isInteger(rawVersion)) {
    throw new Error(`Unsupported project file version ${String(rawVersion)}.`);
  }
  if (rawVersion !== PROJECT_VERSION) {
    throw new Error(`Unsupported project file version ${rawVersion}.`);
  }

  return { ...parsed, projectVersion: PROJECT_VERSION };
};

export const serializeProjectFile = (
  layers: EditorLayer[],
  bitmapStore: BitmapStore,
  canvasWidth: number,
  canvasHeight: number,
  activeLayerId: string,
  swatches: string[] = []
): string => {
  const sources: Record<string, SavedBitmapSource> = {};

  const sourceIds = new Set<string>();
  for (const layer of layers) {
    sourceIds.add(layer.sourceId);
    if (layer.mask) {
      sourceIds.add(layer.mask.bitmapId);
    }
  }

  for (const sourceId of sourceIds) {
    const canvas = bitmapStore.getCanvas(sourceId);
    if (!canvas) {
      throw new Error('Project save failed: missing bitmap source.');
    }

    sources[sourceId] = {
      width: canvas.width,
      height: canvas.height,
      dataUrl: canvas.toDataURL('image/png')
    };
  }

  const project: SavedProjectFile = {
    format: PROJECT_FORMAT,
    projectVersion: PROJECT_VERSION,
    createdAt: new Date().toISOString(),
    canvas: {
      width: canvasWidth,
      height: canvasHeight
    },
    activeLayerId,
    swatches,
    layers: layers.map(cloneLayerForSave),
    sources
  };

  return JSON.stringify(project);
};

export const readProjectSwatches = (rawText: string): string[] => {
  const parsed: unknown = JSON.parse(rawText);
  if (!isRecord(parsed) || !Array.isArray(parsed.swatches)) return [];
  return parsed.swatches.filter((color): color is string => typeof color === 'string');
};

export const deserializeProjectFile = async (rawText: string): Promise<LoadedProject> => {
  const parsed: unknown = JSON.parse(rawText);
  if (!isRecord(parsed)) {
    throw new Error('Invalid project file: root project data is not an object.');
  }

  const project = migrateProjectFile(parsed);

  if (!isRecord(project.canvas)) {
    throw new Error('Invalid project file: canvas metadata is missing.');
  }

  const canvasWidth = Math.round(requireNumber(project.canvas.width, 'canvas.width'));
  const canvasHeight = Math.round(requireNumber(project.canvas.height, 'canvas.height'));
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    throw new Error('Invalid project file: canvas dimensions must be positive.');
  }

  if (!Array.isArray(project.layers)) {
    throw new Error('Invalid project file: layers are missing.');
  }
  if (!isRecord(project.sources)) {
    throw new Error('Invalid project file: bitmap sources are missing.');
  }

  const layers: EditorLayer[] = project.layers.map((rawLayer, index) => {
    if (!isRecord(rawLayer)) {
      throw new Error(`Invalid project file: layer ${index + 1} is malformed.`);
    }

    const type = requireString(rawLayer.type, `layer ${index + 1}.type`);
    if (type !== 'image' && type !== 'drawing' && type !== 'text' && type !== 'shape') {
      throw new Error(`Invalid project file: layer ${index + 1} has an unsupported type.`);
    }

    if (!isRecord(rawLayer.transform)) {
      throw new Error(`Invalid project file: layer ${index + 1} transform is missing.`);
    }
    if (!isRecord(rawLayer.adjustments)) {
      throw new Error(`Invalid project file: layer ${index + 1} adjustments are missing.`);
    }

    const rawFilter = requireString(rawLayer.filter, `layer ${index + 1}.filter`);
    if (rawFilter !== 'none' && rawFilter !== 'blur' && rawFilter !== 'sharpen' && rawFilter !== 'grayscale' && rawFilter !== 'sepia') {
      throw new Error(`Invalid project file: layer ${index + 1} has an unsupported filter.`);
    }
    const filter: FilterType = rawFilter;

    const textData = isRecord(rawLayer.textData)
      ? {
          text: requireString(rawLayer.textData.text, `layer ${index + 1}.textData.text`),
          fontSize: requireNumber(rawLayer.textData.fontSize, `layer ${index + 1}.textData.fontSize`),
          color: requireString(rawLayer.textData.color, `layer ${index + 1}.textData.color`),
          fontFamily: requireString(rawLayer.textData.fontFamily, `layer ${index + 1}.textData.fontFamily`),
          x: requireNumber(rawLayer.textData.x, `layer ${index + 1}.textData.x`),
          y: requireNumber(rawLayer.textData.y, `layer ${index + 1}.textData.y`)
        }
      : undefined;

    const shapeKind = isRecord(rawLayer.shapeData)
      ? requireString(rawLayer.shapeData.kind, `layer ${index + 1}.shapeData.kind`)
      : undefined;
    if (shapeKind !== undefined && shapeKind !== 'rectangle' && shapeKind !== 'ellipse' && shapeKind !== 'line' && shapeKind !== 'arrow') {
      throw new Error(`Invalid project file: layer ${index + 1} has an unsupported shape kind.`);
    }
    const shapeData = isRecord(rawLayer.shapeData)
      ? {
          kind: shapeKind as ShapeKind,
          x1: requireNumber(rawLayer.shapeData.x1, `layer ${index + 1}.shapeData.x1`),
          y1: requireNumber(rawLayer.shapeData.y1, `layer ${index + 1}.shapeData.y1`),
          x2: requireNumber(rawLayer.shapeData.x2, `layer ${index + 1}.shapeData.x2`),
          y2: requireNumber(rawLayer.shapeData.y2, `layer ${index + 1}.shapeData.y2`),
          fillColor: requireString(rawLayer.shapeData.fillColor, `layer ${index + 1}.shapeData.fillColor`),
          strokeColor: requireString(rawLayer.shapeData.strokeColor, `layer ${index + 1}.shapeData.strokeColor`),
          strokeWidth: requireNumber(rawLayer.shapeData.strokeWidth, `layer ${index + 1}.shapeData.strokeWidth`),
          fillEnabled: requireBoolean(rawLayer.shapeData.fillEnabled, `layer ${index + 1}.shapeData.fillEnabled`),
          strokeEnabled: requireBoolean(rawLayer.shapeData.strokeEnabled, `layer ${index + 1}.shapeData.strokeEnabled`)
        }
      : undefined;

    const baseLayer = {
      id: requireString(rawLayer.id, `layer ${index + 1}.id`),
      name: requireString(rawLayer.name, `layer ${index + 1}.name`),
      visible: requireBoolean(rawLayer.visible, `layer ${index + 1}.visible`),
      opacity: requireNumber(rawLayer.opacity, `layer ${index + 1}.opacity`),
      sourceId: requireString(rawLayer.sourceId, `layer ${index + 1}.sourceId`),
      transform: {
        x: requireNumber(rawLayer.transform.x, `layer ${index + 1}.transform.x`),
        y: requireNumber(rawLayer.transform.y, `layer ${index + 1}.transform.y`),
        scaleX: requireNumber(rawLayer.transform.scaleX, `layer ${index + 1}.transform.scaleX`),
        scaleY: requireNumber(rawLayer.transform.scaleY, `layer ${index + 1}.transform.scaleY`),
        rotation: requireNumber(rawLayer.transform.rotation, `layer ${index + 1}.transform.rotation`)
      },
      adjustments: {
        brightness: requireNumber(rawLayer.adjustments.brightness, `layer ${index + 1}.adjustments.brightness`),
        contrast: requireNumber(rawLayer.adjustments.contrast, `layer ${index + 1}.adjustments.contrast`),
        saturation: requireNumber(rawLayer.adjustments.saturation, `layer ${index + 1}.adjustments.saturation`),
        exposure: requireNumber(rawLayer.adjustments.exposure, `layer ${index + 1}.adjustments.exposure`),
        hue: requireNumber(rawLayer.adjustments.hue, `layer ${index + 1}.adjustments.hue`),
        blur: requireNumber(rawLayer.adjustments.blur, `layer ${index + 1}.adjustments.blur`),
        vignette: requireNumber(rawLayer.adjustments.vignette, `layer ${index + 1}.adjustments.vignette`)
      },
      filter,
      blendMode: typeof rawLayer.blendMode === 'string' ? rawLayer.blendMode : undefined,
      mask: isRecord(rawLayer.mask)
        ? {
            bitmapId: requireString(rawLayer.mask.bitmapId, `layer ${index + 1}.mask.bitmapId`),
            enabled: requireBoolean(rawLayer.mask.enabled, `layer ${index + 1}.mask.enabled`),
            linked: requireBoolean(rawLayer.mask.linked, `layer ${index + 1}.mask.linked`)
          }
        : undefined
    };

    if (type === 'text') {
      if (!textData) {
        throw new Error(`Invalid project file: layer ${index + 1} is missing text data.`);
      }
      return { ...baseLayer, type, textData };
    }
    if (type === 'shape') {
      if (!shapeData) {
        throw new Error(`Invalid project file: layer ${index + 1} is missing shape data.`);
      }
      return { ...baseLayer, type, shapeData };
    }
    return { ...baseLayer, type };
  });

  const sources = await Promise.all(Object.entries(project.sources).map(async ([sourceId, rawSource]) => {
    if (!isRecord(rawSource)) {
      throw new Error(`Invalid project file: source ${sourceId} is malformed.`);
    }
    const dataUrl = requireString(rawSource.dataUrl, `source ${sourceId}.dataUrl`);
    const canvas = await readImageDataUrl(dataUrl);
    const expectedWidth = Math.round(requireNumber(rawSource.width, `source ${sourceId}.width`));
    const expectedHeight = Math.round(requireNumber(rawSource.height, `source ${sourceId}.height`));

    if (canvas.width !== expectedWidth || canvas.height !== expectedHeight) {
      throw new Error(`Invalid project file: source ${sourceId} dimensions do not match its image data.`);
    }

    return { sourceId, canvas };
  }));

  const missingSourceLayer = layers.find(layer => !sources.some(source => source.sourceId === layer.sourceId));
  if (missingSourceLayer) {
    throw new Error(`Invalid project file: layer "${missingSourceLayer.name}" is missing bitmap data.`);
  }
  const missingMaskLayer = layers.find(layer => layer.mask && !sources.some(source => source.sourceId === layer.mask?.bitmapId));
  if (missingMaskLayer) {
    throw new Error(`Invalid project file: layer "${missingMaskLayer.name}" is missing mask bitmap data.`);
  }

  const savedActiveLayerId = requireString(project.activeLayerId, 'activeLayerId');
  const activeLayerId = layers.some(layer => layer.id === savedActiveLayerId)
    ? savedActiveLayerId
    : layers[layers.length - 1]?.id ?? '';

  return {
    canvasWidth,
    canvasHeight,
    activeLayerId,
    swatches: Array.isArray(project.swatches) ? project.swatches.filter((color): color is string => typeof color === 'string') : [],
    layers,
    sources
  };
};
