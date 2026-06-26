/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X } from 'lucide-react';
import { starterGoals, type StarterGoalId } from '../data/learning';

interface OnboardingProps {
  onClose: () => void;
  onStartGoal: (goal: StarterGoalId) => void;
}

export default function Onboarding({ onClose, onStartGoal }: OnboardingProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="starter-launcher-overlay">
      <div className="bg-black rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border border-zinc-900 flex flex-col" id="starter-launcher-card">
        <div className="px-6 py-5 border-b border-zinc-900 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-sans">What are you trying to do?</h2>
            <p className="text-sm text-zinc-400 mt-1">Pick a start, or close this and use the editor directly.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition p-1.5 hover:bg-zinc-900 rounded-full cursor-pointer"
            id="starter-launcher-close-btn"
            title="Close starter launcher"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6" id="starter-launcher-goals">
          {starterGoals.map(goal => (
            <button
              key={goal.id}
              type="button"
              onClick={() => onStartGoal(goal.id)}
              className="ui-card border rounded-xl p-4 text-left hover:border-white transition cursor-pointer"
              id={`starter-goal-${goal.id}`}
            >
              <span className="block text-base font-extrabold text-text-primary">{goal.title}</span>
              <span className="block text-[13px] leading-relaxed text-text-secondary mt-1">{goal.description}</span>
              <span className="inline-flex mt-4 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black">
                {goal.primaryAction}
              </span>
            </button>
          ))}
        </div>

        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-bold text-zinc-400 hover:text-white transition cursor-pointer"
            id="starter-launcher-skip-btn"
          >
            Start without help
          </button>
        </div>
      </div>
    </div>
  );
}
