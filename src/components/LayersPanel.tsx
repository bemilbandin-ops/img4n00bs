/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Type, 
  Paintbrush, 
  Image as ImageIcon,
  Square,
  CircleOff,
  MoreVertical,
  Layers
} from 'lucide-react';
import { EditorLayer } from '../types';
import AdvancedSection from './AdvancedSection';
import { ImageIcon as ImageIcon2 } from 'lucide-react'; // to avoid conflict if needed, or just use ImageIcon

interface LayersPanelProps {
  layers: EditorLayer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: (type: 'image' | 'drawing' | 'text' | 'shape', file?: File) => void;
  onDeleteLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onUpdateOpacity: (id: string, opacity: number) => void;
  onCommitOpacity: (id: string, opacity: number) => void;
  onReorderLayers: (id: string, direction: 'up' | 'down') => void;
  onRenameLayer: (id: string, newName: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMergeLayers: (id: string) => void;
  onUpdateBlendMode: (id: string, blendMode: string) => void;
  activeMaskLayerId: string | null;
  hasSelection: boolean;
  onAddLayerMask: (id: string, mode: 'reveal' | 'hide' | 'selection') => void;
  onRemoveBackground: (id: string) => void | Promise<void>;
  isRemovingBackground: boolean;
  removingBackgroundLayerId: string | null;
  onToggleLayerMask: (id: string) => void;
  onDeleteLayerMask: (id: string) => void;
  onSelectLayerMask: (id: string) => void;
  onAddBackgroundTemplate: () => void;
}

export default function LayersPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onToggleVisibility,
  onUpdateOpacity,
  onCommitOpacity,
  onReorderLayers,
  onRenameLayer,
  onDuplicateLayer,
  onMergeLayers,
  onUpdateBlendMode,
  activeMaskLayerId,
  hasSelection,
  onAddLayerMask,
  onRemoveBackground,
  isRemovingBackground,
  removingBackgroundLayerId,
  onToggleLayerMask,
  onDeleteLayerMask,
  onSelectLayerMask,
  onAddBackgroundTemplate
}: LayersPanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddLayer('image', file);
    }
    setShowAddMenu(false);
  };

  const handleStartRename = (layer: EditorLayer) => {
    setEditingLayerId(layer.id);
    setTempName(layer.name);
  };

  const handleSaveRename = (id: string) => {
    if (tempName.trim()) {
      onRenameLayer(id, tempName.trim());
    }
    setEditingLayerId(null);
  };

  return (
    <div className="ui-panel w-full h-full flex flex-col gap-4 rounded-xl border p-4 overflow-y-auto" id="editor-layers-panel">
      {/* Title & Add Action */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3" id="layers-panel-header">
        <div className="flex items-center gap-1.5" id="layers-title-box">
          <Layers className="w-4 h-4 text-text-secondary" />
          <h2 className="ui-section-title tracking-tight">Layers List</h2>
          <span className="bg-zinc-900 text-text-secondary px-2 py-0.5 rounded-full text-xs font-mono border border-zinc-800 ml-1">
            {layers.length}
          </span>
        </div>

        {/* Add part actions */}
        <div className="relative" id="add-layer-action-dropdown">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="ui-primary-button flex items-center gap-1 font-bold py-2 px-3 rounded-xl text-[13px] transition active:scale-95 cursor-pointer border"
            id="btn-add-layer-dropdown"
          >
            <Plus className="w-3.5 h-3.5" /> Add Layer
          </button>
          
          {showAddMenu && (
            <div className="absolute right-0 mt-2 w-44 bg-black border border-zinc-800 rounded-xl shadow-2xl z-30 flex flex-col p-1" id="add-layer-dropdown-menu">
              <button
                type="button"
                onClick={() => {
                  onAddLayer('drawing');
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2.5 p-2 px-3 text-xs text-left text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer"
                id="btn-add-drawing-layer"
              >
                <Paintbrush className="w-3.5 h-3.5 text-zinc-400" />
                <span>+ Drawing Layer</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onAddLayer('text');
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2.5 p-2 px-3 text-xs text-left text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer"
                id="btn-add-text-layer"
              >
                <Type className="w-3.5 h-3.5 text-zinc-400" />
                <span>+ Text Layer</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onAddLayer('shape');
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2.5 p-2 px-3 text-xs text-left text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer"
                id="btn-add-shape-layer"
              >
                <Square className="w-3.5 h-3.5 text-zinc-400" />
                <span>+ Shape Layer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2.5 p-2 px-3 text-xs text-left text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-lg transition cursor-pointer"
                id="btn-add-image-layer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>+ Image Layer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAddBackgroundTemplate();
                  setShowAddMenu(false);
                }}
                className="flex items-center gap-2.5 p-2 px-3 text-xs text-left text-zinc-300 hover:bg-zinc-900 hover:text-white rounded-lg border-t border-zinc-800 transition cursor-pointer"
                id="btn-add-background-template"
              >
                <ImageIcon2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-purple-400 font-medium">+ Background Template</span>
              </button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="hidden-layer-file-picker"
          />
        </div>
      </div>

      {/* Layer List Space */}
      <div className="flex flex-col gap-2 flex-1 min-h-0" id="layers-stack-list">
        {layers.length === 0 ? (
          <div className="py-8 text-center ui-helper font-sans flex flex-col items-center justify-center h-full gap-2" id="empty-layers-display">
            <ImageIcon className="w-8 h-8 opacity-25" />
            <span>No layers in this project.<br/>Add a layer to start editing.</span>
          </div>
        ) : (
          [...layers].reverse().map((layer, index) => {
            const actualIdx = layers.length - 1 - index;
            const isActive = layer.id === activeLayerId;
            const isEditing = editingLayerId === layer.id;

            let layerTypeIcon = <Paintbrush className="w-3.5 h-3.5 text-zinc-400" />;
            let layerTypeLabel = 'Drawing';
            if (layer.type === 'text') {
              layerTypeIcon = <Type className="w-3.5 h-3.5 text-zinc-400" />;
              layerTypeLabel = 'Text';
            } else if (layer.type === 'shape') {
              layerTypeIcon = <Square className="w-3.5 h-3.5 text-zinc-400" />;
              layerTypeLabel = 'Shape';
            } else if (layer.type === 'image') {
              layerTypeIcon = <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />;
              layerTypeLabel = 'Image';
            }

            return (
              <div
                key={layer.id}
                data-active={isActive ? 'true' : 'false'}
                className={`flex flex-col gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'ui-card border-panel-border text-text-primary shadow-md'
                    : 'bg-black/20 border-zinc-900/60 text-text-secondary hover:border-panel-border'
                }`}
                onClick={() => {
                  if (!isActive) onSelectLayer(layer.id);
                }}
                id={`layer-card-${layer.id}`}
              >
                {/* Default Layer Card Header Info (eye icon, layer name, type, ellipsis/options button) */}
                <div className="flex items-center justify-between" id={`layer-header-${layer.id}`}>
                  <div className="flex items-center gap-2 overflow-hidden flex-1" id={`layer-identity-${layer.id}`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(layer.id);
                      }}
                      className={`p-1 rounded-md transition cursor-pointer shrink-0 ${layer.visible ? 'text-zinc-400 hover:text-white' : 'text-zinc-700 hover:text-zinc-400'}`}
                      title={layer.visible ? "Hide Layer" : "Show Layer"}
                      id={`btn-visibility-${layer.id}`}
                    >
                      {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <div className="p-1 bg-black border border-zinc-900 rounded-lg flex items-center justify-center shrink-0">
                      {layerTypeIcon}
                    </div>

                    <div className="flex flex-col min-w-0" id={`layer-title-block-${layer.id}`}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onBlur={() => handleSaveRename(layer.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(layer.id);
                          }}
                          autoFocus
                          className="text-xs font-semibold text-white bg-black border border-zinc-800 rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-white"
                          onClick={(e) => e.stopPropagation()}
                          id={`input-rename-layer-${layer.id}`}
                        />
                      ) : (
                        <span className="text-[13px] font-semibold text-text-primary truncate">
                          {layer.name}
                        </span>
                      )}
                      <span className="ui-helper font-medium">
                        {layerTypeLabel} Layer
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" id={`layer-right-actions-${layer.id}`}>
                    {!isActive ? (
                      <MoreVertical className="w-3.5 h-3.5 text-zinc-600" />
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete layer "${layer.name}"?`)) {
                              onDeleteLayer(layer.id);
                            }
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                          title="Delete Layer"
                          id={`btn-delete-${layer.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details only for the ACTIVE layer */}
                {isActive && (
                  <div className="flex flex-col gap-3 mt-1.5 border-t border-zinc-900 pt-2.5" id={`layer-details-${layer.id}`}>
                    {/* Basic Controls (Opacity, Duplicate, Delete) */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-350">
                        <span>Opacity — see-through amount</span>
                        <span className="font-mono text-white font-bold">
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(layer.opacity * 100)}
                        onChange={(e) => {
                          onUpdateOpacity(layer.id, parseFloat(e.target.value) / 100);
                        }}
                        onPointerUp={(e) => {
                          e.stopPropagation();
                          onCommitOpacity(layer.id, parseFloat((e.currentTarget as HTMLInputElement).value) / 100);
                        }}
                        onKeyUp={(e) => {
                          onCommitOpacity(layer.id, parseFloat((e.currentTarget as HTMLInputElement).value) / 100);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full accent-white h-1 bg-zinc-800 rounded-lg cursor-pointer"
                        id={`layer-opacity-input-${layer.id}`}
                      />

                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateLayer(layer.id);
                          }}
                          className="flex-1 bg-white hover:bg-zinc-200 text-black font-bold py-1.5 px-2.5 rounded-lg text-xs transition cursor-pointer text-center shadow-sm"
                          id={`btn-duplicate-layer-${layer.id}`}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete layer "${layer.name}"?`)) {
                              onDeleteLayer(layer.id);
                            }
                          }}
                          className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-xs transition cursor-pointer text-center"
                          id={`btn-delete-layer-active-${layer.id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Advanced Layer Controls Section */}
                    <AdvancedSection title="Advanced layer controls" defaultOpen={true}>
                      <div className="flex flex-col gap-3">
                        {/* Rename option */}
                        <div className="flex items-center justify-between text-xs border-b border-zinc-900 pb-2">
                          <span className="text-zinc-400">Layer Name</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(layer);
                            }}
                            className="text-white hover:underline transition cursor-pointer text-xs font-semibold"
                            id={`btn-trigger-rename-${layer.id}`}
                          >
                            Rename Label
                          </button>
                        </div>

                        {/* Blend Mode */}
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-zinc-400 font-semibold">Blend mode — how this mixes</span>
                          <select
                            value={layer.blendMode || 'source-over'}
                            onChange={(e) => {
                              onUpdateBlendMode(layer.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-black text-white border border-zinc-800 rounded px-1.5 py-1 focus:outline-none focus:border-zinc-700 text-xs cursor-pointer w-full font-semibold"
                            id={`blend-mode-${layer.id}`}
                          >
                            <option value="source-over">Normal</option>
                            <option value="multiply">Multiply (Darken)</option>
                            <option value="screen">Screen (Lighten)</option>
                            <option value="overlay">Overlay</option>
                            <option value="darken">Darken</option>
                            <option value="lighten">Lighten</option>
                            <option value="color-dodge">Color Dodge</option>
                            <option value="color-burn">Color Burn</option>
                            <option value="hard-light">Hard Light</option>
                            <option value="soft-light">Soft Light</option>
                            <option value="difference">Difference</option>
                            <option value="exclusion">Exclusion</option>
                          </select>
                        </div>

                        {/* Merge Down */}
                        {actualIdx > 0 && (
                          <div className="flex flex-col gap-1 border-t border-zinc-900 pt-2.5">
                            <span className="text-xs text-zinc-400 font-semibold">Merge into layer below</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMergeLayers(layer.id);
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-semibold py-1.5 rounded text-xs transition cursor-pointer"
                              id={`btn-merge-layer-${layer.id}`}
                            >
                              Merge Down
                            </button>
                          </div>
                        )}

                        {/* Mask Controls */}
                        <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-2.5">
                          <span className="text-xs text-zinc-400 font-semibold">Mask — hide/reveal parts</span>
                          {layer.mask ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectLayerMask(layer.id);
                                }}
                                className={`flex-1 py-1.5 border rounded text-xs font-semibold cursor-pointer transition ${
                                  activeMaskLayerId === layer.id 
                                    ? 'border-white text-white bg-zinc-800' 
                                    : 'border-zinc-800 text-zinc-400 bg-zinc-900'
                                }`}
                                title="Edit layer mask"
                                id={`btn-select-mask-${layer.id}`}
                              >
                                {activeMaskLayerId === layer.id ? 'Editing Mask' : 'Edit Mask'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleLayerMask(layer.id);
                                }}
                                className="px-2.5 py-1.5 border border-zinc-800 rounded text-xs font-semibold text-zinc-300 bg-zinc-900 hover:text-white cursor-pointer"
                                id={`btn-toggle-mask-${layer.id}`}
                              >
                                {layer.mask.enabled ? 'Enabled' : 'Disabled'}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteLayerMask(layer.id);
                                }}
                                className="p-1 border border-zinc-800 rounded text-zinc-500 hover:text-red-400 bg-zinc-900 cursor-pointer"
                                title="Delete layer mask"
                                id={`btn-delete-mask-${layer.id}`}
                              >
                                <CircleOff className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddLayerMask(layer.id, 'reveal');
                                }}
                                className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-semibold py-1 px-1.5 rounded text-[11px] transition cursor-pointer"
                                id={`btn-add-reveal-mask-${layer.id}`}
                              >
                                Reveal All
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddLayerMask(layer.id, 'hide');
                                }}
                                className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-semibold py-1 px-1.5 rounded text-[11px] transition cursor-pointer"
                                id={`btn-add-hide-mask-${layer.id}`}
                              >
                                Hide All
                              </button>
                              {hasSelection && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddLayerMask(layer.id, 'selection');
                                  }}
                                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-semibold py-1 px-1.5 rounded text-[11px] transition cursor-pointer mt-1"
                                  id={`btn-add-selection-mask-${layer.id}`}
                                >
                                  Mask from Selection
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Remove Background */}
                        {(layer.type === 'image' || layer.type === 'drawing') && (
                          <div className="flex flex-col gap-1 border-t border-zinc-900 pt-2.5">
                            <span className="text-xs text-zinc-400 font-semibold">Remove background with mask</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveBackground(layer.id);
                              }}
                              disabled={isRemovingBackground}
                              className={`w-full bg-zinc-900 border border-zinc-800 text-white font-semibold py-1.5 rounded text-xs transition cursor-pointer ${
                                isRemovingBackground
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:border-zinc-700'
                              }`}
                              id={`btn-remove-background-${layer.id}`}
                            >
                              {isRemovingBackground && removingBackgroundLayerId === layer.id
                                ? 'Removing…'
                                : 'Remove Background'}
                            </button>
                          </div>
                        )}

                        {/* Reorder controls */}
                        <div className="flex flex-col gap-1.5 border-t border-zinc-900 pt-2.5">
                          <span className="text-xs text-zinc-400 font-semibold">Reorder layer</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderLayers(layer.id, 'up');
                              }}
                              disabled={actualIdx === layers.length - 1}
                              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                                actualIdx === layers.length - 1 
                                  ? 'border-zinc-900/50 bg-zinc-950 text-zinc-750 cursor-not-allowed opacity-30' 
                                  : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-white'
                              }`}
                              id={`btn-moveup-${layer.id}`}
                            >
                              <ChevronUp className="w-3.5 h-3.5" /> Move Up
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onReorderLayers(layer.id, 'down');
                              }}
                              disabled={actualIdx === 0}
                              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                                actualIdx === 0 
                                  ? 'border-zinc-900/50 bg-zinc-950 text-zinc-750 cursor-not-allowed opacity-30' 
                                  : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-white'
                              }`}
                              id={`btn-movedown-${layer.id}`}
                            >
                              <ChevronDown className="w-3.5 h-3.5" /> Move Down
                            </button>
                          </div>
                        </div>
                      </div>
                    </AdvancedSection>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
