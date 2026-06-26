export type HelpLevel = 'tips' | 'explain' | 'guide';
export type StarterGoalId = 'fix-photo' | 'cut-out' | 'add-text-shapes' | 'draw-blank' | 'open-sample';
export type RecipeId = 'fix-photo' | 'make-meme' | 'cut-out-object' | 'save-editable-project';
export type ConceptTriggerId =
  | 'secondLayer'
  | 'selectionActive'
  | 'maskUsed'
  | 'exportOpened'
  | 'textLayer'
  | 'emptyLayers'
  | 'noSelection';

export interface HelpLevelOption {
  id: HelpLevel;
  label: string;
}

export interface StarterGoal {
  id: StarterGoalId;
  title: string;
  description: string;
  primaryAction: string;
}

export interface ConceptTrigger {
  id: ConceptTriggerId;
  tip: string;
  explain: string;
  guide?: string;
}

export interface TaskRecipe {
  id: RecipeId;
  title: string;
  goal: string;
  why: string;
  steps: string[];
  doneCondition: string;
  nextStep?: string;
}

export const helpLevels: HelpLevelOption[] = [
  { id: 'tips', label: 'Tips' },
  { id: 'explain', label: 'Explain' },
  { id: 'guide', label: 'Guide me' }
];

export const starterGoals: StarterGoal[] = [
  {
    id: 'fix-photo',
    title: 'Fix a photo',
    description: 'Crop, clean up, and make colors look better fast.',
    primaryAction: 'Open photo'
  },
  {
    id: 'cut-out',
    title: 'Cut something out',
    description: 'Select the part you want, then hide or remove the rest.',
    primaryAction: 'Start selecting'
  },
  {
    id: 'add-text-shapes',
    title: 'Add text or shapes',
    description: 'Make a poster, meme, label, or simple graphic.',
    primaryAction: 'Add text'
  },
  {
    id: 'draw-blank',
    title: 'Draw from scratch',
    description: 'Start with a blank canvas and basic drawing tools.',
    primaryAction: 'Draw blank'
  },
  {
    id: 'open-sample',
    title: 'Open a sample to learn',
    description: 'Practice on an example project.',
    primaryAction: 'Open sample'
  }
];

export const conceptTriggers: Record<ConceptTriggerId, ConceptTrigger> = {
  secondLayer: {
    id: 'secondLayer',
    tip: 'You now have layers. Edit one part without changing the rest.',
    explain: 'You now have layers. Layers keep parts separate so you can edit one thing without changing the rest.',
    guide: 'Pick a layer in the Layers tab, then change only that layer.'
  },
  selectionActive: {
    id: 'selectionActive',
    tip: 'Selection active. Edits stay inside the picked area.',
    explain: 'Selection active. Edits now stay inside the area you picked.',
    guide: 'Use Fill, Clear, Crop, Mask, or Deselect from the action strip.'
  },
  maskUsed: {
    id: 'maskUsed',
    tip: 'Masks hide without deleting.',
    explain: 'Masks hide without deleting. Use them when you might want the pixels back later.',
    guide: 'Edit the mask to reveal or hide parts of the selected layer.'
  },
  exportOpened: {
    id: 'exportOpened',
    tip: 'Export Picture shares a PNG or JPG. Save Project keeps layers editable.',
    explain: 'Export Picture makes a shareable PNG or JPG. Save Project keeps layers editable for later.',
    guide: 'Export when you are ready to share. Save Project when you want to keep editing later.'
  },
  textLayer: {
    id: 'textLayer',
    tip: 'Text stays editable while it is its own layer.',
    explain: 'Text stays editable while it is its own layer.',
    guide: 'Select the text layer, then edit wording, size, color, or opacity.'
  },
  emptyLayers: {
    id: 'emptyLayers',
    tip: 'Nothing is separate yet. Add text, shape, or image for independent edits.',
    explain: 'Nothing is separate yet. Add text, a shape, or another image to keep edits independent.',
    guide: 'Open Layers, choose Add Layer, then add text, a shape, or an image.'
  },
  noSelection: {
    id: 'noSelection',
    tip: 'No area selected. Use Select before cut, fill, or mask.',
    explain: 'No area selected. Use Select before cutting, filling, or masking part of the image.',
    guide: 'Choose Pick an area / Selection, drag on the canvas, then run the action.'
  }
};

export const taskRecipes: TaskRecipe[] = [
  {
    id: 'fix-photo',
    title: 'Fix a photo',
    goal: 'Crop and improve a photo.',
    why: 'Crop frames the subject. Adjustments fix light and color before export.',
    steps: ['Open image or sample', 'Crop edges', 'Adjust brightness and contrast', 'Export picture'],
    doneCondition: 'Export panel opened or export completed.',
    nextStep: 'Open a photo or sample.'
  },
  {
    id: 'make-meme',
    title: 'Make a meme',
    goal: 'Add readable text to an image.',
    why: 'Text layers keep captions editable while you position them.',
    steps: ['Open sample or image', 'Add text', 'Resize or move text', 'Export'],
    doneCondition: 'Text layer exists and export opened or completed.',
    nextStep: 'Add a text layer.'
  },
  {
    id: 'cut-out-object',
    title: 'Cut out an object',
    goal: 'Select part of an image and hide or remove the rest.',
    why: 'Selections limit edits to one area. Masks hide pixels without deleting them.',
    steps: ['Open sample or image', 'Choose selection tool', 'Make selection', 'Mask, clear, or crop', 'Export or save project'],
    doneCondition: 'Selection used with mask, clear, or crop.',
    nextStep: 'Choose Pick an area / Selection.'
  },
  {
    id: 'save-editable-project',
    title: 'Save an editable project',
    goal: 'Understand picture export vs editable project save.',
    why: 'Project files keep layers. Picture exports are flattened for sharing.',
    steps: ['Create two layers', 'Save project', 'Export picture'],
    doneCondition: 'Project save and/or export action reached.',
    nextStep: 'Add a second layer.'
  }
];
