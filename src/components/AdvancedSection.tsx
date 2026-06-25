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
    <div className="border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 border-t border-zinc-900 flex flex-col gap-3.5 bg-black/40">
          {children}
        </div>
      )}
    </div>
  );
}
