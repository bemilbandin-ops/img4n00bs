/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EditorLayer, ShapeData, TextData } from '../types';
import { BitmapStore } from './bitmapStore';

/**
 * Applies a 3x3 sharpen kernel to a canvas's ImageData.
 */
export function applySharpenToCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = canvas.width;
  resultCanvas.height = canvas.height;
  
  const ctx = resultCanvas.getContext('2d');
  const srcCtx = canvas.getContext('2d');
  if (!ctx || !srcCtx) return canvas;
  
  ctx.drawImage(canvas, 0, 0);
  
  const width = canvas.width;
  const height = canvas.height;
  if (width < 3 || height < 3) return resultCanvas;
  
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const original = new Uint8ClampedArray(data);
    
    const weights = [
       0, -1,  0,
      -1,  5, -1,
       0, -1,  0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const dstIdx = (y * width + x) * 4;
        let r = 0, g = 0, b = 0;
        
        for (let cy = 0; cy < 3; cy++) {
          for (let cx = 0; cx < 3; cx++) {
            const scy = y + cy - 1;
            const scx = x + cx - 1;
            const srcIdx = (scy * width + scx) * 4;
            const w = weights[cy * 3 + cx];
            
            r += original[srcIdx] * w;
            g += original[srcIdx + 1] * w;
            b += original[srcIdx + 2] * w;
          }
        }
        
        data[dstIdx] = Math.min(255, Math.max(0, r));
        data[dstIdx + 1] = Math.min(255, Math.max(0, g));
        data[dstIdx + 2] = Math.min(255, Math.max(0, b));
        data[dstIdx + 3] = original[dstIdx + 3];
      }
    }
    
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    console.error('Failed to run pixel-level sharpen filter:', e);
  }
  
  return resultCanvas;
}


const normalizeShapeBounds = (shapeData: ShapeData) => ({
  x: Math.min(shapeData.x1, shapeData.x2),
  y: Math.min(shapeData.y1, shapeData.y2),
  w: Math.abs(shapeData.x2 - shapeData.x1),
  h: Math.abs(shapeData.y2 - shapeData.y1)
});

const drawArrowHead = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  strokeWidth: number
) => {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headLength = Math.max(12, strokeWidth * 4);

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
};

export function renderShapeToCanvas(canvas: HTMLCanvasElement, shapeData: ShapeData) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, shapeData.strokeWidth);
  ctx.strokeStyle = shapeData.strokeColor;
  ctx.fillStyle = shapeData.fillColor;

  if (shapeData.kind === 'line' || shapeData.kind === 'arrow') {
    if (!shapeData.strokeEnabled) {
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(shapeData.x1, shapeData.y1);
    ctx.lineTo(shapeData.x2, shapeData.y2);
    ctx.stroke();

    if (shapeData.kind === 'arrow') {
      drawArrowHead(ctx, shapeData.x1, shapeData.y1, shapeData.x2, shapeData.y2, shapeData.strokeWidth);
    }
    ctx.restore();
    return;
  }

  const bounds = normalizeShapeBounds(shapeData);
  if (bounds.w < 1 || bounds.h < 1) {
    ctx.restore();
    return;
  }

  ctx.beginPath();
  if (shapeData.kind === 'ellipse') {
    ctx.ellipse(
      bounds.x + bounds.w / 2,
      bounds.y + bounds.h / 2,
      bounds.w / 2,
      bounds.h / 2,
      0,
      0,
      Math.PI * 2
    );
  } else {
    ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
  }

  if (shapeData.fillEnabled) {
    ctx.fill();
  }
  if (shapeData.strokeEnabled) {
    ctx.stroke();
  }
  ctx.restore();
}

export function renderShapeToLayer(layer: EditorLayer, bitmapStore: BitmapStore) {
  if (layer.type !== 'shape' || !layer.shapeData) return;
  const canvas = bitmapStore.getCanvas(layer.sourceId);
  if (!canvas) return;
  renderShapeToCanvas(canvas, layer.shapeData);
}

export function renderTextToCanvas(canvas: HTMLCanvasElement, textData: TextData) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const { text, fontSize, color, fontFamily, x, y } = textData;
  ctx.font = `${fontSize}px ${fontFamily}, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.2;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
}

/**
 * Redraws text pixels for a text layer held in the bitmap store.
 */
export function renderTextToLayer(layer: EditorLayer, bitmapStore: BitmapStore) {
  if (layer.type !== 'text' || !layer.textData) return;
  const canvas = bitmapStore.getCanvas(layer.sourceId);
  if (!canvas) return;
  renderTextToCanvas(canvas, layer.textData);
}

/**
 * Creates a CSS filter string for a layer based on its adjustments.
 */
export function getFilterString(layer: EditorLayer): string {
  let filterStr = '';
  
  if (layer.adjustments.brightness !== 0) {
    filterStr += `brightness(${100 + layer.adjustments.brightness}%) `;
  }
  
  if (layer.adjustments.contrast !== 0) {
    filterStr += `contrast(${100 + layer.adjustments.contrast}%) `;
  }
  
  if (layer.adjustments.saturation !== 0) {
    filterStr += `saturate(${100 + layer.adjustments.saturation}%) `;
  }
  
  if (layer.adjustments.exposure !== 0) {
    filterStr += `brightness(${100 + layer.adjustments.exposure * 1.5}%) saturate(${100 + layer.adjustments.exposure * 0.2}%) `;
  }

  if (layer.adjustments.hue && layer.adjustments.hue !== 0) {
    filterStr += `hue-rotate(${layer.adjustments.hue}deg) `;
  }

  if (layer.adjustments.blur && layer.adjustments.blur !== 0) {
    filterStr += `blur(${layer.adjustments.blur}px) `;
  }
  
  if (layer.filter === 'grayscale') {
    filterStr += 'grayscale(100%) ';
  } else if (layer.filter === 'sepia') {
    filterStr += 'sepia(100%) ';
  } else if (layer.filter === 'blur') {
    filterStr += 'blur(6px) ';
  }
  
  return filterStr.trim() || 'none';
}
