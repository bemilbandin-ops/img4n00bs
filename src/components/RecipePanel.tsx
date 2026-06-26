/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { taskRecipes, type RecipeId } from '../data/learning';

interface RecipePanelProps {
  activeRecipeId: RecipeId | null;
  completedStepCount: number;
  onStartRecipe: (id: RecipeId) => void;
}

export default function RecipePanel({ activeRecipeId, completedStepCount, onStartRecipe }: RecipePanelProps) {
  const activeRecipe = taskRecipes.find(recipe => recipe.id === activeRecipeId);

  if (!activeRecipe) {
    return (
      <div className="ui-card border rounded-xl p-4" id="recipes-empty-state">
        <h3 className="text-sm font-extrabold text-text-primary">Beginner recipes</h3>
        <p className="ui-helper mt-1">Choose a small goal. You can stop anytime.</p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {taskRecipes.map(recipe => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => onStartRecipe(recipe.id)}
              className="rounded-lg border border-zinc-900 bg-black/30 p-2.5 text-left text-xs font-bold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 transition cursor-pointer"
              id={`recipe-start-${recipe.id}`}
            >
              {recipe.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ui-card border rounded-xl p-4" id="active-recipe-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-text-primary">{activeRecipe.title}</h3>
          <p className="ui-helper mt-1">{activeRecipe.goal}</p>
        </div>
        <button
          type="button"
          onClick={() => onStartRecipe(activeRecipe.id)}
          className="rounded-lg border border-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer"
        >
          Restart
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-text-secondary">{activeRecipe.why}</p>
      <ol className="mt-3 space-y-1.5 text-xs text-text-primary">
        {activeRecipe.steps.map((step, index) => (
          <li key={step} className={index < completedStepCount ? 'text-emerald-300' : 'text-zinc-400'}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-lg border border-zinc-900 bg-black/30 p-2 text-[11px] text-zinc-400">
        Current step: {activeRecipe.steps[Math.min(completedStepCount, activeRecipe.steps.length - 1)]}
      </p>
      <p className="mt-2 text-[11px] text-zinc-500">Done when: {activeRecipe.doneCondition}</p>
      {activeRecipe.nextStep && (
        <p className="mt-1 text-[11px] text-zinc-500">Next: {activeRecipe.nextStep}</p>
      )}
    </div>
  );
}
