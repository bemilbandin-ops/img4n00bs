import { workflows } from './workflows';
import { exportPresets } from './exportPresets';

export type CommandActionKind = 'click' | 'workflow' | 'route' | 'export-preset';

export interface CommandAction {
  id: string;
  title: string;
  description: string;
  kind: CommandActionKind;
  keywords: string[];
  targetElementId?: string;
  workflowId?: string;
  route?: string;
  exportPresetId?: string;
}

export const commandActions: CommandAction[] = [
  ...workflows.map(workflow => ({
    id: `workflow-${workflow.id}`,
    title: workflow.beginnerTitle,
    description: workflow.description,
    kind: 'workflow' as const,
    keywords: [workflow.title, workflow.beginnerTitle, workflow.description, ...workflow.requiredFeatures],
    workflowId: workflow.id
  })),
  { id: 'open-photo', title: 'Open photo', description: 'Choose an image from your computer.', kind: 'click', targetElementId: 'btn-open-photo', keywords: ['open photo', 'upload image', 'import'] },
  { id: 'start-sample', title: 'Start sample', description: 'Open a sample project for practice.', kind: 'click', targetElementId: 'btn-start-sample', keywords: ['sample', 'practice', 'learn'] },
  { id: 'blank-canvas', title: 'Blank canvas', description: 'Start with an empty drawing canvas.', kind: 'click', targetElementId: 'btn-draw-blank', keywords: ['blank', 'draw', 'canvas'] },
  { id: 'tool-crop', title: 'Crop', description: 'Switch to the crop tool.', kind: 'click', targetElementId: 'btn-select-tool-crop', keywords: ['crop', 'trim', 'frame'] },
  { id: 'tool-text', title: 'Add text', description: 'Switch to the text tool.', kind: 'click', targetElementId: 'btn-select-tool-text', keywords: ['text', 'caption', 'words'] },
  { id: 'tool-brush', title: 'Brush', description: 'Switch to the brush tool.', kind: 'click', targetElementId: 'btn-select-tool-brush', keywords: ['brush', 'paint', 'draw'] },
  { id: 'tool-select', title: 'Pick an area', description: 'Switch to the selection tool.', kind: 'click', targetElementId: 'btn-select-tool-select_rect', keywords: ['select', 'cut out', 'mask'] },
  { id: 'resize', title: 'Resize image', description: 'Open the resize dialog.', kind: 'click', targetElementId: 'btn-topbar-resize', keywords: ['resize', 'dimensions', 'upload size'] },
  { id: 'export', title: 'Export picture', description: 'Open export settings.', kind: 'click', targetElementId: 'btn-main-export', keywords: ['export', 'download', 'png', 'jpg', 'webp'] },
  { id: 'save-project', title: 'Save editable project', description: 'Save a .n00bs project with layers.', kind: 'click', targetElementId: 'btn-save-layered-project', keywords: ['save project', 'layers', 'editable'] },
  { id: 'help-wiki', title: 'Open Help Wiki', description: 'Open goal, tool, and concept docs.', kind: 'route', route: '#/help-wiki', keywords: ['help', 'wiki', 'docs', 'learn'] },
  ...exportPresets.map(preset => ({
    id: `export-preset-${preset.id}`,
    title: `Export preset: ${preset.label}`,
    description: preset.description,
    kind: 'export-preset' as const,
    targetElementId: 'btn-main-export',
    exportPresetId: preset.id,
    keywords: [preset.label, preset.description, ...preset.keywords]
  }))
];

export const scoreCommandAction = (action: CommandAction, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 1;
  const haystack = [action.title, action.description, ...action.keywords].join(' ').toLowerCase();
  if (haystack.includes(normalizedQuery)) return 10;
  return normalizedQuery.split(/\s+/).filter(token => haystack.includes(token)).length;
};
