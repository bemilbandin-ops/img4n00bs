/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AdvancedSectionProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function AdvancedSection({ 
  title = 'Advanced controls', 
  children, 
  defaultOpen = false 
}: AdvancedSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="ui-card border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 text-[13px] font-bold text-text-secondary hover:text-text-primary hover:bg-zinc-900 transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-panel-border flex flex-col gap-4 bg-black/30">
          {children}
        </div>
      )}
    </div>
  );
}
