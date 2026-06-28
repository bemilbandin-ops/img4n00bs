import { type ToolType } from '../types';

export type SkillMode = 'beginner' | 'full';

export type ToolCategory = 'Navigate' | 'Paint' | 'Clean up' | 'Create' | 'Layout' | 'Select' | 'Color';

export interface ToolMetadata {
  id: ToolType;
  label: string;
  beginnerName: string;
  category: ToolCategory;
  shortDescription: string;
  whenToUse: string;
  steps: string[];
  commonMistakes: string[];
  relatedWorkflows: string[];
  advanced: boolean;
  targetElementId: string;
  visualDemo?: string;
  aliases: string[];
}

export interface ToolGroup {
  title: ToolCategory;
  note: string;
  tools: ToolMetadata[];
}

export const toolMetadata: ToolMetadata[] = [
  {
    id: 'move',
    label: 'Move',
    beginnerName: 'Move or resize something',
    category: 'Navigate',
    shortDescription: 'Drag, scale, and rotate layers on the canvas.',
    whenToUse: 'Use Move when the right thing exists but is in the wrong place or size.',
    steps: ['Select a layer.', 'Drag it on the canvas.', 'Use corner handles to resize or the top handle to rotate.'],
    commonMistakes: ['The wrong layer is selected.', 'The layer is hidden or fully transparent.'],
    relatedWorkflows: ['add-text', 'make-meme', 'learn-basics'],
    advanced: false,
    targetElementId: 'btn-select-tool-move',
    visualDemo: '/demos/layers.svg',
    aliases: ['move', 'resize layer', 'position', 'transform']
  },
  {
    id: 'brush',
    label: 'Brush',
    beginnerName: 'Draw on the image',
    category: 'Paint',
    shortDescription: 'Paint freehand strokes on a drawing layer or mask.',
    whenToUse: 'Use Brush to draw marks, annotate a photo, or refine a mask edge.',
    steps: ['Choose Brush.', 'Pick size and color.', 'Drag on the canvas to paint.'],
    commonMistakes: ['Painting on the wrong layer.', 'Trying to paint while a text or shape layer is selected.'],
    relatedWorkflows: ['draw-on-photo', 'remove-background', 'make-sticker'],
    advanced: false,
    targetElementId: 'btn-select-tool-brush',
    visualDemo: '/demos/brush.svg',
    aliases: ['brush', 'paint', 'draw', 'markup']
  },
  {
    id: 'eraser',
    label: 'Erase',
    beginnerName: 'Erase pixels',
    category: 'Paint',
    shortDescription: 'Remove pixels from an image or drawing layer.',
    whenToUse: 'Use Erase when you want to permanently clear part of a bitmap layer.',
    steps: ['Select an image or drawing layer.', 'Choose Erase.', 'Drag over the part to remove.'],
    commonMistakes: ['Eraser cannot edit text or shape layers.', 'A mask is safer when you might need pixels back.'],
    relatedWorkflows: ['draw-on-photo', 'cut-out', 'make-sticker'],
    advanced: false,
    targetElementId: 'btn-select-tool-eraser',
    aliases: ['eraser', 'erase', 'delete pixels', 'rub out']
  },
  {
    id: 'healingBrush',
    label: 'Heal',
    beginnerName: 'Remove small spots',
    category: 'Clean up',
    shortDescription: 'Blend away small blemishes and dust.',
    whenToUse: 'Use Heal for small cleanup work where nearby texture should blend naturally.',
    steps: ['Alt-click a clean nearby area.', 'Paint over the spot.', 'Use a small brush near edges.'],
    commonMistakes: ['Forgetting to Alt-click a source first.', 'Using too large a brush on detailed edges.'],
    relatedWorkflows: ['fix-photo'],
    advanced: true,
    targetElementId: 'btn-select-tool-healingBrush',
    aliases: ['heal', 'healing', 'remove spot', 'blemish']
  },
  {
    id: 'cloneStamp',
    label: 'Copy',
    beginnerName: 'Copy clean pixels',
    category: 'Clean up',
    shortDescription: 'Copy pixels from one area to another.',
    whenToUse: 'Use Clone when you need exact pixels from another part of the same layer.',
    steps: ['Alt-click the clean source area.', 'Paint over the problem area.', 'Reset the source often.'],
    commonMistakes: ['Repeating obvious patterns.', 'Copying from a source with different lighting.'],
    relatedWorkflows: ['fix-photo'],
    advanced: true,
    targetElementId: 'btn-select-tool-cloneStamp',
    aliases: ['clone', 'stamp', 'copy pixels']
  },
  {
    id: 'text',
    label: 'Text',
    beginnerName: 'Add words',
    category: 'Create',
    shortDescription: 'Add editable text as its own layer.',
    whenToUse: 'Use Text for captions, labels, memes, headings, and annotations.',
    steps: ['Choose Text.', 'Type your words in the right panel.', 'Click Add Text or click the canvas.'],
    commonMistakes: ['Using Move when you mean to edit wording.', 'Forgetting text is on its own layer.'],
    relatedWorkflows: ['add-text', 'make-meme'],
    advanced: false,
    targetElementId: 'btn-select-tool-text',
    visualDemo: '/demos/text.svg',
    aliases: ['text', 'caption', 'words', 'meme']
  },
  {
    id: 'shape',
    label: 'Shape',
    beginnerName: 'Add a box, circle, or arrow',
    category: 'Create',
    shortDescription: 'Draw rectangles, circles, lines, and arrows.',
    whenToUse: 'Use Shape for callouts, frames, labels, or simple graphics.',
    steps: ['Choose Shape.', 'Pick shape type and colors.', 'Drag on the canvas.'],
    commonMistakes: ['Expecting shapes to erase pixels underneath.', 'Forgetting to switch back to Move to reposition.'],
    relatedWorkflows: ['draw-on-photo', 'make-meme'],
    advanced: false,
    targetElementId: 'btn-select-tool-shape',
    aliases: ['shape', 'arrow', 'rectangle', 'circle', 'line']
  },
  {
    id: 'crop',
    label: 'Crop',
    beginnerName: 'Keep only this area',
    category: 'Layout',
    shortDescription: 'Trim the canvas to a selected frame.',
    whenToUse: 'Use Crop to improve framing or remove unwanted edges.',
    steps: ['Choose Crop.', 'Adjust the crop box.', 'Click Keep This Area.'],
    commonMistakes: ['Cropping changes the whole document size.', 'Use Undo if you cropped too far.'],
    relatedWorkflows: ['fix-photo', 'resize-upload'],
    advanced: false,
    targetElementId: 'btn-select-tool-crop',
    visualDemo: '/demos/crop.svg',
    aliases: ['crop', 'trim', 'frame', 'instagram']
  },
  {
    id: 'select_rect',
    label: 'Pick',
    beginnerName: 'Select an area',
    category: 'Select',
    shortDescription: 'Pick part of the image before copying, clearing, masking, or cropping.',
    whenToUse: 'Use Select when the next edit should affect only one area.',
    steps: ['Choose Pick.', 'Drag around the area.', 'Use the selection toolbar actions.'],
    commonMistakes: ['Trying to cut before a selection exists.', 'Selecting the background instead of the object.'],
    relatedWorkflows: ['cut-out', 'make-sticker'],
    advanced: false,
    targetElementId: 'btn-select-tool-select_rect',
    visualDemo: '/demos/mask.svg',
    aliases: ['select', 'selection', 'cut out', 'mask', 'lasso']
  },
  {
    id: 'select_ellipse',
    label: 'Oval',
    beginnerName: 'Select an oval area',
    category: 'Select',
    shortDescription: 'Create an oval selection for round subjects.',
    whenToUse: 'Use Oval selection for faces, badges, circles, and round crops.',
    steps: ['Choose selection.', 'Switch to oval in tool options.', 'Drag around the area.'],
    commonMistakes: ['Using it for irregular objects where lasso is better.'],
    relatedWorkflows: ['cut-out'],
    advanced: true,
    targetElementId: 'btn-select-tool-select_rect',
    aliases: ['ellipse', 'oval', 'circle selection']
  },
  {
    id: 'select_lasso',
    label: 'Lasso',
    beginnerName: 'Trace around an object',
    category: 'Select',
    shortDescription: 'Freehand-select an irregular subject.',
    whenToUse: 'Use Lasso when the object is not rectangular or oval.',
    steps: ['Choose selection.', 'Switch to lasso in tool options.', 'Trace around the object.'],
    commonMistakes: ['Leaving gaps in the traced loop.', 'Going too fast around edges.'],
    relatedWorkflows: ['cut-out', 'make-sticker'],
    advanced: true,
    targetElementId: 'btn-select-tool-select_rect',
    aliases: ['lasso', 'freehand selection', 'trace']
  },
  {
    id: 'eyedropper',
    label: 'Color',
    beginnerName: 'Pick a color',
    category: 'Color',
    shortDescription: 'Sample a color from the canvas.',
    whenToUse: 'Use Color Pick when you want paint or text to match an existing color.',
    steps: ['Choose Color.', 'Click the canvas.', 'Use the sampled color for brush, text, or shape.'],
    commonMistakes: ['Sampling from the active layer when you expected the final composite.'],
    relatedWorkflows: ['draw-on-photo', 'add-text'],
    advanced: true,
    targetElementId: 'btn-select-tool-eyedropper',
    aliases: ['eyedropper', 'sample color', 'pick color']
  }
];

