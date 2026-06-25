import { describe, expect, it } from 'vitest';
import { readProjectSwatches } from '../projectFile';

describe('project swatches', () => {
  it('reads saved swatches from project files', () => {
    const project = JSON.stringify({
      format: 'photoshop-for-n00bs-project',
      version: 1,
      swatches: ['#ff0000', '#00ff00'],
      canvas: { width: 1, height: 1 },
      activeLayerId: '',
      layers: [],
      sources: {}
    });

    expect(readProjectSwatches(project)).toEqual(['#ff0000', '#00ff00']);
  });
});
