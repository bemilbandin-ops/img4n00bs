export interface ConceptDoc {
  id: string;
  title: string;
  plainMeaning: string;
  whenItMatters: string;
  steps: string[];
  commonMistake: string;
  visualDemo?: string;
}

export const conceptDocs: ConceptDoc[] = [
  {
    id: 'layers',
    title: 'Layers',
    plainMeaning: 'Layers are separate pieces stacked on top of each other.',
    whenItMatters: 'Use layers when text, drawings, cutouts, or backgrounds need independent editing.',
    steps: ['Select a layer before editing.', 'Hide layers to inspect the stack.', 'Use Move to reposition one layer at a time.'],
    commonMistake: 'Editing the wrong layer and thinking the tool is broken.',
    visualDemo: '/demos/layers.svg'
  },
  {
    id: 'masks',
    title: 'Masks',
    plainMeaning: 'Masks hide parts of a layer without deleting the pixels.',
    whenItMatters: 'Use masks for background removal, sticker cleanup, and reversible cutouts.',
    steps: ['Create a mask from a selection or background removal.', 'Paint on the mask to reveal or hide.', 'Toggle the mask to compare.'],
    commonMistake: 'Erasing pixels when a mask would be safer.',
    visualDemo: '/demos/mask.svg'
  },
  {
    id: 'selections',
    title: 'Selections',
    plainMeaning: 'A selection limits the next edit to one area.',
    whenItMatters: 'Use selections before copying, cutting, clearing, filling, cropping, or masking part of an image.',
    steps: ['Choose Pick.', 'Drag around the area.', 'Use the action strip that appears.'],
    commonMistake: 'Trying to mask or cut before selecting an area.',
    visualDemo: '/demos/mask.svg'
  },
  {
    id: 'export-vs-project',
    title: 'Export vs project save',
    plainMeaning: 'Export makes a final picture. Save Project keeps the editable layer file.',
    whenItMatters: 'Export when sharing; save the project when you want to keep editing later.',
    steps: ['Use Save Project for editable .n00bs files.', 'Use Export Picture for PNG, JPG, or WebP.', 'Use transparent PNG for stickers.'],
    commonMistake: 'Exporting only, then expecting to reopen editable layers later.',
    visualDemo: '/demos/export.svg'
  },
  {
    id: 'canvas-vs-image-size',
    title: 'Canvas size vs image size',
    plainMeaning: 'The canvas is the document frame. Image layers are content inside it.',
    whenItMatters: 'Resize the canvas for layout; resize the image for upload dimensions or smaller files.',
    steps: ['Use Crop to trim the frame.', 'Use Resize to scale the project.', 'Check export width and height before saving.'],
    commonMistake: 'Cropping when you meant to resize for upload.',
    visualDemo: '/demos/crop.svg'
  },
  {
    id: 'opacity-blend',
    title: 'Opacity and blend modes',
    plainMeaning: 'Opacity controls transparency. Blend modes change how layers visually mix.',
    whenItMatters: 'Use opacity for subtle overlays; use blend modes for advanced compositing.',
    steps: ['Select the layer.', 'Lower opacity for a softer effect.', 'Use blend modes only after the basic edit works.'],
    commonMistake: 'Changing blend mode before checking opacity and layer order.'
  },
  {
    id: 'non-destructive',
    title: 'Destructive vs non-destructive edits',
    plainMeaning: 'Destructive edits change pixels. Non-destructive edits keep the original easier to recover.',
    whenItMatters: 'Use masks, layers, and project save when you need flexibility.',
    steps: ['Duplicate important layers.', 'Use masks instead of erasing when possible.', 'Save a project before exporting.'],
    commonMistake: 'Only exporting a flat file after complex layered work.'
  }
];
