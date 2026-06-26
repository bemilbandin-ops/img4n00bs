/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, 
  Crop, 
  Trash2, 
  Scissors, 
  Sparkles, 
  MousePointer, 
  ZoomIn, 
  ZoomOut, 
  RefreshCcw, 
  Hand, 
  Type,
  Pipette
} from 'lucide-react';
import { ToolType, Point, EditorLayer, SelectionState, LayerTransform, ShapeKind } from '../types';
import { renderComposite } from '../utils/renderComposite';
import { BitmapStore } from '../utils/bitmapStore';
import { getLayerContentCenter, getLayerContentBounds } from '../utils/layerTransforms';

interface CanvasAreaProps {
  layers: EditorLayer[];
  bitmapStore: BitmapStore;
  activeLayerId: string;
  canvasWidth: number;
  canvasHeight: number;
  activeTool: ToolType;
  cloneSourcePoint: Point | null;
  selection: SelectionState;
  onUpdateSelection: (sel: Partial<SelectionState>) => void;
  onDrawStart?: () => void;
  onDrawStroke: (points: Point[], isEraser: boolean) => void;
  onSetCloneSource: (point: Point) => void;
  onUpdateTextPosition: (x: number, y: number) => void;
  onSampleColor: (point: Point) => void;
  onCreateShapeLayer: (start: Point, end: Point) => void;
  shapeKind: ShapeKind;
  shapeFillColor: string;
  shapeStrokeColor: string;
  shapeStrokeWidth: number;
  shapeFillEnabled: boolean;
  shapeStrokeEnabled: boolean;
  onSetActiveLayerTransform: (transform: LayerTransform, commit: boolean) => void;
  onFileLoaded: (file: File) => void;
  onSelectSample: (type: 'cat' | 'scenic' | 'blank') => void;
  
  // Crop states
  cropRect: { x: number; y: number; w: number; h: number } | null;
  onUpdateCropRect: (rect: { x: number; y: number; w: number; h: number } | null) => void;
  onExecuteCrop: () => void;
  
  // Selection Actions
  onFillSelectionColor: () => void;
  onClearSelectionArea: () => void;
  onCancelSelectionArea: () => void;
  onDrawEnd: () => void;
}


type TransformHandle = 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br' | 'rotate';

interface TransformInteraction {
  handle: TransformHandle;
  startPoint: Point;
  startTransform: LayerTransform;
  startAngleDeg: number;
}

const MIN_LAYER_SCALE = 0.1;
const MAX_LAYER_SCALE = 6;

const clampScale = (value: number) => Math.max(MIN_LAYER_SCALE, Math.min(MAX_LAYER_SCALE, value));
const toDegrees = (radians: number) => radians * 180 / Math.PI;
const toRadians = (degrees: number) => degrees * Math.PI / 180;

