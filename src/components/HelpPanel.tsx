/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { conceptHelp } from '../data/conceptHelp';
import { HelpCircle, BookOpen } from 'lucide-react';

export default function HelpPanel() {
  return (
    <div className="flex flex-col h-full bg-zinc-950/40 rounded-xl border border-zinc-900/60 p-4 overflow-y-auto" id="help-panel">
      <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3" id="help-panel-header">
        <BookOpen className="w-4 h-4 text-zinc-400" />
        <h2 className="text-sm font-bold text-white tracking-tight">Concepts & Guide</h2>
      </div>

      <div className="flex flex-col gap-4" id="help-concepts-list">
        {conceptHelp.map((concept, index) => (
          <div 
            key={index} 
            className="p-3 bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-900 rounded-xl transition-all"
            id={`help-concept-item-${index}`}
          >
            <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              {concept.title}
            </h3>
            <p className="text-xs leading-relaxed text-zinc-400 font-normal">
              {concept.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 text-center">
        <p className="text-[11px] text-zinc-500 leading-normal">
          Tip: You can use standard keyboard shortcuts like <kbd className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono text-[10px] text-zinc-400">Ctrl+Z</kbd> to undo and <kbd className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono text-[10px] text-zinc-400">Ctrl+Y</kbd> to redo.
        </p>
      </div>
    </div>
  );
}
