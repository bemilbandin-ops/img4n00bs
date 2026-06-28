import { type RecipeId } from '../data/learning';
import { workflows } from '../data/workflows';

interface RecipePanelProps {
  activeRecipeId: RecipeId | null;
  completedStepCount: number;
  onStartRecipe: (id: RecipeId) => void;
}

const workflowByRecipe: Record<RecipeId, string> = {
  'fix-photo': 'fix-photo',
  'make-meme': 'make-meme',
  'cut-out-object': 'cut-out',
  'save-editable-project': 'learn-basics'
};

const recipeByWorkflow: Record<string, RecipeId> = {
  'fix-photo': 'fix-photo',
  'make-meme': 'make-meme',
  'cut-out': 'cut-out-object',
  'learn-basics': 'save-editable-project'
};

const startGuidedWorkflow = (workflowId: string) => {
  window.dispatchEvent(new CustomEvent('img4n00bs:start-workflow', { detail: { workflowId } }));
};

export default function RecipePanel({ activeRecipeId, completedStepCount, onStartRecipe }: RecipePanelProps) {
  const activeWorkflowId = activeRecipeId ? workflowByRecipe[activeRecipeId] : null;
  const activeWorkflow = workflows.find(workflow => workflow.id === activeWorkflowId);

  if (!activeWorkflow) {
    return (
      <div className="ui-card border rounded-xl p-4" id="workflows-empty-state">
        <h3 className="text-sm font-extrabold text-text-primary">Guided workflows</h3>
        <p className="ui-helper mt-1">Choose a goal. Guide me highlights the next click.</p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {workflows.slice(0, 6).map(workflow => (
            <button key={workflow.id} type="button" onClick={() => { startGuidedWorkflow(workflow.id); const recipeId = recipeByWorkflow[workflow.id]; if (recipeId) onStartRecipe(recipeId); }} className="rounded-lg border border-zinc-900 bg-black/30 p-2.5 text-left text-xs font-bold text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 transition cursor-pointer" id={`workflow-start-${workflow.id}`}>
              {workflow.title}
              <span className="block pt-1 text-[11px] font-normal text-zinc-500">{workflow.estimatedMinutes} min · {workflow.difficulty}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentIndex = Math.min(completedStepCount, activeWorkflow.steps.length - 1);
  const currentStep = activeWorkflow.steps[currentIndex];

  return (
    <div className="ui-card border rounded-xl p-4" id="active-workflow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-text-primary">{activeWorkflow.title}</h3>
          <p className="ui-helper mt-1">{activeWorkflow.description}</p>
        </div>
        <button type="button" onClick={() => startGuidedWorkflow(activeWorkflow.id)} className="rounded-lg border border-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer" id="btn-start-guided-workflow">
          Guide me
        </button>
      </div>
      <ol className="mt-3 space-y-1.5 text-xs text-text-primary">
        {activeWorkflow.steps.map((step, index) => (
          <li key={step.id} className={index < completedStepCount ? 'text-emerald-300' : 'text-zinc-400'}>{index + 1}. {step.title}</li>
        ))}
      </ol>
      <p className="mt-3 rounded-lg border border-zinc-900 bg-black/30 p-2 text-[11px] text-zinc-400">
        Current step: {currentStep.instruction}
      </p>
    </div>
  );
}
