import { describe, expect, it } from 'vitest';

import { toolbarToolGroups } from './Toolbar';

describe('toolbarToolGroups', () => {
  it('organizes every tool by beginner editing job without dropping advanced tools', () => {
    expect(toolbarToolGroups.map(group => group.title)).toEqual([
      'Clean up',
      'Add things',
      'Cut out',
      'Move'
    ]);

    expect(toolbarToolGroups.flatMap(group => group.tools.map(tool => tool.id))).toEqual([
      'healingBrush',
      'cloneStamp',
      'eraser',
      'brush',
      'text',
      'shape',
      'eyedropper',
      'crop',
      'select_rect',
      'select_ellipse',
      'select_lasso',
      'move'
    ]);
  });
});
