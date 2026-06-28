import { useEffect, useMemo, useState } from 'react';
import { type Workflow } from '../../data/workflows';
import { getElementTarget, getElementTargetRect, pulseTarget, scrollTargetIntoView } from '../../utils/elementTargets';
import CoachBubble from './CoachBubble';
import Spotlight from './Spotlight';

interface GuidedOverlayProps {
  workflow: Workflow | null;
  activeStepIndex: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export default function GuidedOverlay({ workflow, activeStepIndex, onBack, onNext, onSkip }: GuidedOverlayProps) {
  const [version, setVersion] = useState(0);
  const step = workflow?.steps[activeStepIndex] ?? null;

  useEffect(() => {
    setVersion(value => value + 1);
  }, [workflow?.id, activeStepIndex]);

  useEffect(() => {
    const handleWindowChange = () => setVersion(value => value + 1);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);
    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, []);

  useEffect(() => {
    if (!step?.targetElementId) return;
    const target = getElementTarget(step.targetElementId);
    if (!target) return;
    const handleClick = () => window.setTimeout(onNext, 180);
    target.addEventListener('click', handleClick, { once: true });
    return () => target.removeEventListener('click', handleClick);
  }, [onNext, step?.targetElementId]);

  const rect = useMemo(() => getElementTargetRect(step?.targetElementId), [step?.targetElementId, version]);

  if (!workflow || !step) return null;

  const handleShowMe = () => {
    scrollTargetIntoView(step.targetElementId);
    pulseTarget(step.targetElementId);
    setVersion(value => value + 1);
  };

  return (
    <div className="fixed inset-0" style={{ zIndex: 50, pointerEvents: 'none' }} id="guided-overlay-root">
      <div className="absolute inset-0 bg-black/50" />
      <Spotlight rect={rect} />
      <CoachBubble
        workflow={workflow}
        step={step}
        stepIndex={activeStepIndex}
        rect={rect}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
        onShowMe={handleShowMe}
      />
    </div>
  );
}
