import { useMemo, useState } from 'react';
import { workflowById, type Workflow } from '../data/workflows';

export interface GuidedWorkflowState {
  workflow: Workflow | null;
  activeStepIndex: number;
  active: boolean;
  startWorkflow: (workflowId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  stopWorkflow: () => void;
}

export function useGuidedWorkflow(): GuidedWorkflowState {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const workflow = useMemo(() => (workflowId ? workflowById[workflowId] ?? null : null), [workflowId]);

  const startWorkflow = (nextWorkflowId: string) => {
    if (!workflowById[nextWorkflowId]) return;
    setWorkflowId(nextWorkflowId);
    setActiveStepIndex(0);
  };

  const stopWorkflow = () => {
    setWorkflowId(null);
    setActiveStepIndex(0);
  };

  const nextStep = () => {
    if (!workflow) return;
    setActiveStepIndex(current => {
      if (current >= workflow.steps.length - 1) {
        setWorkflowId(null);
        return 0;
      }
      return current + 1;
    });
  };

  const previousStep = () => {
    setActiveStepIndex(current => Math.max(0, current - 1));
  };

  return {
    workflow,
    activeStepIndex,
    active: Boolean(workflow),
    startWorkflow,
    nextStep,
    previousStep,
    stopWorkflow
  };
}
