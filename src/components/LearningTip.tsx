/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import { type ConceptTrigger, type HelpLevel } from '../data/learning';

interface LearningTipProps {
  trigger: ConceptTrigger;
  level: HelpLevel;
  onDismiss: () => void;
}

export default function LearningTip({ trigger, level, onDismiss }: LearningTipProps) {
  const copy = level === 'tips' ? trigger.tip : trigger.explain;

  return (
    <div className="rounded-xl border border-zinc-800 bg-black/95 p-3 shadow-2xl" id="contextual-learning-tip">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold leading-relaxed text-zinc-100">{copy}</p>
          {level === 'guide' && trigger.guide && (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{trigger.guide}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-white cursor-pointer"
          title="Dismiss tip"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
