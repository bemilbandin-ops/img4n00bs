/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { helpLevels, type HelpLevel } from '../data/learning';

interface HelpLevelSelectorProps {
  value: HelpLevel;
  onChange: (level: HelpLevel) => void;
}

export default function HelpLevelSelector({ value, onChange }: HelpLevelSelectorProps) {
  return (
    <div className="flex items-center rounded-xl border border-zinc-800 bg-black p-1" id="help-level-selector">
      {helpLevels.map(level => (
        <button
          key={level.id}
          type="button"
          onClick={() => onChange(level.id)}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
            value === level.id
              ? 'bg-white text-black'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
          id={`help-level-${level.id}`}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