export default function CanvasArea({
  layers,
  bitmapStore,
  activeLayerId,
  canvasWidth,
  canvasHeight,
  activeTool,
  cloneSourcePoint,
  selection,
  onUpdateSelection,
  onDrawStart,
  onDrawStroke,
  onSetCloneSource,
  onDrawEnd,
  onUpdateTextPosition,
  onSampleColor,
  onCreateShapeLayer,
  shapeKind,
  shapeFillColor,
  shapeStrokeColor,
  shapeStrokeWidth,
  shapeFillEnabled,
  shapeStrokeEnabled,
  onSetActiveLayerTransform,
  onFileLoaded,
  onSelectSample,
  cropRect,
  onUpdateCropRect,
  onExecuteCrop,
  onFillSelectionColor,
  onClearSelectionArea,
  onCancelSelectionArea
}: CanvasAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [isDraggingCrop, setIsDraggingCrop] = useState<string | null>(null);
  const [cropDragStart, setCropDragStart] = useState<Point | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isMovingLayer, setIsMovingLayer] = useState(false);
  const [layerMoveStart, setLayerMoveStart] = useState<Point | null>(null);
  const [layerMoveStartTransform, setLayerMoveStartTransform] = useState<LayerTransform | null>(null);
  const [pendingLayerTransform, setPendingLayerTransform] = useState<LayerTransform | null>(null);
  const [transformInteraction, setTransformInteraction] = useState<TransformInteraction | null>(null);
  const [shapeDraft, setShapeDraft] = useState<{ start: Point; end: Point } | null>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId);

  // Reset zoom on load
  useEffect(() => {
    if (canvasWidth > 0 && containerRef.current) {
      const container = containerRef.current;
      const fitZoom = Math.min(
        (container.clientWidth - 40) / canvasWidth,
        (container.clientHeight - 40) / canvasHeight,
        1 // Cap at 100% size initially
      );
      setZoom(Math.round(fitZoom * 10) / 10 || 0.8);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(value => Math.min(4, Math.round((value + 0.1) * 10) / 10));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(value => Math.max(0.1, Math.round((value - 0.1) * 10) / 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Composite layers onto main preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasWidth === 0) return;

    renderComposite({
      layers,
      bitmapStore,
      width: canvasWidth,
      height: canvasHeight,
      targetCanvas: canvas
    });
  }, [layers, canvasWidth, canvasHeight]);

  // Handle Drag over & Leave
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileLoaded(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileLoaded(file);
    }
  };

  // Convert client cursor coords to Canvas relative coords based on current zoom and pan offset
  const getCanvasCoords = (clientX: number, clientY: number, clampToCanvas = true): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale factor
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    
    const rawX = (clientX - rect.left) * scaleX;
    const rawY = (clientY - rect.top) * scaleY;
    const x = clampToCanvas ? Math.max(0, Math.min(canvasWidth, rawX)) : rawX;
    const y = clampToCanvas ? Math.max(0, Math.min(canvasHeight, rawY)) : rawY;
    
    return { 
      x: Math.round(x), 
      y: Math.round(y) 
    };
  };

  const normalizeCropRect = (rect: { x: number; y: number; w: number; h: number }) => {
    const minSize = 10;
    let x = rect.x;
    let y = rect.y;
    let w = rect.w;
    let h = rect.h;

    if (w < 0) {
      x += w;
      w = Math.abs(w);
    }
    if (h < 0) {
      y += h;
      h = Math.abs(h);
    }

    x = Math.max(0, Math.min(canvasWidth - minSize, x));
    y = Math.max(0, Math.min(canvasHeight - minSize, y));
    w = Math.max(minSize, Math.min(canvasWidth - x, w));
    h = Math.max(minSize, Math.min(canvasHeight - y, h));

    return {
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h)
    };
  };

  const getLayerCenter = (transform: LayerTransform): Point => {
    if (!activeLayer) {
      return {
        x: transform.x + canvasWidth / 2,
        y: transform.y + canvasHeight / 2
      };
    }
    const center = getLayerContentCenter(activeLayer, canvasWidth, canvasHeight);
    return {
      x: transform.x + center.x,
      y: transform.y + center.y
    };
  };

  const pointToLayerLocalSpace = (point: Point, transform: LayerTransform): Point => {
    const center = getLayerCenter(transform);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const angle = -toRadians(transform.rotation);

    return {
      x: dx * Math.cos(angle) - dy * Math.sin(angle),
      y: dx * Math.sin(angle) + dy * Math.cos(angle)
    };
  };

  const calculateTransformFromInteraction = (point: Point, interaction: TransformInteraction): LayerTransform => {
    if (interaction.handle === 'rotate') {
      const center = getLayerCenter(interaction.startTransform);
      const angle = toDegrees(Math.atan2(point.y - center.y, point.x - center.x));
      const delta = angle - interaction.startAngleDeg;

      return {
        ...interaction.startTransform,
        rotation: Math.round(interaction.startTransform.rotation + delta)
      };
    }

    const local = pointToLayerLocalSpace(point, interaction.startTransform);
    const bounds = activeLayer
      ? getLayerContentBounds(activeLayer, canvasWidth, canvasHeight)
      : { width: canvasWidth, height: canvasHeight };

    return {
      ...interaction.startTransform,
      scaleX: Number(clampScale(Math.abs(local.x) / (bounds.width / 2)).toFixed(3)),
      scaleY: Number(clampScale(Math.abs(local.y) / (bounds.height / 2)).toFixed(3))
    };
  };

  const beginTransformInteraction = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    handle: TransformHandle
  ) => {
    if (!activeLayer || canvasWidth === 0) return;

    e.preventDefault();
    e.stopPropagation();

    const isTouch = 'touches' in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const point = getCanvasCoords(clientX, clientY, false);
    const startTransform = { ...activeLayer.transform };
    const center = getLayerCenter(startTransform);

    setTransformInteraction({
      handle,
      startPoint: point,
      startTransform,
      startAngleDeg: toDegrees(Math.atan2(point.y - center.y, point.x - center.x))
    });
    setPendingLayerTransform(null);
  };

  // Mouse & Touch Handlers
  const handleDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (canvasWidth === 0) return;

    const isTouch = 'touches' in e;
    if (isTouch) e.preventDefault();
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const clickCoords = getCanvasCoords(clientX, clientY);

    // Zoom/Pan tool via middle click or Space/Alt (or simple Select tool if designated)
    const isMiddleClick = !isTouch && e.button === 1;
    if (isMiddleClick || (activeTool === 'select_rect' && !isTouch && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
      return;
    }

    if (activeTool === 'eyedropper') {
      onSampleColor(clickCoords);
      return;
    }

    if ((activeTool === 'cloneStamp' || activeTool === 'healingBrush') && !isTouch && (e.altKey || e.shiftKey)) {
      onSetCloneSource(clickCoords);
      return;
    }

    if (activeTool === 'move' && activeLayer) {
      setIsMovingLayer(true);
      setLayerMoveStart(clickCoords);
      setLayerMoveStartTransform({ ...activeLayer.transform });
      setPendingLayerTransform(null);
      return;
    }

    // 1. Text Tool click to reposition/place text
    if (activeTool === 'text') {
      onUpdateTextPosition(clickCoords.x, clickCoords.y);
      return;
    }

    if (activeTool === 'shape') {
      setIsDrawing(true);
      setShapeDraft({ start: clickCoords, end: clickCoords });
      return;
    }

    // 2. Crop Overlay Corner Dragging
    if (activeTool === 'crop' && cropRect) {
      const handleSize = 14 / zoom; // Draggable size scaled
      const rx = cropRect.x;
      const ry = cropRect.y;
      const rw = cropRect.w;
      const rh = cropRect.h;

      // Check distance to corners
      const dist = (px: number, py: number, qx: number, qy: number) => 
        Math.sqrt((px - qx) ** 2 + (py - qy) ** 2);

      const thresh = handleSize * 1.5;

      if (dist(clickCoords.x, clickCoords.y, rx, ry) < thresh) {
        setIsDraggingCrop('tl');
      } else if (dist(clickCoords.x, clickCoords.y, rx + rw, ry) < thresh) {
        setIsDraggingCrop('tr');
      } else if (dist(clickCoords.x, clickCoords.y, rx, ry + rh) < thresh) {
        setIsDraggingCrop('bl');
      } else if (dist(clickCoords.x, clickCoords.y, rx + rw, ry + rh) < thresh) {
        setIsDraggingCrop('br');
      } else if (
        clickCoords.x > rx && 
        clickCoords.x < rx + rw && 
        clickCoords.y > ry && 
        clickCoords.y < ry + rh
      ) {
        setIsDraggingCrop('move');
        setCropDragStart(clickCoords);
      }
      return;
    }

    // 3. Brush / Eraser drawing
    if (activeTool === 'cloneStamp' || activeTool === 'healingBrush') {
      if (!cloneSourcePoint || !activeLayer?.visible || (activeLayer.type !== 'image' && activeLayer.type !== 'drawing')) return;
      setIsDrawing(true);
      setDrawPoints([clickCoords]);
      if (onDrawStart) onDrawStart();
      return;
    }

    if (activeTool === 'brush' || activeTool === 'eraser') {
      setIsDrawing(true);
      setDrawPoints([clickCoords]);
      if (onDrawStart) onDrawStart();
      return;
    }

    // 4. Selections
    if (activeTool.startsWith('select_')) {
      const selectionType = activeTool === 'select_rect' ? 'rectangle' : activeTool === 'select_ellipse' ? 'ellipse' : 'lasso';
      setIsDrawing(true);
      onUpdateSelection({
        type: selectionType,
        startPoint: clickCoords,
        endPoint: clickCoords,
        points: [clickCoords],
        active: true
      });
      return;
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (canvasWidth === 0) return;
    
    const isTouch = 'touches' in e;
    if (isTouch) e.preventDefault();
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const moveCoords = getCanvasCoords(clientX, clientY, !transformInteraction);

    if (transformInteraction && activeTool === 'move') {
      const nextTransform = calculateTransformFromInteraction(moveCoords, transformInteraction);
      setPendingLayerTransform(nextTransform);
      onSetActiveLayerTransform(nextTransform, false);
      return;
    }

    if (isPanning) {
      setPanOffset({
        x: clientX - panStart.x,
        y: clientY - panStart.y
      });
      return;
    }

    if (isMovingLayer && activeTool === 'move' && layerMoveStart && layerMoveStartTransform) {
      const dx = moveCoords.x - layerMoveStart.x;
      const dy = moveCoords.y - layerMoveStart.y;
      const nextTransform: LayerTransform = {
        ...layerMoveStartTransform,
        x: Math.round(layerMoveStartTransform.x + dx),
        y: Math.round(layerMoveStartTransform.y + dy)
      };
      setPendingLayerTransform(nextTransform);
      onSetActiveLayerTransform(nextTransform, false);
      return;
    }

    // 1. Crop dragging updates
    if (activeTool === 'crop' && cropRect && isDraggingCrop) {
      const rx = cropRect.x;
      const ry = cropRect.y;
      const rw = cropRect.w;
      const rh = cropRect.h;
      
      let nextRect = { ...cropRect };

      if (isDraggingCrop === 'move' && cropDragStart) {
        const dx = moveCoords.x - cropDragStart.x;
        const dy = moveCoords.y - cropDragStart.y;
        nextRect.x = Math.max(0, Math.min(canvasWidth - rw, rx + dx));
        nextRect.y = Math.max(0, Math.min(canvasHeight - rh, ry + dy));
        setCropDragStart(moveCoords);
      } else if (isDraggingCrop === 'tl') {
        nextRect.x = moveCoords.x;
        nextRect.y = moveCoords.y;
        nextRect.w = rx + rw - moveCoords.x;
        nextRect.h = ry + rh - moveCoords.y;
      } else if (isDraggingCrop === 'tr') {
        nextRect.y = moveCoords.y;
        nextRect.w = moveCoords.x - rx;
        nextRect.h = ry + rh - moveCoords.y;
      } else if (isDraggingCrop === 'bl') {
        nextRect.x = moveCoords.x;
        nextRect.w = rx + rw - moveCoords.x;
        nextRect.h = moveCoords.y - ry;
      } else if (isDraggingCrop === 'br') {
        nextRect.w = moveCoords.x - rx;
        nextRect.h = moveCoords.y - ry;
      }

      onUpdateCropRect(normalizeCropRect(nextRect));
      return;
    }

    if (isDrawing && activeTool === 'shape' && shapeDraft) {
      setShapeDraft({ ...shapeDraft, end: moveCoords });
      return;
    }

    // 2. Brush stroke collecting
    if (isDrawing && (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'cloneStamp' || activeTool === 'healingBrush')) {
      const updated = [...drawPoints, moveCoords];
      setDrawPoints(updated);
      
      // Perform progressive drawing onto active layer immediately for lag-free performance
      onDrawStroke(updated, activeTool === 'eraser');
      return;
    }

    // 3. Selection dragging updates
    if (isDrawing && activeTool.startsWith('select_')) {
      if (selection.type === 'lasso') {
        onUpdateSelection({
          points: [...selection.points, moveCoords],
          endPoint: moveCoords
        });
      } else {
        onUpdateSelection({
          endPoint: moveCoords
        });
      }
      return;
    }
  };

  const handleUp = () => {
    setIsPanning(false);
    setIsDraggingCrop(null);
    setCropDragStart(null);

    if (transformInteraction) {
      if (pendingLayerTransform) {
        onSetActiveLayerTransform(pendingLayerTransform, true);
      }
      setTransformInteraction(null);
      setPendingLayerTransform(null);
    }

    if (isMovingLayer) {
      if (pendingLayerTransform) {
        onSetActiveLayerTransform(pendingLayerTransform, true);
      }
      setIsMovingLayer(false);
      setLayerMoveStart(null);
      setLayerMoveStartTransform(null);
      setPendingLayerTransform(null);
    }

    if (isDrawing) {
      setIsDrawing(false);
      
      if (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'cloneStamp' || activeTool === 'healingBrush') {
        setDrawPoints([]);
        onDrawEnd();
      }

      if (activeTool === 'shape' && shapeDraft) {
        onCreateShapeLayer(shapeDraft.start, shapeDraft.end);
        setShapeDraft(null);
      }
    }
  };

  const resetPan = () => {
    setPanOffset({ x: 0, y: 0 });
    if (canvasWidth > 0 && containerRef.current) {
      const container = containerRef.current;
      const fitZoom = Math.min(
        (container.clientWidth - 40) / canvasWidth,
        (container.clientHeight - 40) / canvasHeight,
        1
      );
      setZoom(fitZoom);
    }
  };

  // Selection outline bounds computed in viewport pixels
  const getSelectionStyles = () => {
    if (!selection.active || !selection.startPoint || !selection.endPoint || selection.type === 'lasso') return null;
    
    // Convert canvas coords to overlay percentages/styles
    const x = Math.min(selection.startPoint.x, selection.endPoint.x);
    const y = Math.min(selection.startPoint.y, selection.endPoint.y);
    const w = Math.abs(selection.startPoint.x - selection.endPoint.x);
    const h = Math.abs(selection.startPoint.y - selection.endPoint.y);

    return {
      left: `${(x / canvasWidth) * 100}%`,
      top: `${(y / canvasHeight) * 100}%`,
      width: `${(w / canvasWidth) * 100}%`,
      height: `${(h / canvasHeight) * 100}%`,
      borderRadius: selection.type === 'ellipse' ? '50%' : '0px'
    };
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" id="canvas-workspace-box">
      {/* Zoom / Canvas Controls Header */}
      {canvasWidth > 0 && (
        <div className="bg-black border border-zinc-900 rounded-2xl px-4 py-2 mb-3 flex items-center justify-between shadow-lg select-none" id="canvas-zoom-toolbar">
          <div className="flex items-center gap-1.5" id="canvas-resolution-details">
            <span className="text-xs bg-zinc-900 text-white px-2.5 py-0.5 rounded-lg font-bold font-mono border border-zinc-800">
              {canvasWidth} × {canvasHeight} px
            </span>
            <span className="text-xs text-text-secondary capitalize hidden sm:inline-block">
              Active Layer: {layers.find(l => l.id === activeLayerId)?.name || 'None'}
            </span>
          </div>

          <div className="flex items-center gap-2" id="zoom-control-cluster">
            <button
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
              className="p-1 px-1.5 hover:bg-zinc-900 rounded-lg text-text-secondary hover:text-text-primary transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Zoom out of image"
              id="btn-zoom-out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-text-primary min-w-12 text-center" id="zoom-percentage-text">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(4, zoom + 0.1))}
              className="p-1 px-1.5 hover:bg-zinc-900 rounded-lg text-text-secondary hover:text-text-primary transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Zoom in on image"
              id="btn-zoom-in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetPan}
              className="p-1.5 hover:bg-zinc-900 rounded-lg text-text-secondary hover:text-text-primary transition cursor-pointer"
              title="Recenter and Fit viewport"
              id="btn-recenter-canvas"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Drag-And-Drop / Grid Arena */}
      <div 
        ref={containerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 relative rounded-3xl border border-dashed flex flex-col items-center transition-all duration-300 min-h-[350px] bg-black ${
          canvasWidth === 0 ? 'justify-center overflow-hidden' : 'justify-start overflow-auto p-5 sm:p-6'
        } ${
          isDragOver 
            ? 'border-white bg-zinc-905 scale-[0.99] shadow-inner' 
            : 'border-zinc-900 hover:border-zinc-800'
        }`}
        id="canvas-viewport"
      >
        {canvasWidth === 0 ? (
          /* Landing Dashboard / Empty State Upload Option */
          <div className="max-w-md w-full p-8 text-center flex flex-col items-center" id="unloaded-dashboard">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-white shadow-md mb-4 animate-pulse">
              <Upload className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-extrabold text-white tracking-tight font-sans mb-2">
              Let's craft some magic!
            </h3>
            <p className="ui-body font-sans mb-6">
              Drag and drop any picture here, search a local file, or experience one of our fun starter playgrounds:
            </p>

            {/* Standard File Picker Core */}
            <label className="cursor-pointer bg-white hover:bg-zinc-200 text-black font-extrabold py-3 px-6 rounded-2xl text-sm shadow-md transition inline-flex items-center gap-2 mb-8 select-none">
              <Upload className="w-4 h-4" /> Pick a Photo
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </label>

            {/* Beginner Template Quick Try */}
            <div className="w-full flex flex-col gap-3" id="starter-samples-block">
              <span className="text-xs uppercase font-bold text-text-secondary tracking-wider font-sans">
                Try a Starter Desk Project
              </span>
              <div className="grid grid-cols-3 gap-3" id="onboarding-starter-cards">
                <button
                  onClick={() => onSelectSample('cat')}
                  className="flex flex-col items-center gap-2 p-2 bg-black border border-zinc-900 hover:border-white hover:bg-zinc-905 transition select-none cursor-pointer"
                  id="sample-trigger-cat"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80" 
                    alt="Cute Cat" 
                    className="w-16 h-12 object-cover rounded-xl shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] font-bold text-zinc-300 font-sans">Kitten Photo</span>
                </button>
                <button
                  onClick={() => onSelectSample('scenic')}
                  className="flex flex-col items-center gap-2 p-2 bg-black border border-zinc-900 hover:border-white hover:bg-zinc-905 transition select-none cursor-pointer"
                  id="sample-trigger-scenic"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&auto=format&fit=crop&q=80" 
                    alt="Scenic Mountain" 
                    className="w-16 h-12 object-cover rounded-xl shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] font-bold text-zinc-300 font-sans">Mountain</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSample('blank')}
                  className="flex flex-col items-center justify-center p-2 bg-black border border-zinc-900 hover:border-white hover:bg-zinc-905 transition select-none h-[82px] cursor-pointer"
                  id="sample-trigger-blank"
                >
                  <div className="w-16 h-10 border border-dashed border-zinc-800 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500">
                    <Hand className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300 mt-2 font-sans">Blank Draw</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Interactive Workspace Canvas Section */
          <div 
            className={`relative overflow-visible flex items-center justify-center ${activeTool === 'move' ? 'cursor-move' : activeTool === 'eyedropper' ? 'cursor-copy' : 'cursor-crosshair'}`}
            style={{ 
              width: `${canvasWidth}px`, 
              height: `${canvasHeight}px`,
              transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
              transformOrigin: 'top center',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              touchAction: 'none'
            }}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            onTouchStart={handleDown}
            onTouchMove={handleMove}
            onTouchEnd={handleUp}
            id="active-artboard-frame"
          >
            {/* The Physical Composite Canvas Layer */}
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="shadow-xl bg-white rounded-md max-w-none checkboard-bg"
              id="active-drawing-canvas-element"
            />

            {/* Selection Outlines SVG/HTML Overlay */}
            {selection.active && selection.startPoint && selection.endPoint && (
              <div className="absolute inset-0 pointer-events-none select-none z-10" id="selection-visuals-overlay">
                {selection.type === 'lasso' ? (
                  /* Lasso Poly Outline SVG rendering */
                  <svg className="absolute inset-0 w-full h-full" id="lasso-svg-path">
                    <polygon
                      points={selection.points.map(p => `${p.x},${p.y}`).join(' ')}
                      className="fill-none stroke-indigo-600 stroke-2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                ) : (
                  /* Standard Square / Oval Selection Outline rendering */
                  <div 
                    style={getSelectionStyles() || {}}
                    className="absolute border-2 border-indigo-600 border-dashed animate-marching-ants"
                    id="shape-selection-antbox"
                  />
                )}
              </div>
            )}

            {activeTool === 'shape' && shapeDraft && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" id="shape-draft-preview">
                {shapeKind === 'arrow' && (
                  <defs>
                    <marker
                      id="shape-draft-arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill={shapeStrokeColor} />
                    </marker>
                  </defs>
                )}
                {(shapeKind === 'line' || shapeKind === 'arrow') ? (
                  <line
                    x1={shapeDraft.start.x}
                    y1={shapeDraft.start.y}
                    x2={shapeDraft.end.x}
                    y2={shapeDraft.end.y}
                    stroke={shapeStrokeColor}
                    strokeWidth={Math.max(1, shapeStrokeWidth)}
                    strokeLinecap="round"
                    markerEnd={shapeKind === 'arrow' ? 'url(#shape-draft-arrowhead)' : undefined}
                  />
                ) : shapeKind === 'ellipse' ? (
                  <ellipse
                    cx={(shapeDraft.start.x + shapeDraft.end.x) / 2}
                    cy={(shapeDraft.start.y + shapeDraft.end.y) / 2}
                    rx={Math.abs(shapeDraft.end.x - shapeDraft.start.x) / 2}
                    ry={Math.abs(shapeDraft.end.y - shapeDraft.start.y) / 2}
                    fill={shapeFillEnabled ? shapeFillColor : 'none'}
                    fillOpacity={shapeFillEnabled ? 0.45 : undefined}
                    stroke={shapeStrokeEnabled ? shapeStrokeColor : 'none'}
                    strokeWidth={Math.max(1, shapeStrokeWidth)}
                    strokeDasharray="6 4"
                  />
                ) : (
                  <rect
                    x={Math.min(shapeDraft.start.x, shapeDraft.end.x)}
                    y={Math.min(shapeDraft.start.y, shapeDraft.end.y)}
                    width={Math.abs(shapeDraft.end.x - shapeDraft.start.x)}
                    height={Math.abs(shapeDraft.end.y - shapeDraft.start.y)}
                    fill={shapeFillEnabled ? shapeFillColor : 'none'}
                    fillOpacity={shapeFillEnabled ? 0.45 : undefined}
                    stroke={shapeStrokeEnabled ? shapeStrokeColor : 'none'}
                    strokeWidth={Math.max(1, shapeStrokeWidth)}
                    strokeDasharray="6 4"
                  />
                )}
              </svg>
            )}

            {/* Drag Crop Corners Overlay Layer for Crop Tool */}
            {activeTool === 'crop' && cropRect && (
              <div className="absolute inset-0 z-20 select-none cursor-default" id="crop-tool-overlay">
                {/* Dark Mask outside crop bounds */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <defs>
                    <mask id="crop-mask">
                      <rect width={canvasWidth} height={canvasHeight} fill="white" />
                      <rect 
                        x={cropRect.x} 
                        y={cropRect.y} 
                        width={cropRect.w} 
                        height={cropRect.h} 
                        fill="black" 
                      />
                    </mask>
                  </defs>
                  <rect 
                    width={canvasWidth} 
                    height={canvasHeight} 
                    fill="black" 
                    opacity="0.55" 
                    mask="url(#crop-mask)" 
                  />
                  {/* Outer border of crop container */}
                  <rect
                    x={cropRect.x}
                    y={cropRect.y}
                    width={cropRect.w}
                    height={cropRect.h}
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Handlers at crop corners */}
                {[
                  { id: 'tl', cx: cropRect.x, cy: cropRect.y, cursor: 'nwse-resize' },
                  { id: 'tr', cx: cropRect.x + cropRect.w, cy: cropRect.y, cursor: 'nesw-resize' },
                  { id: 'bl', cx: cropRect.x, cy: cropRect.y + cropRect.h, cursor: 'nesw-resize' },
                  { id: 'br', cx: cropRect.x + cropRect.w, cy: cropRect.y + cropRect.h, cursor: 'nwse-resize' },
                ].map((handle) => (
                  <div
                    key={handle.id}
                    className="absolute w-5 h-5 bg-white border-2 border-indigo-600 rounded-full shadow-lg z-30"
                    style={{
                      left: `${handle.cx}px`,
                      top: `${handle.cy}px`,
                      transform: 'translate(-50%, -50%)',
                      cursor: handle.cursor,
                    }}
                    id={`crop-handle-${handle.id}`}
                  />
                ))}
              </div>
            )}

            {activeTool === 'move' && activeLayer && (() => {
              const bounds = getLayerContentBounds(activeLayer, canvasWidth, canvasHeight);
              return (
                <div
                  className="absolute border-2 border-white border-dashed pointer-events-none z-20 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.8)]"
                  style={{
                    left: `${activeLayer.transform.x + bounds.left}px`,
                    top: `${activeLayer.transform.y + bounds.top}px`,
                    width: `${bounds.width}px`,
                    height: `${bounds.height}px`,
                    transform: `rotate(${activeLayer.transform.rotation}deg) scale(${activeLayer.transform.scaleX}, ${activeLayer.transform.scaleY})`,
                    transformOrigin: 'center center'
                  }}
                  id="active-layer-transform-outline"
                >
                  {[
                    { id: 'scale-tl' as TransformHandle, left: '0%', top: '0%', cursor: 'nwse-resize' },
                    { id: 'scale-tr' as TransformHandle, left: '100%', top: '0%', cursor: 'nesw-resize' },
                    { id: 'scale-bl' as TransformHandle, left: '0%', top: '100%', cursor: 'nesw-resize' },
                    { id: 'scale-br' as TransformHandle, left: '100%', top: '100%', cursor: 'nwse-resize' }
                  ].map((handle) => (
                    <div
                      key={handle.id}
                      className="absolute w-5 h-5 bg-white border-2 border-black rounded-full shadow-lg pointer-events-auto"
                      style={{
                        left: handle.left,
                        top: handle.top,
                        transform: 'translate(-50%, -50%)',
                        cursor: handle.cursor
                      }}
                      onMouseDown={(e) => beginTransformInteraction(e, handle.id)}
                      onTouchStart={(e) => beginTransformInteraction(e, handle.id)}
                      title="Drag to scale active layer"
                      id={`layer-transform-handle-${handle.id}`}
                    />
                  ))}

                  <div
                    className="absolute left-1/2 -top-11 w-5 h-5 bg-indigo-500 border-2 border-white rounded-full shadow-lg pointer-events-auto"
                    style={{
                      transform: 'translate(-50%, -50%)',
                      cursor: 'grab'
                    }}
                    onMouseDown={(e) => beginTransformInteraction(e, 'rotate')}
                    onTouchStart={(e) => beginTransformInteraction(e, 'rotate')}
                    title="Drag to rotate active layer"
                    id="layer-transform-handle-rotate"
                  />
                  <div className="absolute left-1/2 top-0 w-px h-8 bg-white/80 -translate-x-1/2 -translate-y-9 pointer-events-none" />
                </div>
              );
            })()}

            {activeTool === 'move' && activeLayer && !isMovingLayer && !transformInteraction && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-3 rounded-xl flex items-center gap-1 shadow-md pointer-events-none z-30" id="move-tool-prompt">
                <MousePointer className="w-3.5 h-3.5" /> Drag layer, corners scale, top dot rotates
              </div>
            )}

            {/* Active tool specific feedback (e.g. Text Placement Prompt) */}
            {activeTool === 'eyedropper' && (
              <div className="absolute inset-0 hover:bg-black/5 flex items-center justify-center text-center p-4 pointer-events-none z-10" id="eyedropper-sample-prompt">
                <div className="bg-zinc-900/95 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-3 rounded-xl flex items-center gap-1 shadow-md">
                  <Pipette className="w-3.5 h-3.5" /> Click a pixel to copy its color
                </div>
              </div>
            )}
            {activeTool === 'text' && (
              <div className="absolute inset-0 hover:bg-black/5 flex items-center justify-center text-center p-4 pointer-events-none z-10" id="text-placement-prompt">
                <div className="bg-zinc-900/95 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-3 rounded-xl flex items-center gap-1 shadow-md">
                  <Type className="w-3.5 h-3.5" /> Tap anywhere to position text!
                </div>
              </div>
            )}
            {activeTool === 'shape' && !shapeDraft && (
              <div className="absolute inset-0 hover:bg-black/5 flex items-center justify-center text-center p-4 pointer-events-none z-10" id="shape-placement-prompt">
                <div className="bg-zinc-900/95 backdrop-blur-xs text-white text-[11px] font-bold py-1 px-3 rounded-xl flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3.5 h-3.5" /> Drag to draw a shape layer
                </div>
              </div>
            )}
          </div>
        )}

        {/* Float selection action shortcuts instantly below active selection */}
        {selection.active && selection.startPoint && selection.endPoint && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black border border-zinc-800 text-white p-2 rounded-2xl flex items-center gap-1 shadow-2xl z-40 select-none animate-bounce" id="selection-floatbar">
            <button
              onClick={onExecuteCrop}
              className="flex items-center gap-1 text-[11px] hover:bg-zinc-900 p-1.5 px-3 rounded-xl transition font-bold"
              id="fbtn-crop"
            >
              <Crop className="w-3.5 h-3.5 text-white" /> Crop
            </button>
            <div className="w-[1px] h-4 bg-zinc-800" />
            <button
              onClick={onFillSelectionColor}
              className="flex items-center gap-1 text-[11px] hover:bg-zinc-900 p-1.5 px-3 rounded-xl transition font-bold"
              id="fbtn-fill"
            >
              <Scissors className="w-3.5 h-3.5 text-white rotate-90" /> Fill
            </button>
            <div className="w-[1px] h-4 bg-zinc-800" />
            <button
              onClick={onClearSelectionArea}
              className="flex items-center gap-1 text-[11px] hover:bg-zinc-900 p-1.5 px-3 rounded-xl transition font-bold"
              id="fbtn-erase"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" /> Erase
            </button>
            <div className="w-[1px] h-4 bg-zinc-800" />
            <button
              onClick={onCancelSelectionArea}
              className="flex items-center gap-1 text-[11px] hover:bg-zinc-900 p-1.5 px-2 rounded-xl text-zinc-400 hover:text-white transition"
              id="fbtn-cancel"
            >
              Deselect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
