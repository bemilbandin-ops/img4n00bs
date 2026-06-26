/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Copy, Crop, Download, Eraser, Image as ImageIcon, Paintbrush, Save, Type, X } from 'lucide-react';
import { type EditorLayer } from '../types';

interface ContextualActionStripProps {
  hasProject: boolean;
  hasSelection: boolean;
  activeLayer?: EditorLayer;
  onPickPhoto: () => void;
  onStartSample: () => void;
  onDrawBlank: () => void;
  onChangeTool: (tool: 'crop' | 'select_rect' | 'text' | 'move') => void;
  onFillSelection: () => void;
  onClearSelection: () => void;
  onCropSelection: () => void;
  onMaskSelection: () => void;
  canMaskSelection: boolean;
  onDeselect: () => void;
  onDuplicateLayer: (id: string) => void;
  onOpenAdjust: () => void;
  onExport: () => void;
  onSaveProject: () => void;
}

export default function ContextualActionStrip({
  hasProject,
  hasSelection,
  activeLayer,
  onPickPhoto,
  onStartSample,
  onDrawBlank,
  onChangeTool,
  onFillSelection,
  onClearSelection,
  onCropSelection,
  onMaskSelection,
  canMaskSelection,
  onDeselect,
  onDuplicateLayer,
  onOpenAdjust,
  onExport,
  onSaveProject
}: ContextualActionStripProps) {
  const buttonClass = 'inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 hover:text-white transition cursor-pointer';

  let content = (
    <>
      <button type="button" onClick={onPickPhoto} className={buttonClass}><ImageIcon className="h-3.5 w-3.5" /> Open photo</button>
      <button type="button" onClick={onStartSample} className={buttonClass}>Start sample</button>
      <button type="button" onClick={onDrawBlank} className={buttonClass}><Paintbrush className="h-3.5 w-3.5" /> Draw blank</button>
    </>
  );

  if (hasProject && hasSelection) {
    content = (
      <>
        <button type="button" onClick={onFillSelection} className={buttonClass}>Fill</button>
        <button type="button" onClick={onClearSelection} className={buttonClass}><Eraser className="h-3.5 w-3.5" /> Clear</button>
        <button type="button" onClick={onCropSelection} className={buttonClass}><Crop className="h-3.5 w-3.5" /> Crop</button>
        {canMaskSelection && <button type="button" onClick={onMaskSelection} className={buttonClass}>Mask</button>}
        <button type="button" onClick={onDeselect} className={buttonClass}><X className="h-3.5 w-3.5" /> Deselect</button>
      </>
    );
  } else if (activeLayer?.type === 'text') {
    content = (
      <>
        <button type="button" onClick={() => onChangeTool('text')} className={buttonClass}><Type className="h-3.5 w-3.5" /> Edit text</button>
        <button type="button" onClick={() => onChangeTool('move')} className={buttonClass}>Change size</button>
        <button type="button" onClick={() => onDuplicateLayer(activeLayer.id)} className={buttonClass}><Copy className="h-3.5 w-3.5" /> Duplicate</button>
        <button type="button" onClick={onSaveProject} className={buttonClass}><Save className="h-3.5 w-3.5" /> Save Project</button>
      </>
    );
  } else if (activeLayer?.type === 'image' || activeLayer?.type === 'drawing') {
    content = (
      <>
        <button type="button" onClick={() => onChangeTool('crop')} className={buttonClass}><Crop className="h-3.5 w-3.5" /> Crop</button>
        <button type="button" onClick={onOpenAdjust} className={buttonClass}>Adjust</button>
        <button type="button" onClick={() => onDuplicateLayer(activeLayer.id)} className={buttonClass}><Copy className="h-3.5 w-3.5" /> Duplicate</button>
        <button type="button" onClick={onExport} className={buttonClass}><Download className="h-3.5 w-3.5" /> Export Picture</button>
      </>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-900 bg-black p-2 shadow" id="contextual-action-strip">
      {content}
    </div>
  );
}
