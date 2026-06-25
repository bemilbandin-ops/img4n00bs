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
      icon: <MousePointer className="w-4 h-4" />,
      active: activeTool === 'move'
    },
    {
      id: 'brush' as ToolType,
      label: 'Brush',
      icon: <Paintbrush className="w-4 h-4" />,
      active: activeTool === 'brush'
    },
    {
      id: 'eraser' as ToolType,
      label: 'Erase',
      icon: <Eraser className="w-4 h-4" />,
      active: activeTool === 'eraser'
    },
    {
      id: 'healingBrush' as ToolType,
      label: 'Heal',
      icon: <Sparkles className="w-4 h-4" />,
      active: activeTool === 'healingBrush'
    },
    {
      id: 'cloneStamp' as ToolType,
      label: 'Clone',
      icon: <Stamp className="w-4 h-4" />,
      active: activeTool === 'cloneStamp'
    },
    {
      id: 'text' as ToolType,
      label: 'Text',
      icon: <Type className="w-4 h-4" />,
      active: activeTool === 'text'
    },
    {
      id: 'shape' as ToolType,
      label: 'Shape',
      icon: <Square className="w-4 h-4" />,
      active: activeTool === 'shape'
    },
    {
      id: 'crop' as ToolType,
      label: 'Crop',
      icon: <Crop className="w-4 h-4" />,
      active: activeTool === 'crop'
    },
    {
      id: 'select_rect' as ToolType,
      label: 'Select',
      icon: <Scissors className="w-4 h-4" />,
      active: isSelectionActive
    },
    {
      id: 'eyedropper' as ToolType,
      label: 'Color',
      icon: <Pipette className="w-4 h-4" />,
      active: activeTool === 'eyedropper'
    }
  ];

  return (
    <div 
      className="w-[84px] h-full bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-center py-4 gap-2 shadow-xl shrink-0 z-30" 
      id="editor-tool-rail"
    >
      <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono mb-2">Tools</div>
      <div className="flex flex-col gap-2 w-full px-2 overflow-y-auto" id="tool-rail-buttons">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => {
              if (t.label === 'Select') {
                if (!isSelectionActive) {
                  onChangeTool('select_rect');
                }
              } else {
                onChangeTool(t.id);
              }
            }}
            className={`w-full aspect-square flex flex-col items-center justify-center p-1 rounded-xl transition-all border cursor-pointer select-none gap-1 ${
              t.active 
                ? 'bg-white text-black border-white shadow-lg scale-[1.03]' 
                : 'bg-zinc-900/40 text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-white hover:border-zinc-800'
            }`}
            id={`btn-select-tool-${t.id}`}
            title={t.label}
          >
            <div className={`p-1.5 rounded-lg ${t.active ? 'bg-zinc-100 text-black' : 'bg-black text-zinc-400'}`}>
              {t.icon}
            </div>
            <span className="text-[11px] font-semibold tracking-wide">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
