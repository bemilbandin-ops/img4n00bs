/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Paintbrush, 
  Eraser, 
  Type, 
  Crop, 
  Square, 
  Circle, 
  Sparkles, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical,
  Undo2,
  Redo2,
  Download,
  HelpCircle,
  MousePointer,
  Save,
  FolderOpen,
  Maximize2,
  Pipette,
  Stamp
} from 'lucide-react';
import { ToolType } from '../types';

export const toolbarToolGroups = [
  {
    title: 'Clean up',
    note: 'Fix marks, spots, and unwanted bits.',
    tools: [
      {
        id: 'healingBrush' as ToolType,
        label: 'Heal',
        subtitle: 'Blend away spots',
        desc: 'Use this when you want a small mark or edge to blend into nearby pixels.',
        icon: <Sparkles className="w-3.5 h-3.5" />
      },
      {
        id: 'cloneStamp' as ToolType,
        label: 'Clone',
        subtitle: 'Cover with nearby pixels',
        desc: 'Use this when you want to copy a clean nearby area over something distracting.',
        icon: <Stamp className="w-3.5 h-3.5" />
      },
      {
        id: 'eraser' as ToolType,
        label: 'Erase',
        subtitle: 'Remove from a layer',
        desc: 'Use this when you want to wipe paint or pixels from the active layer.',
        icon: <Eraser className="w-3.5 h-3.5" />
      }
    ]
  },
  {
    title: 'Add things',
    note: 'Draw, write, mark, and reuse colors.',
    tools: [
      {
        id: 'brush' as ToolType,
        label: 'Brush',
        subtitle: 'Draw over it',
        desc: 'Use this when you want to draw, highlight, or paint directly on a drawing layer.',
        icon: <Paintbrush className="w-3.5 h-3.5" />
      },
      {
        id: 'text' as ToolType,
        label: 'Text',
        subtitle: 'Add words',
        desc: 'Use this when you want a caption, label, meme line, or title on the image.',
        icon: <Type className="w-3.5 h-3.5" />
      },
      {
        id: 'shape' as ToolType,
        label: 'Shapes',
        subtitle: 'Point or box things',
        desc: 'Use this when you want arrows, boxes, circles, or simple callouts.',
        icon: <Square className="w-3.5 h-3.5" />
      },
      {
        id: 'eyedropper' as ToolType,
        label: 'Pick Color',
        subtitle: 'Reuse a color',
        desc: 'Use this when you want text, shapes, or brush strokes to match a color already in the image.',
        icon: <Pipette className="w-3.5 h-3.5" />
      }
    ]
  },
  {
    title: 'Cut out',
    note: 'Keep, crop, or copy part of the image.',
    tools: [
      {
        id: 'crop' as ToolType,
        label: 'Crop',
        subtitle: 'Keep the best area',
        desc: 'Use this when you want to trim the whole picture down to a stronger frame.',
        icon: <Crop className="w-3.5 h-3.5" />
      },
      {
        id: 'select_rect' as ToolType,
        label: 'Box Select',
        subtitle: 'Grab a rectangle',
        desc: 'Use this when the area you want is square or rectangular.',
        icon: <Square className="w-3.5 h-3.5" />
      },
      {
        id: 'select_ellipse' as ToolType,
        label: 'Oval Select',
        subtitle: 'Grab a circle',
        desc: 'Use this when you want a round crop, avatar shape, or soft oval area.',
        icon: <Circle className="w-3.5 h-3.5" />
      },
      {
        id: 'select_lasso' as ToolType,
        label: 'Lasso',
        subtitle: 'Trace odd shapes',
        desc: 'Use this when the thing you want to cut out has an irregular outline.',
        icon: <Sparkles className="w-3.5 h-3.5" />
      }
    ]
  },
  {
    title: 'Move',
    note: 'Place a layer where you want it.',
    tools: [
      {
        id: 'move' as ToolType,
        label: 'Move',
        subtitle: 'Drag, scale, rotate',
        desc: 'Use this when a layer is in the wrong spot, too big, too small, or tilted.',
        icon: <MousePointer className="w-3.5 h-3.5" />
      }
    ]
  }
];

interface ToolbarProps {
  activeTool: ToolType;
  onChangeTool: (tool: ToolType) => void;
  onRotateAndFlip: (action: 'rotate-90' | 'flip-h' | 'flip-v') => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onSaveProject: () => void;
  onOpenProject: () => void;
  onResizeProject: () => void;
  onShowHelp?: () => void;
}

