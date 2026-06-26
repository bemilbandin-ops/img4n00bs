/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  MousePointer, 
  Paintbrush, 
  Eraser, 
  Sparkles, 
  Stamp, 
  Type, 
  Square, 
  Crop, 
  Pipette,
  Scissors
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolRailProps {
  activeTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
}

export default function ToolRail({ activeTool, onChangeTool }: ToolRailProps) {
  const isSelectionActive = ['select_rect', 'select_ellipse', 'select_lasso'].includes(activeTool);

  const tools = [
    {
      id: 'move' as ToolType,
      label: 'Move',
      title: 'Move',
      icon: <MousePointer className="w-4 h-4" />,
      active: activeTool === 'move'
    },
    {
      id: 'brush' as ToolType,
      label: 'Brush',
      title: 'Brush',
      icon: <Paintbrush className="w-4 h-4" />,
      active: activeTool === 'brush'
    },
    {
      id: 'eraser' as ToolType,
      label: 'Erase',
      title: 'Erase',
      icon: <Eraser className="w-4 h-4" />,
      active: activeTool === 'eraser'
    },
    {
      id: 'healingBrush' as ToolType,
      label: 'Heal',
      title: 'Heal',
      icon: <Sparkles className="w-4 h-4" />,
      active: activeTool === 'healingBrush'
    },
    {
      id: 'cloneStamp' as ToolType,
      label: 'Copy',
      title: 'Copy from nearby / Clone',
      icon: <Stamp className="w-4 h-4" />,
      active: activeTool === 'cloneStamp'
    },
    {
      id: 'text' as ToolType,
      label: 'Text',
      title: 'Text',
      icon: <Type className="w-4 h-4" />,
      active: activeTool === 'text'
    },
    {
      id: 'shape' as ToolType,
      label: 'Shape',
      title: 'Shape',
      icon: <Square className="w-4 h-4" />,
      active: activeTool === 'shape'
    },
    {
      id: 'crop' as ToolType,
      label: 'Crop',
      title: 'Crop',
      icon: <Crop className="w-4 h-4" />,
      active: activeTool === 'crop'
    },
    {
      id: 'select_rect' as ToolType,
      label: 'Pick',
      title: 'Pick an area / Selection',
      icon: <Scissors className="w-4 h-4" />,
      active: isSelectionActive
    },
    {
      id: 'eyedropper' as ToolType,
      label: 'Color',
      title: 'Pick Color / Eyedropper',
      icon: <Pipette className="w-4 h-4" />,
      active: activeTool === 'eyedropper'
    }
  ];

  return (
    <div 
      className="ui-panel w-[92px] h-full border rounded-2xl flex flex-col items-center py-4 gap-3 shadow-xl shrink-0 z-30" 
      id="editor-tool-rail"
    >
      <div className="text-xs uppercase font-bold text-text-secondary tracking-wider font-mono mb-1">Tools</div>
      <div className="flex flex-col gap-2 w-full px-2 overflow-y-auto" id="tool-rail-buttons">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => {
              if (t.id === 'select_rect') {
                if (!isSelectionActive) {
                  onChangeTool('select_rect');
                }
              } else {
                onChangeTool(t.id);
              }
            }}
            className={`w-full aspect-square flex flex-col items-center justify-center p-1.5 rounded-xl transition-all border cursor-pointer select-none gap-1 ${
              t.active 
                ? 'bg-white text-black border-white shadow-lg scale-[1.03]' 
                : 'bg-zinc-900/40 text-text-secondary border-transparent hover:bg-zinc-900 hover:text-text-primary hover:border-panel-border'
            }`}
            id={`btn-select-tool-${t.id}`}
            title={t.title || t.label}
          >
            <div className={`p-1.5 rounded-lg ${t.active ? 'bg-zinc-100 text-black' : 'bg-black text-text-secondary'}`}>
              {t.icon}
            </div>
            <span className="text-xs font-semibold tracking-wide">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
