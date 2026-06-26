/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { Keyboard, Maximize2, X } from 'lucide-react';

import Onboarding from './components/Onboarding';
import ToolRail from './components/ToolRail';
import TopBar from './components/TopBar';
import InspectorPanel, { InspectorTab } from './components/InspectorPanel';
import HelpPanel from './components/HelpPanel';
import LayersPanel from './components/LayersPanel';
import AdjustmentsPanel from './components/AdjustmentsPanel';
import ToolOptions from './components/ToolOptions';
import CanvasArea from './components/CanvasArea';
import BackgroundTemplates, { BackgroundTemplate } from './components/BackgroundTemplates';

import { 
  ToolType, 
  Point, 
  EditorLayer, 
  SelectionState, 
  HistoryEntry,
  ProjectHistoryState,
  EditorHistoryCommandType,
  EditorAdjustments,
  FilterType,
  EyedropperSource,
  ShapeData,
  ShapeKind
} from './types';
import { renderShapeToLayer, renderTextToLayer } from './utils/imageFilters';
import { getDefaultTransform, renderComposite } from './utils/renderComposite';
import { BitmapStore, cloneCanvas, createCanvas } from './utils/bitmapStore';
import {
  applyInverseLayerTransform,
  cropLayerTransform,
  flipLayerTransformHorizontally,
  flipLayerTransformVertically,
  offsetLayerTransform,
  remapPointBetweenCanvasCenters,
  rotateLayerTransform90,
  transformShapePoints
} from './utils/layerTransforms';
import {
  captureBitmapAssets,
  cloneLayer,
  createCheckpointEntry,
  createProjectHistoryState,
  getHistoryEntryState,
  restoreBitmapAssets
} from './utils/history';
import { deserializeProjectFile, serializeProjectFile } from './utils/projectFile';
import { addSelectionPath, clearSelection, getSelectionBounds } from './utils/selection';
import {
  LARGE_EXPORT_PIXEL_WARNING,
  LARGE_IMAGE_PIXEL_WARNING,
  formatLargeCanvasWarning,
  isLargeCanvas
} from './utils/safeguards';

const HISTORY_LIMIT = 50;
const MAX_RESIZE_DIMENSION = 5000;
const MAX_EXPORT_DIMENSION = 8000;
const MAX_RECENT_COLORS = 8;
type ResizeMode = 'image' | 'canvas';
type CanvasResizeAnchor = 'center' | 'top-left';
type ExportFormat = 'png' | 'jpeg' | 'webp';
type ExportBackgroundMode = 'transparent' | 'solid';
type BackgroundRemovalStatus = 'idle' | 'running' | 'error';
type BackgroundRemovalPreview = {
  layerId: string;
  maskId: string;
  previewUrl: string;
};

const KEYBOARD_SHORTCUTS = [
  { action: 'Undo', keys: ['Ctrl/Cmd + Z'] },
  { action: 'Redo', keys: ['Ctrl/Cmd + Shift + Z', 'Ctrl/Cmd + Y'] },
  { action: 'Zoom', keys: ['Ctrl/Cmd + +', 'Ctrl/Cmd + -'] },
  { action: 'Brush', keys: ['B'] },
  { action: 'Eraser', keys: ['E'] },
  { action: 'Text', keys: ['T'] },
  { action: 'Crop', keys: ['C'] },
  { action: 'Selection', keys: ['M'] },
  { action: 'Duplicate layer', keys: ['Ctrl/Cmd + J'] },
  { action: 'Delete layer', keys: ['Delete', 'Backspace'] }
];

const makeDefaultAdjustments = (): EditorAdjustments => ({
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  hue: 0,
  blur: 0,
  vignette: 0
});

const makeShapeData = (
  kind: ShapeKind,
  start: Point,
  end: Point,
  fillColor: string,
  strokeColor: string,
  strokeWidth: number,
  fillEnabled: boolean,
  strokeEnabled: boolean
): ShapeData => ({
  kind,
  x1: Math.round(start.x),
  y1: Math.round(start.y),
  x2: Math.round(end.x),
  y2: Math.round(end.y),
  fillColor,
  strokeColor,
  strokeWidth: Math.max(1, Math.round(strokeWidth)),
  fillEnabled: kind === 'line' || kind === 'arrow' ? false : fillEnabled,
  strokeEnabled
});

const toHexChannel = (value: number) => value.toString(16).padStart(2, '0');

const rgbToHex = (r: number, g: number, b: number) => (
  `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`
);

const pushUniqueColor = (colors: string[], color: string, limit = MAX_RECENT_COLORS) => {
  const normalized = color.toLowerCase();
  return [normalized, ...colors.filter(c => c.toLowerCase() !== normalized)].slice(0, limit);
};