export const toolById = Object.fromEntries(toolMetadata.map(tool => [tool.id, tool])) as Record<ToolType, ToolMetadata>;

export const beginnerToolIds: ToolType[] = ['move', 'brush', 'eraser', 'text', 'shape', 'crop', 'select_rect'];

export const toolGroups: ToolGroup[] = [
  {
    title: 'Navigate',
    note: 'Move layers and understand what is selected.',
    tools: toolMetadata.filter(tool => tool.category === 'Navigate')
  },
  {
    title: 'Paint',
    note: 'Draw, erase, and refine visible pixels.',
    tools: toolMetadata.filter(tool => tool.category === 'Paint')
  },
  {
    title: 'Clean up',
    note: 'Advanced repair tools for spot cleanup.',
    tools: toolMetadata.filter(tool => tool.category === 'Clean up')
  },
  {
    title: 'Create',
    note: 'Add editable text, shapes, and graphic elements.',
    tools: toolMetadata.filter(tool => tool.category === 'Create')
  },
  {
    title: 'Layout',
    note: 'Frame and size the final picture.',
    tools: toolMetadata.filter(tool => tool.category === 'Layout')
  },
  {
    title: 'Select',
    note: 'Pick one area before cutting, clearing, masking, or copying.',
    tools: toolMetadata.filter(tool => tool.category === 'Select')
  },
  {
    title: 'Color',
    note: 'Sample colors from the image.',
    tools: toolMetadata.filter(tool => tool.category === 'Color')
  }
];

export const getStoredSkillMode = (): SkillMode => {
  if (typeof localStorage === 'undefined') return 'beginner';
  return localStorage.getItem('editor_skill_mode_v1') === 'full' ? 'full' : 'beginner';
};

export const setStoredSkillMode = (mode: SkillMode) => {
  localStorage.setItem('editor_skill_mode_v1', mode);
  window.dispatchEvent(new CustomEvent<SkillMode>('editor-skill-mode-changed', { detail: mode }));
};
