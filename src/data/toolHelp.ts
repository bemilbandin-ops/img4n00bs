/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ToolHelpItem {
  title: string;
  summary: string;
  steps: string[];
  mistake?: string;
}

export const toolHelp: Record<string, ToolHelpItem> = {
  move: {
    title: 'Move Tool',
    summary: 'Drag, scale, and rotate layers on the canvas.',
    steps: [
      'Select a layer from the Layers tab on the right.',
      'Drag on the canvas to move the layer.',
      'Drag corners to resize, or drag the top handle to rotate.'
    ],
    mistake: 'If you cannot move anything, check that the layer is visible and not empty.'
  },
  brush: {
    title: 'Paint Brush',
    summary: 'Draw directly on the selected drawing layer.',
    steps: [
      'Choose a brush color and thickness in the controls below.',
      'Drag on the canvas to paint strokes.',
      'Paint is applied to the active drawing layer.'
    ],
    mistake: 'If paint is not showing up, make sure the active layer is visible and of type "drawing".'
  },
  eraser: {
    title: 'Eraser',
    summary: 'Wipe off pixels or drawings from the active layer.',
    steps: [
      'Select a drawing or image layer.',
      'Adjust the eraser size below.',
      'Drag over the canvas area you want to erase.'
    ],
    mistake: 'Eraser only works on pixel layers (image or drawing), not text or shapes.'
  },
  healingBrush: {
    title: 'Healing Brush',
    summary: 'Blend away spots, dust, and minor imperfections.',
    steps: [
      'Alt-click on a clean area nearby to set the source.',
      'Paint over the imperfection.',
      'The tool will blend the pixels to match the surrounding area.'
    ],
    mistake: 'If healing does not work, make sure you Alt-clicked a source area first.'
  },
  cloneStamp: {
    title: 'Clone Stamp',
    summary: 'Copy pixels from one area of the layer to another.',
    steps: [
      'Alt-click on a clean area to set the copy source.',
      'Drag over the area you want to cover.',
      'Pixels are copied directly from the source to the target.'
    ],
    mistake: 'Remember to Alt-click a source area before painting.'
  },
  text: {
    title: 'Text Tool',
    summary: 'Add editable words, captions, or headings to your design.',
    steps: [
      'Type your text in the text area below.',
      'Adjust the size, color, and font style.',
      'Click "Add Text" or press Enter to add a new layer.'
    ],
    mistake: 'You can edit existing text layers by selecting them and typing in the box.'
  },
  shape: {
    title: 'Shape Tool',
    summary: 'Draw geometric callouts, boxes, circles, arrows, or lines.',
    steps: [
      'Select a shape type (Rectangle, Circle, Line, Arrow).',
      'Choose fill and outline (stroke) colors and width.',
      'Drag on the canvas to draw the shape.'
    ],
    mistake: 'To draw a perfect square or circle, drag with equal proportions.'
  },
  crop: {
    title: 'Crop Tool',
    summary: 'Trim the canvas to a specific bounding area.',
    steps: [
      'Drag the bounding box on the canvas to frame your area.',
      'Click "Keep This Area" to crop the project.'
    ],
    mistake: 'Cropping changes the document size. Use Undo if you make a mistake.'
  },
  select_rect: {
    title: 'Box Selection',
    summary: 'Select a rectangular area to copy, erase, fill, or crop.',
    steps: [
      'Drag on the canvas to draw a select box.',
      'Use the action buttons below to fill, clear, copy, or mask.'
    ]
  },
  select_ellipse: {
    title: 'Oval Selection',
    summary: 'Select a circular/oval area to copy, erase, fill, or crop.',
    steps: [
      'Drag on the canvas to draw a circular select bounds.',
      'Use the actions below to copy or manipulate the area.'
    ]
  },
  select_lasso: {
    title: 'Lasso Selection',
    summary: 'Trace an irregular shape on the canvas to select it.',
    steps: [
      'Drag on the canvas to trace around an object.',
      'Release to close the loop and complete the selection.',
      'Use the actions below to cut or copy the traced area.'
    ]
  },
  eyedropper: {
    title: 'Color Eyedropper',
    summary: 'Sample a color directly from your artwork.',
    steps: [
      'Click anywhere on the canvas to pick its color.',
      'The picked color will be set as your current paint/text color.',
      'Double-click a recent sample to add it to swatches.'
    ]
  }
};
