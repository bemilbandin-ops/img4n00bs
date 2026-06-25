Implementation Plan: Make It Feel Simpler Without Removing Power
Target

Keep the full Photoshop-like feature set, but change the UI from:

tools + settings + layers + adjustments + project actions all visible

to:

canvas first
one active tool
one active side panel
advanced controls hidden until needed
Final UI Structure
New layout
┌──────────────────────────────────────────────┐
│ TopBar: Open | Undo | Redo | Resize | Save  │
├──────────┬──────────────────────┬────────────┤
│ ToolRail │       Canvas         │ Inspector  │
│          │                      │            │
│ icons    │                      │ Tool       │
│ only     │                      │ Layers     │
│          │                      │ Adjust     │
│          │                      │ Help       │
└──────────┴──────────────────────┴────────────┘
Main visual change

Current:

Toolbar + ToolOptions | Canvas | Layers + Adjustments

New:

Tool icons | Canvas | One selected panel
Phase 1 — Create a real top bar
Goal

Move all global actions out of the tool sidebar.

Move these from Toolbar.tsx:

Undo
Redo
Rotate
Flip
Open Project
Save Project
Resize
Save Picture
Keyboard Shortcuts

Into a new component:

src/components/TopBar.tsx
TopBar should contain
Left:
Logo / app name

Middle:
Undo / Redo / Rotate / Flip

Right:
Open Project / Save Project / Resize / Save Picture / Help
Result

The left sidebar becomes only tools. This immediately reduces visual clutter.

Phase 2 — Replace Toolbar with a simple ToolRail
Current problem

Toolbar.tsx shows:

group headings
group notes
tool icon
tool label
tool subtitle
hover tooltip
global actions
export actions

Too much.

New component

Rename or replace:

Toolbar.tsx → ToolRail.tsx
ToolRail should show only
[Move]
[Brush]
[Erase]
[Heal]
[Clone]
[Text]
[Shape]
[Crop]
[Select]
[Color]

Each button:

icon
short label
active state

No subtitles. No group descriptions. No hover paragraph.

Tool explanations move to the right inspector

The explanation should not be attached to every tool button. It should appear only for the active tool.

Phase 3 — Add a right-side Inspector with tabs
New state in EditorApp.tsx
type InspectorTab = 'tool' | 'layers' | 'adjust' | 'help';

const [activeInspectorTab, setActiveInspectorTab] =
  useState<InspectorTab>('tool');
New component
src/components/InspectorPanel.tsx
Tabs
[ Tool ] [ Layers ] [ Adjust ] [ Help ]

Only one panel visible at once.

Inspector rendering
<InspectorPanel activeTab={activeInspectorTab}>
  {activeTab === 'tool' && <ToolOptions />}
  {activeTab === 'layers' && <LayersPanel />}
  {activeTab === 'adjust' && <AdjustmentsPanel />}
  {activeTab === 'help' && <HelpPanel />}
</InspectorPanel>
Important behavior

When user selects a tool:

setActiveInspectorTab('tool');

When user selects a layer:

setActiveInspectorTab('layers');

When user changes brightness/filter:

setActiveInspectorTab('adjust');
Phase 4 — Redesign ToolOptions as “selected tool card”
Current problem

ToolOptions.tsx is too dense and reads like settings.

New structure for every tool
Tool name

What it does
Short explanation.

How to use it
1. Do this.
2. Then this.

Basic controls

Advanced
Example: Brush
Brush

Draw directly on the selected layer.

How to use it:
Drag on the canvas to paint.

Basic:
Size
Color

Advanced:
Recent colors
Swatches
Example: Clone
Clone

Copies pixels from one area to another.

How to use it:
1. Pick a clean source point.
2. Paint over the area you want to cover.

Basic:
Brush size
Source point status

Advanced:
Healing mode explanation
Implementation detail

Create a copy map:

src/data/toolHelp.ts

Shape:

export const toolHelp = {
  brush: {
    title: 'Brush',
    summary: 'Draw directly on the selected layer.',
    steps: [
      'Choose a color and size.',
      'Drag on the canvas to paint.'
    ],
    mistake: 'If nothing appears, check that the selected layer is visible.'
  }
};
Phase 5 — Collapse advanced layer controls
Current problem

LayersPanel.tsx shows too much per layer:

opacity
blend mode
duplicate
merge
mask
hide mask
selection mask
remove background
delete
reorder
rename
visibility
New default layer card

Show only:

[eye] Layer name           [⋯]
Layer type

For active layer show:

Basic:
Opacity
Duplicate
Delete

Everything else goes inside:

Advanced layer controls

Advanced contains:

Blend mode
Merge down
Mask
Hide mask
Mask from selection
Remove background
Reorder
Rename labels

Use paired beginner/pro labels:

Current	New
Opacity	Opacity — see-through amount
Blend Mode	Blend mode — how this mixes
Mask	Mask — hide/reveal parts
Merge Down	Merge into layer below
Remove Background	Remove background with mask
Phase 6 — Make canvas visually dominant
Current grid

