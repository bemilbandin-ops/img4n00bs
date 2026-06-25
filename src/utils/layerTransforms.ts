import type { EditorLayer, LayerTransform, Point, ShapeData } from '../types';

const DEFAULT_LAYER_TRANSFORM: LayerTransform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0
};

type LayerSize = {
  width: number;
  height: number;
};

type CanvasOffset = {
  x: number;
  y: number;
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const normalizeScale = (value: number) => (value === 0 ? 1 : value);

const getCanvasCenter = ({ width, height }: LayerSize): Point => ({
  x: width / 2,
  y: height / 2
});

export function getDefaultLayerTransform(): LayerTransform {
  return { ...DEFAULT_LAYER_TRANSFORM };
}

export function isDefaultLayerTransform(transform?: LayerTransform): boolean {
  const t = transform ?? DEFAULT_LAYER_TRANSFORM;
  return t.x === 0 && t.y === 0 && t.scaleX === 1 && t.scaleY === 1 && t.rotation === 0;
}

export function getLayerContentCenter(layer: EditorLayer, canvasWidth: number, canvasHeight: number): Point {
  if (layer.type === 'shape' && layer.shapeData) {
    return {
      x: (layer.shapeData.x1 + layer.shapeData.x2) / 2,
      y: (layer.shapeData.y1 + layer.shapeData.y2) / 2
    };
  }
  if (layer.type === 'text' && layer.textData) {
    return {
      x: layer.textData.x,
      y: layer.textData.y
    };
  }
  return {
    x: canvasWidth / 2,
    y: canvasHeight / 2
  };
}

export function getLayerContentBounds(
  layer: EditorLayer,
  canvasWidth: number,
  canvasHeight: number
): { left: number; top: number; width: number; height: number } {
  if (layer.type === 'shape' && layer.shapeData) {
    const s = layer.shapeData;
    const padding = (s.strokeWidth ?? 0) / 2 + 8;
    const xMin = Math.min(s.x1, s.x2) - padding;
    const xMax = Math.max(s.x1, s.x2) + padding;
    const yMin = Math.min(s.y1, s.y2) - padding;
    const yMax = Math.max(s.y1, s.y2) + padding;
    return {
      left: xMin,
      top: yMin,
      width: Math.max(10, xMax - xMin),
      height: Math.max(10, yMax - yMin)
    };
  }
  if (layer.type === 'text' && layer.textData) {
    const t = layer.textData;
    const lines = t.text.split('\n');
    const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
    const fontSize = t.fontSize;
    const lineHeight = fontSize * 1.2;
    const approxW = Math.max(40, longestLine * fontSize * 0.55 + 16);
    const approxH = Math.max(20, lines.length * lineHeight + 12);
    return {
      left: t.x - approxW / 2,
      top: t.y - approxH / 2,
      width: approxW,
      height: approxH
    };
  }
  return {
    left: 0,
    top: 0,
    width: canvasWidth,
    height: canvasHeight
  };
}

export function applyLayerTransform(
  ctx: CanvasRenderingContext2D,
  layerSize: LayerSize,
  transform?: LayerTransform,
  customCenter?: Point
) {
  const t = transform ?? DEFAULT_LAYER_TRANSFORM;
  const centerX = customCenter ? customCenter.x : layerSize.width / 2;
  const centerY = customCenter ? customCenter.y : layerSize.height / 2;

  ctx.translate(t.x + centerX, t.y + centerY);
  ctx.rotate(toRadians(t.rotation));
  ctx.scale(t.scaleX, t.scaleY);
  ctx.translate(-centerX, -centerY);
}

export function applyInverseLayerTransform(
  ctx: CanvasRenderingContext2D,
  layerSize: LayerSize,
  transform?: LayerTransform,
  customCenter?: Point
) {
  const t = transform ?? DEFAULT_LAYER_TRANSFORM;
  const centerX = customCenter ? customCenter.x : layerSize.width / 2;
  const centerY = customCenter ? customCenter.y : layerSize.height / 2;

  ctx.translate(centerX, centerY);
  ctx.scale(1 / normalizeScale(t.scaleX), 1 / normalizeScale(t.scaleY));
  ctx.rotate(-toRadians(t.rotation));
  ctx.translate(-(t.x + centerX), -(t.y + centerY));
}

export function layerPointToCanvasPoint(
  point: Point,
  layerSize: LayerSize,
  transform?: LayerTransform,
  customCenter?: Point
): Point {
  const t = transform ?? DEFAULT_LAYER_TRANSFORM;
  const centerX = customCenter ? customCenter.x : layerSize.width / 2;
  const centerY = customCenter ? customCenter.y : layerSize.height / 2;
  const localX = point.x - centerX;
  const localY = point.y - centerY;
  const scaledX = localX * t.scaleX;
  const scaledY = localY * t.scaleY;
  const radians = toRadians(t.rotation);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: centerX + t.x + scaledX * cos - scaledY * sin,
    y: centerY + t.y + scaledX * sin + scaledY * cos
  };
}

