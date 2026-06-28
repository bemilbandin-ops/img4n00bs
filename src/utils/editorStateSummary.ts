import { type EditorLayer, type ToolType } from '../types';

export interface EditorStateSummaryInput {
  canvasWidth: number;
  canvasHeight: number;
  layers: EditorLayer[];
  activeLayerId: string;
  activeTool: ToolType;
  hasSelection: boolean;
  hasClipboard: boolean;
  exportModalOpen: boolean;
}

export interface EditorStateSummary {
  hasProject: boolean;
  hasImageLayer: boolean;
  hasTextLayer: boolean;
  hasSelection: boolean;
  activeTool: ToolType;
  activeLayerType: EditorLayer['type'] | null;
  canExport: boolean;
  canMask: boolean;
  hasClipboard: boolean;
  exportModalOpen: boolean;
}

export type EditorStatePredicate = (state: EditorStateSummary) => boolean;

export function summarizeEditorState(input: EditorStateSummaryInput): EditorStateSummary {
  const activeLayer = input.layers.find(layer => layer.id === input.activeLayerId) ?? null;
  const hasProject = input.canvasWidth > 0 && input.canvasHeight > 0 && input.layers.length > 0;
  const hasImageLayer = input.layers.some(layer => layer.type === 'image');
  const hasTextLayer = input.layers.some(layer => layer.type === 'text');

  return {
    hasProject,
    hasImageLayer,
    hasTextLayer,
    hasSelection: input.hasSelection,
    activeTool: input.activeTool,
    activeLayerType: activeLayer?.type ?? null,
    canExport: hasProject,
    canMask: Boolean(activeLayer && !activeLayer.mask && input.hasSelection),
    hasClipboard: input.hasClipboard,
    exportModalOpen: input.exportModalOpen
  };
}
