import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { commandActions, scoreCommandAction, type CommandAction } from '../data/actions';
import { clickTarget } from '../utils/elementTargets';
import { useGuidedWorkflow } from '../hooks/useGuidedWorkflow';
import GuidedOverlay from './guidance/GuidedOverlay';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowStart: () => void;
}

export default function CommandPalette({ open, onOpenChange, onShowStart }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const guide = useGuidedWorkflow();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(true);
      }
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    const handleWorkflowEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ workflowId?: string }>;
      if (customEvent.detail.workflowId) guide.startWorkflow(customEvent.detail.workflowId);
    };
    window.addEventListener('img4n00bs:start-workflow', handleWorkflowEvent);
    return () => window.removeEventListener('img4n00bs:start-workflow', handleWorkflowEvent);
  }, [guide]);

  const visibleActions = useMemo(() => commandActions
    .map(action => ({ action, score: scoreCommandAction(action, query) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.action.title.localeCompare(b.action.title))
    .slice(0, 10), [query]);

  const runAction = (action: CommandAction) => {
    onOpenChange(false);
    setQuery('');
    if (action.kind === 'workflow' && action.workflowId) {
      guide.startWorkflow(action.workflowId);
    } else if (action.kind === 'route' && action.route) {
      window.location.hash = action.route;
    } else {
      if (action.kind === 'export-preset' && action.exportPresetId) {
        localStorage.setItem('editor_export_preset_v1', action.exportPresetId);
      }
      if (!clickTarget(action.targetElementId) && action.id === 'open-photo') clickTarget('hidden-image-file-picker');
    }
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20" id="command-palette-overlay">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl" id="command-palette-card">
            <div className="flex items-center gap-2 border-b border-zinc-900 px-4 py-3">
              <Search className="h-4 w-4 text-zinc-500" />
              <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="What do you want to do?" className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600" id="command-palette-input" />
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-900 hover:text-white" id="command-palette-close"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2" id="command-palette-results">
              <button type="button" onClick={() => { onOpenChange(false); onShowStart(); }} className="mb-2 w-full rounded-xl border border-zinc-900 bg-zinc-950 p-3 text-left text-sm font-bold text-zinc-200 hover:border-zinc-700" id="command-open-start-center">
                Open Start Center
                <span className="block text-xs font-normal text-zinc-500">Goal-first entry point for beginners.</span>
              </button>
              {visibleActions.map(({ action }) => (
                <button key={action.id} type="button" onClick={() => runAction(action)} className="w-full rounded-xl p-3 text-left hover:bg-zinc-950" id={`command-action-${action.id}`}>
                  <span className="block text-sm font-bold text-zinc-100">{action.title}</span>
                  <span className="block text-xs leading-5 text-zinc-500">{action.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <GuidedOverlay workflow={guide.workflow} activeStepIndex={guide.activeStepIndex} onBack={guide.previousStep} onNext={guide.nextStep} onSkip={guide.stopWorkflow} />
    </>
  );
}