export function canvasPointToLayerPoint(
  point: Point,
  layerSize: LayerSize,
  transform?: LayerTransform,
  customCenter?: Point
): Point {
  const t = transform ?? DEFAULT_LAYER_TRANSFORM;
  const centerX = customCenter ? customCenter.x : layerSize.width / 2;
  const centerY = customCenter ? customCenter.y : layerSize.height / 2;
  const translatedX = point.x - (centerX + t.x);
  const translatedY = point.y - (centerY + t.y);
  const radians = -toRadians(t.rotation);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;

  return {
    x: rotatedX / normalizeScale(t.scaleX) + centerX,
    y: rotatedY / normalizeScale(t.scaleY) + centerY
  };
}

export function transformShapePoints(
  shapeData: ShapeData,
  transformPoint: (point: Point) => Point
): ShapeData {
  const start = transformPoint({ x: shapeData.x1, y: shapeData.y1 });
  const end = transformPoint({ x: shapeData.x2, y: shapeData.y2 });

  return {
    ...shapeData,
    x1: Math.round(start.x),
    y1: Math.round(start.y),
    x2: Math.round(end.x),
    y2: Math.round(end.y)
  };
}

export function remapPointBetweenCanvasCenters(
  point: Point,
  oldSize: LayerSize,
  newSize: LayerSize
): Point {
  const oldCenter = getCanvasCenter(oldSize);
  const newCenter = getCanvasCenter(newSize);

  return {
    x: point.x - oldCenter.x + newCenter.x,
    y: point.y - oldCenter.y + newCenter.y
  };
}

export function cropLayerTransform(
  transform: LayerTransform,
  oldSize: LayerSize,
  newSize: LayerSize,
  cropOrigin: CanvasOffset
): LayerTransform {
  const oldCenter = getCanvasCenter(oldSize);
  const newCenter = getCanvasCenter(newSize);

  return {
    ...transform,
    x: transform.x + oldCenter.x - cropOrigin.x - newCenter.x,
    y: transform.y + oldCenter.y - cropOrigin.y - newCenter.y
  };
}

export function offsetLayerTransform(
  transform: LayerTransform,
  oldSize: LayerSize,
  newSize: LayerSize,
  offset: CanvasOffset
): LayerTransform {
  const oldCenter = getCanvasCenter(oldSize);
  const newCenter = getCanvasCenter(newSize);

  return {
    ...transform,
    x: transform.x + oldCenter.x + offset.x - newCenter.x,
    y: transform.y + oldCenter.y + offset.y - newCenter.y
  };
}

export function rotateLayerTransform90(transform: LayerTransform): LayerTransform {
  return {
    ...transform,
    x: -transform.y,
    y: transform.x,
    rotation: transform.rotation + 90
  };
}

export function flipLayerTransformHorizontally(transform: LayerTransform): LayerTransform {
  return {
    ...transform,
    x: -transform.x,
    rotation: -transform.rotation,
    scaleX: -transform.scaleX
  };
}

export function flipLayerTransformVertically(transform: LayerTransform): LayerTransform {
  return {
    ...transform,
    y: -transform.y,
    rotation: -transform.rotation,
    scaleY: -transform.scaleY
  };
}
