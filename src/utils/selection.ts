/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SelectionState } from '../types';

export const getSelectionBounds = (selection: SelectionState, width: number, height: number) => {
  if (!selection.active || !selection.type) return null;

  let sx = 0;
  let sy = 0;
  let sw = 0;
  let sh = 0;

  if (selection.type === 'lasso') {
    if (selection.points.length < 3) return null;
    const xs = selection.points.map((p) => p.x);
    const ys = selection.points.map((p) => p.y);
    sx = Math.min(...xs);
    sy = Math.min(...ys);
    sw = Math.max(...xs) - sx;
    sh = Math.max(...ys) - sy;
  } else {
    if (!selection.startPoint || !selection.endPoint) return null;
    sx = Math.min(selection.startPoint.x, selection.endPoint.x);
    sy = Math.min(selection.startPoint.y, selection.endPoint.y);
    sw = Math.abs(selection.startPoint.x - selection.endPoint.x);
    sh = Math.abs(selection.startPoint.y - selection.endPoint.y);
  }

  sx = Math.max(0, Math.min(width, sx));
  sy = Math.max(0, Math.min(height, sy));
  sw = Math.max(0, Math.min(width - sx, sw));
  sh = Math.max(0, Math.min(height - sy, sh));

  if (sw < 5 || sh < 5) return null;
  return { sx, sy, sw, sh };
};

export const addSelectionPath = (
  ctx: CanvasRenderingContext2D,
  selection: SelectionState,
  offsetX = 0,
  offsetY = 0
) => {
  if (!selection.type) return false;

  ctx.beginPath();

  if (selection.type === 'rectangle') {
    if (!selection.startPoint || !selection.endPoint) return false;
    const x = Math.min(selection.startPoint.x, selection.endPoint.x) - offsetX;
    const y = Math.min(selection.startPoint.y, selection.endPoint.y) - offsetY;
    const w = Math.abs(selection.startPoint.x - selection.endPoint.x);
    const h = Math.abs(selection.startPoint.y - selection.endPoint.y);
    ctx.rect(x, y, w, h);
    return true;
  }

  if (selection.type === 'ellipse') {
    if (!selection.startPoint || !selection.endPoint) return false;
    const x = Math.min(selection.startPoint.x, selection.endPoint.x) - offsetX;
    const y = Math.min(selection.startPoint.y, selection.endPoint.y) - offsetY;
    const w = Math.abs(selection.startPoint.x - selection.endPoint.x);
    const h = Math.abs(selection.startPoint.y - selection.endPoint.y);
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    return true;
  }

  if (selection.type === 'lasso' && selection.points.length >= 3) {
    ctx.moveTo(selection.points[0].x - offsetX, selection.points[0].y - offsetY);
    for (let i = 1; i < selection.points.length; i++) {
      ctx.lineTo(selection.points[i].x - offsetX, selection.points[i].y - offsetY);
    }
    ctx.closePath();
    return true;
  }

  return false;
};

export const clearSelection = (): SelectionState => ({
  type: null,
  startPoint: null,
  endPoint: null,
  points: [],
  active: false
});
