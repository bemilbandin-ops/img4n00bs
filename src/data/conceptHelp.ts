/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConceptHelpItem {
  title: string;
  desc: string;
}

export const conceptHelp: ConceptHelpItem[] = [
  {
    title: 'What are Layers?',
    desc: 'Think of layers as transparent sheets stacked on top of each other. The top layer covers the ones underneath. You can draw on one layer without touching the others!'
  },
  {
    title: 'What is a Layer Mask?',
    desc: 'A mask lets you hide parts of a layer without deleting them. Painting black on a mask makes it see-through; painting white makes it visible again. Extremely useful for clean cutouts!'
  },
  {
    title: 'How do Selections work?',
    desc: 'Selections let you isolate a specific area. Once selected, any action like Fill, Erase, or Copy will only affect that specific bounded area, leaving the rest of the layer safe.'
  },
  {
    title: 'What are Blend Modes?',
    desc: 'Blend modes change how a layer mixes visually with the layers underneath it. For example, "Multiply" is great for darkening and blending shadows, while "Screen" is perfect for highlights.'
  },
  {
    title: 'Project Files vs. Pictures',
    desc: 'Saving a "Project" (.n00bs) keeps all your layers separate so you can edit them later. Saving a "Picture" (PNG/JPG) flattens everything into a single file ready to share on social media.'
  },
  {
    title: 'Undo History',
    desc: 'Made a mistake? Don\'t worry! The app tracks your last 50 actions. Press Undo at the top or Ctrl+Z on your keyboard to step backward in time.'
  }
];
