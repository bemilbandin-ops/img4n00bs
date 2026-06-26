/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Undo2, 
  Redo2, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  FolderOpen, 
  Save, 
  Maximize2, 
  Download, 
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';

interface TopBarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onRotateAndFlip: (action: 'rotate-90' | 'flip-h' | 'flip-v') => void;
  onOpenProject: () => void;
  onSaveProject: () => void;
  onResizeProject: () => void;
  onExport: () => void;
  onShowHelp: () => void;
  canvasWidth: number;
  canvasHeight: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function TopBar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onRotateAndFlip,
  onOpenProject,
  onSaveProject,
  onResizeProject,
  onExport,
  onShowHelp,
  canvasWidth,
  canvasHeight,
  theme,
  onToggleTheme
}: TopBarProps) {
  return (
    <header 
      className="ui-panel w-full border rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl shrink-0 z-40"
      id="editor-top-bar"
    >
      {/* Left Section: Brand Logo & Title */}
      <div className="flex items-center gap-2.5 shrink-0" id="topbar-left-brand">
        <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-black text-sm font-bold border border-zinc-200 shrink-0 select-none shadow">
          🪄
        </div>
        <div className="flex flex-col">
          <h1 className="text-[15px] font-extrabold text-text-primary tracking-tight font-display leading-none">Img4n00bs</h1>
        </div>
        {canvasWidth > 0 && (
          <div className="hidden sm:inline-flex ml-2 px-2 py-0.5 bg-zinc-900 border border-panel-border rounded-lg text-xs font-mono text-text-secondary">
            {canvasWidth} × {canvasHeight}px
          </div>
        )}
      </div>

      {/* Middle Section: Undo / Redo & Transforms */}
      <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-900 shadow-inner" id="topbar-middle-actions">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex items-center justify-center p-2 rounded-lg transition-all cursor-pointer select-none ${
            canUndo ? 'text-zinc-200 hover:text-white hover:bg-zinc-900' : 'text-zinc-700 cursor-not-allowed opacity-20'
          }`}
          title="Go back in time (Undo)"
          id="btn-topbar-undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex items-center justify-center p-2 rounded-lg transition-all cursor-pointer select-none ${
            canRedo ? 'text-zinc-200 hover:text-white hover:bg-zinc-900' : 'text-zinc-700 cursor-not-allowed opacity-20'
          }`}
          title="Go forward in time (Redo)"
          id="btn-topbar-redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-zinc-900 shrink-0 mx-1" />

        <button
          type="button"
          onClick={() => onRotateAndFlip('rotate-90')}
          className="flex items-center justify-center p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
          title="Rotate 90° right"
          id="btn-topbar-rotate"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onRotateAndFlip('flip-h')}
          className="flex items-center justify-center p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
          title="Mirror canvas horizontally"
          id="btn-topbar-flip-h"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onRotateAndFlip('flip-v')}
          className="flex items-center justify-center p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all cursor-pointer"
          title="Flip canvas upside down"
          id="btn-topbar-flip-v"
        >
          <FlipVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Right Section: Files, Resize, Export, Help */}
      <div className="flex items-center gap-2" id="topbar-right-actions">
        <button
          type="button"
          onClick={onOpenProject}
          className="ui-secondary-button flex items-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-[13px] shadow-sm transition active:scale-95 cursor-pointer border"
          id="btn-topbar-open-project"
          title="Open layered project file (.n00bs)"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Open Project</span>
        </button>
        <button
          type="button"
          onClick={onSaveProject}
          className="ui-secondary-button flex items-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-[13px] shadow-sm transition active:scale-95 cursor-pointer border"
          id="btn-save-layered-project"
          title="Save layered project file (.n00bs)"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save Project</span>
        </button>

        <button
          type="button"
          onClick={onResizeProject}
          className="ui-secondary-button flex items-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-[13px] shadow-sm transition active:scale-95 cursor-pointer border"
          id="btn-topbar-resize"
          title="Resize canvas or pixel scale"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Resize</span>
        </button>

        <button
          type="button"
          onClick={onExport}
          className="ui-primary-button flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl font-bold text-[13px] shadow transition active:scale-95 cursor-pointer border"
          id="btn-main-export"
          title="Export flattened picture (PNG/JPG/WebP)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Picture</span>
        </button>

        <div className="w-[1px] h-5 bg-zinc-900 shrink-0 mx-0.5" />

        <button
          type="button"
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          id="btn-topbar-theme-toggle"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onShowHelp}
          className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
          title="Keyboard Shortcuts & Guide"
          id="btn-help-keyboard-shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
