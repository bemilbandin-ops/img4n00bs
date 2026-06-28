/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { beginnerToolIds, getStoredSkillMode, toolMetadata, type SkillMode } from '../data/tools';

interface ToolRailProps {
  activeTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
}

const iconByTool: Record<ToolType, ReactNode> = {
  move: <MousePointer className="w-4 h-4" />,
  brush: <Paintbrush className="w-4 h-4" />,
  eraser: <Eraser className="w-4 h-4" />,
  healingBrush: <Sparkles className="w-4 h-4" />,
  cloneStamp: <Stamp className="w-4 h-4" />,
  text: <Type className="w-4 h-4" />,
  shape: <Square className="w-4 h-4" />,
  crop: <Crop className="w-4 h-4" />,
  select_rect: <Scissors className="w-4 h-4" />,
  select_ellipse: <Scissors className="w-4 h-4" />,
  select_lasso: <Scissors className="w-4 h-4" />,
  eyedropper: <Pipette className="w-4 h-4" />
};

export default function ToolRail({ activeTool, onChangeTool }: ToolRailProps) {
  const [skillMode, setSkillMode] = useState<SkillMode>(getStoredSkillMode);
  const isSelectionActive = ['select_rect', 'select_ellipse', 'select_lasso'].includes(activeTool);

  useEffect(() => {
    const handleModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<SkillMode>;
      setSkillMode(customEvent.detail === 'full' ? 'full' : 'beginner');
    };
    window.addEventListener('editor-skill-mode-changed', handleModeChange);
    return () => window.removeEventListener('editor-skill-mode-changed', handleModeChange);
  }, []);

  const tools = useMemo(() => toolMetadata.filter(tool => {
    if (tool.id === 'select_ellipse' || tool.id === 'select_lasso') return false;
    return skillMode === 'full' || beginnerToolIds.includes(tool.id);
  }), [skillMode]);

  return (
    <div
      className="ui-panel w-[92px] h-full border rounded-2xl flex flex-col items-center py-4 gap-3 shadow-xl shrink-0 z-30"
      id="editor-tool-rail"
    >
      <div className="text-xs uppercase font-bold text-text-secondary tracking-wider font-mono mb-1">Tools</div>
      <div className="flex flex-col gap-2 w-full px-2 overflow-y-auto" id="tool-rail-buttons">
        {tools.map((tool) => {
          const active = tool.id === 'select_rect' ? isSelectionActive : activeTool === tool.id;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                if (tool.id === 'select_rect') {
                  if (!isSelectionActive) onChangeTool('select_rect');
                } else {
                  onChangeTool(tool.id);
                }
              }}
              className={`w-full aspect-square flex flex-col items-center justify-center p-1.5 rounded-xl transition-all border cursor-pointer select-none gap-1 ${
                active
                  ? 'bg-white text-black border-white shadow-lg scale-[1.03]'
                  : 'bg-zinc-900/40 text-text-secondary border-transparent hover:bg-zinc-900 hover:text-text-primary hover:border-panel-border'
              }`}
              id={`btn-select-tool-${tool.id}`}
              title={tool.beginnerName}
            >
              <div className={`p-1.5 rounded-lg ${active ? 'bg-zinc-100 text-black' : 'bg-black text-text-secondary'}`}>
                {iconByTool[tool.id]}
              </div>
              <span className="text-xs font-semibold tracking-wide">{tool.label}</span>
            </button>
          );
        })}
      </div>
      <div className="px-2 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-600" id="tool-rail-skill-mode">
        {skillMode === 'full' ? 'Full tools' : 'Beginner tools'}
      </div>
    </div>
  );
}
