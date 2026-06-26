import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('global page overflow', () => {
  it('allows standalone pages such as the help wiki to scroll', () => {
    const css = readFileSync('src/index.css', 'utf8');

    expect(css).toContain('overflow: auto;');
    expect(css).toContain('min-height: 100%;');
    expect(css).not.toMatch(/^\s*height:\s*100%;/m);
  });

  it('defines readable UI tokens and a calmer checkerboard', () => {
    const css = readFileSync('src/index.css', 'utf8');

    for (const token of ['--text-primary', '--text-secondary', '--panel-bg', '--panel-border', '--checker-light', '--checker-dark']) {
      expect(css).toContain(token);
    }
    expect(css).toContain('background-size: 24px 24px;');
  });
});