The project uses:

left 3 cols / canvas 6 cols / right 3 cols
New desktop proportions
ToolRail: fixed 84px
Canvas: flexible, largest area
Inspector: 320–360px

Recommended layout class:

grid-template-columns: 84px minmax(0, 1fr) 340px;
Visual rule

Canvas should feel like 65–75% of the app.

Panels should feel secondary.

Phase 7 — Add “Advanced” disclosure component

Create reusable component:

src/components/AdvancedSection.tsx

Use it in:

ToolOptions.tsx
LayersPanel.tsx
AdjustmentsPanel.tsx
Export modal
Resize modal

Default:

collapsed

Example:

<AdvancedSection title="Advanced">
  <BlendModeControl />
  <MaskControls />
</AdvancedSection>

This preserves power without showing everything immediately.

Phase 8 — Simplify AdjustmentsPanel
Current panel

Many sliders are always visible.

New structure

Default visible:

Improve photo

[ Auto fix ]
Brightness
Contrast
Color

Collapsed advanced:

Exposure
Hue
Blur
Vignette
Filters
Reset
Add simple preset buttons
Auto fix
Brighter
More colorful
Black & white
Sharper

These can just set existing adjustment values.

No new engine needed.

Phase 9 — Add HelpPanel as a playground reference

Create:

src/components/HelpPanel.tsx

It should explain concepts, not run a tutorial.

Sections:

Layers
Selections
Masks
Blend modes
Project file vs picture file
Undo history

Example:

Layers are transparent sheets stacked on top of each other.
The top layer appears above the lower layers.

Keep each explanation short.

Phase 10 — Improve empty state

Before upload, canvas should be inviting.

Current app already has sample/upload behavior in CanvasArea.

Make empty state more focused:

Drop an image here

or

[ Open image ]
[ Try sample project ]

Below:

You can draw, cut out, add text, remove backgrounds, and edit in layers.

No panels should feel important before an image exists.

Phase 11 — Add contextual “why nothing happened” messages

Use uploadError or a new toast system.

Examples:

You are using Eraser, but the selected layer is text.
Choose Move to reposition text, or create a drawing layer to erase pixels.
Clone needs a source point first.
Pick a clean area, then paint over the problem area.
This selection only chooses an area.
Pick Fill, Cut, Copy, or Mask to do something with it.

This makes the playground self-teaching.

Implementation order
Step 1

Create:

TopBar.tsx
ToolRail.tsx
InspectorPanel.tsx
AdvancedSection.tsx
toolHelp.ts

Do not touch canvas logic yet.

Step 2

Update EditorApp.tsx layout:

Remove:

<Toolbar />
<ToolOptions />
<LayersPanel />
<AdjustmentsPanel />

Replace with:

<TopBar />
<ToolRail />
<CanvasArea />
<InspectorPanel />
Step 3

Move old toolbar global actions into TopBar.

Keep the same existing handlers:

handleUndo
handleRedo
handleRotateAndFlip
handleOpenExportDialog
handleSaveProjectFile
handleOpenProjectPicker
handleOpenResizeDialog
setShowKeyboardShortcuts

No business logic change.

Step 4

Move ToolOptions into the Inspector tool tab.

Add explanations from toolHelp.ts.

Split controls into:

Basic
Advanced
Step 5

Move LayersPanel into the Inspector layers tab.

Collapse advanced controls per layer.

Default layer list becomes much lighter.

Step 6

Move AdjustmentsPanel into the Inspector adjust tab.

Show 3 core sliders first.

Move the rest into Advanced.

Step 7

Add auto tab switching:

onChangeTool → setActiveInspectorTab('tool')
onSelectLayer → setActiveInspectorTab('layers')
onChangeAdjustments → setActiveInspectorTab('adjust')
Files to modify
src/EditorApp.tsx
src/components/Toolbar.tsx
src/components/ToolOptions.tsx
src/components/LayersPanel.tsx
src/components/AdjustmentsPanel.tsx
src/components/CanvasArea.tsx
src/index.css
Files to add
src/components/TopBar.tsx
src/components/ToolRail.tsx
src/components/InspectorPanel.tsx
src/components/AdvancedSection.tsx
src/components/HelpPanel.tsx
src/data/toolHelp.ts
src/data/conceptHelp.ts
Acceptance criteria

The redesign is successful when:

1. Left side only shows tools.
2. Top bar contains all global actions.
3. Right side shows only one active tab.
4. Tool settings explain the active tool.
5. Layers are not always fully expanded.
6. Adjustments are not all visible at once.
7. Canvas feels like the main object.
8. No existing editing feature is removed.
9. Advanced users can still reach every feature.
10. Beginners see fewer simultaneous decisions.
Main rule while implementing

Do not simplify by deleting features.

Simplify by changing visibility:

Common action = visible
Current context = visible
Advanced option = collapsed
Everything else = one tab away