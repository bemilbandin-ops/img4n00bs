/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolType =
  | 'move'
  | 'select_rect'
  | 'select_ellipse'
  | 'select_lasso'
  | 'brush'
  | 'eraser'
  | 'cloneStamp'
  | 'healingBrush'
  | 'eyedropper'
  | 'text'
  | 'shape'
  | 'crop';

export type FilterType = 'none' | 'blur' | 'sharpen' | 'grayscale' | 'sepia';

export type EyedropperSource = 'composite' | 'active-layer';


export interface Point {
  x: number;
  y: number;
}

export interface SelectionState {
  type: 'rectangle' | 'ellipse' | 'lasso' | null;
  startPoint: Point | null;
  endPoint: Point | null;
  points: Point[]; // Used for lasso
  active: boolean;
}

export interface EditorAdjustments {
  brightness: number; // -100 to 100 (default 0)
  contrast: number;   // -100 to 100 (default 0)
  saturation: number; // -100 to 100 (default 0)
  exposure: number;   // -100 to 100 (default 0)
  hue: number;        // -180 to 180 (default 0)
  blur: number;       // 0 to 50 (default 0)
  vignette: number;   // 0 to 100 (default 0)
}

export interface TextData {
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  x: number;
  y: number;
}

export type ShapeKind = 'rectangle' | 'ellipse' | 'line' | 'arrow';

export interface ShapeData {
  kind: ShapeKind;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fillEnabled: boolean;
  strokeEnabled: boolean;
}

export interface LayerTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  /** Translation already baked into bitmap pixels during crop. */
  bakedCropOffsetX?: number;
  /** Translation already baked into bitmap pixels during crop. */
  bakedCropOffsetY?: number;
}

export interface LayerMask {
  bitmapId: string;
  enabled: boolean;
  linked: boolean;
}

interface BaseEditorLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0 to 1
  sourceId: string;
  transform: LayerTransform;
  adjustments: EditorAdjustments;
  filter: FilterType;
  blendMode?: string; // e.g. 'source-over', 'multiply', etc.
  mask?: LayerMask;
}

export type BitmapLayerType = 'image' | 'drawing';

export type BitmapEditorLayer = BaseEditorLayer & {
  type: BitmapLayerType;
  textData?: never;
  shapeData?: never;
};

export type TextEditorLayer = BaseEditorLayer & {
  type: 'text';
  textData: TextData;
  shapeData?: never;
};

export type ShapeEditorLayer = BaseEditorLayer & {
  type: 'shape';
  shapeData: ShapeData;
  textData?: never;
};

export type EditorLayer = BitmapEditorLayer | TextEditorLayer | ShapeEditorLayer;

export type HistoryLayer = EditorLayer & {
  imageData: ImageData;
  maskImageData?: ImageData;
};

export interface HistoryStep {
  layers: HistoryLayer[];
  canvasWidth: number;
  canvasHeight: number;
  activeLayerId: string;
}

export interface ProjectHistoryState {
  layers: EditorLayer[];
  canvasWidth: number;
  canvasHeight: number;
  activeLayerId: string;
}

export interface BitmapHistoryAsset {
  sourceId: string;
  imageData: ImageData;
  width: number;
  height: number;
}

export type EditorHistoryCommandType =
  | 'layer:add'
  | 'layer:delete'
  | 'layer:duplicate'
  | 'layer:visibility'
  | 'layer:opacity'
  | 'layer:blend-mode'
  | 'layer:reorder'
  | 'layer:rename'
  | 'layer:adjustments'
  | 'layer:filter'
  | 'layer:mask'
  | 'layer:text'
  | 'layer:shape'
  | 'layer:transform'
  | 'selection:copy-layer'
  | 'selection:paste-layer'
  | 'project:metadata';

export interface EditorHistoryCommand {
  type: EditorHistoryCommandType;
  label: string;
  before: ProjectHistoryState;
  after: ProjectHistoryState;
  beforeAssets?: BitmapHistoryAsset[];
  afterAssets?: BitmapHistoryAsset[];
}

export type HistoryEntry =
  | {
      kind: 'checkpoint';
      label: string;
      step: HistoryStep;
    }
  | {
      kind: 'command';
      label: string;
      command: EditorHistoryCommand;
    };