export default function Toolbar({
  activeTool,
  onChangeTool,
  onRotateAndFlip,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onSaveProject,
  onOpenProject,
  onResizeProject,
  onShowHelp
}: ToolbarProps) {

  return (
    <div className="w-full bg-black border border-zinc-900 rounded-2xl p-3 flex flex-col gap-2.5 shadow-xl shrink-0" id="editor-left-toolbar">
      {/* Title / App Brand with Small Logo (Sleek Compact Sidebar Header) */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2" id="toolbar-header">
        <div className="flex items-center gap-2" id="toolbar-small-logo">
          <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-black text-xs font-bold border border-zinc-200 shrink-0 select-none shadow">
            🪄
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold font-mono leading-none">My Magic Desk</span>
            <h1 className="text-xs font-bold text-white tracking-tight font-sans mt-0.5 leading-none">Beginner Editor</h1>
          </div>
        </div>

        {/* Compact Help Tour guide button */}
        {onShowHelp && (
          <button
            type="button"
            onClick={onShowHelp}
            className="w-6 h-6 rounded-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
            title="Keyboard Shortcuts"
            id="btn-help-keyboard-shortcuts"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Modern Compact Unified Action Bar (Undo, Redo, Rotate, Mirror) */}
      <div className="flex items-center justify-between gap-0.5 bg-zinc-955 p-1 rounded-lg border border-zinc-900" id="toolbar-actions-row">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex-1 flex items-center justify-center p-1 rounded transition cursor-pointer select-none ${
            canUndo ? 'text-zinc-200 hover:text-white hover:bg-zinc-900' : 'text-zinc-650 cursor-not-allowed opacity-20'
          }`}
          title="Go back in time (Undo)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex-1 flex items-center justify-center p-1 rounded transition cursor-pointer select-none ${
            canRedo ? 'text-zinc-200 hover:text-white hover:bg-zinc-900' : 'text-zinc-650 cursor-not-allowed opacity-20'
          }`}
          title="Go forward in time (Redo)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-zinc-850 shrink-0 mx-0.5" />
        <button
          type="button"
          onClick={() => onRotateAndFlip('rotate-90')}
          className="flex-1 flex items-center justify-center p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          title="Rotate 90° right"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRotateAndFlip('flip-h')}
          className="flex-1 flex items-center justify-center p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          title="Mirror canvas horizontally"
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRotateAndFlip('flip-v')}
          className="flex-1 flex items-center justify-center p-1 rounded text-zinc-300 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
          title="Flip canvas upside down"
        >
          <FlipVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-2" id="toolbar-tools-list">
        <div className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Pick what you want to do</div>
        {toolbarToolGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1" id={`tool-group-${group.title.toLowerCase().replaceAll(' ', '-')}`}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[10px] font-extrabold text-white leading-none">{group.title}</h2>
              <span className="text-[8px] text-zinc-500 truncate">{group.note}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5" id={`tools-grid-${group.title.toLowerCase().replaceAll(' ', '-')}`}>
              {group.tools.map((t) => {
                const isActive = activeTool === t.id;
                return (
                  <div key={t.id} className="group relative" id={`tool-wrapper-${t.id}`}>
                    <button
                      type="button"
                      onClick={() => onChangeTool(t.id)}
                      className={`w-full min-h-12 flex items-center gap-1.5 p-1.5 rounded-lg transition-all text-left border cursor-pointer select-none ${
                        isActive 
                          ? 'bg-white text-black border-white font-bold' 
                          : 'bg-zinc-900/60 text-zinc-300 border-transparent hover:bg-zinc-900 hover:text-white hover:border-zinc-800'
                      }`}
                      id={`btn-select-tool-${t.id}`}
                    >
                      <div className={`p-1 rounded shrink-0 ${isActive ? 'bg-zinc-100 text-black' : 'bg-black text-zinc-400 group-hover:bg-zinc-900'}`} id={`tool-icon-box-${t.id}`}>
                        {t.icon}
                      </div>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold leading-tight truncate">{t.label}</span>
                        <span className={`block text-[8px] leading-tight truncate ${isActive ? 'text-zinc-700' : 'text-zinc-500'}`}>{t.subtitle}</span>
                      </span>
                    </button>

                    <div className="hidden group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 w-60 bg-black text-white p-3 rounded-xl shadow-2xl z-50 text-[11px] flex-col gap-1 pointer-events-none border border-zinc-850" id={`tool-tooltip-${t.id}`}>
                      <div className="font-bold flex items-center gap-1.5 text-white" id={`tooltip-title-${t.id}`}>
                        {t.icon} {t.label}
                      </div>
                      <div className="text-[10px] text-zinc-305 leading-normal mt-0.5" id={`tooltip-desc-${t.id}`}>
                        {t.desc}
                      </div>
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-y-6 border-y-transparent border-r-6 border-r-black" id={`tooltip-arrow-${t.id}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Export Button Section */}
      <div className="border-t border-zinc-900 pt-2 flex flex-col gap-1.5" id="toolbar-export">
        <div className="grid grid-cols-2 gap-1.5" id="toolbar-project-file-actions">
          <button
            type="button"
            onClick={onSaveProject}
            className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 py-1.5 px-2 rounded-lg font-bold text-[11px] shadow transition cursor-pointer border border-zinc-800"
            id="btn-save-layered-project"
            title="Save editable layered project"
          >
            <Save className="w-3.5 h-3.5" /> Project
          </button>
          <button
            type="button"
            onClick={onOpenProject}
            className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 py-1.5 px-2 rounded-lg font-bold text-[11px] shadow transition cursor-pointer border border-zinc-800"
            id="btn-open-layered-project"
            title="Open editable layered project"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Open
          </button>
        </div>
        <button
          type="button"
          onClick={onResizeProject}
          className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 py-1.5 px-2 rounded-lg font-bold text-[11px] shadow transition cursor-pointer border border-zinc-800"
          id="btn-open-resize-dialog"
          title="Resize image pixels or canvas bounds"
        >
          <Maximize2 className="w-3.5 h-3.5" /> Resize
        </button>
        <button
          type="button"
          onClick={onExport}
          className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-200 text-black py-1.5 px-3 rounded-lg font-bold text-xs shadow transition cursor-pointer"
          id="btn-main-export"
        >
          <Download className="w-3.5 h-3.5" /> Save Picture
        </button>
      </div>
    </div>
  );
}
