/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Contrast, Droplets, FastForward, RotateCcw, Palette, Eye, Aperture } from 'lucide-react';
import { EditorAdjustments, FilterType } from '../types';
import AdvancedSection from './AdvancedSection';

interface AdjustmentsPanelProps {
  adjustments: EditorAdjustments;
  filter: FilterType;
  onChangeAdjustments: (adjustments: EditorAdjustments) => void;
  onCommitAdjustments: (adjustments: EditorAdjustments) => void;
  onChangeFilter: (filter: FilterType) => void;
  onReset: () => void;
  activeLayerName: string;
}

export default function AdjustmentsPanel({
  adjustments,
  filter,
  onChangeAdjustments,
  onCommitAdjustments,
  onChangeFilter,
  onReset,
  activeLayerName
}: AdjustmentsPanelProps) {

  const getNextAdjustments = (key: keyof EditorAdjustments, value: number) => ({
    ...adjustments,
    [key]: value
  });

  const handleSliderChange = (key: keyof EditorAdjustments, value: number) => {
    onChangeAdjustments(getNextAdjustments(key, value));
  };

  const handleSliderCommit = (key: keyof EditorAdjustments, value: number) => {
    onCommitAdjustments(getNextAdjustments(key, value));
  };

  // Preset operations
  const applyPresetAutoFix = () => {
    const next = {
      ...adjustments,
      brightness: Math.min(100, Math.max(-100, adjustments.brightness + 10)),
      contrast: Math.min(100, Math.max(-100, adjustments.contrast + 15)),
      saturation: Math.min(100, Math.max(-100, adjustments.saturation + 10))
    };
    onCommitAdjustments(next);
  };

  const applyPresetBrighter = () => {
    const next = getNextAdjustments('brightness', Math.min(100, adjustments.brightness + 20));
    onCommitAdjustments(next);
  };

  const applyPresetMoreColorful = () => {
    const next = getNextAdjustments('saturation', Math.min(100, adjustments.saturation + 25));
    onCommitAdjustments(next);
  };

  const applyPresetBlackAndWhite = () => {
    onChangeFilter('grayscale');
  };

  const applyPresetSharper = () => {
    onChangeFilter('sharpen');
  };

  const filtersList: { id: FilterType; label: string; desc: string; previewClass: string }[] = [
    { 
      id: 'none', 
      label: 'Normal', 
      desc: 'No effects applied',
      previewClass: 'bg-zinc-900 border-white text-white' 
    },
    { 
      id: 'grayscale', 
      label: 'Grayscale', 
      desc: 'Elegant black & white',
      previewClass: 'bg-zinc-900 border-white text-white filter grayscale' 
    },
    { 
      id: 'sepia', 
      label: 'Sepia', 
      desc: 'Warm ancient paper look',
      previewClass: 'bg-zinc-900 border-white text-white filter sepia' 
    },
    { 
      id: 'blur', 
      label: 'Soft Blur', 
      desc: 'Gently soften details',
      previewClass: 'bg-zinc-900 border-white text-white' 
    },
    { 
      id: 'sharpen', 
      label: 'Sharpen', 
      desc: 'Crisp outline details',
      previewClass: 'bg-zinc-900 border-white text-white' 
    }
  ];

  return (
    <div className="w-full flex flex-col gap-4 text-zinc-300" id="editor-adjustments-panel">
      {/* Target layer heading info */}
      <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-xl flex flex-col gap-1 shrink-0" id="adjust-panel-header">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-mono">Current Layer</span>
        <h2 className="text-sm font-semibold text-white truncate" title={activeLayerName}>
          {activeLayerName}
        </h2>
      </div>

      {/* Core/Simple Controls */}
      <div className="flex flex-col gap-4" id="adjustments-simple-group">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Quick Enhancements</span>
          <div className="flex flex-wrap gap-1.5" id="presets-quick-row">
            <button
              type="button"
              onClick={applyPresetAutoFix}
              className="py-1.5 px-3 bg-white hover:bg-zinc-200 text-black font-bold rounded-lg text-xs transition cursor-pointer select-none"
              title="Enhance brightness, contrast and color automatically"
            >
              Auto fix
            </button>
            <button
              type="button"
              onClick={applyPresetBrighter}
              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-semibold rounded-lg text-xs transition cursor-pointer select-none"
            >
              Brighter
            </button>
            <button
              type="button"
              onClick={applyPresetMoreColorful}
              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-semibold rounded-lg text-xs transition cursor-pointer select-none"
            >
              More colorful
            </button>
            <button
              type="button"
              onClick={applyPresetBlackAndWhite}
              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-semibold rounded-lg text-xs transition cursor-pointer select-none"
            >
              Black & white
            </button>
            <button
              type="button"
              onClick={applyPresetSharper}
              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white font-semibold rounded-lg text-xs transition cursor-pointer select-none"
            >
              Sharper
            </button>
          </div>
        </div>

        {/* Sliders for Brightness, Contrast, Saturation */}
        <div className="flex flex-col gap-3.5 mt-1" id="core-sliders">
          {/* Brightness */}
          <div className="flex flex-col gap-1.5" id="adjustment-row-brightness">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-350 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Brightness — lighter/darker
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.brightness}
              onChange={(e) => handleSliderChange('brightness', parseInt(e.target.value))}
              onPointerUp={(e) => handleSliderCommit('brightness', parseInt((e.currentTarget as HTMLInputElement).value))}
              onKeyUp={(e) => handleSliderCommit('brightness', parseInt((e.currentTarget as HTMLInputElement).value))}
              className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
              id="slider-brightness"
            />
          </div>

          {/* Contrast */}
          <div className="flex flex-col gap-1.5" id="adjustment-row-contrast">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-350 flex items-center gap-1.5">
                <Contrast className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Contrast — more/less punch
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.contrast}
              onChange={(e) => handleSliderChange('contrast', parseInt(e.target.value))}
              onPointerUp={(e) => handleSliderCommit('contrast', parseInt((e.currentTarget as HTMLInputElement).value))}
              onKeyUp={(e) => handleSliderCommit('contrast', parseInt((e.currentTarget as HTMLInputElement).value))}
              className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
              id="slider-contrast"
            />
          </div>

          {/* Saturation / Color */}
          <div className="flex flex-col gap-1.5" id="adjustment-row-saturation">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-350 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> Color — more/less color
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.saturation}
              onChange={(e) => handleSliderChange('saturation', parseInt(e.target.value))}
              onPointerUp={(e) => handleSliderCommit('saturation', parseInt((e.currentTarget as HTMLInputElement).value))}
              onKeyUp={(e) => handleSliderCommit('saturation', parseInt((e.currentTarget as HTMLInputElement).value))}
              className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
              id="slider-saturation"
            />
          </div>
        </div>
      </div>

      {/* Advanced Adjustments Section */}
      <AdvancedSection title="Advanced adjustments">
        <div className="flex flex-col gap-3.5">
          {/* Exposure */}
          <div className="flex flex-col gap-1.5" id="adjustment-row-exposure">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-350 flex items-center gap-1.5">
                <FastForward className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Exposure
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {adjustments.exposure > 0 ? `+${adjustments.exposure}` : adjustments.exposure}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={adjustments.exposure}
              onChange={(e) => handleSliderChange('exposure', parseInt(e.target.value))}
              onPointerUp={(e) => handleSliderCommit('exposure', parseInt((e.currentTarget as HTMLInputElement).value))}
              onKeyUp={(e) => handleSliderCommit('exposure', parseInt((e.currentTarget as HTMLInputElement).value))}
              className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
              id="slider-exposure"
            />
          </div>

          {/* Hue */}
          <div className="flex flex-col gap-1.5" id="adjustment-row-hue">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-350 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Hue Shift
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {adjustments.hue > 0 ? `+${adjustments.hue}°` : `${adjustments.hue || 0}°`}
              </span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={adjustments.hue || 0}
              onChange={(e) => handleSliderChange('hue', parseInt(e.target.value))}
              onPointerUp={(e) => handleSliderCommit('hue', parseInt((e.currentTarget as HTMLInputElement).value))}
              onKeyUp={(e) => handleSliderCommit('hue', parseInt((e.currentTarget as HTMLInputElement).value))}
              className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
              id="slider-hue"
            />
          </div>

          {/* Blur */}
          <div className="flex flex-col gap-1.5" id="adjustment-row-blur">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-350 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Soften Details
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {adjustments.blur || 0}px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={adjustments.blur || 0}
              onChange={(e) => handleSliderChange('blur', parseInt(e.target.value))}
              onPointerUp={(e) => handleSliderCommit('blur', parseInt((e.currentTarget as HTMLInputElement).value))}
              onKeyUp={(e) => handleSliderCommit('blur', parseInt((e.currentTarget as HTMLInputElement).value))}
              className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
              id="slider-blur"
            />
          </div>

          {/* Vignette */}
          <div className="flex flex-col gap-1.5" id="adjustment-row-vignette">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-350 flex items-center gap-1.5">
                <Aperture className="w-3.5 h-3.5 text-zinc-500 shrink-0" /> Vignette strength
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {adjustments.vignette || 0}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={adjustments.vignette || 0}
              onChange={(e) => handleSliderChange('vignette', parseInt(e.target.value))}
              onPointerUp={(e) => handleSliderCommit('vignette', parseInt((e.currentTarget as HTMLInputElement).value))}
              onKeyUp={(e) => handleSliderCommit('vignette', parseInt((e.currentTarget as HTMLInputElement).value))}
              className="w-full accent-white h-1 bg-zinc-900 rounded-lg cursor-pointer"
              id="slider-vignette"
            />
          </div>

          {/* One-click Looks (Filters) */}
          <div className="flex flex-col gap-2 border-t border-zinc-900 pt-3" id="filters-grid-box">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">One-click looks</div>
            <div className="grid grid-cols-2 gap-2" id="filter-cards-holder">
              {filtersList.map((f) => {
                const isSelected = filter === f.id;
                return (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => onChangeFilter(f.id)}
                    className={`flex flex-col items-start p-2.5 rounded-xl text-left border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] select-none ${
                      isSelected 
                        ? f.previewClass + ' border-2 border-white shadow-inner font-bold' 
                        : 'bg-transparent text-zinc-450 border-zinc-905 hover:border-zinc-800 hover:bg-zinc-900/60'
                    }`}
                    id={`btn-filter-select-${f.id}`}
                  >
                    <span className="text-xs font-semibold leading-tight">
                      {f.label}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{f.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset Button */}
          <div className="border-t border-zinc-900 pt-3 flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 py-1.5 px-3 rounded-lg border border-zinc-800 transition cursor-pointer select-none"
              id="btn-reset-adjustments"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset sliders to zero
            </button>
          </div>
        </div>
      </AdvancedSection>
    </div>
  );
}
