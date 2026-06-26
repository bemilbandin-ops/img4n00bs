/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Eraser, 
  Crop, 
  Square, 
  Circle,
  Minus,
  ArrowRight,
  Scissors, 
  Download, 
  X,
  Plus,
  Copy,
  ClipboardPaste,
  BookOpen
} from 'lucide-react';
import { ToolType, ShapeKind, EyedropperSource } from '../types';
import { toolHelp } from '../data/toolHelp';
import AdvancedSection from './AdvancedSection';

interface ToolOptionsProps {
  activeTool: ToolType;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  eraserSize: number;
  onEraserSizeChange: (size: number) => void;
  cloneSourcePoint: { x: number; y: number } | null;

  // Eyedropper Options
  eyedropperSource: EyedropperSource;
  onEyedropperSourceChange: (source: EyedropperSource) => void;
  lastSampledColor: string | null;
  recentSampledColors: string[];
  swatches: string[];
  onAddSwatch: (color: string) => void;
  onRemoveSwatch: (color: string) => void;
  onSelectSwatch: (color: string) => void;
  
  // Text Options
  textText: string;
  onTextTextChange: (text: string) => void;
  textFontSize: number;
  onTextFontSizeChange: (size: number) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  textFontFamily: string;
  onTextFontFamilyChange: (family: string) => void;
  onCommitTextEdit: () => void;
  onAddNewTextLayer: () => void;

  // Shape Options
  shapeKind: ShapeKind;
  onShapeKindChange: (kind: ShapeKind) => void;
  shapeFillColor: string;
  onShapeFillColorChange: (color: string) => void;
  shapeStrokeColor: string;
  onShapeStrokeColorChange: (color: string) => void;
  shapeStrokeWidth: number;
  onShapeStrokeWidthChange: (size: number) => void;
  shapeFillEnabled: boolean;
  onShapeFillEnabledChange: (enabled: boolean) => void;
  shapeStrokeEnabled: boolean;
  onShapeStrokeEnabledChange: (enabled: boolean) => void;
  onCommitShapeEdit: () => void;

  // Crop & Selection options
  hasSelection: boolean;
  onExecuteCropSelection: () => void;
  onFillSelection: () => void;
  onClearSelectionPixels: () => void;
  onCopySelectionToLayer: () => void;
  onCutSelectionToLayer: () => void;
  onPasteSelectionAsLayer: () => void;
  hasSelectionClipboard: boolean;
  onDownloadSelection: () => void;
  onCancelSelection: () => void;

  // Optional tool switcher (for select types)
  onChangeTool?: (tool: ToolType) => void;
}

