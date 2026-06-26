import { describe, expect, it } from 'vitest';
import { conceptTriggers, helpLevels, starterGoals, taskRecipes } from './learning';

describe('learning content', () => {
  it('defines the required beginner learning surfaces', () => {
    expect(starterGoals.map(goal => goal.id)).toEqual([
      'fix-photo',
      'cut-out',
      'add-text-shapes',
      'draw-blank',
      'open-sample'
    ]);
    expect(helpLevels.map(level => level.id)).toEqual(['tips', 'explain', 'guide']);
    expect(taskRecipes).toHaveLength(4);
    expect(conceptTriggers.secondLayer.tip).toContain('layers');
    expect(conceptTriggers.exportOpened.explain).toContain('Save Project');
  });
});
