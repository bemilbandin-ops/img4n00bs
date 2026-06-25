import { describe, expect, it } from 'vitest';
import type { EditorLayer, LayerTransform } from '../../types';
import {
  cropLayerTransform,
  flipLayerTransformHorizontally,
  flipLayerTransformVertically,
  canvasPointToLayerPoint,
  getDefaultLayerTransform,
  layerPointToCanvasPoint,
  offsetLayerTransform,
  remapPointBetweenCanvasCenters,
  rotateLayerTransform90,
  getLayerContentCenter,
  getLayerContentBounds
} from '../layerTransforms';

const layerSize = { width: 200, height: 100 };

describe('layerTransforms', () => {
  it('keeps points unchanged for the default transform', () => {
    const point = { x: 40, y: 25 };

    expect(layerPointToCanvasPoint(point, layerSize, getDefaultLayerTransform())).toEqual(point);
    expect(canvasPointToLayerPoint(point, layerSize, getDefaultLayerTransform())).toEqual(point);
  });

  it('round-trips points through translation, rotation, and scaling', () => {
    const transform: LayerTransform = {
      x: 30,
      y: -15,
      scaleX: 1.5,
      scaleY: 0.75,
      rotation: 35
    };
    const point = { x: 120, y: 30 };

    const canvasPoint = layerPointToCanvasPoint(point, layerSize, transform);
    const restoredPoint = canvasPointToLayerPoint(canvasPoint, layerSize, transform);

    expect(restoredPoint.x).toBeCloseTo(point.x, 6);
    expect(restoredPoint.y).toBeCloseTo(point.y, 6);
  });

  it('re-centers local points when the canvas size changes', () => {
    expect(
      remapPointBetweenCanvasCenters(
        { x: 120, y: 40 },
        { width: 200, height: 100 },
        { width: 100, height: 200 }
      )
    ).toEqual({ x: 70, y: 90 });
  });

  it('updates crop translation without discarding rotation or scale', () => {
    expect(
      cropLayerTransform(
        { x: 10, y: 15, scaleX: 2, scaleY: 3, rotation: 45 },
        { width: 200, height: 100 },
        { width: 80, height: 60 },
        { x: 25, y: 10 }
      )
    ).toEqual({ x: 45, y: 25, scaleX: 2, scaleY: 3, rotation: 45 });
  });

  it('offsets layer transforms when the canvas grows around existing artwork', () => {
    expect(
      offsetLayerTransform(
        { x: 4, y: -6, scaleX: 1.25, scaleY: 0.75, rotation: 12 },
        { width: 100, height: 100 },
        { width: 140, height: 120 },
        { x: 20, y: 10 }
      )
    ).toEqual({ x: 4, y: -6, scaleX: 1.25, scaleY: 0.75, rotation: 12 });
  });

  it('rotates and flips transforms without flattening them', () => {
    const transform: LayerTransform = { x: 8, y: -12, scaleX: 1.5, scaleY: 0.5, rotation: 30 };

    expect(rotateLayerTransform90(transform)).toEqual({ x: 12, y: 8, scaleX: 1.5, scaleY: 0.5, rotation: 120 });
    expect(flipLayerTransformHorizontally(transform)).toEqual({ x: -8, y: -12, scaleX: -1.5, scaleY: 0.5, rotation: -30 });
    expect(flipLayerTransformVertically(transform)).toEqual({ x: 8, y: 12, scaleX: 1.5, scaleY: -0.5, rotation: -30 });
  });

  it('determines layer content center for shape, text, and other layers', () => {
    const shapeLayer: EditorLayer = {
      id: 'layer1',
      name: 'Shape',
      visible: true,
      opacity: 1,
      sourceId: 'src1',
      transform: getDefaultLayerTransform(),
      adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hue: 0, blur: 0, vignette: 0 },
      filter: 'none',
      type: 'shape',
      shapeData: {
        kind: 'rectangle',
        x1: 20,
        y1: 30,
        x2: 80,
        y2: 70,
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2,
        fillEnabled: true,
        strokeEnabled: true
      }
    };
    expect(getLayerContentCenter(shapeLayer, 200, 100)).toEqual({ x: 50, y: 50 });

    const textLayer: EditorLayer = {
      id: 'layer2',
      name: 'Text',
      visible: true,
      opacity: 1,
      sourceId: 'src2',
      transform: getDefaultLayerTransform(),
      adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hue: 0, blur: 0, vignette: 0 },
      filter: 'none',
      type: 'text',
      textData: {
        text: 'hello',
        fontSize: 16,
        color: '#000000',
        fontFamily: 'sans-serif',
        x: 45,
        y: 65
      }
    };
    expect(getLayerContentCenter(textLayer, 200, 100)).toEqual({ x: 45, y: 65 });

    const imageLayer: EditorLayer = {
      id: 'layer3',
      name: 'Image',
      visible: true,
      opacity: 1,
      sourceId: 'src3',
      transform: getDefaultLayerTransform(),
      adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hue: 0, blur: 0, vignette: 0 },
      filter: 'none',
      type: 'image'
    };
    expect(getLayerContentCenter(imageLayer, 200, 100)).toEqual({ x: 100, y: 50 });
  });

  it('calculates content bounds for shape, text, and other layers', () => {
    const shapeLayer: EditorLayer = {
      id: 'layer1',
      name: 'Shape',
      visible: true,
      opacity: 1,
      sourceId: 'src1',
      transform: getDefaultLayerTransform(),
      adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hue: 0, blur: 0, vignette: 0 },
      filter: 'none',
      type: 'shape',
      shapeData: {
        kind: 'rectangle',
        x1: 20,
        y1: 30,
        x2: 80,
        y2: 70,
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 4,
        fillEnabled: true,
        strokeEnabled: true
      }
    };
    // padding = strokeWidth/2 + 8 = 2 + 8 = 10
    // xMin = 20 - 10 = 10
    // xMax = 80 + 10 = 90
    // yMin = 30 - 10 = 20
    // yMax = 70 + 10 = 80
    // width = 80, height = 60
    expect(getLayerContentBounds(shapeLayer, 200, 100)).toEqual({
      left: 10,
      top: 20,
      width: 80,
      height: 60
    });

    const textLayer: EditorLayer = {
      id: 'layer2',
      name: 'Text',
      visible: true,
      opacity: 1,
      sourceId: 'src2',
      transform: getDefaultLayerTransform(),
      adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hue: 0, blur: 0, vignette: 0 },
      filter: 'none',
      type: 'text',
      textData: {
        text: 'hello',
        fontSize: 16,
        color: '#000000',
        fontFamily: 'sans-serif',
        x: 100,
        y: 50
      }
    };
    const bounds = getLayerContentBounds(textLayer, 200, 100);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    expect(bounds.left).toBeCloseTo(100 - bounds.width / 2);
    expect(bounds.top).toBeCloseTo(50 - bounds.height / 2);

    const imageLayer: EditorLayer = {
      id: 'layer3',
      name: 'Image',
      visible: true,
      opacity: 1,
      sourceId: 'src3',
      transform: getDefaultLayerTransform(),
      adjustments: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hue: 0, blur: 0, vignette: 0 },
      filter: 'none',
      type: 'image'
    };
    expect(getLayerContentBounds(imageLayer, 200, 100)).toEqual({
      left: 0,
      top: 0,
      width: 200,
      height: 100
    });
  });

  it('applies and inverse-applies layer transforms relative to a custom center', () => {
    const transform: LayerTransform = {
      x: 10,
      y: 20,
      scaleX: 2,
      scaleY: 0.5,
      rotation: 90
    };
    const customCenter = { x: 50, y: 40 };
    const point = { x: 60, y: 50 };

    const canvasPoint = layerPointToCanvasPoint(point, layerSize, transform, customCenter);
    const restoredPoint = canvasPointToLayerPoint(canvasPoint, layerSize, transform, customCenter);

    expect(restoredPoint.x).toBeCloseTo(point.x, 6);
    expect(restoredPoint.y).toBeCloseTo(point.y, 6);
  });
});
