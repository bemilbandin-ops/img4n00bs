import { type Workflow, type WorkflowStep } from '../../data/workflows';
import { type ElementTargetRect } from '../../utils/elementTargets';

interface CoachBubbleProps {
  workflow: Workflow;
  step: WorkflowStep;
  stepIndex: number;
  rect: ElementTargetRect | null;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onShowMe: () => void;
}

export default function CoachBubble({ workflow, step, stepIndex, rect, onBack, onNext, onSkip, onShowMe }: CoachBubbleProps) {
  const isLast = stepIndex === workflow.steps.length - 1;
  const style = {
    top: rect ? Math.min(window.innerHeight - 220, Math.max(16, rect.bottom + 18)) : 96,
    left: rect ? Math.min(window.innerWidth - 380, Math.max(16, rect.left)) : 24,
    width: 360,
    maxWidth: 'calc(100vw - 32px)'
  };

  return (
    <section className="fixed rounded-2xl border border-zinc-700 bg-black p-4 text-white shadow-2xl" style={style} id="guided-coach-bubble">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">Step {stepIndex + 1}/{workflow.steps.length}</span>
        <button type="button" onClick={onSkip} className="text-xs font-bold text-zinc-500 hover:text-white" id="guided-skip-button">Skip</button>
      </div>
      <h3 className="text-base font-extrabold tracking-tight" id="guided-step-title">{step.title}</h3>
      <p className="mt-1 text-sm leading-6 text-zinc-300" id="guided-step-instruction">{step.instruction}</p>
      {step.why && <p className="mt-3 rounded-xl border border-zinc-850 bg-zinc-950 p-3 text-xs leading-5 text-zinc-400"><span className="font-bold text-zinc-200">Why:</span> {step.why}</p>}
      {step.fallbackHelp && <p className="mt-2 text-xs leading-5 text-zinc-500">{step.fallbackHelp}</p>}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} disabled={stepIndex === 0} className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 disabled:opacity-30" id="guided-back-button">Back</button>
        <button type="button" onClick={onShowMe} className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:border-zinc-600" id="guided-show-me-button">Show me</button>
        <button type="button" onClick={onNext} className="rounded-lg bg-white px-3 py-1.5 text-xs font-extrabold text-black" id="guided-next-button">{isLast ? 'Done' : 'Next'}</button>
      </div>
    </section>
  );
}
