import { type ToolType } from '../types';
import { type EditorStatePredicate } from '../utils/editorStateSummary';

export type WorkflowDifficulty = 'easy' | 'medium' | 'advanced';
export type WorkflowStarterAction = 'open-image' | 'open-sample' | 'blank-canvas';

export interface WorkflowStep {
  id: string;
  title: string;
  instruction: string;
  why?: string;
  targetElementId?: string;
  expectedState?: EditorStatePredicate;
  tool?: ToolType;
  visualDemo?: string;
  fallbackHelp?: string;
}

export interface Workflow {
  id: string;
  title: string;
  beginnerTitle: string;
  description: string;
  difficulty: WorkflowDifficulty;
  estimatedMinutes: number;
  requiredFeatures: string[];
  starterAction: WorkflowStarterAction;
  steps: WorkflowStep[];
}

export const workflows: Workflow[] = [
  {
    id: 'fix-photo',
    title: 'Fix a photo',
    beginnerTitle: 'Make a photo look better',
    description: 'Open a photo, crop distractions, adjust light and color, then export.',
    difficulty: 'easy',
    estimatedMinutes: 4,
    requiredFeatures: ['open-photo', 'crop', 'adjustments', 'export'],
    starterAction: 'open-image',
    steps: [
      {
        id: 'open-photo',
        title: 'Open a photo',
        instruction: 'Click Open photo and choose an image from your computer.',
        why: 'Every edit starts with a canvas and one image layer.',
        targetElementId: 'btn-open-photo',
        expectedState: state => state.hasProject,
        visualDemo: '/demos/layers.svg',
        fallbackHelp: 'Use Start sample if you want to practice without your own image.'
      },
      {
        id: 'crop-frame',
        title: 'Crop the frame',
        instruction: 'Choose Crop, drag the box around the best area, then keep it.',
        why: 'Cropping removes distracting edges and sets the final composition.',
        targetElementId: 'btn-select-tool-crop',
        expectedState: state => state.activeTool === 'crop',
        tool: 'crop',
        visualDemo: '/demos/crop.svg'
      },
      {
        id: 'adjust-photo',
        title: 'Improve light and color',
        instruction: 'Open Adjust and tune brightness, contrast, or saturation.',
        why: 'Small adjustments usually make the photo clearer before export.',
        targetElementId: 'tab-inspector-adjust',
        fallbackHelp: 'If Adjust is hidden, show the inspector on the right.'
      },
      {
        id: 'export-photo',
        title: 'Export the picture',
        instruction: 'Click Export Picture when the photo is ready.',
        why: 'Export creates a shareable image file. Save Project keeps layers editable.',
        targetElementId: 'btn-main-export',
        expectedState: state => state.exportModalOpen,
        visualDemo: '/demos/export.svg'
      }
    ]
  },
  {
    id: 'remove-background',
    title: 'Remove background',
    beginnerTitle: 'Make the background transparent',
    description: 'Use background removal, review the mask, clean edges, and export transparent PNG.',
    difficulty: 'medium',
    estimatedMinutes: 5,
    requiredFeatures: ['open-photo', 'background-removal', 'mask', 'brush', 'export'],
    starterAction: 'open-image',
    steps: [
      {
        id: 'open-subject-photo',
        title: 'Open the subject photo',
        instruction: 'Open the photo that contains the subject you want to keep.',
        targetElementId: 'btn-open-photo',
        expectedState: state => state.hasImageLayer,
        visualDemo: '/demos/layers.svg'
      },
      {
        id: 'find-layer-action',
        title: 'Find Remove Background',
        instruction: 'Select the image layer, then use Remove Background in the Layers panel.',
        why: 'Background removal creates a mask so pixels are hidden instead of destroyed.',
        targetElementId: 'layers-panel',
        fallbackHelp: 'Open the Layers tab if the layer actions are not visible.'
      },
      {
        id: 'apply-mask',
        title: 'Apply the preview mask',
        instruction: 'Review the preview, then click Apply Mask.',
        targetElementId: 'btn-apply-remove-background',
        visualDemo: '/demos/mask.svg'
      },
      {
        id: 'clean-mask',
        title: 'Clean the edges',
        instruction: 'Use Brush or Erase on the mask to refine missing or extra areas.',
        targetElementId: 'btn-select-tool-brush',
        tool: 'brush',
        fallbackHelp: 'White on a mask reveals; transparent/erased mask areas hide.'
      },
      {
        id: 'transparent-export',
        title: 'Export transparent PNG',
        instruction: 'Open Export Picture, choose PNG, and keep Background set to Transparent.',
        targetElementId: 'btn-main-export',
        expectedState: state => state.exportModalOpen,
        visualDemo: '/demos/export.svg'
      }
    ]
  },
  {
    id: 'cut-out',
    title: 'Cut something out',
    beginnerTitle: 'Pick one part of the image',
    description: 'Select an object, copy or mask it, and export or keep editing.',
    difficulty: 'medium',
    estimatedMinutes: 5,
    requiredFeatures: ['selection', 'mask', 'copy-selection', 'export'],
    starterAction: 'open-sample',
    steps: [
      {
        id: 'start-image',
        title: 'Start with an image',
        instruction: 'Open your own photo or use the sample project.',
        targetElementId: 'btn-start-sample',
        expectedState: state => state.hasProject
      },
      {
        id: 'select-tool',
        title: 'Choose Pick',
        instruction: 'Click Pick to start a selection.',
        why: 'Selections tell the editor which area the next action should affect.',
        targetElementId: 'btn-select-tool-select_rect',
        expectedState: state => state.activeTool === 'select_rect',
        tool: 'select_rect',
        visualDemo: '/demos/mask.svg'
      },
      {
        id: 'draw-selection',
        title: 'Drag around the object',
        instruction: 'Drag on the canvas around the object you want to keep.',
        targetElementId: 'active-drawing-canvas-element',
        expectedState: state => state.hasSelection
      },
      {
        id: 'use-selection',
        title: 'Use the selection toolbar',
        instruction: 'Choose Mask, Crop, Clear, or Copy from the action strip.',
        targetElementId: 'contextual-action-strip',
        fallbackHelp: 'Mask is safest because it hides pixels without deleting them.'
      },
      {
        id: 'finish-cutout',
        title: 'Export or save',
        instruction: 'Export a picture or save an editable project with layers intact.',
        targetElementId: 'btn-main-export'
      }
    ]
  },
  {
    id: 'add-text',
    title: 'Add text',
    beginnerTitle: 'Put words on an image',
    description: 'Add editable text as its own layer and position it with Move.',
    difficulty: 'easy',
    estimatedMinutes: 3,
    requiredFeatures: ['text', 'move', 'export'],
    starterAction: 'blank-canvas',
    steps: [
      {
        id: 'choose-text',
        title: 'Choose Text',
        instruction: 'Click Text on the left.',
        why: 'Text is created on its own layer so you can edit it later.',
        targetElementId: 'btn-select-tool-text',
        expectedState: state => state.activeTool === 'text',
        tool: 'text',
        visualDemo: '/demos/text.svg'
      },
      {
        id: 'type-words',
        title: 'Type the words',
        instruction: 'Use the Text controls in the right panel, then click Add Text.',
        targetElementId: 'tool-options-container',
        expectedState: state => state.hasTextLayer
      },
      {
        id: 'move-text',
        title: 'Move the text',
        instruction: 'Switch to Move and drag the text where it belongs.',
        targetElementId: 'btn-select-tool-move',
        tool: 'move'
      },
      {
        id: 'export-text-image',
        title: 'Export',
        instruction: 'Click Export Picture to save the result.',
        targetElementId: 'btn-main-export'
      }
    ]
  },
  {
    id: 'make-meme',
    title: 'Make meme',
    beginnerTitle: 'Caption a picture',
    description: 'Start from a photo or sample, add large text, then export for sharing.',
    difficulty: 'easy',
    estimatedMinutes: 4,
    requiredFeatures: ['sample', 'text', 'export'],
    starterAction: 'open-sample',
    steps: [
      { id: 'sample', title: 'Open a sample', instruction: 'Start with a sample or open your own meme image.', targetElementId: 'btn-start-sample', expectedState: state => state.hasProject },
      { id: 'caption', title: 'Add caption text', instruction: 'Choose Text and add your caption.', targetElementId: 'btn-select-tool-text', tool: 'text', expectedState: state => state.hasTextLayer, visualDemo: '/demos/text.svg' },
      { id: 'position', title: 'Position the caption', instruction: 'Use Move to place the caption clearly.', targetElementId: 'btn-select-tool-move', tool: 'move' },
      { id: 'export', title: 'Export meme', instruction: 'Export as PNG, JPG, or WebP.', targetElementId: 'btn-main-export' }
    ]
  },
  {
    id: 'make-sticker',
    title: 'Make sticker',
    beginnerTitle: 'Make a transparent sticker',
    description: 'Cut out a subject and export a transparent PNG sticker.',
    difficulty: 'medium',
    estimatedMinutes: 6,
    requiredFeatures: ['selection', 'background-removal', 'mask', 'transparent-png'],
    starterAction: 'open-image',
    steps: [
      { id: 'open-photo', title: 'Open a photo', instruction: 'Open a photo with the subject you want as a sticker.', targetElementId: 'btn-open-photo', expectedState: state => state.hasProject },
      { id: 'remove-background', title: 'Remove background', instruction: 'Use Remove Background from the selected image layer.', targetElementId: 'layers-panel', visualDemo: '/demos/mask.svg' },
      { id: 'clean-edge', title: 'Clean the edge', instruction: 'Brush the mask edge if anything is missing or still visible.', targetElementId: 'btn-select-tool-brush', tool: 'brush' },
      { id: 'export-transparent', title: 'Export transparent PNG', instruction: 'Export as PNG with transparent background.', targetElementId: 'btn-main-export', expectedState: state => state.exportModalOpen, visualDemo: '/demos/export.svg' }
    ]
  },
  {
    id: 'draw-on-photo',
    title: 'Draw on photo',
    beginnerTitle: 'Draw or mark up a photo',
    description: 'Open a photo, paint on a drawing layer, add shapes, and export.',
    difficulty: 'easy',
    estimatedMinutes: 3,
    requiredFeatures: ['brush', 'shape', 'export'],
    starterAction: 'open-image',
    steps: [
      { id: 'open-photo', title: 'Open a photo', instruction: 'Open the photo you want to mark up.', targetElementId: 'btn-open-photo', expectedState: state => state.hasProject },
      { id: 'brush', title: 'Choose Brush', instruction: 'Choose Brush and pick a color.', targetElementId: 'btn-select-tool-brush', tool: 'brush', visualDemo: '/demos/brush.svg' },
      { id: 'draw', title: 'Draw on the image', instruction: 'Drag on the canvas to draw.', targetElementId: 'active-drawing-canvas-element' },
      { id: 'shape', title: 'Add a shape', instruction: 'Use Shape for arrows, boxes, or circles.', targetElementId: 'btn-select-tool-shape', tool: 'shape' },
      { id: 'export', title: 'Export', instruction: 'Export the marked-up photo.', targetElementId: 'btn-main-export' }
    ]
  },
  {
    id: 'resize-upload',
    title: 'Resize for upload',
    beginnerTitle: 'Make the image fit upload limits',
    description: 'Open an image, resize it, choose export settings, and save a small file.',
    difficulty: 'easy',
    estimatedMinutes: 3,
    requiredFeatures: ['resize', 'export'],
    starterAction: 'open-image',
    steps: [
      { id: 'open', title: 'Open image', instruction: 'Open the image you need to resize.', targetElementId: 'btn-open-photo', expectedState: state => state.hasProject },
      { id: 'resize', title: 'Open Resize', instruction: 'Click Resize in the top bar and choose a target size.', targetElementId: 'btn-topbar-resize' },
      { id: 'export-small', title: 'Export smaller file', instruction: 'Export as JPG or WebP for a smaller upload file.', targetElementId: 'btn-main-export', visualDemo: '/demos/export.svg' }
    ]
  },
  {
    id: 'learn-basics',
    title: 'Learn editor basics',
    beginnerTitle: 'Learn the editor with a sample',
    description: 'Practice opening a sample, selecting layers, using tools, and exporting.',
    difficulty: 'easy',
    estimatedMinutes: 7,
    requiredFeatures: ['sample', 'layers', 'tools', 'export'],
    starterAction: 'open-sample',
    steps: [
      { id: 'sample', title: 'Open a sample', instruction: 'Click Start sample to practice without risk.', targetElementId: 'btn-start-sample', expectedState: state => state.hasProject, visualDemo: '/demos/layers.svg' },
      { id: 'layers', title: 'Look at Layers', instruction: 'Use the Layers panel to select what you want to edit.', targetElementId: 'layers-panel', visualDemo: '/demos/layers.svg' },
      { id: 'tools', title: 'Pick a tool', instruction: 'Choose a tool on the left. The right panel explains it.', targetElementId: 'editor-tool-rail' },
      { id: 'actions', title: 'Use quick actions', instruction: 'Use the action strip above the canvas for common next steps.', targetElementId: 'contextual-action-strip' },
      { id: 'export', title: 'Export when finished', instruction: 'Click Export Picture when ready to share.', targetElementId: 'btn-main-export', visualDemo: '/demos/export.svg' }
    ]
  }
];

export const workflowById = Object.fromEntries(workflows.map(workflow => [workflow.id, workflow])) as Record<string, Workflow>;

export const workflowSearchText = (workflow: Workflow) => [
  workflow.title,
  workflow.beginnerTitle,
  workflow.description,
  workflow.requiredFeatures.join(' '),
  workflow.steps.map(step => `${step.title} ${step.instruction}`).join(' ')
].join(' ').toLowerCase();
