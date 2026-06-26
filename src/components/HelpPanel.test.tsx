import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HelpPanel from './HelpPanel';

describe('HelpPanel', () => {
  it('links to the Help Wiki under the concepts guide heading', () => {
    const html = renderToStaticMarkup(<HelpPanel />);

    expect(html).toContain('Concepts &amp; Guide');
    expect(html).toContain('href="#/help-wiki"');
    expect(html).toContain('Help Wiki');
  });
});