const createLayerId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export default function App() {
  // Project canvas dimensions
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  
  // Track if we auto-created a drawing layer during the current stroke sequence
  const currentDrawStrokeLayerIdRef = useRef<string | null>(null);
  const bitmapStoreRef = useRef(new BitmapStore());
  const latestLayersRef = useRef<EditorLayer[]>([]);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const activePixelEditBeforeRef = useRef<HistoryEntry | null>(null);
  const [activeMaskLayerId, setActiveMaskLayerId] = useState<string | null>(null);
  
  // Layers State
  const [layers, setLayers] = useState<EditorLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');

  useEffect(() => {
    latestLayersRef.current = layers;
  }, [layers]);

  // Active Toolbar Tool
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTab>('tool');

  // Brush and Eraser properties
  const [brushSize, setBrushSize] = useState(12);
  const [brushColor, setBrushColor] = useState('#22c55e'); // Green default
  const [eraserSize, setEraserSize] = useState(16);
  const [cloneSourcePoint, setCloneSourcePoint] = useState<Point | null>(null);

  // Eyedropper properties
  const [eyedropperSource, setEyedropperSource] = useState<EyedropperSource>('composite');
  const [lastSampledColor, setLastSampledColor] = useState<string | null>(null);
  const [recentSampledColors, setRecentSampledColors] = useState<string[]>([]);
  const [swatches, setSwatches] = useState<string[]>([]);

  // Text Properties
  const [textText, setTextText] = useState('Type something!');
  const [textFontSize, setTextFontSize] = useState(36);
  const [textColor, setTextColor] = useState('#6366f1'); // Indigo default
  const [textFontFamily, setTextFontFamily] = useState('Outfit');

  // Shape Properties
  const [shapeKind, setShapeKind] = useState<ShapeKind>('rectangle');
  const [shapeFillColor, setShapeFillColor] = useState('#ffffff');
  const [shapeStrokeColor, setShapeStrokeColor] = useState('#111827');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(6);
  const [shapeFillEnabled, setShapeFillEnabled] = useState(true);
  const [shapeStrokeEnabled, setShapeStrokeEnabled] = useState(true);

  // Selection Overlay Details
  const [selection, setSelection] = useState<SelectionState>({
    type: null,
    startPoint: null,
    endPoint: null,
    points: [],
    active: false
  });

  // Draggable Crop overlay values
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Undo/Redo Engine history stack
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Onboarding Modal Visibility
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showBackgroundTemplatesModal, setShowBackgroundTemplatesModal] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  // Export Selector Options Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportWidth, setExportWidth] = useState(0);
  const [exportHeight, setExportHeight] = useState(0);
  const [exportLockAspect, setExportLockAspect] = useState(true);
  const [exportQuality, setExportQuality] = useState(92);
  const [exportBackgroundMode, setExportBackgroundMode] = useState<ExportBackgroundMode>('transparent');
  const [exportBackgroundColor, setExportBackgroundColor] = useState('#ffffff');
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [backgroundRemovalPreview, setBackgroundRemovalPreview] = useState<BackgroundRemovalPreview | null>(null);
  const [resizeMode, setResizeMode] = useState<ResizeMode>('image');
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [resizeLockAspect, setResizeLockAspect] = useState(true);
  const [resizeAnchor, setResizeAnchor] = useState<CanvasResizeAnchor>('center');
  const selectionClipboardRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSelectionClipboard, setHasSelectionClipboard] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [backgroundRemovalStatus, setBackgroundRemovalStatus] = useState<BackgroundRemovalStatus>('idle');
  const [backgroundRemovalLayerId, setBackgroundRemovalLayerId] = useState<string | null>(null);
  const [backgroundRemovalError, setBackgroundRemovalError] = useState<string | null>(null);
  const backgroundRemovalOperationRef = useRef<string | null>(null);

  const isRemovingBackground = backgroundRemovalStatus === 'running';

  // Load onboarding on first visit based on localStorage
  useEffect(() => {
    const done = localStorage.getItem('onboarding_done_v1');
    if (!done) {
      setShowOnboarding(true);
    }
  }, []);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('editor_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('editor_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing if the user is actively entering text in an input or textarea
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        const type = activeElement.getAttribute('type') || '';
        const isTextEntry = 
          activeElement.getAttribute('contenteditable') === 'true' ||
          tagName === 'textarea' ||
          (tagName === 'input' && !['file', 'checkbox', 'radio', 'button', 'submit', 'range', 'color'].includes(type));
        if (isTextEntry) {
          return;
        }
      }

      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const isMod = e.ctrlKey || e.metaKey;
      const lowerKey = e.key.toLowerCase();

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }

      if (isMod && isZ) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isMod && isY) {
        e.preventDefault();
        handleRedo();
      } else if (isMod && lowerKey === 'j') {
        e.preventDefault();
        if (activeLayerId) {
          handleDuplicateLayer(activeLayerId);
        }
      } else if (!isMod && !e.altKey && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        if (activeLayerId) {
          handleDeleteLayer(activeLayerId);
        }
      } else if (!isMod && !e.altKey) {
        const toolByKey: Partial<Record<string, ToolType>> = {
          b: 'brush',
          e: 'eraser',
          t: 'text',
          c: 'crop',
          m: 'select_rect'
        };
        const tool = toolByKey[lowerKey];
        if (tool) {
          e.preventDefault();
          handleToolSelectionChange(tool);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [history, historyIndex, activeLayerId, layers, canvasWidth, canvasHeight]);

  const getCommittedHistoryState = (): ProjectHistoryState | null => {
    const entry = history[historyIndex];
    return entry ? getHistoryEntryState(entry) : null;
  };

  const pushHistoryEntry = (entry: HistoryEntry) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    const boundedHistory = [...updatedHistory, entry].slice(-HISTORY_LIMIT);

    setHistory(boundedHistory);
    setHistoryIndex(boundedHistory.length - 1);
  };

  // Bitmap checkpoints are reserved for pixel-destructive operations such as brush strokes,
  // crop, resize, merge, cut, fill, and clear.
  const createPixelEditBeforeCheckpoint = (
    label = 'Before pixel edit',
    sourceLayers = layers,
    w = canvasWidth,
    h = canvasHeight,
    activeId = activeLayerId
  ) => {
    if (w <= 0 || h <= 0) return null;
    return createCheckpointEntry(label, sourceLayers, bitmapStoreRef.current, w, h, activeId);
  };

  const saveHistorySnapshot = (
    currentLayers: EditorLayer[],
    w: number,
    h: number,
    activeId: string,
    label = 'Pixel edit checkpoint',
    beforeCheckpoint: HistoryEntry | null = null
  ) => {
    if (w <= 0 || h <= 0) return;

    const afterCheckpoint = createCheckpointEntry(label, currentLayers, bitmapStoreRef.current, w, h, activeId);
    const updatedHistory = history.slice(0, historyIndex + 1);
    const entriesToAppend: HistoryEntry[] = [];
    const lastEntry = updatedHistory[updatedHistory.length - 1];

    if (beforeCheckpoint && lastEntry?.kind !== 'checkpoint') {
      entriesToAppend.push(beforeCheckpoint);
    }

    entriesToAppend.push(afterCheckpoint);
    const boundedHistory = [...updatedHistory, ...entriesToAppend].slice(-HISTORY_LIMIT);

    setHistory(boundedHistory);
    setHistoryIndex(boundedHistory.length - 1);
  };

  // Semantic commands store layer metadata and only capture bitmap assets for sources that
  // may not exist after undo/redo traversal, such as copied or duplicated layers.
  const saveHistoryCommand = (
    type: EditorHistoryCommandType,
    label: string,
    afterLayers: EditorLayer[],
    afterCanvasWidth = canvasWidth,
    afterCanvasHeight = canvasHeight,
    afterActiveLayerId = activeLayerId,
    bitmapSourceIds: string[] = []
  ) => {
    const before = getCommittedHistoryState();
    if (!before || afterCanvasWidth <= 0 || afterCanvasHeight <= 0) return;

    const after = createProjectHistoryState(afterLayers, afterCanvasWidth, afterCanvasHeight, afterActiveLayerId);
    const assets = captureBitmapAssets(bitmapSourceIds, bitmapStoreRef.current);

    pushHistoryEntry({
      kind: 'command',
      label,
      command: {
        type,
        label,
        before,
        after,
        beforeAssets: assets,
        afterAssets: assets
      }
    });
  };

  const restoreHistoryStep = (entry: Extract<HistoryEntry, { kind: 'checkpoint' }>['step']) => {
    bitmapStoreRef.current.clear();

    const restoredLayers = entry.layers.map((sl): EditorLayer => {
      const restoredCanvas = createCanvas(entry.canvasWidth, entry.canvasHeight);
      const ctx = restoredCanvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(sl.imageData, 0, 0);
      }
      bitmapStoreRef.current.setCanvas(sl.sourceId, restoredCanvas);
      if (sl.mask?.bitmapId && sl.maskImageData) {
        const restoredMask = createCanvas(entry.canvasWidth, entry.canvasHeight);
        const maskCtx = restoredMask.getContext('2d');
        if (maskCtx) {
          maskCtx.putImageData(sl.maskImageData, 0, 0);
        }
        bitmapStoreRef.current.setCanvas(sl.mask.bitmapId, restoredMask);
      }

      const { imageData: _imageData, maskImageData: _maskImageData, ...layer } = sl;
      return cloneLayer(layer);
    });

    latestLayersRef.current = restoredLayers;
    setLayers(restoredLayers);
    setCanvasWidth(entry.canvasWidth);
    setCanvasHeight(entry.canvasHeight);
    setActiveLayerId(entry.activeLayerId);
    setActiveMaskLayerId(null);
    bitmapStoreRef.current.pruneToLayers(restoredLayers);
  };

  const restoreProjectState = (
    state: ProjectHistoryState,
    bitmapAssets?: Parameters<typeof restoreBitmapAssets>[0]
  ) => {
    restoreBitmapAssets(bitmapAssets, bitmapStoreRef.current);

    const restoredLayers = state.layers.map((layer): EditorLayer => {
      const restoredLayer = cloneLayer(layer);

      if (!bitmapStoreRef.current.getCanvas(restoredLayer.sourceId)) {
        bitmapStoreRef.current.createBlank(restoredLayer.sourceId, state.canvasWidth, state.canvasHeight);
      }
      if (restoredLayer.mask && !bitmapStoreRef.current.getCanvas(restoredLayer.mask.bitmapId)) {
        const maskCanvas = bitmapStoreRef.current.createBlank(restoredLayer.mask.bitmapId, state.canvasWidth, state.canvasHeight);
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          maskCtx.fillStyle = '#ffffff';
          maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        }
      }

      if (restoredLayer.type === 'text' && restoredLayer.textData) {
        renderTextToLayer(restoredLayer, bitmapStoreRef.current);
      } else if (restoredLayer.type === 'shape' && restoredLayer.shapeData) {
        renderShapeToLayer(restoredLayer, bitmapStoreRef.current);
      }

      return restoredLayer;
    });

    latestLayersRef.current = restoredLayers;
    setLayers(restoredLayers);
    setCanvasWidth(state.canvasWidth);
    setCanvasHeight(state.canvasHeight);
    setActiveLayerId(state.activeLayerId);
    setActiveMaskLayerId(null);
    bitmapStoreRef.current.pruneToLayers(restoredLayers);
  };

  const restoreHistoryEntryState = (entry: HistoryEntry) => {
    if (entry.kind === 'checkpoint') {
      restoreHistoryStep(entry.step);
    } else {
      restoreProjectState(entry.command.after, entry.command.afterAssets);
    }
  };

  const restoreCommandUndoState = (entry: Extract<HistoryEntry, { kind: 'command' }>) => {
    restoreProjectState(entry.command.before, entry.command.beforeAssets);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const currentEntry = history[historyIndex];
      const targetIdx = historyIndex - 1;
      setHistoryIndex(targetIdx);

      if (currentEntry.kind === 'command') {
        restoreCommandUndoState(currentEntry);
      } else {
        restoreHistoryEntryState(history[targetIdx]);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      setHistoryIndex(targetIdx);
      restoreHistoryEntryState(history[targetIdx]);
    }
  };

  // Close onboarding
  const handleOnboardingClose = () => {
    localStorage.setItem('onboarding_done_v1', 'true');
    setShowOnboarding(false);
  };

  // Initialize Project Canvas based on image file
  const handleInitializeWithImage = (img: HTMLImageElement, name: string) => {
    // Set a maximum responsive editing dimension
    const maxDim = 900;
    let w = img.width;
    let h = img.height;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }

    const firstCanvas = createCanvas(w, h);
    const ctx = firstCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, w, h);
    }

    bitmapStoreRef.current.clear();
    const sourceId = createLayerId('src');
    bitmapStoreRef.current.setCanvas(sourceId, firstCanvas);

    const firstLayer: EditorLayer = {
      id: createLayerId('bg'),
      name: name.replace(/\.[^/.]+$/, "") || 'Background Photo',
      type: 'image',
      visible: true,
      opacity: 1,
      sourceId,
      transform: getDefaultTransform(),
      adjustments: makeDefaultAdjustments(),
      filter: 'none'
    };

    setLayers([firstLayer]);
    setCanvasWidth(w);
    setCanvasHeight(h);
    setActiveLayerId(firstLayer.id);
    setActiveMaskLayerId(null);
    setRecentSampledColors([]);
    setSwatches([]);
    setActiveInspectorTab('layers');

    const initialStep = createCheckpointEntry('Project initialized', [firstLayer], bitmapStoreRef.current, w, h, firstLayer.id);
    setHistory([initialStep]);
    setHistoryIndex(0);
  };

  const handleFileLoaded = (file: File) => {
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('Upload failed: choose a PNG, JPEG, WebP, GIF, or another browser-supported image file.');
      return;
    }

    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError('Upload failed: this image is over 25 MB. Use a smaller file for the browser editor.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('Upload failed: the browser could not read that file.');
    };
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (
          isLargeCanvas(img.width, img.height, LARGE_IMAGE_PIXEL_WARNING) &&
          !window.confirm(formatLargeCanvasWarning('image', img.width, img.height))
        ) {
          setUploadError('Upload cancelled: image is very large.');
          return;
        }
        handleInitializeWithImage(img, file.name);
      };
      img.onerror = () => {
        setUploadError('Upload failed: the image could not be decoded. Try a different file format.');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Onboarding starter presets
  const handleSelectSampleProject = (type: 'cat' | 'scenic' | 'blank') => {
    handleOnboardingClose();
    if (type === 'blank') {
      const w = 800;
      const h = 600;
      const sourceId = createLayerId('src');
      bitmapStoreRef.current.clear();
      const firstCanvas = bitmapStoreRef.current.createBlank(sourceId, w, h);
      const ctx = firstCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }

      const paintLayer: EditorLayer = {
        id: createLayerId('paint'),
        name: 'Canvas Paper',
        type: 'drawing',
        visible: true,
        opacity: 1,
        sourceId,
        transform: getDefaultTransform(),
        adjustments: makeDefaultAdjustments(),
        filter: 'none'
      };

      setLayers([paintLayer]);
      setCanvasWidth(w);
      setCanvasHeight(h);
      setActiveLayerId(paintLayer.id);
      setActiveMaskLayerId(null);
      setRecentSampledColors([]);
      setSwatches([]);

      const initialStep = createCheckpointEntry('Blank project initialized', [paintLayer], bitmapStoreRef.current, w, h, paintLayer.id);
      setHistory([initialStep]);
      setHistoryIndex(0);
    } else {
      const url = type === 'cat' 
        ? "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80" 
        : "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80";
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        handleInitializeWithImage(img, type === 'cat' ? 'Starter Cat' : 'Scenic Mountain');
      };
      img.src = url;
    }
  };

  const handleAddBackgroundTemplate = (template: BackgroundTemplate) => {
    setShowBackgroundTemplatesModal(false);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sourceId = createLayerId('src');
      
      // If project is blank/empty, initialize canvas size
      if (canvasWidth === 0 || canvasHeight === 0) {
        setCanvasWidth(img.naturalWidth);
        setCanvasHeight(img.naturalHeight);
      }
      
      const newCanvas = bitmapStoreRef.current.createBlank(sourceId, img.naturalWidth, img.naturalHeight);
      const ctx = newCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }

      const newId = createLayerId('img');
      const newLayer: EditorLayer = {
        id: newId,
        name: template.name,
        type: 'image',
        visible: true,
        opacity: 1,
        sourceId,
        transform: getDefaultTransform(),
        adjustments: makeDefaultAdjustments(),
        filter: 'none'
      };

      // Add as background (index 0)
      const nextStack = [newLayer, ...layers];
      setLayers(nextStack);
      latestLayersRef.current = nextStack;
      setActiveLayerId(newId);
      
      saveHistoryCommand('layer:add', 'Add background template', nextStack, canvasWidth || img.naturalWidth, canvasHeight || img.naturalHeight, newId);
    };
    img.src = template.url;
  };

  // Manage Active layer select
  const handleSelectLayer = (id: string) => {
    setActiveLayerId(id);
    if (activeMaskLayerId !== id) {
      setActiveMaskLayerId(null);
    }
    setActiveInspectorTab('layers');
    
    // Auto populate text properties if they clicked a text layer
    const target = layers.find(l => l.id === id);
    if (target && target.type === 'text' && target.textData) {
      setTextText(target.textData.text);
      setTextFontSize(target.textData.fontSize);
      setTextColor(target.textData.color);
      setTextFontFamily(target.textData.fontFamily);
    }
    if (target && target.type === 'shape' && target.shapeData) {
      setShapeKind(target.shapeData.kind);
      setShapeFillColor(target.shapeData.fillColor);
      setShapeStrokeColor(target.shapeData.strokeColor);
      setShapeStrokeWidth(target.shapeData.strokeWidth);
      setShapeFillEnabled(target.shapeData.fillEnabled);
      setShapeStrokeEnabled(target.shapeData.strokeEnabled);
    }
  };

  // Add different layers
  const handleAddLayer = (type: 'image' | 'drawing' | 'text' | 'shape', file?: File) => {
    if (canvasWidth === 0) return; // Need initialized workspace first
    setActiveInspectorTab('layers');

    const sourceId = createLayerId('src');
    const layerCanvas = bitmapStoreRef.current.createBlank(sourceId, canvasWidth, canvasHeight);

    const newId = createLayerId('layer');
    let newName = '';

    if (type === 'drawing') {
      newName = `Drawing Layer ${layers.length + 1}`;
    } else if (type === 'text') {
      newName = `Text Layer ${layers.length + 1}`;
    } else if (type === 'shape') {
      newName = `Shape Layer ${layers.length + 1}`;
    } else if (type === 'image' && file) {
      newName = file.name.replace(/\.[^/.]+$/, "");
    } else {
      newName = `Image Layer ${layers.length + 1}`;
    }

    const baseLayer = {
      id: newId,
      name: newName,
      visible: true,
      opacity: 1,
      sourceId,
      transform: getDefaultTransform(),
      adjustments: makeDefaultAdjustments(),
      filter: 'none' as const
    };
    const created: EditorLayer = type === 'text'
      ? {
          ...baseLayer,
          type: 'text',
          textData: {
            text: textText,
            fontSize: textFontSize,
            color: textColor,
            fontFamily: textFontFamily,
            x: canvasWidth / 2,
            y: canvasHeight / 2
          }
        }
      : type === 'shape'
        ? {
            ...baseLayer,
            type: 'shape',
            shapeData: makeShapeData(
              shapeKind,
              {
                x: canvasWidth / 2 - Math.min(220, Math.max(80, canvasWidth * 0.35)) / 2,
                y: canvasHeight / 2 - Math.min(140, Math.max(60, canvasHeight * 0.25)) / 2
              },
              {
                x: canvasWidth / 2 + Math.min(220, Math.max(80, canvasWidth * 0.35)) / 2,
                y: canvasHeight / 2 + Math.min(140, Math.max(60, canvasHeight * 0.25)) / 2
              },
              shapeFillColor,
              shapeStrokeColor,
              shapeStrokeWidth,
              shapeFillEnabled,
              shapeStrokeEnabled
            )
          }
        : {
            ...baseLayer,
            type
          };

    if (type === 'image' && file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Draw image centered and fitted proportional matching workspace
          const ctx = layerCanvas.getContext('2d');
          if (ctx) {
            const ratio = Math.min(canvasWidth / img.width, canvasHeight / img.height, 1);
            const w = img.width * ratio;
            const h = img.height * ratio;
            const x = (canvasWidth - w) / 2;
            const y = (canvasHeight - h) / 2;
            ctx.drawImage(img, x, y, w, h);
          }
          const nextStack = [...layers, created];
          setLayers(nextStack);
          setActiveLayerId(newId);
          saveHistoryCommand('layer:add', 'Add image layer', nextStack, canvasWidth, canvasHeight, newId, [sourceId]);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      if (type === 'text') {
        renderTextToLayer(created, bitmapStoreRef.current);
      } else if (type === 'shape') {
        renderShapeToLayer(created, bitmapStoreRef.current);
      }
      const nextStack = [...layers, created];
      const labelByType = type === 'text' ? 'Add text layer' : type === 'shape' ? 'Add shape layer' : 'Add drawing layer';
      setLayers(nextStack);
      setActiveLayerId(newId);
      saveHistoryCommand('layer:add', labelByType, nextStack, canvasWidth, canvasHeight, newId);
    }
  };

  const handleDeleteLayer = (id: string) => {
    const nextStack = layers.filter(l => l.id !== id);
    setLayers(nextStack);
    if (activeMaskLayerId === id) {
      setActiveMaskLayerId(null);
    }
    
    // Choose replacement active layer if active was Deleted
    if (activeLayerId === id && nextStack.length > 0) {
      const newActive = nextStack[nextStack.length - 1].id;
      setActiveLayerId(newActive);
    }
    const deletedLayer = layers.find(l => l.id === id);
    saveHistoryCommand(
      'layer:delete',
      'Delete layer',
      nextStack,
      canvasWidth,
      canvasHeight,
      activeLayerId === id && nextStack.length > 0 ? nextStack[nextStack.length - 1].id : '',
      [deletedLayer?.sourceId, deletedLayer?.mask?.bitmapId].filter(Boolean) as string[]
    );
    bitmapStoreRef.current.pruneToLayers(nextStack);
  };

  const createMaskCanvas = (bitmapId: string, mode: 'reveal' | 'hide' | 'selection') => {
    const maskCanvas = bitmapStoreRef.current.createBlank(bitmapId, canvasWidth, canvasHeight);
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return maskCanvas;

    if (mode === 'reveal') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    if (mode === 'selection' && addSelectionPath(ctx, selection)) {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    return maskCanvas;
  };

  const handleAddLayerMask = (id: string, mode: 'reveal' | 'hide' | 'selection') => {
    if (canvasWidth === 0 || canvasHeight === 0) return;
    if (mode === 'selection' && !getSelectionBounds(selection, canvasWidth, canvasHeight)) return;

    const maskId = createLayerId('mask');
    createMaskCanvas(maskId, mode);

    const nextStack = layers.map(layer => layer.id === id
      ? { ...layer, mask: { bitmapId: maskId, enabled: true, linked: true } }
      : layer
    );

    setLayers(nextStack);
    latestLayersRef.current = nextStack;
    setActiveLayerId(id);
    setActiveMaskLayerId(id);
    setSelection(clearSelection());
    saveHistoryCommand('layer:mask', 'Add layer mask', nextStack, canvasWidth, canvasHeight, id, [maskId]);
  };

  const handlePreviewRemoveBackground = async (id: string) => {
    const target = layers.find(layer => layer.id === id);
    if (!target || (target.type !== 'image' && target.type !== 'drawing')) {
      setUploadError('Remove background works on image and drawing layers.');
      return;
    }
    if (target.mask) {
      setUploadError('Remove background creates a mask. Delete the current mask first.');
      return;
    }

    const source = bitmapStoreRef.current.getCanvas(target.sourceId);
    if (!source) {
      setUploadError('Remove background failed: layer pixels are missing.');
      return;
    }

    // Generate a unique operation token for stale-operation protection
    const operationId = crypto.randomUUID();
    backgroundRemovalOperationRef.current = operationId;
    const operationLayerId = id;
    const sourceWidth = source.width;
    const sourceHeight = source.height;

    setBackgroundRemovalStatus('running');
    setBackgroundRemovalLayerId(id);
    setBackgroundRemovalError(null);
    setUploadError('');

    try {
      const maskId = createLayerId('mask');
      const { createBackgroundRemovalMask } = await import('./utils/backgroundRemoval');
      const mask = await createBackgroundRemovalMask(source);

      // Stale-operation guard: verify nothing changed while we awaited
      const latestTarget = latestLayersRef.current.find(layer => layer.id === operationLayerId);
      const latestSource = latestTarget
        ? bitmapStoreRef.current.getCanvas(latestTarget.sourceId)
        : null;

      if (
        backgroundRemovalOperationRef.current !== operationId ||
        !latestTarget ||
        latestTarget.mask ||
        !latestSource ||
        latestSource.width !== sourceWidth ||
        latestSource.height !== sourceHeight
      ) {
        // Operation is stale — discard result silently
        return;
      }

      bitmapStoreRef.current.setCanvas(maskId, mask);

      const preview = cloneCanvas(source);
      const previewCtx = preview.getContext('2d');
      if (previewCtx) {
        previewCtx.globalCompositeOperation = 'destination-in';
        previewCtx.drawImage(mask, 0, 0, preview.width, preview.height);
        previewCtx.globalCompositeOperation = 'source-over';
      }

      setBackgroundRemovalPreview({
        layerId: id,
        maskId,
        previewUrl: preview.toDataURL('image/png')
      });
    } catch {
      setBackgroundRemovalError(
        'Remove background failed: AI model could not process this image.'
      );
      setBackgroundRemovalStatus('error');
    } finally {
      setBackgroundRemovalStatus(prev => prev === 'running' ? 'idle' : prev);
      setBackgroundRemovalLayerId(null);
    }
  };

  const handleCancelRemoveBackground = () => {
    if (backgroundRemovalPreview) {
      bitmapStoreRef.current.delete(backgroundRemovalPreview.maskId);
    }
    setBackgroundRemovalPreview(null);
  };

  const handleApplyRemoveBackground = () => {
    if (isRemovingBackground) return;
    if (!backgroundRemovalPreview) return;
    const { layerId, maskId } = backgroundRemovalPreview;
    const target = layers.find(layer => layer.id === layerId);
    if (!target || target.mask || !bitmapStoreRef.current.getCanvas(maskId)) {
      handleCancelRemoveBackground();
      return;
    }

    const nextStack = layers.map(layer => layer.id === layerId
      ? { ...layer, mask: { bitmapId: maskId, enabled: true, linked: true } }
      : layer
    );

    setLayers(nextStack);
    latestLayersRef.current = nextStack;
    setActiveLayerId(layerId);
    setActiveMaskLayerId(layerId);
    setSelection(clearSelection());
    setBackgroundRemovalPreview(null);
    saveHistoryCommand('layer:mask', 'Remove background', nextStack, canvasWidth, canvasHeight, layerId, [maskId]);
  };

  const handleToggleLayerMask = (id: string) => {
    const nextStack = layers.map(layer => layer.id === id && layer.mask
      ? { ...layer, mask: { ...layer.mask, enabled: !layer.mask.enabled } }
      : layer
    );
    setLayers(nextStack);
    latestLayersRef.current = nextStack;
    saveHistoryCommand('layer:mask', 'Toggle layer mask', nextStack, canvasWidth, canvasHeight, activeLayerId);
  };

  const handleDeleteLayerMask = (id: string) => {
    const target = layers.find(layer => layer.id === id);
    if (!target?.mask) return;

    const maskId = target.mask.bitmapId;
    const nextStack = layers.map(layer => {
      if (layer.id !== id) return layer;
      const { mask: _mask, ...rest } = layer;
      return rest;
    });

    setLayers(nextStack);
    latestLayersRef.current = nextStack;
    if (activeMaskLayerId === id) {
      setActiveMaskLayerId(null);
    }
    saveHistoryCommand('layer:mask', 'Delete layer mask', nextStack, canvasWidth, canvasHeight, activeLayerId, [maskId]);
    bitmapStoreRef.current.pruneToLayers(nextStack);
  };

  const handleSelectLayerMask = (id: string) => {
    const target = layers.find(layer => layer.id === id);
    if (!target?.mask) return;
    setActiveLayerId(id);
    setActiveMaskLayerId(activeMaskLayerId === id ? null : id);
  };

  const handleToggleVisibility = (id: string) => {
    const nextStack = layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
    setLayers(nextStack);
    // Don't save transient toggles to main pixel histories, or we can, let's do it to keep sync
    saveHistoryCommand('layer:visibility', 'Toggle layer visibility', nextStack, canvasWidth, canvasHeight, activeLayerId);
  };

  const handleUpdateOpacity = (id: string, opacity: number) => {
    const nextStack = layers.map(l => l.id === id ? { ...l, opacity } : l);
    setLayers(nextStack);
    latestLayersRef.current = nextStack;
  };

  const handleCommitOpacity = (id: string, opacity: number) => {
    const nextStack = latestLayersRef.current.map(l => l.id === id ? { ...l, opacity } : l);
    setLayers(nextStack);
    latestLayersRef.current = nextStack;
    saveHistoryCommand('layer:opacity', 'Change layer opacity', nextStack, canvasWidth, canvasHeight, activeLayerId);
  };

  const handleDuplicateLayer = (id: string) => {
    const target = layers.find(l => l.id === id);
    if (!target || canvasWidth === 0) return;

    const duplicateSourceId = createLayerId('src');
    const dupCanvas = bitmapStoreRef.current.cloneTo(target.sourceId, duplicateSourceId);
    if (!dupCanvas) return;
    const duplicateMaskId = target.mask ? createLayerId('mask') : undefined;
    if (target.mask && duplicateMaskId) {
      bitmapStoreRef.current.cloneTo(target.mask.bitmapId, duplicateMaskId);
    }

    const dupLayer = cloneLayer(target);
    dupLayer.id = createLayerId('dup');
    dupLayer.name = `${target.name} Copy`;
    dupLayer.sourceId = duplicateSourceId;
    dupLayer.mask = target.mask && duplicateMaskId
      ? { ...target.mask, bitmapId: duplicateMaskId }
      : undefined;

    const index = layers.findIndex(l => l.id === id);
    const nextLayers = [...layers];
    nextLayers.splice(index + 1, 0, dupLayer);

    setLayers(nextLayers);
    setActiveLayerId(dupLayer.id);
    saveHistoryCommand(
      'layer:duplicate',
      'Duplicate layer',
      nextLayers,
      canvasWidth,
      canvasHeight,
      dupLayer.id,
      [duplicateSourceId, duplicateMaskId].filter(Boolean) as string[]
    );
  };

  const handleMergeLayers = (id: string) => {
    const idx = layers.findIndex(l => l.id === id);
    if (idx <= 0 || canvasWidth === 0) return;

    const beforeCheckpoint = createPixelEditBeforeCheckpoint('Before merge');
    const topLayer = layers[idx];
    const bottomLayer = layers[idx - 1];
    const mergeCanvas = renderComposite({
      layers: [bottomLayer, topLayer],
      bitmapStore: bitmapStoreRef.current,
      width: canvasWidth,
      height: canvasHeight
    });

    bitmapStoreRef.current.setCanvas(bottomLayer.sourceId, mergeCanvas);

    const updatedBottomLayer: EditorLayer = {
      ...bottomLayer,
      name: `${bottomLayer.name} (Merged)`,
      opacity: 1,
      blendMode: 'source-over',
      transform: getDefaultTransform(),
      filter: 'none',
      adjustments: makeDefaultAdjustments()
    };

    const nextLayers = [...layers];
    nextLayers.splice(idx, 1);
    nextLayers[idx - 1] = updatedBottomLayer;
    bitmapStoreRef.current.pruneToLayers(nextLayers);

    setLayers(nextLayers);
    setActiveLayerId(updatedBottomLayer.id);
    saveHistorySnapshot(nextLayers, canvasWidth, canvasHeight, updatedBottomLayer.id, 'Merge layers', beforeCheckpoint);
  };

  const handleUpdateBlendMode = (id: string, blendMode: string) => {
    const nextStack = layers.map(l => l.id === id ? { ...l, blendMode } : l);
    setLayers(nextStack);
    saveHistoryCommand('layer:blend-mode', 'Change blend mode', nextStack, canvasWidth, canvasHeight, activeLayerId);
  };

  const handleReorderLayers = (id: string, direction: 'up' | 'down') => {
    const idx = layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;

    const nextStack = [...layers];
    const temp = nextStack[idx];
    nextStack[idx] = nextStack[targetIdx];
    nextStack[targetIdx] = temp;

    setLayers(nextStack);
    saveHistoryCommand('layer:reorder', 'Reorder layer', nextStack, canvasWidth, canvasHeight, activeLayerId);
  };

  const handleRenameLayer = (id: string, newName: string) => {
    const nextStack = layers.map(l => l.id === id ? { ...l, name: newName } : l);
    setLayers(nextStack);
    // Silent history save
    saveHistoryCommand('layer:rename', 'Rename layer', nextStack, canvasWidth, canvasHeight, activeLayerId);
  };

  // Live slider preview on active layer. History is committed on slider release.
  const handleChangeAdjustments = (adjustments: EditorAdjustments) => {
    setActiveInspectorTab('adjust');
    setLayers(prev => {
      const nextLayers = prev.map(l => l.id === activeLayerId ? { ...l, adjustments } : l);
      latestLayersRef.current = nextLayers;
      return nextLayers;
    });
  };

  const handleCommitAdjustments = (adjustments: EditorAdjustments) => {
    setActiveInspectorTab('adjust');
    const nextLayers = latestLayersRef.current.map(l => l.id === activeLayerId ? { ...l, adjustments } : l);
    setLayers(nextLayers);
    latestLayersRef.current = nextLayers;
    saveHistoryCommand('layer:adjustments', 'Change adjustments', nextLayers, canvasWidth, canvasHeight, activeLayerId);
  };

  const handleChangeFilter = (filter: FilterType) => {
    setActiveInspectorTab('adjust');
    const nextLayers = latestLayersRef.current.map(l => l.id === activeLayerId ? { ...l, filter } : l);
    setLayers(nextLayers);
    latestLayersRef.current = nextLayers;
    saveHistoryCommand('layer:filter', 'Change filter', nextLayers, canvasWidth, canvasHeight, activeLayerId);
  };

  const resetLayerAdjustments = (layerId: string) => {
    const nextLayers = latestLayersRef.current.map((layer) => (
      layer.id === layerId
        ? {
            ...layer,
            adjustments: makeDefaultAdjustments(),
            filter: 'none' as FilterType
          }
        : layer
    ));
    setLayers(nextLayers);
    latestLayersRef.current = nextLayers;
    saveHistoryCommand('layer:adjustments', 'Reset layer adjustments', nextLayers, canvasWidth, canvasHeight, layerId);
  };

  const drawCloneSegment = (
    canvas: HTMLCanvasElement,
    points: Point[],
    sourcePoint: Point,
    heal: boolean
  ) => {
    if (points.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p2 = points[points.length - 1];
    const start = points[0];
    const radius = Math.max(1, brushSize / 2);
    const sx = sourcePoint.x + (p2.x - start.x) - radius;
    const sy = sourcePoint.y + (p2.y - start.y) - radius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = heal ? 0.65 : 1;
    ctx.drawImage(canvas, sx, sy, radius * 2, radius * 2, p2.x - radius, p2.y - radius, radius * 2, radius * 2);
    ctx.restore();
  };

  // Handle start of draw stroke on mouse down to ensure layer exists synchronously
  const handleDrawStart = () => {
    if (canvasWidth === 0) return;
    let activeLayer = layers.find(l => l.id === activeLayerId);
    if (activeMaskLayerId && activeLayer?.mask) {
      currentDrawStrokeLayerIdRef.current = activeLayer.id;
      activePixelEditBeforeRef.current = createPixelEditBeforeCheckpoint('Before mask stroke', layers, canvasWidth, canvasHeight, activeLayer.id);
      return;
    }

    if (activeTool === 'cloneStamp' || activeTool === 'healingBrush') {
      if (!activeLayer || !activeLayer.visible || (activeLayer.type !== 'image' && activeLayer.type !== 'drawing')) {
        setUploadError('Clone and heal work on visible bitmap layers.');
        return;
      }
      if (!cloneSourcePoint) {
        setUploadError('Alt-click the canvas to choose a clone source first.');
        return;
      }
      currentDrawStrokeLayerIdRef.current = activeLayer.id;
      activePixelEditBeforeRef.current = createPixelEditBeforeCheckpoint('Before clone stroke', layers, canvasWidth, canvasHeight, activeLayer.id);
      setUploadError('');
      return;
    }

    if (activeTool === 'eraser') {
      if (!activeLayer || !activeLayer.visible || (activeLayer.type !== 'image' && activeLayer.type !== 'drawing')) {
        setUploadError('Eraser works on visible image or drawing layers.');
        return;
      }
      currentDrawStrokeLayerIdRef.current = activeLayer.id;
      activePixelEditBeforeRef.current = createPixelEditBeforeCheckpoint('Before eraser stroke', layers, canvasWidth, canvasHeight, activeLayer.id);
      setUploadError('');
      return;
    }

    if (!activeLayer || activeLayer.type !== 'drawing') {
      // Find compile existing drawing layer first
      const existingDrawing = layers.find(l => l.type === 'drawing');
      if (existingDrawing) {
        setActiveLayerId(existingDrawing.id);
        currentDrawStrokeLayerIdRef.current = existingDrawing.id;
      } else {
        const sourceId = createLayerId('src');
        bitmapStoreRef.current.createBlank(sourceId, canvasWidth, canvasHeight);

        const newId = createLayerId('paint');
        const newLayer: EditorLayer = {
          id: newId,
          name: `Drawing Layer ${layers.length + 1}`,
          type: 'drawing',
          visible: true,
          opacity: 1,
          sourceId,
          transform: getDefaultTransform(),
          adjustments: makeDefaultAdjustments(),
          filter: 'none'
        };

        const nextLayers = [...layers, newLayer];
        setLayers(nextLayers);
        setActiveLayerId(newId);
        currentDrawStrokeLayerIdRef.current = newId;
        saveHistoryCommand('layer:add', 'Add drawing layer', nextLayers, canvasWidth, canvasHeight, newId);
        activePixelEditBeforeRef.current = createPixelEditBeforeCheckpoint('Before brush stroke', nextLayers, canvasWidth, canvasHeight, newId);
      }
    } else {
      currentDrawStrokeLayerIdRef.current = activeLayer.id;
      activePixelEditBeforeRef.current = createPixelEditBeforeCheckpoint('Before brush stroke', layers, canvasWidth, canvasHeight, activeLayer.id);
    }
  };

  // Progressive Drawing on mouse drag
  const handleDrawStroke = (points: Point[], isEraser: boolean) => {
    if (layers.length === 0) return;
    
    const targetId = currentDrawStrokeLayerIdRef.current || activeLayerId;
    let activeLayer = layers.find(l => l.id === targetId);
    let workspaceLayers = [...layers];
    const isEditingMask = activeMaskLayerId === targetId && Boolean(activeLayer?.mask);
    const isCloning = activeTool === 'cloneStamp' || activeTool === 'healingBrush';

    if (isCloning) {
      if (!activeLayer || !cloneSourcePoint || !activeLayer.visible || (activeLayer.type !== 'image' && activeLayer.type !== 'drawing')) return;
      const activeCanvas = bitmapStoreRef.current.getCanvas(activeLayer.sourceId);
      if (!activeCanvas) return;
      drawCloneSegment(activeCanvas, points, cloneSourcePoint, activeTool === 'healingBrush');
      latestLayersRef.current = workspaceLayers;
      setLayers([...workspaceLayers]);
      return;
    }
    
    // Fallback if somehow not caught in handleDrawStart
    if (!isEditingMask && isEraser && (!activeLayer || !activeLayer.visible || (activeLayer.type !== 'image' && activeLayer.type !== 'drawing'))) {
      return;
    }

    if (!isEditingMask && !isEraser && (!activeLayer || activeLayer.type !== 'drawing')) {
      const sourceId = createLayerId('src');
      bitmapStoreRef.current.createBlank(sourceId, canvasWidth, canvasHeight);
      
      const newId = createLayerId('paint');
      activeLayer = {
        id: newId,
        name: `Drawing Layer ${layers.length + 1}`,
        type: 'drawing',
        visible: true,
        opacity: 1,
        sourceId,
        transform: getDefaultTransform(),
        adjustments: makeDefaultAdjustments(),
        filter: 'none'
      };
      
      workspaceLayers = [...layers, activeLayer];
      setLayers(workspaceLayers);
      setActiveLayerId(newId);
      currentDrawStrokeLayerIdRef.current = newId;
      if (!activePixelEditBeforeRef.current) {
        activePixelEditBeforeRef.current = createPixelEditBeforeCheckpoint('Before brush stroke', workspaceLayers, canvasWidth, canvasHeight, newId);
      }
    }

    if (!activeLayer) return;
    const activeCanvas = bitmapStoreRef.current.getCanvas(
      isEditingMask && activeLayer.mask ? activeLayer.mask.bitmapId : activeLayer.sourceId
    );
    const ctx = activeCanvas?.getContext('2d');
    if (!activeCanvas || !ctx) return;

    // Draw previous point segment line to current point
    if (points.length < 2) return;
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = isEditingMask ? '#ffffff' : brushColor;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();

    latestLayersRef.current = workspaceLayers;
    setLayers([...workspaceLayers]);
  };

  // Mouse up finalizes brush strokes into history undo stack
  const handleFinalizeStroke = () => {
    const finalLayersId = currentDrawStrokeLayerIdRef.current || activeLayerId;
    saveHistorySnapshot(
      latestLayersRef.current,
      canvasWidth,
      canvasHeight,
      finalLayersId,
      activeTool === 'cloneStamp' ? 'Clone stamp stroke' : activeTool === 'healingBrush' ? 'Healing brush stroke' : activeTool === 'eraser' ? 'Eraser stroke' : activeMaskLayerId ? 'Mask stroke' : 'Brush stroke',
      activePixelEditBeforeRef.current
    );
    currentDrawStrokeLayerIdRef.current = null;
    activePixelEditBeforeRef.current = null;
  };

  // Text options changes re-rendered live
  const updateActiveTextLayer = (patch: Partial<NonNullable<EditorLayer['textData']>>) => {
    setLayers(prev => {
      const nextLayers = prev.map(l => {
        if (l.id === activeLayerId && l.type === 'text' && l.textData) {
          const nextLayer = {
            ...l,
            textData: { ...l.textData, ...patch }
          };
          renderTextToLayer(nextLayer, bitmapStoreRef.current);
          return nextLayer;
        }
        return l;
      });
      latestLayersRef.current = nextLayers;
      return nextLayers;
    });
  };

  const handleTextTextChange = (text: string) => {
    setTextText(text);
    updateActiveTextLayer({ text });
  };

  const handleTextFontSizeChange = (fontSize: number) => {
    setTextFontSize(fontSize);
    updateActiveTextLayer({ fontSize });
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    updateActiveTextLayer({ color });
  };

  const handleTextFontFamilyChange = (fontFamily: string) => {
    setTextFontFamily(fontFamily);
    updateActiveTextLayer({ fontFamily });
  };

  const handleCommitTextEdit = () => {
    if (!activeLayerId) return;
    saveHistoryCommand('layer:text', 'Edit text layer', latestLayersRef.current, canvasWidth, canvasHeight, activeLayerId);
  };

  // Clicking canvas repositions active text layer
  const handleUpdateTextPosition = (x: number, y: number) => {
    if (layers.length === 0) return;
    
    let activeLayer = layers.find(l => l.id === activeLayerId);
    let nextStack = [...layers];

    if (!activeLayer || activeLayer.type !== 'text') {
      const sourceId = createLayerId('src');
      bitmapStoreRef.current.createBlank(sourceId, canvasWidth, canvasHeight);
      const newId = createLayerId('text');
      
      activeLayer = {
        id: newId,
        name: `Text Layer ${layers.length + 1}`,
        type: 'text',
        visible: true,
        opacity: 1,
        sourceId,
        transform: getDefaultTransform(),
        adjustments: makeDefaultAdjustments(),
        filter: 'none',
        textData: {
          text: textText,
          fontSize: textFontSize,
          color: textColor,
          fontFamily: textFontFamily,
          x,
          y
        }
      };
      nextStack = [...layers, activeLayer];
      setActiveLayerId(newId);
    } else if (activeLayer.textData) {
      activeLayer = {
        ...activeLayer,
        textData: {
          ...activeLayer.textData,
          x,
          y
        }
      };
      nextStack = layers.map(l => l.id === activeLayerId ? activeLayer as EditorLayer : l);
    }

    renderTextToLayer(activeLayer, bitmapStoreRef.current);
    latestLayersRef.current = nextStack;
    setLayers(nextStack);
    saveHistoryCommand(activeLayer.type === 'text' ? 'layer:text' : 'layer:add', activeLayer.type === 'text' ? 'Move text layer' : 'Add text layer', nextStack, canvasWidth, canvasHeight, activeLayer.id);
  };

  const handleStampNewTextFromOptions = () => {
    handleAddLayer('text');
  };

  const updateActiveShapeLayer = (patch: Partial<ShapeData>) => {
    const baseLayers = latestLayersRef.current.length > 0 ? latestLayersRef.current : layers;
    const nextLayers = baseLayers.map(l => {
      if (l.id === activeLayerId && l.type === 'shape' && l.shapeData) {
        const nextLayer = {
          ...l,
          shapeData: {
            ...l.shapeData,
            ...patch,
            fillEnabled: patch.kind === 'line' || patch.kind === 'arrow' ? false : patch.fillEnabled ?? l.shapeData.fillEnabled
          }
        };
        renderShapeToLayer(nextLayer, bitmapStoreRef.current);
        return nextLayer;
      }
      return l;
    });
    latestLayersRef.current = nextLayers;
    setLayers(nextLayers);
  };

  const handleShapeKindChange = (kind: ShapeKind) => {
    setShapeKind(kind);
    updateActiveShapeLayer({ kind, fillEnabled: kind === 'line' || kind === 'arrow' ? false : shapeFillEnabled });
  };

  const handleShapeFillColorChange = (fillColor: string) => {
    setShapeFillColor(fillColor);
    updateActiveShapeLayer({ fillColor });
  };

  const handleShapeStrokeColorChange = (strokeColor: string) => {
    setShapeStrokeColor(strokeColor);
    updateActiveShapeLayer({ strokeColor });
  };

  const handleShapeStrokeWidthChange = (strokeWidth: number) => {
    const nextWidth = Math.max(1, Math.min(80, Math.round(strokeWidth)));
    setShapeStrokeWidth(nextWidth);
    updateActiveShapeLayer({ strokeWidth: nextWidth });
  };

  const handleShapeFillEnabledChange = (fillEnabled: boolean) => {
    setShapeFillEnabled(fillEnabled);
    updateActiveShapeLayer({ fillEnabled });
  };

  const handleShapeStrokeEnabledChange = (strokeEnabled: boolean) => {
    setShapeStrokeEnabled(strokeEnabled);
    updateActiveShapeLayer({ strokeEnabled });
  };

  const handleCommitShapeEdit = () => {
    if (!activeLayerId) return;
    saveHistoryCommand('layer:shape', 'Edit shape layer', latestLayersRef.current, canvasWidth, canvasHeight, activeLayerId);
  };

  const handleCreateShapeLayer = (start: Point, end: Point) => {
    if (canvasWidth === 0 || canvasHeight === 0) return;

    const isLinearShape = shapeKind === 'line' || shapeKind === 'arrow';
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    if (isLinearShape ? Math.hypot(width, height) < 5 : width < 5 || height < 5) return;

    const sourceId = createLayerId('src');
    bitmapStoreRef.current.createBlank(sourceId, canvasWidth, canvasHeight);

    const newLayer: EditorLayer = {
      id: createLayerId('shape'),
      name: `${shapeKind[0].toUpperCase()}${shapeKind.slice(1)} Shape ${layers.length + 1}`,
      type: 'shape',
      visible: true,
      opacity: 1,
      sourceId,
      transform: getDefaultTransform(),
      adjustments: makeDefaultAdjustments(),
      filter: 'none',
      shapeData: makeShapeData(
        shapeKind,
        start,
        end,
        shapeFillColor,
        shapeStrokeColor,
        shapeStrokeWidth,
        shapeFillEnabled,
        shapeStrokeEnabled
      )
    };

    renderShapeToLayer(newLayer, bitmapStoreRef.current);
    const nextLayers = [...layers, newLayer];
    latestLayersRef.current = nextLayers;
    setLayers(nextLayers);
    setActiveLayerId(newLayer.id);
    saveHistoryCommand('layer:add', 'Add shape layer', nextLayers, canvasWidth, canvasHeight, newLayer.id);
  };


  const handleSetActiveLayerTransform = (
    transform: EditorLayer['transform'],
    commit: boolean
  ) => {
    if (!activeLayerId || canvasWidth === 0) return;

    const baseLayers = latestLayersRef.current.length > 0 ? latestLayersRef.current : layers;
    const nextLayers = baseLayers.map(l => l.id === activeLayerId ? {
      ...l,
      transform: { ...transform }
    } : l);

    setLayers(nextLayers);
    latestLayersRef.current = nextLayers;

    if (commit) {
      saveHistoryCommand('layer:transform', 'Transform layer', nextLayers, canvasWidth, canvasHeight, activeLayerId);
    }
  };


  const handleSampleColor = (point: Point) => {
    if (canvasWidth === 0 || canvasHeight === 0 || layers.length === 0) return;

    const sourceLayers = eyedropperSource === 'active-layer'
      ? layers.filter(layer => layer.id === activeLayerId)
      : layers;

    if (sourceLayers.length === 0) {
      setUploadError('Eyedropper failed: select a layer or switch the sample source to Whole Image.');
      return;
    }

    const sampleCanvas = renderComposite({
      layers: sourceLayers,
      bitmapStore: bitmapStoreRef.current,
      width: canvasWidth,
      height: canvasHeight
    });
    const ctx = sampleCanvas.getContext('2d');
    if (!ctx) return;

    const x = Math.max(0, Math.min(canvasWidth - 1, Math.round(point.x)));
    const y = Math.max(0, Math.min(canvasHeight - 1, Math.round(point.y)));
    const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;

    if (a === 0) {
      setUploadError('Eyedropper found a transparent pixel. Try a visible part of the image.');
      return;
    }

    const sampledColor = rgbToHex(r, g, b);
    setBrushColor(sampledColor);
    setTextColor(sampledColor);
    setShapeFillColor(sampledColor);
    setShapeStrokeColor(sampledColor);
    setLastSampledColor(sampledColor);
    setRecentSampledColors(colors => pushUniqueColor(colors, sampledColor));
    setUploadError('');
  };

  const applyForegroundColor = (color: string) => {
    const normalized = color.toLowerCase();
    setBrushColor(normalized);
    setTextColor(normalized);
    setShapeFillColor(normalized);
    setShapeStrokeColor(normalized);
    setLastSampledColor(normalized);
  };

  const handleAddSwatch = (color: string) => {
    setSwatches(colors => pushUniqueColor(colors, color, 24));
  };

  const handleRemoveSwatch = (color: string) => {
    setSwatches(colors => colors.filter(c => c.toLowerCase() !== color.toLowerCase()));
  };

  // Crop & Selection actions implementation
  const handleExecuteCropSelection = () => {
    const beforeCheckpoint = createPixelEditBeforeCheckpoint('Before crop');
    let sx = 0;
    let sy = 0;
    let targetW = canvasWidth;
    let targetH = canvasHeight;

    if (activeTool === 'crop' && cropRect) {
      sx = Math.max(0, Math.min(canvasWidth - 1, cropRect.x));
      sy = Math.max(0, Math.min(canvasHeight - 1, cropRect.y));
      targetW = Math.max(0, Math.min(canvasWidth - sx, cropRect.w));
      targetH = Math.max(0, Math.min(canvasHeight - sy, cropRect.h));
    } else {
      const bounds = getSelectionBounds(selection, canvasWidth, canvasHeight);
      if (!bounds) return;
      sx = bounds.sx;
      sy = bounds.sy;
      targetW = bounds.sw;
      targetH = bounds.sh;
    }

    targetW = Math.round(targetW);
    targetH = Math.round(targetH);
    sx = Math.round(sx);
    sy = Math.round(sy);

    if (targetW < 5 || targetH < 5) return;

    const oldSize = { width: canvasWidth, height: canvasHeight };
    const newSize = { width: targetW, height: targetH };
    const cropOrigin = { x: sx, y: sy };
    const croppedLayers = layers.map(layer => {
      const sourceCanvas = bitmapStoreRef.current.getCanvas(layer.sourceId);
      const croppedCanvas = createCanvas(targetW, targetH);
      const ctx = croppedCanvas.getContext('2d');

      if (ctx && sourceCanvas && (layer.type === 'image' || layer.type === 'drawing')) {
        ctx.drawImage(
          sourceCanvas,
          sx,
          sy,
          targetW,
          targetH,
          0,
          0,
          targetW,
          targetH
        );
      }

      bitmapStoreRef.current.setCanvas(layer.sourceId, croppedCanvas);

      if (layer.mask) {
        const sourceMask = bitmapStoreRef.current.getCanvas(layer.mask.bitmapId);
        const croppedMask = createCanvas(targetW, targetH);
        const maskCtx = croppedMask.getContext('2d');

        if (maskCtx && sourceMask) {
          maskCtx.drawImage(sourceMask, sx, sy, targetW, targetH, 0, 0, targetW, targetH);
        }

        bitmapStoreRef.current.setCanvas(layer.mask.bitmapId, croppedMask);
      }

      const updated: EditorLayer = {
        ...layer,
        transform: cropLayerTransform(layer.transform, oldSize, newSize, cropOrigin)
      };

      if (updated.type === 'text' && updated.textData) {
        updated.textData = {
          ...updated.textData,
          ...remapPointBetweenCanvasCenters(updated.textData, oldSize, newSize)
        };
        renderTextToLayer(updated, bitmapStoreRef.current);
      }

      if (updated.type === 'shape' && updated.shapeData) {
        updated.shapeData = transformShapePoints(updated.shapeData, point => (
          remapPointBetweenCanvasCenters(point, oldSize, newSize)
        ));
        renderShapeToLayer(updated, bitmapStoreRef.current);
      }

      return updated;
    });

    setLayers(croppedLayers);
    setCanvasWidth(targetW);
    setCanvasHeight(targetH);
    setCropRect(null);
    setSelection(clearSelection());

    if (activeTool === 'crop') {
      setActiveTool('brush');
    }

    saveHistorySnapshot(croppedLayers, targetW, targetH, activeLayerId, 'Crop canvas', beforeCheckpoint);
  };

  const createMaskedSelectionCanvas = (sourceCanvas: HTMLCanvasElement) => {
    const bounds = getSelectionBounds(selection, canvasWidth, canvasHeight);
    if (!bounds) return null;

    const selectedCanvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = selectedCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.save();
    if (!addSelectionPath(ctx, selection)) {
      ctx.restore();
      return null;
    }
    ctx.clip();
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.restore();

    const sx = Math.max(0, Math.floor(bounds.sx));
    const sy = Math.max(0, Math.floor(bounds.sy));
    const sw = Math.max(1, Math.min(canvasWidth - sx, Math.ceil(bounds.sw)));
    const sh = Math.max(1, Math.min(canvasHeight - sy, Math.ceil(bounds.sh)));
    const pixels = ctx.getImageData(sx, sy, sw, sh).data;
    let hasVisiblePixel = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) {
        hasVisiblePixel = true;
        break;
      }
    }

    if (!hasVisiblePixel) return null;
    return selectedCanvas;
  };

  const addSelectionCanvasAsLayer = (selectedCanvas: HTMLCanvasElement, name: string, baseLayers = layers) => {
    const sourceId = createLayerId('src');
    bitmapStoreRef.current.setCanvas(sourceId, selectedCanvas);

    const newLayer: EditorLayer = {
      id: createLayerId('cutout'),
      name,
      type: 'image',
      visible: true,
      opacity: 1,
      sourceId,
      transform: getDefaultTransform(),
      adjustments: makeDefaultAdjustments(),
      filter: 'none',
      blendMode: 'source-over'
    };

    const nextLayers = [...baseLayers, newLayer];
    latestLayersRef.current = nextLayers;
    setLayers(nextLayers);
    setActiveLayerId(newLayer.id);
    setActiveTool('move');
    setSelection(clearSelection());
    return { nextLayers, newLayer };
  };

  const saveSelectionClipboard = (selectedCanvas: HTMLCanvasElement) => {
    selectionClipboardRef.current = cloneCanvas(selectedCanvas);
    setHasSelectionClipboard(true);
  };

  const handleCopySelectionToLayer = () => {
    if (layers.length === 0 || canvasWidth === 0 || canvasHeight === 0) return;

    const fullComposite = renderComposite({
      layers,
      bitmapStore: bitmapStoreRef.current,
      width: canvasWidth,
      height: canvasHeight
    });
    const selectedCanvas = createMaskedSelectionCanvas(fullComposite);

    if (!selectedCanvas) {
      setUploadError('Copy failed: the selected area does not contain visible pixels.');
      return;
    }

    saveSelectionClipboard(selectedCanvas);
    const { nextLayers, newLayer } = addSelectionCanvasAsLayer(
      selectedCanvas,
      `Copied Selection ${layers.length + 1}`
    );
    setUploadError('');
    saveHistoryCommand('selection:copy-layer', 'Copy selection to layer', nextLayers, canvasWidth, canvasHeight, newLayer.id, [newLayer.sourceId]);
  };

  const clearSelectionFromCanvas = (targetCanvas: HTMLCanvasElement) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return false;

    ctx.save();
    if (!addSelectionPath(ctx, selection)) {
      ctx.restore();
      return false;
    }
    ctx.clip();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
    return true;
  };

  const handleCutSelectionToLayer = () => {
    if (layers.length === 0 || canvasWidth === 0 || canvasHeight === 0) return;
    const beforeCheckpoint = createPixelEditBeforeCheckpoint('Before cut selection');

    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) {
      setUploadError('Cut failed: choose a layer first.');
      return;
    }

    const activeVisual = renderComposite({
      layers: [{ ...activeLayer, blendMode: 'source-over' }],
      bitmapStore: bitmapStoreRef.current,
      width: canvasWidth,
      height: canvasHeight
    });
    const selectedCanvas = createMaskedSelectionCanvas(activeVisual);

    if (!selectedCanvas) {
      setUploadError('Cut failed: the selected area does not contain visible pixels on the active layer.');
      return;
    }

    const remainingCanvas = cloneCanvas(activeVisual);
    if (!clearSelectionFromCanvas(remainingCanvas)) {
      setUploadError('Cut failed: the selection mask could not be applied.');
      return;
    }

    bitmapStoreRef.current.setCanvas(activeLayer.sourceId, remainingCanvas);
    const rasterizedActiveLayer: EditorLayer = {
      ...activeLayer,
      name: activeLayer.type === 'image' || activeLayer.type === 'drawing'
        ? activeLayer.name
        : `${activeLayer.name} (Rasterized)`,
      type: activeLayer.type === 'drawing' ? 'drawing' : 'image',
      transform: getDefaultTransform(),
      adjustments: makeDefaultAdjustments(),
      filter: 'none',
      blendMode: 'source-over',
      textData: undefined,
      shapeData: undefined
    };
    const baseLayers = layers.map(layer => layer.id === activeLayer.id ? rasterizedActiveLayer : layer);

    saveSelectionClipboard(selectedCanvas);
    const { nextLayers, newLayer } = addSelectionCanvasAsLayer(
      selectedCanvas,
      `Cut Selection ${layers.length + 1}`,
      baseLayers
    );
    setUploadError('');
    saveHistorySnapshot(nextLayers, canvasWidth, canvasHeight, newLayer.id, 'Cut selection to layer', beforeCheckpoint);
  };

  const handlePasteSelectionAsLayer = () => {
    if (!selectionClipboardRef.current || canvasWidth === 0 || canvasHeight === 0) {
      setUploadError('Paste failed: copy or cut a selection first.');
      return;
    }

    const pastedCanvas = cloneCanvas(selectionClipboardRef.current, canvasWidth, canvasHeight);
    const { nextLayers, newLayer } = addSelectionCanvasAsLayer(
      pastedCanvas,
      `Pasted Selection ${layers.length + 1}`
    );
    setUploadError('');
    saveHistoryCommand('selection:paste-layer', 'Paste selection as layer', nextLayers, canvasWidth, canvasHeight, newLayer.id, [newLayer.sourceId]);
  };

  const handleFillSelectionPixels = () => {
    const beforeCheckpoint = createPixelEditBeforeCheckpoint('Before fill selection');
    const bounds = getSelectionBounds(selection, canvasWidth, canvasHeight);
    if (layers.length === 0 || !bounds) return;

    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) return;
    if (activeLayer.type === 'text' || activeLayer.type === 'shape') {
      setUploadError('Fill selection is only supported on bitmap layers. Rasterize the layer first.');
      return;
    }

    const activeCanvas = bitmapStoreRef.current.getCanvas(activeLayer.sourceId);
    const ctx = activeCanvas?.getContext('2d');
    if (!activeCanvas || !ctx) return;

    ctx.save();
    applyInverseLayerTransform(ctx, activeCanvas, activeLayer.transform);
    if (!addSelectionPath(ctx, selection)) {
      ctx.restore();
      return;
    }

    ctx.clip();
    ctx.fillStyle = brushColor;
    ctx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
    ctx.restore();

    const nextLayers = [...layers];
    setLayers(nextLayers);
    setSelection(clearSelection());
    setUploadError('');
    saveHistorySnapshot(nextLayers, canvasWidth, canvasHeight, activeLayerId, 'Fill selection', beforeCheckpoint);
  };

  const handleClearSelectionPixels = () => {
    const beforeCheckpoint = createPixelEditBeforeCheckpoint('Before clear selection');
    const bounds = getSelectionBounds(selection, canvasWidth, canvasHeight);
    if (layers.length === 0 || !bounds) return;

    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer) return;
    if (activeLayer.type === 'text' || activeLayer.type === 'shape') {
      setUploadError('Clear selection is only supported on bitmap layers. Rasterize the layer first.');
      return;
    }

    const activeCanvas = bitmapStoreRef.current.getCanvas(activeLayer.sourceId);
    const ctx = activeCanvas?.getContext('2d');
    if (!activeCanvas || !ctx) return;

    ctx.save();
    applyInverseLayerTransform(ctx, activeCanvas, activeLayer.transform);
    if (!addSelectionPath(ctx, selection)) {
      ctx.restore();
      return;
    }

    ctx.clip();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
    ctx.restore();

    const nextLayers = [...layers];
    setLayers(nextLayers);
    setSelection(clearSelection());
    setUploadError('');
    saveHistorySnapshot(nextLayers, canvasWidth, canvasHeight, activeLayerId, 'Clear selection', beforeCheckpoint);
  };

  const handleDownloadSelectionArea = () => {
    const bounds = getSelectionBounds(selection, canvasWidth, canvasHeight);
    if (layers.length === 0 || !bounds) return;

    const { sx, sy, sw, sh } = bounds;
    const elementComps = createCanvas(sw, sh);
    const ctx = elementComps.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (!addSelectionPath(ctx, selection, sx, sy)) {
      ctx.restore();
      return;
    }
    ctx.clip();

    const fullComposite = renderComposite({
      layers,
      bitmapStore: bitmapStoreRef.current,
      width: canvasWidth,
      height: canvasHeight
    });
    ctx.drawImage(fullComposite, sx, sy, sw, sh, 0, 0, sw, sh);
    ctx.restore();

    const link = document.createElement('a');
    link.download = `sticker_cutout_${Date.now()}.png`;
    link.href = elementComps.toDataURL('image/png');
    link.click();

    setSelection(clearSelection());
  };

  const handleCancelSelectionBounds = () => {
    setSelection(clearSelection());
  };

  // Rotate & Flip logic
  const handleRotateAndFlip = (action: 'rotate-90' | 'flip-h' | 'flip-v') => {
    if (canvasWidth === 0) return;

    const beforeCheckpoint = createPixelEditBeforeCheckpoint('Before rotate/flip');
    let targetW = canvasWidth;
    let targetH = canvasHeight;

    if (action === 'rotate-90') {
      targetW = canvasHeight;
      targetH = canvasWidth;
    }

    const oldSize = { width: canvasWidth, height: canvasHeight };
    const newSize = { width: targetW, height: targetH };
    const transformed = layers.map(layer => {
      const updated: EditorLayer = {
        ...layer,
        transform:
          action === 'rotate-90'
            ? rotateLayerTransform90(layer.transform)
            : action === 'flip-h'
              ? flipLayerTransformHorizontally(layer.transform)
              : flipLayerTransformVertically(layer.transform)
      };

      if (action === 'rotate-90' && updated.type === 'text' && updated.textData) {
        updated.textData = {
          ...updated.textData,
          ...remapPointBetweenCanvasCenters(updated.textData, oldSize, newSize)
        };
        renderTextToLayer(updated, bitmapStoreRef.current);
      }

      if (action === 'rotate-90' && updated.type === 'shape' && updated.shapeData) {
        updated.shapeData = transformShapePoints(updated.shapeData, point => (
          remapPointBetweenCanvasCenters(point, oldSize, newSize)
        ));
        renderShapeToLayer(updated, bitmapStoreRef.current);
      }

      return updated;
    });

    setLayers(transformed);
    setCanvasWidth(targetW);
    setCanvasHeight(targetH);
    saveHistorySnapshot(transformed, targetW, targetH, activeLayerId, 'Rotate/flip canvas', beforeCheckpoint);
  };

  // Crop tool initial box placement
  const handleToolSelectionChange = (tool: ToolType) => {
    setActiveTool(tool);
    // Dismiss active selections
    setSelection(clearSelection());
    setActiveInspectorTab('tool');

    if (tool === 'crop' && canvasWidth > 0) {
      // Set initial crop border padding 5% inside canvas edge
      const px = Math.round(canvasWidth * 0.05);
      const py = Math.round(canvasHeight * 0.05);
      setCropRect({
        x: px,
        y: py,
        w: canvasWidth - px * 2,
        h: canvasHeight - py * 2
      });
    } else {
      setCropRect(null);
    }

    // Auto-select or auto-create a drawing layer for brush
    if (tool === 'brush' && canvasWidth > 0 && !activeMaskLayerId) {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (!activeLayer || activeLayer.type !== 'drawing') {
        const existingDrawing = layers.find(l => l.type === 'drawing');
        if (existingDrawing) {
          setActiveLayerId(existingDrawing.id);
        } else {
          const sourceId = createLayerId('src');
          bitmapStoreRef.current.createBlank(sourceId, canvasWidth, canvasHeight);
          
          const newId = createLayerId('paint');
          const drawingLayer: EditorLayer = {
            id: newId,
            name: `Drawing Layer ${layers.length + 1}`,
            type: 'drawing',
            visible: true,
            opacity: 1,
            sourceId,
            transform: getDefaultTransform(),
            adjustments: makeDefaultAdjustments(),
            filter: 'none'
          };
          const nextLayers = [...layers, drawingLayer];
          setLayers(nextLayers);
          setActiveLayerId(newId);
          saveHistoryCommand('layer:add', 'Add drawing layer', nextLayers, canvasWidth, canvasHeight, newId);
        }
      }
    }
  };


  const clampResizeDimension = (value: number) => {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.min(MAX_RESIZE_DIMENSION, Math.round(value)));
  };

  const handleOpenResizeDialog = () => {
    if (canvasWidth === 0 || canvasHeight === 0) {
      setUploadError('Resize unavailable: create or open a canvas first.');
      return;
    }

    setResizeMode('image');
    setResizeWidth(canvasWidth);
    setResizeHeight(canvasHeight);
    setResizeLockAspect(true);
    setResizeAnchor('center');
    setUploadError('');
    setShowResizeModal(true);
  };

  const handleResizeWidthChange = (value: number) => {
    const nextWidth = clampResizeDimension(value);
    setResizeWidth(nextWidth);

    if (resizeLockAspect && canvasWidth > 0) {
      setResizeHeight(clampResizeDimension((nextWidth * canvasHeight) / canvasWidth));
    }
  };

  const handleResizeHeightChange = (value: number) => {
    const nextHeight = clampResizeDimension(value);
    setResizeHeight(nextHeight);

    if (resizeLockAspect && canvasHeight > 0) {
      setResizeWidth(clampResizeDimension((nextHeight * canvasWidth) / canvasHeight));
    }
  };

  const handleResizeLockChange = (locked: boolean) => {
    setResizeLockAspect(locked);
    if (locked && canvasWidth > 0) {
      setResizeHeight(clampResizeDimension((resizeWidth * canvasHeight) / canvasWidth));
    }
  };

  const applyImageResize = (targetW: number, targetH: number) => {
    const scaleX = targetW / canvasWidth;
    const scaleY = targetH / canvasHeight;
    const fontScale = Math.max(0.1, (scaleX + scaleY) / 2);

    return layers.map((layer) => {
      const sourceCanvas = bitmapStoreRef.current.getCanvas(layer.sourceId);
      const resizedCanvas = createCanvas(targetW, targetH);
      const ctx = resizedCanvas.getContext('2d');

      const updatedLayer = cloneLayer(layer);
      updatedLayer.transform = {
        ...layer.transform,
        x: layer.transform.x * scaleX,
        y: layer.transform.y * scaleY
      };
      if (updatedLayer.type === 'text') {
        updatedLayer.textData = {
          ...updatedLayer.textData,
          x: updatedLayer.textData.x * scaleX,
          y: updatedLayer.textData.y * scaleY,
          fontSize: Math.max(1, Math.round(updatedLayer.textData.fontSize * fontScale))
        };
      } else if (updatedLayer.type === 'shape') {
        updatedLayer.shapeData = {
          ...transformShapePoints(updatedLayer.shapeData, point => ({
            x: point.x * scaleX,
            y: point.y * scaleY
          })),
          strokeWidth: Math.max(1, Math.round(updatedLayer.shapeData.strokeWidth * fontScale))
        };
      }

      bitmapStoreRef.current.setCanvas(layer.sourceId, resizedCanvas);

      if (updatedLayer.type === 'text') {
        renderTextToLayer(updatedLayer, bitmapStoreRef.current);
      } else if (updatedLayer.type === 'shape') {
        renderShapeToLayer(updatedLayer, bitmapStoreRef.current);
      } else if (ctx && sourceCanvas) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceCanvas, 0, 0, canvasWidth, canvasHeight, 0, 0, targetW, targetH);
      }

      return updatedLayer;
    });
  };

  const applyCanvasResize = (targetW: number, targetH: number) => {
    const offsetX = resizeAnchor === 'center' ? Math.round((targetW - canvasWidth) / 2) : 0;
    const offsetY = resizeAnchor === 'center' ? Math.round((targetH - canvasHeight) / 2) : 0;
    const oldSize = { width: canvasWidth, height: canvasHeight };
    const newSize = { width: targetW, height: targetH };
    const offset = { x: offsetX, y: offsetY };

    return layers.map((layer) => {
      const updatedLayer = cloneLayer(layer);
      if (updatedLayer.type === 'image' || updatedLayer.type === 'drawing') {
        updatedLayer.transform = { ...layer.transform };
      } else {
        updatedLayer.transform = offsetLayerTransform(layer.transform, oldSize, newSize, offset);
      }
      if (updatedLayer.type === 'text') {
        updatedLayer.textData = {
          ...updatedLayer.textData,
          ...remapPointBetweenCanvasCenters(updatedLayer.textData, oldSize, newSize)
        };
      } else if (updatedLayer.type === 'shape') {
        updatedLayer.shapeData = transformShapePoints(updatedLayer.shapeData, point => (
          remapPointBetweenCanvasCenters(point, oldSize, newSize)
        ));
      }

      if (updatedLayer.type === 'text') {
        renderTextToLayer(updatedLayer, bitmapStoreRef.current);
      }

      if (updatedLayer.type === 'shape') {
        renderShapeToLayer(updatedLayer, bitmapStoreRef.current);
      }

      if (updatedLayer.type === 'image' || updatedLayer.type === 'drawing') {
        const sourceCanvas = bitmapStoreRef.current.getCanvas(layer.sourceId);
        const resizedCanvas = createCanvas(targetW, targetH);
        const ctx = resizedCanvas.getContext('2d');

        if (ctx && sourceCanvas) {
          ctx.drawImage(sourceCanvas, offsetX, offsetY);
        }

        bitmapStoreRef.current.setCanvas(layer.sourceId, resizedCanvas);
      }

      if (updatedLayer.mask) {
        const sourceMask = bitmapStoreRef.current.getCanvas(updatedLayer.mask.bitmapId);
        const resizedMask = createCanvas(targetW, targetH);
        const maskCtx = resizedMask.getContext('2d');

        if (maskCtx && sourceMask) {
          maskCtx.drawImage(sourceMask, offsetX, offsetY);
        }

        bitmapStoreRef.current.setCanvas(updatedLayer.mask.bitmapId, resizedMask);
      }

      return updatedLayer;
    });
  };

  const handleApplyResize = () => {
    if (canvasWidth === 0 || canvasHeight === 0) return;

    const beforeCheckpoint = createPixelEditBeforeCheckpoint('Before resize');
    const targetW = clampResizeDimension(resizeWidth);
    const targetH = clampResizeDimension(resizeHeight);

    if (targetW === canvasWidth && targetH === canvasHeight) {
      setShowResizeModal(false);
      return;
    }

    const resizedLayers = resizeMode === 'image'
      ? applyImageResize(targetW, targetH)
      : applyCanvasResize(targetW, targetH);

    latestLayersRef.current = resizedLayers;
    setLayers(resizedLayers);
    setCanvasWidth(targetW);
    setCanvasHeight(targetH);
    setSelection(clearSelection());
    setCropRect(null);
    setActiveTool('move');
    setShowResizeModal(false);
    setUploadError('');
    saveHistorySnapshot(resizedLayers, targetW, targetH, activeLayerId, 'Resize project', beforeCheckpoint);
  };


  const handleSaveProjectFile = () => {
    if (canvasWidth === 0 || canvasHeight === 0 || layers.length === 0) {
      setUploadError('Project save failed: create or open a canvas first.');
      return;
    }

    try {
      const projectJson = serializeProjectFile(
        layers,
        bitmapStoreRef.current,
        canvasWidth,
        canvasHeight,
        activeLayerId,
        swatches
      );
      const blob = new Blob([projectJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `photoshop_for_n00bs_project_${Date.now()}.n00bs`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setUploadError('');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Project save failed.');
    }
  };

  const handleOpenProjectPicker = () => {
    projectFileInputRef.current?.click();
  };

  const handleProjectFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadError('');

    const hasDot = file.name.includes('.');
    const ext = hasDot ? file.name.split('.').pop()?.toLowerCase() : '';
    if (hasDot && ext !== 'n00bs' && ext !== 'json' && file.type !== 'application/json') {
      setUploadError('Project open failed: choose a .n00bs project file.');
      return;
    }

    try {
      const loadedProject = await deserializeProjectFile(await file.text());
      if (
        isLargeCanvas(loadedProject.canvasWidth, loadedProject.canvasHeight, LARGE_IMAGE_PIXEL_WARNING) &&
        !window.confirm(formatLargeCanvasWarning('project', loadedProject.canvasWidth, loadedProject.canvasHeight))
      ) {
        setUploadError('Project open cancelled: canvas is very large.');
        return;
      }

      bitmapStoreRef.current.clear();
      for (const source of loadedProject.sources) {
        bitmapStoreRef.current.setCanvas(source.sourceId, source.canvas);
      }
      bitmapStoreRef.current.pruneToLayers(loadedProject.layers);

      latestLayersRef.current = loadedProject.layers;
      setLayers(loadedProject.layers);
      setCanvasWidth(loadedProject.canvasWidth);
      setCanvasHeight(loadedProject.canvasHeight);
      setActiveLayerId(loadedProject.activeLayerId);
      setActiveMaskLayerId(null);
      setRecentSampledColors([]);
      setSwatches(loadedProject.swatches);
      setSelection(clearSelection());
      setCropRect(null);
      setActiveTool('move');
      setActiveInspectorTab('layers');

      const initialStep = createCheckpointEntry(
        'Project opened',
        loadedProject.layers,
        bitmapStoreRef.current,
        loadedProject.canvasWidth,
        loadedProject.canvasHeight,
        loadedProject.activeLayerId
      );
      setHistory([initialStep]);
      setHistoryIndex(0);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Project open failed.');
    }
  };

  const clampExportDimension = (value: number) => {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.min(MAX_EXPORT_DIMENSION, Math.round(value)));
  };

  const handleOpenExportDialog = () => {
    if (canvasWidth === 0 || canvasHeight === 0 || layers.length === 0) {
      setUploadError('Export unavailable: create or open a canvas first.');
      return;
    }

    setExportWidth(canvasWidth);
    setExportHeight(canvasHeight);
    setExportLockAspect(true);
    setExportQuality(92);
    setUploadError('');
    setShowExportModal(true);
  };

  const handleExportFormatChange = (format: ExportFormat) => {
    setExportFormat(format);
    if (format === 'jpeg') {
      setExportBackgroundMode('solid');
    }
  };

  const handleExportWidthChange = (value: number) => {
    const nextWidth = clampExportDimension(value);
    setExportWidth(nextWidth);

    if (exportLockAspect && canvasWidth > 0) {
      setExportHeight(clampExportDimension((nextWidth * canvasHeight) / canvasWidth));
    }
  };

  const handleExportHeightChange = (value: number) => {
    const nextHeight = clampExportDimension(value);
    setExportHeight(nextHeight);

    if (exportLockAspect && canvasHeight > 0) {
      setExportWidth(clampExportDimension((nextHeight * canvasWidth) / canvasHeight));
    }
  };

  const handleExportLockChange = (locked: boolean) => {
    setExportLockAspect(locked);
    if (locked && canvasWidth > 0) {
      setExportHeight(clampExportDimension((exportWidth * canvasHeight) / canvasWidth));
    }
  };

  const canvasToBlob = (canvas: HTMLCanvasElement, mime: string, quality?: number) => (
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mime, quality);
    })
  );

  // Save/Export Entire Work Canvas triggered
  const handleExportFinishedImage = async () => {
    if (canvasWidth === 0 || canvasHeight === 0 || layers.length === 0) return;

    const targetW = clampExportDimension(exportWidth || canvasWidth);
    const targetH = clampExportDimension(exportHeight || canvasHeight);
    if (
      isLargeCanvas(targetW, targetH, LARGE_EXPORT_PIXEL_WARNING) &&
      !window.confirm(formatLargeCanvasWarning('export', targetW, targetH))
    ) {
      setUploadError('Export cancelled: canvas is very large.');
      return;
    }

    const background = exportFormat === 'jpeg' || exportBackgroundMode === 'solid'
      ? exportBackgroundColor
      : undefined;

    const baseComposite = renderComposite({
      layers,
      bitmapStore: bitmapStoreRef.current,
      width: canvasWidth,
      height: canvasHeight,
      background
    });

    const exportCanvas = createCanvas(targetW, targetH);
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) {
      setUploadError('Export failed: the browser could not create the output canvas.');
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(baseComposite, 0, 0, canvasWidth, canvasHeight, 0, 0, targetW, targetH);

    const mimeByFormat: Record<ExportFormat, string> = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp'
    };
    const extByFormat: Record<ExportFormat, string> = {
      png: 'png',
      jpeg: 'jpg',
      webp: 'webp'
    };

    const mime = mimeByFormat[exportFormat];
    const ext = extByFormat[exportFormat];
    const quality = exportFormat === 'png' ? undefined : Math.max(0.01, Math.min(1, exportQuality / 100));

    try {
      const blob = await canvasToBlob(exportCanvas, mime, quality);
      const link = document.createElement('a');
      link.download = `beginner_masterpiece_${targetW}x${targetH}_${Date.now()}.${ext}`;

      if (blob) {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        link.href = exportCanvas.toDataURL(mime, quality);
        link.click();
      }
    } catch {
      setUploadError('Export failed: the browser could not encode this image.');
      return;
    }

    setShowExportModal(false);
  };

  const activeLayer = layers.find(l => l.id === activeLayerId);
  const activeLayerName = activeLayer ? activeLayer.name : 'No Layer selected';
  const leftSidebarVisible = !leftSidebarCollapsed;
  const rightSidebarVisible = !rightSidebarCollapsed;

  const gridStyle = {
    gridTemplateColumns: [
      leftSidebarVisible ? '84px' : '',
      'minmax(0, 1fr)',
      rightSidebarVisible ? '340px' : ''
    ].filter(Boolean).join(' ')
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-black text-white font-sans flex flex-col justify-between select-none p-2 md:p-3" id="beginner-photo-editor-app">
      {/* Top Bar */}
      <TopBar
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onRotateAndFlip={handleRotateAndFlip}
        onOpenProject={handleOpenProjectPicker}
        onSaveProject={handleSaveProjectFile}
        onResizeProject={handleOpenResizeDialog}
        onExport={handleOpenExportDialog}
        onShowHelp={() => setShowKeyboardShortcuts(true)}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Grid Area Layout - strictly fit on a single screen without scrolling on desktop */}
      <main className="flex-1 w-full mx-auto grid grid-cols-1 lg:grid grid-rows-[minmax(0,1fr)] gap-3.5 lg:overflow-hidden min-h-0" style={gridStyle} id="editor-core-grid">
        {/* Left column: ToolRail */}
        {leftSidebarVisible && (
          <div id="left-sidebar-col" className="h-full flex shrink-0">
            <ToolRail
              activeTool={activeTool}
              onChangeTool={handleToolSelectionChange}
            />
          </div>
        )}

        {/* Middle column: Interactive Painting Stage Workspace */}
        <section className="flex flex-col min-h-0 min-w-0 h-full max-h-full" id="middle-canvas-stage">
          <div className="mb-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLeftSidebarCollapsed(value => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-200 shadow hover:border-zinc-700 hover:bg-zinc-900 hover:text-white active:scale-95 transition cursor-pointer"
              id="btn-toggle-left-sidebar"
              aria-pressed={leftSidebarCollapsed}
              title={leftSidebarCollapsed ? 'Show tools panel' : 'Hide tools panel'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {leftSidebarCollapsed ? 'Show tools' : 'Hide tools'}
            </button>
            <button
              type="button"
              onClick={() => setRightSidebarCollapsed(value => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-200 shadow hover:border-zinc-700 hover:bg-zinc-900 hover:text-white active:scale-95 transition cursor-pointer"
              id="btn-toggle-right-sidebar"
              aria-pressed={rightSidebarCollapsed}
              title={rightSidebarCollapsed ? 'Show inspector panel' : 'Hide inspector panel'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {rightSidebarCollapsed ? 'Show inspector' : 'Hide inspector'}
            </button>
          </div>
          <CanvasArea
            key={`${leftSidebarCollapsed}-${rightSidebarCollapsed}`}
            layers={layers}
            bitmapStore={bitmapStoreRef.current}
            activeLayerId={activeLayerId}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            activeTool={activeTool}
            cloneSourcePoint={cloneSourcePoint}
            selection={selection}
            onUpdateSelection={(nextSelection) => setSelection(current => ({ ...current, ...nextSelection }))}
            onDrawStart={handleDrawStart}
            onDrawStroke={handleDrawStroke}
            onSetCloneSource={setCloneSourcePoint}
            onDrawEnd={handleFinalizeStroke}
            onUpdateTextPosition={handleUpdateTextPosition}
            onSampleColor={handleSampleColor}
            onCreateShapeLayer={handleCreateShapeLayer}
            shapeKind={shapeKind}
            shapeFillColor={shapeFillColor}
            shapeStrokeColor={shapeStrokeColor}
            shapeStrokeWidth={shapeStrokeWidth}
            shapeFillEnabled={shapeFillEnabled}
            shapeStrokeEnabled={shapeStrokeEnabled}
            onSetActiveLayerTransform={handleSetActiveLayerTransform}
            onFileLoaded={handleFileLoaded}
            onSelectSample={handleSelectSampleProject}
            cropRect={cropRect}
            onUpdateCropRect={setCropRect}
            onExecuteCrop={handleExecuteCropSelection}
            onFillSelectionColor={handleFillSelectionPixels}
            onClearSelectionArea={handleClearSelectionPixels}
            onCancelSelectionArea={handleCancelSelectionBounds}
          />
        </section>

        {/* Right column: InspectorPanel */}
        {rightSidebarVisible && (
          <div id="right-sidebar-col" className="h-full flex shrink-0">
            <InspectorPanel
              activeTab={activeInspectorTab}
              onTabChange={setActiveInspectorTab}
            >
              {activeInspectorTab === 'layers' ? (
                <LayersPanel
                  layers={layers}
                  activeLayerId={activeLayerId}
                  onSelectLayer={handleSelectLayer}
                  onAddLayer={handleAddLayer}
                  onDeleteLayer={handleDeleteLayer}
                  onToggleVisibility={handleToggleVisibility}
                  onUpdateOpacity={handleUpdateOpacity}
                  onCommitOpacity={handleCommitOpacity}
                  onReorderLayers={handleReorderLayers}
                  onRenameLayer={handleRenameLayer}
                  onDuplicateLayer={handleDuplicateLayer}
                  onMergeLayers={handleMergeLayers}
                  onUpdateBlendMode={handleUpdateBlendMode}
                  activeMaskLayerId={activeMaskLayerId}
                  hasSelection={Boolean(getSelectionBounds(selection, canvasWidth, canvasHeight))}
                  onAddLayerMask={handleAddLayerMask}
                  onRemoveBackground={handlePreviewRemoveBackground}
                  isRemovingBackground={isRemovingBackground}
                  removingBackgroundLayerId={backgroundRemovalLayerId}
                  onToggleLayerMask={handleToggleLayerMask}
                  onDeleteLayerMask={handleDeleteLayerMask}
                  onSelectLayerMask={handleSelectLayerMask}
                  onAddBackgroundTemplate={() => setShowBackgroundTemplatesModal(true)}
                />
              ) : (
                <>
                  <div className="flex-initial max-h-[55%] min-h-0 overflow-y-auto pb-3 shrink-0">
                    {activeInspectorTab === 'tool' && (
                      <ToolOptions
                        activeTool={activeTool}
                        brushSize={brushSize}
                        onBrushSizeChange={setBrushSize}
                        brushColor={brushColor}
                        onBrushColorChange={setBrushColor}
                        eraserSize={eraserSize}
                        onEraserSizeChange={setEraserSize}
                        cloneSourcePoint={cloneSourcePoint}
                        eyedropperSource={eyedropperSource}
                        onEyedropperSourceChange={setEyedropperSource}
                        lastSampledColor={lastSampledColor}
                        recentSampledColors={recentSampledColors}
                        swatches={swatches}
                        onAddSwatch={handleAddSwatch}
                        onRemoveSwatch={handleRemoveSwatch}
                        onSelectSwatch={applyForegroundColor}
                        textText={textText}
                        onTextTextChange={handleTextTextChange}
                        textFontSize={textFontSize}
                        onTextFontSizeChange={handleTextFontSizeChange}
                        textColor={textColor}
                        onTextColorChange={handleTextColorChange}
                        textFontFamily={textFontFamily}
                        onTextFontFamilyChange={handleTextFontFamilyChange}
                        onCommitTextEdit={handleCommitTextEdit}
                        onAddNewTextLayer={handleStampNewTextFromOptions}
                        shapeKind={shapeKind}
                        onShapeKindChange={handleShapeKindChange}
                        shapeFillColor={shapeFillColor}
                        onShapeFillColorChange={handleShapeFillColorChange}
                        shapeStrokeColor={shapeStrokeColor}
                        onShapeStrokeColorChange={handleShapeStrokeColorChange}
                        shapeStrokeWidth={shapeStrokeWidth}
                        onShapeStrokeWidthChange={handleShapeStrokeWidthChange}
                        shapeFillEnabled={shapeFillEnabled}
                        onShapeFillEnabledChange={handleShapeFillEnabledChange}
                        shapeStrokeEnabled={shapeStrokeEnabled}
                        onShapeStrokeEnabledChange={handleShapeStrokeEnabledChange}
                        onCommitShapeEdit={handleCommitShapeEdit}
                        hasSelection={selection.active}
                        onExecuteCropSelection={handleExecuteCropSelection}
                        onFillSelection={handleFillSelectionPixels}
                        onClearSelectionPixels={handleClearSelectionPixels}
                        onCopySelectionToLayer={handleCopySelectionToLayer}
                        onCutSelectionToLayer={handleCutSelectionToLayer}
                        onPasteSelectionAsLayer={handlePasteSelectionAsLayer}
                        hasSelectionClipboard={hasSelectionClipboard}
                        onDownloadSelection={handleDownloadSelectionArea}
                        onCancelSelection={handleCancelSelectionBounds}
                        onChangeTool={handleToolSelectionChange}
                      />
                    )}
                    {activeInspectorTab === 'adjust' && (
                      <AdjustmentsPanel
                        adjustments={activeLayer ? activeLayer.adjustments : { brightness: 0, contrast: 0, saturation: 0, exposure: 0, hue: 0, blur: 0, vignette: 0 }}
                        filter={activeLayer ? activeLayer.filter : 'none'}
                        onChangeAdjustments={handleChangeAdjustments}
                        onCommitAdjustments={handleCommitAdjustments}
                        onChangeFilter={handleChangeFilter}
                        onReset={() => {
                          if (activeLayerId) {
                            resetLayerAdjustments(activeLayerId);
                          }
                        }}
                        activeLayerName={activeLayerName}
                      />
                    )}
                    {activeInspectorTab === 'help' && (
                      <HelpPanel />
                    )}
                  </div>
                  <div className="flex-1 border-t border-zinc-900 pt-3 flex flex-col min-h-[150px] min-h-0">
                    <LayersPanel
                      layers={layers}
                      activeLayerId={activeLayerId}
                      onSelectLayer={handleSelectLayer}
                      onAddLayer={handleAddLayer}
                      onDeleteLayer={handleDeleteLayer}
                      onToggleVisibility={handleToggleVisibility}
                      onUpdateOpacity={handleUpdateOpacity}
                      onCommitOpacity={handleCommitOpacity}
                      onReorderLayers={handleReorderLayers}
                      onRenameLayer={handleRenameLayer}
                      onDuplicateLayer={handleDuplicateLayer}
                      onMergeLayers={handleMergeLayers}
                      onUpdateBlendMode={handleUpdateBlendMode}
                      activeMaskLayerId={activeMaskLayerId}
                      hasSelection={Boolean(getSelectionBounds(selection, canvasWidth, canvasHeight))}
                      onAddLayerMask={handleAddLayerMask}
                      onRemoveBackground={handlePreviewRemoveBackground}
                      isRemovingBackground={isRemovingBackground}
                      removingBackgroundLayerId={backgroundRemovalLayerId}
                      onToggleLayerMask={handleToggleLayerMask}
                      onDeleteLayerMask={handleDeleteLayerMask}
                      onSelectLayerMask={handleSelectLayerMask}
                      onAddBackgroundTemplate={() => setShowBackgroundTemplatesModal(true)}
                    />
                  </div>
                </>
              )}
            </InspectorPanel>
          </div>
        )}
      </main>

      <input
        ref={projectFileInputRef}
        type="file"
        accept=".n00bs,application/json"
        className="hidden"
        onChange={handleProjectFileSelected}
        id="hidden-project-file-picker"
      />

      {uploadError && (
        <div
          role="alert"
          className="fixed left-1/2 bottom-8 -translate-x-1/2 z-50 max-w-sm rounded-2xl border border-red-800 bg-red-950 px-4 py-3 text-xs font-semibold text-red-100 shadow-2xl"
        >
          {uploadError}
        </div>
      )}

      {backgroundRemovalError && (
        <div
          role="alert"
          className="fixed left-1/2 bottom-20 -translate-x-1/2 z-50 max-w-sm rounded-2xl border border-red-800 bg-red-950 px-4 py-3 text-xs font-semibold text-red-100 shadow-2xl"
          onClick={() => setBackgroundRemovalError(null)}
        >
          {backgroundRemovalError}
        </div>
      )}

      {backgroundRemovalPreview && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none" id="remove-background-modal-overlay">
          <div className="bg-black rounded-3xl p-5 shadow-2xl border border-zinc-800 max-w-md w-full" id="remove-background-modal-card">
            <h3 className="text-base font-extrabold text-white tracking-tight font-sans mb-1">
              Remove background
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
              Preview the mask before applying. You can paint the mask afterward to clean up edges.
            </p>
            <div className="checkerboard rounded-2xl border border-zinc-800 overflow-hidden mb-4" id="remove-background-preview">
              <img
                src={backgroundRemovalPreview.previewUrl}
                alt="Background removal preview"
                className="block w-full max-h-80 object-contain"
              />
            </div>
            <div className="flex gap-2.5" id="remove-background-footer-actions">
              <button
                type="button"
                onClick={handleCancelRemoveBackground}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 transition text-xs font-semibold rounded-xl text-zinc-300 cursor-pointer border border-zinc-800"
                id="btn-cancel-remove-background"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyRemoveBackground}
                className="flex-1 py-1.5 bg-white hover:bg-zinc-200 transition text-xs font-bold rounded-xl text-black cursor-pointer border border-white"
                id="btn-apply-remove-background"
              >
                Apply Mask
              </button>
            </div>
          </div>
        </div>
      )}

      {showResizeModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none" id="resize-modal-overlay">
          <div className="bg-black rounded-3xl p-6 shadow-2xl border border-zinc-800 max-w-md w-full" id="resize-modal-card">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight font-sans">
                  Resize image or canvas
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">
                  Current project size: <span className="font-mono text-zinc-200">{canvasWidth} × {canvasHeight}px</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4" id="resize-mode-options">
              <button
                type="button"
                onClick={() => setResizeMode('image')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  resizeMode === 'image'
                    ? 'border-white bg-zinc-900 text-white'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/40'
                }`}
                id="resize-mode-image"
              >
                <div className="text-xs font-bold">Resize image</div>
                <div className="text-[10px] leading-snug text-zinc-500 mt-1">Scale every layer to the new pixel size.</div>
              </button>
              <button
                type="button"
                onClick={() => setResizeMode('canvas')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  resizeMode === 'canvas'
                    ? 'border-white bg-zinc-900 text-white'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/40'
                }`}
                id="resize-mode-canvas"
              >
                <div className="text-xs font-bold">Resize canvas</div>
                <div className="text-[10px] leading-snug text-zinc-500 mt-1">Change the page bounds without scaling pixels.</div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3" id="resize-dimension-inputs">
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Width
                <input
                  type="number"
                  min="1"
                  max={MAX_RESIZE_DIMENSION}
                  value={resizeWidth}
                  onChange={(e) => handleResizeWidthChange(Number(e.target.value))}
                  className="text-xs border border-zinc-800 rounded-xl p-2.5 font-mono w-full focus:outline-none focus:border-zinc-650 bg-zinc-950 text-white"
                  id="resize-width-input"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Height
                <input
                  type="number"
                  min="1"
                  max={MAX_RESIZE_DIMENSION}
                  value={resizeHeight}
                  onChange={(e) => handleResizeHeightChange(Number(e.target.value))}
                  className="text-xs border border-zinc-800 rounded-xl p-2.5 font-mono w-full focus:outline-none focus:border-zinc-650 bg-zinc-950 text-white"
                  id="resize-height-input"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-zinc-850 bg-zinc-950 p-3 text-xs text-zinc-300 mb-3 cursor-pointer" id="resize-lock-aspect-row">
              <input
                type="checkbox"
                checked={resizeLockAspect}
                onChange={(e) => handleResizeLockChange(e.target.checked)}
                className="accent-white"
              />
              Keep the current aspect ratio
            </label>

            {resizeMode === 'canvas' && (
              <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-3 mb-4" id="canvas-anchor-options">
                <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-2">Place existing artwork</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResizeAnchor('center')}
                    className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      resizeAnchor === 'center'
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                    id="resize-anchor-center"
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => setResizeAnchor('top-left')}
                    className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                      resizeAnchor === 'top-left'
                        ? 'bg-white text-black border-white'
                        : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                    id="resize-anchor-top-left"
                  >
                    Top-left
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] leading-relaxed text-zinc-500 mb-5">
              Limit: {MAX_RESIZE_DIMENSION}px per side. Resize is saved as one undo step.
            </p>

            <div className="flex gap-2.5" id="resize-footer-actions">
              <button
                type="button"
                onClick={() => setShowResizeModal(false)}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 transition text-xs font-semibold rounded-xl text-zinc-300 cursor-pointer border border-zinc-800"
                id="btn-close-resize-modal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyResize}
                className="flex-1 py-1.5 bg-white hover:bg-zinc-200 transition text-xs font-bold rounded-xl text-black cursor-pointer border border-white"
                id="btn-apply-resize"
              >
                Apply Resize
              </button>
            </div>
          </div>
        </div>
      )}

      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none" id="keyboard-shortcuts-modal">
          <div className="bg-black rounded-3xl p-6 shadow-2xl border border-zinc-800 max-w-md w-full">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center shrink-0">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight font-sans">
                    Keyboard shortcuts
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans mt-1">
                    Help - Keyboard Shortcuts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyboardShortcuts(false)}
                className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                id="btn-close-keyboard-shortcuts"
                title="Close keyboard shortcuts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
              {KEYBOARD_SHORTCUTS.map(shortcut => (
                <div key={shortcut.action} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-zinc-950">
                  <span className="text-xs font-bold text-zinc-200">{shortcut.action}</span>
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {shortcut.keys.map(key => (
                      <kbd key={key} className="rounded-lg border border-zinc-800 bg-black px-2 py-1 text-[10px] font-mono font-bold text-zinc-300">
                        {key}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Guide Dialog Overlay */}
      {showOnboarding && (
        <Onboarding
          onClose={handleOnboardingClose}
          onSelectSample={handleSelectSampleProject}
        />
      )}

      {showBackgroundTemplatesModal && (
        <BackgroundTemplates
          onClose={() => setShowBackgroundTemplatesModal(false)}
          onSelectTemplate={handleAddBackgroundTemplate}
        />
      )}

      {/* Save Export Quality Selector Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none" id="export-modal-overlay">
          <div className="bg-black rounded-3xl p-6 shadow-2xl border border-zinc-800 max-w-lg w-full" id="export-modal-card">
            <h3 className="text-base font-extrabold text-white tracking-tight font-sans mb-1">
              Export picture
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-4">
              Choose format, output size, compression, and how transparent areas should be handled.
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4" id="export-format-options">
              {([
                { id: 'png' as ExportFormat, label: 'PNG', note: 'Lossless' },
                { id: 'jpeg' as ExportFormat, label: 'JPG', note: 'Small files' },
                { id: 'webp' as ExportFormat, label: 'WebP', note: 'Modern' }
              ]).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleExportFormatChange(option.id)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer select-none ${
                    exportFormat === option.id
                      ? 'border-white bg-zinc-900 text-white font-bold'
                      : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:bg-zinc-900/40'
                  }`}
                  id={`export-${option.id}-choice`}
                >
                  <span className="text-xs">{option.label}</span>
                  <span className="text-[9px] text-zinc-500 font-normal leading-none mt-0.5">{option.note}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3" id="export-dimension-inputs">
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Width
                <input
                  type="number"
                  min="1"
                  max={MAX_EXPORT_DIMENSION}
                  value={exportWidth}
                  onChange={(e) => handleExportWidthChange(Number(e.target.value))}
                  className="text-xs border border-zinc-800 rounded-xl p-2.5 font-mono w-full focus:outline-none focus:border-zinc-650 bg-zinc-950 text-white"
                  id="export-width-input"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Height
                <input
                  type="number"
                  min="1"
                  max={MAX_EXPORT_DIMENSION}
                  value={exportHeight}
                  onChange={(e) => handleExportHeightChange(Number(e.target.value))}
                  className="text-xs border border-zinc-800 rounded-xl p-2.5 font-mono w-full focus:outline-none focus:border-zinc-650 bg-zinc-950 text-white"
                  id="export-height-input"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-zinc-850 bg-zinc-950 p-3 text-xs text-zinc-300 mb-3 cursor-pointer" id="export-lock-aspect-row">
              <input
                type="checkbox"
                checked={exportLockAspect}
                onChange={(e) => handleExportLockChange(e.target.checked)}
                className="accent-white"
              />
              Keep the current aspect ratio
            </label>

            {exportFormat !== 'png' && (
              <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-3 mb-3" id="export-quality-options">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label htmlFor="export-quality-slider" className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    Quality
                  </label>
                  <span className="text-xs font-mono text-zinc-200">{exportQuality}%</span>
                </div>
                <input
                  id="export-quality-slider"
                  type="range"
                  min="1"
                  max="100"
                  value={exportQuality}
                  onChange={(e) => setExportQuality(Number(e.target.value))}
                  className="w-full accent-white"
                />
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-2">
                  Lower quality creates smaller files. PNG is always lossless, so this control only applies to JPG and WebP.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-zinc-850 bg-zinc-950 p-3 mb-4" id="export-background-options">
              <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-2">Background</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => exportFormat !== 'jpeg' && setExportBackgroundMode('transparent')}
                  disabled={exportFormat === 'jpeg'}
                  className={`py-2 rounded-lg border text-xs font-bold transition ${
                    exportBackgroundMode === 'transparent' && exportFormat !== 'jpeg'
                      ? 'bg-white text-black border-white'
                      : exportFormat === 'jpeg'
                        ? 'bg-black text-zinc-650 border-zinc-900 cursor-not-allowed'
                        : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700 cursor-pointer'
                  }`}
                  id="export-background-transparent"
                >
                  Transparent
                </button>
                <button
                  type="button"
                  onClick={() => setExportBackgroundMode('solid')}
                  className={`py-2 rounded-lg border text-xs font-bold transition cursor-pointer ${
                    exportFormat === 'jpeg' || exportBackgroundMode === 'solid'
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                  id="export-background-solid"
                >
                  Solid color
                </button>
              </div>
              {(exportFormat === 'jpeg' || exportBackgroundMode === 'solid') && (
                <label className="flex items-center justify-between gap-3 text-xs text-zinc-300">
                  <span>Fill transparent areas</span>
                  <input
                    type="color"
                    value={exportBackgroundColor}
                    onChange={(e) => setExportBackgroundColor(e.target.value)}
                    className="h-8 w-14 rounded-lg border border-zinc-800 bg-black p-1 cursor-pointer"
                    id="export-background-color"
                  />
                </label>
              )}
              {exportFormat === 'jpeg' && (
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-2">
                  JPG cannot store transparency, so a solid background is required.
                </p>
              )}
            </div>

            <p className="text-[10px] leading-relaxed text-zinc-500 mb-5">
              Source canvas: {canvasWidth} × {canvasHeight}px. Export limit: {MAX_EXPORT_DIMENSION}px per side. Export does not modify layers or history.
            </p>

            <div className="flex gap-2.5" id="export-footer-actions">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 transition text-xs font-semibold rounded-xl text-zinc-300 cursor-pointer border border-zinc-800"
                id="btn-close-export-modal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportFinishedImage}
                className="flex-1 py-1.5 bg-white hover:bg-zinc-200 transition text-xs font-bold rounded-xl text-black cursor-pointer border border-white"
                id="btn-confirm-export-download"
              >
                Export File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
