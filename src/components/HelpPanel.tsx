/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { conceptHelp } from '../data/conceptHelp';
import { HelpCircle, BookOpen, ExternalLink } from 'lucide-react';

export default function HelpPanel() {
  return (
    <div className="ui-panel flex flex-col h-full rounded-xl border p-4 overflow-y-auto" id="help-panel">
      <div className="mb-4 border-b border-zinc-900 pb-3" id="help-panel-header">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-text-secondary" />
          <h2 className="ui-section-title tracking-tight">Concepts & Guide</h2>
        </div>
        <a
          href="#/help-wiki"
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-text-secondary hover:text-text-primary"
        >
          Help Wiki
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex flex-col gap-4" id="help-concepts-list">
        {conceptHelp.map((concept, index) => (
          <div 
            key={index} 
            className="ui-card p-4 border rounded-xl transition-all"
            id={`help-concept-item-${index}`}
          >
            <h3 className="text-[15px] font-semibold text-text-primary flex items-center gap-1.5 mb-2 leading-snug">
              <HelpCircle className="w-3.5 h-3.5 text-text-secondary shrink-0" />
              {concept.title}
            </h3>
            <p className="ui-body font-normal">
              {concept.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl border border-dashed border-panel-border bg-black/20 text-center">
        <p className="ui-helper">
          Tip: You can use standard keyboard shortcuts like <kbd className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono text-xs text-text-secondary">Ctrl+Z</kbd> to undo and <kbd className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 font-mono text-xs text-text-secondary">Ctrl+Y</kbd> to redo.
        </p>
      </div>
    </div>
  );
}
