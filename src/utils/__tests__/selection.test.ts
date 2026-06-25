import { describe, expect, it } from 'vitest';
import type { SelectionState } from '../../types';
import { clearSelection, getSelectionBounds } from '../selection';

const inactive = clearSelection();

const rect = (start: { x: number; y: number }, end: { x: number; y: number }): SelectionState => ({
  type: 'rectangle',
  startPoint: start,
  endPoint: end,
  points: [],
  active: true
});

const lasso = (points: { x: number; y: number }[]): SelectionState => ({
  type: 'lasso',
  startPoint: null,
  endPoint: null,
  points,
  active: true
});

describe('selection utilities', () => {
  it('returns null for inactive selections', () => {
    expect(getSelectionBounds(inactive, 100, 100)).toBeNull();
  });

  it('normalizes inverted rectangle selections', () => {
    expect(getSelectionBounds(rect({ x: 80, y: 70 }, { x: 10, y: 20 }), 100, 100)).toEqual({
      sx: 10,
      sy: 20,
      sw: 70,
      sh: 50
    });
  });

  it('clamps selections to canvas limits', () => {
    expect(getSelectionBounds(rect({ x: -20, y: -5 }, { x: 120, y: 50 }), 100, 40)).toEqual({
      sx: 0,
      sy: 0,
      sw: 100,
      sh: 40
    });
  });

  it('rejects tiny selections', () => {
    expect(getSelectionBounds(rect({ x: 0, y: 0 }, { x: 3, y: 3 }), 100, 100)).toBeNull();
  });

  it('computes lasso bounds from polygon points', () => {
    expect(getSelectionBounds(lasso([{ x: 5, y: 8 }, { x: 20, y: 10 }, { x: 7, y: 40 }]), 100, 100)).toEqual({
      sx: 5,
      sy: 8,
      sw: 15,
      sh: 32
    });
  });
});