export default function ToolOptions({
  activeTool,
  brushSize,
  onBrushSizeChange,
  brushColor,
  onBrushColorChange,
  eraserSize,
  onEraserSizeChange,
  cloneSourcePoint,
  eyedropperSource,
  onEyedropperSourceChange,
  lastSampledColor,
  recentSampledColors,
  swatches,
  onAddSwatch,
  onRemoveSwatch,
  onSelectSwatch,
  textText,
  onTextTextChange,
  textFontSize,
  onTextFontSizeChange,
  textColor,
  onTextColorChange,
  textFontFamily,
  onTextFontFamilyChange,
  onCommitTextEdit,
  onAddNewTextLayer,
  shapeKind,
  onShapeKindChange,
  shapeFillColor,
  onShapeFillColorChange,
  shapeStrokeColor,
  onShapeStrokeColorChange,
  shapeStrokeWidth,
  onShapeStrokeWidthChange,
  shapeFillEnabled,
  onShapeFillEnabledChange,
  shapeStrokeEnabled,
  onShapeStrokeEnabledChange,
  onCommitShapeEdit,
  hasSelection,
  onExecuteCropSelection,
  onFillSelection,
  onClearSelectionPixels,
  onCopySelectionToLayer,
  onCutSelectionToLayer,
  onPasteSelectionAsLayer,
  hasSelectionClipboard,
  onDownloadSelection,
  onCancelSelection,
  onChangeTool
}: ToolOptionsProps) {

  const help = toolHelp[activeTool] || {
    title: 'Active Tool',
    summary: 'Adjust tool parameters below.',
    steps: []
  };

  const quickColors = [
    '#000000', // Black
    '#ffffff', // White
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#a855f7', // Purple
    '#ec4899', // Pink
  ];

  return (
    <div className="w-full flex flex-col gap-5 text-text-primary" id="tool-options-container">
      {/* 1. Educational card about active tool */}
      <div className="ui-card border p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden" id="tool-info-card">
        <div className="flex items-center gap-2 border-b border-panel-border pb-2.5">
          <BookOpen className="w-4 h-4 text-text-secondary shrink-0" />
          <h3 className="ui-section-title tracking-tight">{help.title}</h3>
        </div>
        <p className="ui-body">{help.summary}</p>
        
        {help.steps.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            <span className="ui-helper uppercase font-bold tracking-wider font-mono">How to use:</span>
            <ol className="list-decimal pl-4 text-[13px] text-text-primary leading-6 space-y-1">
              {help.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {help.mistake && (
          <div className="mt-1 ui-helper bg-black/30 p-3 rounded-lg border border-panel-border">
            <span className="font-bold text-text-primary">Hint:</span> {help.mistake}
          </div>
        )}
      </div>

      {/* 2. Basic controls section */}
      <div className="flex flex-col gap-3.5" id="tool-basic-controls">
        {activeTool === 'move' && (
          <p className="ui-body text-center py-2">
            No basic controls. Drag directly on the canvas to place.
          </p>
        )}

        {activeTool === 'brush' && (
          <div className="flex flex-col gap-3.5">
            {/* Size slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-350">
                <span>Size</span>
                <span className="font-mono text-white font-bold">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
                id="input-brush-size"
              />
            </div>

            {/* Color selection */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-zinc-355">Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => onBrushColorChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-800 p-0 overflow-hidden shrink-0 bg-transparent"
                  id="input-brush-hex"
                  title="Custom color"
                />
                <input
                  type="text"
                  value={brushColor}
                  onChange={(e) => {
                    if (e.target.value.startsWith('#') && e.target.value.length <= 7) {
                      onBrushColorChange(e.target.value);
                    }
                  }}
                  className="text-xs font-mono border border-zinc-850 rounded-lg px-2.5 py-1.5 flex-1 uppercase text-zinc-100 bg-zinc-950 focus:outline-none focus:border-zinc-700"
                  placeholder="#000000"
                  id="text-brush-color"
                />
              </div>
            </div>
          </div>
        )}

        {activeTool === 'eraser' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-zinc-350">
              <span>Size</span>
              <span className="font-mono text-white font-bold">{eraserSize}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={eraserSize}
              onChange={(e) => onEraserSizeChange(parseInt(e.target.value))}
              className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
              id="input-eraser-size"
            />
          </div>
        )}

        {(activeTool === 'cloneStamp' || activeTool === 'healingBrush') && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-350">
                <span>Size</span>
                <span className="font-mono text-white font-bold">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
                id="input-clone-size"
              />
            </div>
            <div className="rounded-xl border border-zinc-850 bg-zinc-900/20 p-2.5 text-xs text-zinc-300">
              <span className="font-bold text-zinc-400">Source status:</span>{' '}
              {cloneSourcePoint ? (
                <span className="text-emerald-400 font-mono font-bold">
                  Set ({Math.round(cloneSourcePoint.x)}, {Math.round(cloneSourcePoint.y)})
                </span>
              ) : (
                <span className="text-zinc-500 font-medium">Alt-click on canvas to set</span>
              )}
            </div>
          </div>
        )}

        {activeTool === 'eyedropper' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'composite' as EyedropperSource, label: 'Whole Image' },
                { id: 'active-layer' as EyedropperSource, label: 'Active Layer' }
              ].map((source) => (
                <button
                  type="button"
                  key={source.id}
                  onClick={() => onEyedropperSourceChange(source.id)}
                  className={`py-1.5 px-2.5 rounded-lg border text-center transition cursor-pointer select-none font-bold text-xs ${
                    eyedropperSource === source.id
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900/40 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  {source.label}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-2.5 flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border border-zinc-700 shadow-inner shrink-0"
                style={{ backgroundColor: lastSampledColor ?? brushColor }}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-xs font-bold text-white uppercase truncate">
                  {lastSampledColor ?? brushColor}
                </span>
                <span className="text-[10px] text-zinc-500 truncate">Current color</span>
              </div>
              <button
                type="button"
                onClick={() => onAddSwatch(lastSampledColor ?? brushColor)}
                className="ml-auto p-1.5 rounded-lg border border-zinc-850 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 cursor-pointer"
                title="Save swatch"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {activeTool === 'text' && (
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Text</span>
              <textarea
                value={textText}
                onChange={(e) => onTextTextChange(e.target.value)}
                onBlur={onCommitTextEdit}
                className="text-xs border border-zinc-800 rounded-xl p-2.5 h-14 w-full resize-none focus:outline-none focus:border-zinc-700 bg-zinc-950 text-white"
                placeholder="Type text..."
                id="input-text-content"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Size</span>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={textFontSize}
                  onChange={(e) => onTextFontSizeChange(Math.max(10, parseInt(e.target.value) || 24))}
                  onBlur={onCommitTextEdit}
                  className="text-xs border border-zinc-800 rounded-lg p-1.5 font-mono w-full focus:outline-none focus:border-zinc-700 bg-zinc-950 text-white"
                  id="input-text-size"
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Font</span>
                <select
                  value={textFontFamily}
                  onChange={(e) => onTextFontFamilyChange(e.target.value)}
                  onBlur={onCommitTextEdit}
                  className="text-xs border border-zinc-800 rounded-lg p-1.5 w-full bg-zinc-950 text-white focus:outline-none focus:border-zinc-700"
                  id="select-text-family"
                >
                  <option value="Outfit">Outfit</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier</option>
                  <option value="Impact">Impact</option>
                  <option value="Comic Sans MS">Comic Sans</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => onTextColorChange(e.target.value)}
                  onBlur={onCommitTextEdit}
                  className="w-7 h-7 rounded-lg cursor-pointer border border-zinc-800 p-0 overflow-hidden shrink-0 bg-transparent"
                  id="input-text-color-hex"
                />
                <span className="text-xs font-mono uppercase">{textColor}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onAddNewTextLayer}
              className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-200 text-black font-bold py-2 rounded-xl text-xs transition cursor-pointer"
              id="btn-add-new-text-layer-opt"
            >
              <Plus className="w-3.5 h-3.5" /> Place New Text Layer
            </button>
          </div>
        )}

        {activeTool === 'shape' && (
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'rectangle' as ShapeKind, label: 'Box', icon: <Square className="w-3 h-3" /> },
                { id: 'ellipse' as ShapeKind, label: 'Oval', icon: <Circle className="w-3 h-3" /> },
                { id: 'line' as ShapeKind, label: 'Line', icon: <Minus className="w-3 h-3" /> },
                { id: 'arrow' as ShapeKind, label: 'Arrow', icon: <ArrowRight className="w-3 h-3" /> }
              ].map((shape) => (
                <button
                  type="button"
                  key={shape.id}
                  onClick={() => {
                    onShapeKindChange(shape.id);
                    onCommitShapeEdit();
                  }}
                  className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer select-none ${
                    shapeKind === shape.id
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900/40 text-zinc-300 border-zinc-800 hover:bg-zinc-900'
                  }`}
                  id={`btn-shape-kind-${shape.id}`}
                >
                  {shape.icon}
                  {shape.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Fill
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-850 bg-zinc-950 p-1.5">
                  <input
                    type="checkbox"
                    checked={shapeFillEnabled}
                    disabled={shapeKind === 'line' || shapeKind === 'arrow'}
                    onChange={(e) => {
                      onShapeFillEnabledChange(e.target.checked);
                      onCommitShapeEdit();
                    }}
                    className="accent-white"
                  />
                  <input
                    type="color"
                    value={shapeFillColor}
                    disabled={shapeKind === 'line' || shapeKind === 'arrow' || !shapeFillEnabled}
                    onChange={(e) => onShapeFillColorChange(e.target.value)}
                    onBlur={onCommitShapeEdit}
                    className="w-6 h-6 rounded-md cursor-pointer border border-zinc-800 p-0 overflow-hidden shrink-0 bg-transparent disabled:opacity-30"
                    id="input-shape-fill-color"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Outline
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-850 bg-zinc-950 p-1.5">
                  <input
                    type="checkbox"
                    checked={shapeStrokeEnabled}
                    onChange={(e) => {
                      onShapeStrokeEnabledChange(e.target.checked);
                      onCommitShapeEdit();
                    }}
                    className="accent-white"
                  />
                  <input
                    type="color"
                    value={shapeStrokeColor}
                    disabled={!shapeStrokeEnabled}
                    onChange={(e) => onShapeStrokeColorChange(e.target.value)}
                    onBlur={onCommitShapeEdit}
                    className="w-6 h-6 rounded-md cursor-pointer border border-zinc-800 p-0 overflow-hidden shrink-0 bg-transparent disabled:opacity-30"
                    id="input-shape-stroke-color"
                  />
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-semibold text-zinc-350">
                <span>Outline Width</span>
                <span className="font-mono text-white font-bold">{shapeStrokeWidth}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="80"
                value={shapeStrokeWidth}
                onChange={(e) => onShapeStrokeWidthChange(parseInt(e.target.value))}
                onPointerUp={onCommitShapeEdit}
                onKeyUp={onCommitShapeEdit}
                className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
                id="input-shape-stroke-width"
              />
            </div>
          </div>
        )}

        {activeTool === 'crop' && (
          <button
            type="button"
            onClick={onExecuteCropSelection}
            className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-200 text-black font-bold py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
            id="btn-confirm-crop-action"
          >
            <Crop className="w-4 h-4" /> Keep Frame Bounding Box
          </button>
        )}

        {activeTool.startsWith('select_') && (
          <div className="flex flex-col gap-2">
            {/* Selection Sub-Type Switcher (since unified Select is on the rail) */}
            <div className="flex flex-col gap-1 mb-2.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Selection Method</span>
              <div className="grid grid-cols-3 gap-1 bg-black p-0.5 rounded-lg border border-zinc-900">
                {[
                  { id: 'select_rect' as ToolType, label: 'Box' },
                  { id: 'select_ellipse' as ToolType, label: 'Oval' },
                  { id: 'select_lasso' as ToolType, label: 'Lasso' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => onChangeTool && onChangeTool(type.id)}
                    className={`py-1 px-1.5 rounded-md text-[11px] font-semibold transition select-none cursor-pointer ${
                      activeTool === type.id
                        ? 'bg-zinc-900 text-white border border-zinc-800'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {!hasSelection ? (
              <p className="text-[11px] text-zinc-500 leading-normal text-center py-2">
                No area selected. Drag on the canvas before cutting, filling, or masking part of the image.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onExecuteCropSelection}
                  className="flex items-center gap-2 text-left p-1.5 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-900/50 hover:bg-zinc-900 hover:text-white border border-zinc-800/80 transition w-full cursor-pointer"
                  id="btn-crop-to-selection"
                >
                  <div className="p-1 bg-black text-white border border-zinc-850 rounded-lg shrink-0">
                    <Crop className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px]">Crop to Selection</div>
                    <div className="text-xs leading-snug text-text-secondary">Trim canvas down to selected region</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onFillSelection}
                  className="flex items-center gap-2 text-left p-1.5 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-900/50 hover:bg-zinc-900 hover:text-white border border-zinc-800/80 transition w-full cursor-pointer"
                  id="btn-fill-selection"
                >
                  <div className="p-1 bg-black text-white border border-zinc-850 rounded-lg shrink-0">
                    <Scissors className="w-3.5 h-3.5 rotate-90" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px]">Fill Selection</div>
                    <div className="text-xs leading-snug text-text-secondary">Fill with current brush color</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onClearSelectionPixels}
                  className="flex items-center gap-2 text-left p-1.5 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-900/50 hover:bg-zinc-900 hover:text-white border border-zinc-800/80 transition w-full cursor-pointer"
                  id="btn-erase-selection"
                >
                  <div className="p-1 bg-black text-white border border-zinc-850 rounded-lg shrink-0">
                    <Eraser className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-[11px]">Clear Inside</div>
                    <div className="text-xs leading-snug text-text-secondary">Erase pixels inside selection</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Advanced controls section */}
      <div id="tool-advanced-controls">
        {/* Brush Advanced Controls */}
        {activeTool === 'brush' && (
          <AdvancedSection title="Advanced Color Options">
            <div className="flex flex-col gap-3">
              {/* Quick Palette */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Quick Palette</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {quickColors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => onBrushColorChange(color)}
                      style={{ backgroundColor: color }}
                      className={`h-5 rounded border cursor-pointer border-white/5 shadow-sm transition-all hover:scale-110 active:scale-90 ${
                        brushColor.toLowerCase() === color.toLowerCase() 
                          ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-105' 
                          : ''
                      }`}
                      id={`btn-palette-color-${color.replace('#', '')}`}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Swatches & Recent Colors */}
              {recentSampledColors.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-2.5">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Recent samples</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSampledColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onSelectSwatch(color)}
                        style={{ backgroundColor: color }}
                        className="w-5 h-5 rounded-md border border-white/10 hover:scale-105 active:scale-95 transition cursor-pointer"
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-2.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Swatches</span>
                {swatches.length === 0 ? (
                  <span className="text-[11px] text-zinc-500">No saved swatches yet.</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {swatches.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onSelectSwatch(color)}
                        style={{ backgroundColor: color }}
                        className="w-5.5 h-5.5 rounded-md border border-white/10 hover:scale-105 active:scale-95 transition cursor-pointer"
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AdvancedSection>
        )}

        {/* Eyedropper Advanced Controls */}
        {activeTool === 'eyedropper' && (
          <AdvancedSection title="Saved Swatches">
            <div className="flex flex-col gap-3">
              {recentSampledColors.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Recent samples</span>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSampledColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onSelectSwatch(color)}
                        onDoubleClick={() => onAddSwatch(color)}
                        style={{ backgroundColor: color }}
                        className="w-6 h-6 rounded-lg border border-white/10 hover:scale-105 active:scale-95 transition cursor-pointer"
                        title={`${color.toUpperCase()} - double-click to save`}
                        id={`btn-recent-color-${color.replace('#', '')}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-2.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Swatches</span>
                {swatches.length === 0 ? (
                  <div className="text-[11px] text-zinc-500">No swatches saved yet. Use the plus button above.</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {swatches.map(color => (
                      <div key={color} className="relative group">
                        <button
                          type="button"
                          onClick={() => onSelectSwatch(color)}
                          style={{ backgroundColor: color }}
                          className="w-7 h-7 rounded-lg border border-white/10 hover:scale-105 active:scale-95 transition cursor-pointer"
                          id={`btn-swatch-${color.replace('#', '')}`}
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveSwatch(color)}
                          className="absolute -right-1 -top-1 hidden group-hover:flex w-4 h-4 items-center justify-center rounded-full bg-black border border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                          id={`btn-remove-swatch-${color.replace('#', '')}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AdvancedSection>
        )}

        {/* Text Advanced Controls */}
        {activeTool === 'text' && (
          <AdvancedSection title="Quick Colors">
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-5 gap-1.5">
                {quickColors.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => {
                      onTextColorChange(c);
                      onCommitTextEdit();
                    }}
                    style={{ backgroundColor: c }}
                    className={`h-5 rounded border cursor-pointer border-white/5 transition-all hover:scale-110 active:scale-95 ${
                      textColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-105' : ''
                    }`}
                    id={`btn-text-color-${c.replace('#', '')}`}
                  />
                ))}
              </div>
            </div>
          </AdvancedSection>
        )}

        {/* Shape Advanced Controls */}
        {activeTool === 'shape' && (
          <AdvancedSection title="Quick Outline Palette">
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-5 gap-1.5">
                {quickColors.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => {
                      onShapeStrokeColorChange(color);
                      onCommitShapeEdit();
                    }}
                    style={{ backgroundColor: color }}
                    className={`h-5 rounded border cursor-pointer border-white/5 transition-all hover:scale-110 active:scale-90 ${
                      shapeStrokeColor.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-105' : ''
                    }`}
                    id={`btn-shape-stroke-palette-${color.replace('#', '')}`}
                    title={`Set outline to ${color}`}
                  />
                ))}
              </div>
            </div>
          </AdvancedSection>
        )}

        {/* Selection Advanced Controls */}
        {activeTool.startsWith('select_') && hasSelection && (
          <AdvancedSection title="Cutout & Clipboard Actions">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onCopySelectionToLayer}
                className="flex items-center gap-2 text-left p-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-950/60 hover:bg-zinc-900/60 border border-zinc-900 transition w-full cursor-pointer"
                id="btn-copy-selection-layer"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-white">Copy to New Layer</div>
                  <div className="text-xs leading-snug text-text-secondary">Duplicate selected pixels</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onCutSelectionToLayer}
                className="flex items-center gap-2 text-left p-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-950/60 hover:bg-zinc-900/60 border border-zinc-900 transition w-full cursor-pointer"
                id="btn-cut-selection-layer"
              >
                <Scissors className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-white">Cut to New Layer</div>
                  <div className="text-xs leading-snug text-text-secondary">Move selected pixels to new layer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onPasteSelectionAsLayer}
                disabled={!hasSelectionClipboard}
                className={`flex items-center gap-2 text-left p-1.5 rounded-lg text-xs font-semibold border transition w-full ${
                  hasSelectionClipboard
                    ? 'text-zinc-400 hover:text-white bg-zinc-950/60 hover:bg-zinc-900/60 border-zinc-900 cursor-pointer'
                    : 'text-zinc-650 bg-zinc-950/20 border-zinc-950 cursor-not-allowed opacity-30'
                }`}
                id="btn-paste-selection-layer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-white">Paste Clipboard Cutout</div>
                  <div className="text-xs leading-snug text-text-secondary">Paste copied pixels as a layer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onDownloadSelection}
                className="flex items-center gap-2 text-left p-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-950/60 hover:bg-zinc-900/60 border border-zinc-900 transition w-full cursor-pointer"
                id="btn-download-selection"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-white">Download Area (PNG)</div>
                  <div className="text-xs leading-snug text-text-secondary">Save selection area as image file</div>
                </div>
              </button>

              <button
                type="button"
                onClick={onCancelSelection}
                className="mt-1 flex items-center justify-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition py-1 cursor-pointer w-full"
                id="btn-clear-selection-overlay"
              >
                <X className="w-3 h-3" /> Clear Selection Borders
              </button>
            </div>
          </AdvancedSection>
        )}
      </div>
    </div>
  );
}
