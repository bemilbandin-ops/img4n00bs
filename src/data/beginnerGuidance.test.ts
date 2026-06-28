import { describe, expect, it } from 'vitest';
import { conceptDocs } from './concepts';
import { toolMetadata } from './tools';
import { workflows } from './workflows';

const toolIds = new Set(toolMetadata.map(tool => tool.id));
const workflowIds = new Set(workflows.map(workflow => workflow.id));

describe('beginner guidance data', () => {
  it('defines the expected goal-first workflows', () => {
    expect(workflowIds).toEqual(expect.arrayContaining([
      'fix-photo',
      'remove-background',
      'cut-out',
      'add-text',
      'make-meme',
      'make-sticker',
      'draw-on-photo',
      'resize-upload',
      'learn-basics'
    ]));
  });

  it('gives every workflow actionable steps', () => {
    for (const workflow of workflows) {
      expect(workflow.steps.length).toBeGreaterThan(0);
      expect(workflow.requiredFeatures.length).toBeGreaterThan(0);
      const stepIds = workflow.steps.map(step => step.id);
      expect(new Set(stepIds).size).toBe(stepIds.length);
      expect(workflow.estimatedMinutes).toBeGreaterThan(0);
    }
  });

  it('uses valid tool references in workflow steps', () => {
    for (const workflow of workflows) {
      for (const step of workflow.steps) {
        if (step.tool) expect(toolIds.has(step.tool)).toBe(true);
      }
    }
  });

  it('links tool metadata to real workflows', () => {
    for (const tool of toolMetadata) {
      expect(tool.steps.length).toBeGreaterThan(0);
      expect(tool.shortDescription.length).toBeGreaterThan(10);
      for (const workflowId of tool.relatedWorkflows) {
        expect(workflowIds.has(workflowId)).toBe(true);
      }
    }
  });

  it('documents core beginner concepts', () => {
    const conceptIds = conceptDocs.map(concept => concept.id);
    expect(conceptIds).toEqual(expect.arrayContaining([
      'layers',
      'masks',
      'selections',
      'export-vs-project',
      'canvas-vs-image-size'
    ]));
  });
});
