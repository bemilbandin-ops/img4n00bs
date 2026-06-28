import { type Workflow } from '../../data/workflows';

interface ProgressStepsProps {
  workflow: Workflow;
  activeIndex: number;
}

export default function ProgressSteps({ workflow, activeIndex }: ProgressStepsProps) {
  return (
    <ol className="mt-3 flex flex-col gap-1.5" id="workflow-progress-steps">
      {workflow.steps.map((step, index) => (
        <li key={step.id} className={index === activeIndex ? 'text-xs text-white' : 'text-xs text-zinc-500'}>
          {index + 1}. {step.title}
        </li>
      ))}
    </ol>
  );
}
