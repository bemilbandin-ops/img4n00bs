import { expect, test } from '@playwright/test';
import path from 'node:path';

const pngFixture = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAApUlEQVR4nO3RQQ0AIBDAMMC/5+ONAvZoFSzZnQ2p3T3AQwEJSA' +
  'AhIQGEhAQQEhJASEgAIZEAQkICCAkJICQkgJCQAEJCAsgJCSAkgJCQAEJCAsgJCSAkgJCQAEJCAsgJCSAkgJCQAEJCAsgJCSAkgJCQAEJC' +
  'AsgJCSAkgJCQAEJCAsgJCSAkgJCQAEJCAsgJCSAkgJCQAEJCAsgJCSAkgJCQAEJCAsgJCSAkgJCQAEJCAsgJCSAkgJCQAEJCAgjJH6zsAr' +
  'TxFQjPAAAAAElFTkSuQmCC',
  'base64'
);

const artboard = (page: import('@playwright/test').Page) => page.locator('#active-artboard-frame');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('onboarding_done_v1', 'true'));
});

test('keyboard shortcuts help lists working shortcuts', async ({ page }) => {
  await page.goto('/');

  await page.locator('#btn-help-keyboard-shortcuts').click();
  await expect(page.locator('#keyboard-shortcuts-modal')).toBeVisible();

  for (const label of [
    'Undo',
    'Redo',
    'Zoom',
    'Brush',
    'Eraser',
    'Text',
    'Crop',
    'Selection',
    'Duplicate layer',
    'Delete layer'
  ]) {
    await expect(page.locator('#keyboard-shortcuts-modal')).toContainText(label);
  }

  await page.locator('#btn-close-keyboard-shortcuts').click();
  await expect(page.locator('#keyboard-shortcuts-modal')).toBeHidden();

  await page.keyboard.press('T');
  await expect(page.locator('#btn-select-tool-text')).toHaveClass(/bg-white/);

  await page.keyboard.press('B');
  await expect(page.locator('#btn-select-tool-brush')).toHaveClass(/bg-white/);

  await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles({
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: pngFixture
  });
  await expect(page.locator('#active-drawing-canvas-element')).toBeVisible();

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+J' : 'Control+J');
  await expect(page.locator('#layers-stack-list').getByText(/fixture Copy/)).toBeVisible();

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+=' : 'Control+=');
  await expect(page.locator('#zoom-percentage-text')).not.toHaveText('100%');
});

test('sidebars collapse independently and expand the canvas stage', async ({ page }) => {
  await page.goto('/');

  await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles({
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: pngFixture
  });
  await expect(page.locator('#active-drawing-canvas-element')).toBeVisible();

  const initialBox = await page.locator('#middle-canvas-stage').boundingBox();
  expect(initialBox).not.toBeNull();

  await page.locator('#btn-toggle-right-sidebar').click();

  await expect(page.locator('#left-sidebar-col')).toBeVisible();
  await expect(page.locator('#right-sidebar-col')).toBeHidden();

  const rightHiddenBox = await page.locator('#middle-canvas-stage').boundingBox();
  expect(rightHiddenBox).not.toBeNull();
  expect(rightHiddenBox!.width).toBeGreaterThan(initialBox!.width);

  await page.locator('#btn-toggle-left-sidebar').click();

  await expect(page.locator('#left-sidebar-col')).toBeHidden();
  await expect(page.locator('#right-sidebar-col')).toBeHidden();

  const bothHiddenBox = await page.locator('#middle-canvas-stage').boundingBox();
  expect(bothHiddenBox).not.toBeNull();
  expect(bothHiddenBox!.width).toBeGreaterThan(rightHiddenBox!.width);

  await page.locator('#btn-toggle-right-sidebar').click();
  await expect(page.locator('#right-sidebar-col')).toBeVisible();
  await expect(page.locator('#left-sidebar-col')).toBeHidden();
});

