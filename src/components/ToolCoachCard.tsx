import { BookOpen } from 'lucide-react';
import { type ToolType } from '../types';
import { toolById } from '../data/tools';

interface ToolCoachCardProps {
  activeTool: ToolType;
}

export default function ToolCoachCard({ activeTool }: ToolCoachCardProps) {
  const tool = toolById[activeTool] ?? toolById.brush;

  return (
    <div className="ui-card border p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden" id="tool-coach-card">
      <div className="flex items-center gap-2 border-b border-panel-border pb-2.5">
        <BookOpen className="w-4 h-4 text-text-secondary shrink-0" />
        <div>
          <h3 className="ui-section-title tracking-tight">{tool.beginnerName}</h3>
          <p className="ui-helper mt-0.5">{tool.label}</p>
        </div>
      </div>
      <p className="ui-body">{tool.shortDescription}</p>
      <p className="text-xs leading-5 text-text-secondary"><span className="font-bold text-text-primary">Use when:</span> {tool.whenToUse}</p>
      <ol className="list-decimal pl-4 text-[13px] text-text-primary leading-6 space-y-1">
        {tool.steps.map(step => <li key={step}>{step}</li>)}
      </ol>
      {tool.commonMistakes[0] && (
        <div className="mt-1 ui-helper bg-black/30 p-3 rounded-lg border border-panel-border">
          <span className="font-bold text-text-primary">Common mistake:</span> {tool.commonMistakes[0]}
        </div>
      )}
    </div>
  );
}
