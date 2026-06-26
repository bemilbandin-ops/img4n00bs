/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Wrench, Layers, Sliders, HelpCircle } from 'lucide-react';

export type InspectorTab = 'tool' | 'layers' | 'adjust' | 'help';

interface InspectorPanelProps {
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  children: React.ReactNode;
}

export default function InspectorPanel({ activeTab, onTabChange, children }: InspectorPanelProps) {
  const tabs = [
    { id: 'tool' as InspectorTab, label: 'Tool', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'layers' as InspectorTab, label: 'Layers', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'adjust' as InspectorTab, label: 'Adjust', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'help' as InspectorTab, label: 'Help', icon: <HelpCircle className="w-3.5 h-3.5" /> }
  ];

  return (
    <div 
      className="ui-panel w-full lg:w-[340px] h-full flex flex-col border rounded-2xl shadow-xl overflow-hidden shrink-0 z-30" 
      id="editor-inspector-panel"
    >
      {/* Tab Navigation Header */}
      <div 
        className="flex items-center justify-between bg-black p-1 border-b border-zinc-900 shadow-inner" 
        id="inspector-tabs-header"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[13px] font-bold transition-all cursor-pointer select-none ${
                isActive 
                  ? 'bg-zinc-900 text-text-primary shadow-sm border border-panel-border' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-zinc-900/30 border border-transparent'
              }`}
              id={`tab-inspector-${tab.id}`}
              title={`${tab.label} Panel`}
            >
              {tab.icon}
              <span className="hidden sm:inline lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel Content Area */}
      <div className="flex-1 p-3 flex flex-col min-h-0 overflow-hidden" id="inspector-tab-content">
        {children}
      </div>
    </div>
  );
}