test('main editor workflow round-trips project and exports png', async ({ page }, testInfo) => {
  console.log('goto');
  await page.goto('/');

  console.log('upload');
  await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles({
    name: 'fixture.png',
    mimeType: 'image/png',
    buffer: pngFixture
  });
  await expect(page.locator('#active-drawing-canvas-element')).toBeVisible();

  console.log('text');
  await page.locator('#btn-select-tool-text').click();
  await page.locator('#input-text-content').fill('Round trip text');
  await page.locator('#btn-add-new-text-layer-opt').click();
  await expect(page.locator('#layers-stack-list').getByText(/Text Layer/).first()).toBeVisible();

  console.log('move rotate');
  await page.locator('#btn-select-tool-move').click();
  let box = await artboard(page).boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 35, box!.y + 35);
  await page.mouse.down();
  await page.mouse.move(box!.x + 55, box!.y + 45);
  await page.mouse.up();
  await page.locator('#layer-transform-handle-rotate').dragTo(artboard(page), {
    targetPosition: { x: 70, y: 20 },
    force: true
  });

  console.log('save project');
  const projectDownload = page.waitForEvent('download');
  await page.locator('#btn-save-layered-project').click();
  const projectPath = await (await projectDownload).path();
  expect(projectPath).toBeTruthy();

  console.log('open project');
  await page.locator('#hidden-project-file-picker').setInputFiles(projectPath!);
  await page.locator('#layers-stack-list').getByText(/Text Layer/).first().click();
  await page.locator('#btn-select-tool-text').click();
  await expect(page.locator('#input-text-content')).toHaveValue('Round trip text');

  console.log('selection fill');
  await page.locator('#layers-stack-list').getByText('fixture').click();
  await page.locator('#btn-select-tool-select_rect').click();
  
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.getElementById('editor-core-grid')?.scrollTo(0, 0);
    document.getElementById('canvas-viewport')?.scrollTo(0, 0);
  });

  const selectionBox = await artboard(page).boundingBox();
  expect(selectionBox).not.toBeNull();
  await page.mouse.move(selectionBox!.x + 15, selectionBox!.y + 15);
  await page.mouse.down();
  await page.mouse.move(selectionBox!.x + 45, selectionBox!.y + 45);
  await page.mouse.up();
  await expect(page.locator('#shape-selection-antbox')).toBeVisible();
  await page.locator('#btn-fill-selection').click();
  await expect(page.locator('#shape-selection-antbox')).toBeHidden();

  console.log('mask');
  await page.locator('#layers-stack-list').getByText('fixture').click();
  await page.locator('[id^="btn-add-reveal-mask-"]').first().click();
  await page.locator('[id^="btn-toggle-mask-"]').first().click();
  await page.locator('[id^="btn-toggle-mask-"]').first().click();

  console.log('clone undo redo');
  await page.locator('#btn-select-tool-cloneStamp').click();
  const boxAfterOpen = await artboard(page).boundingBox();
  expect(boxAfterOpen).not.toBeNull();
  await page.keyboard.down('Alt');
  await page.mouse.click(boxAfterOpen!.x + 20, boxAfterOpen!.y + 20);
  await page.keyboard.up('Alt');
  await page.mouse.move(boxAfterOpen!.x + 30, boxAfterOpen!.y + 30);
  await page.mouse.down();
  await page.mouse.move(boxAfterOpen!.x + 40, boxAfterOpen!.y + 40);
  await page.mouse.up();

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Z' : 'Control+Z');
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Shift+Z' : 'Control+Shift+Z');

  console.log('export');
  await page.locator('#btn-main-export').click({ force: true, timeout: 10_000 });
  await expect(page.locator('#export-modal-overlay')).toBeVisible();
  const exportDownload = page.waitForEvent('download', { timeout: 10_000 });
  await page.locator('#btn-confirm-export-download').click();
  const downloadedExport = await exportDownload;
  const exportPath = await downloadedExport.path();
  expect(exportPath).toBeTruthy();
  expect(path.extname(downloadedExport.suggestedFilename())).toBe('.png');

  await testInfo.attach('projectPath', { body: projectPath! });
  await testInfo.attach('exportPath', { body: exportPath! });
});
