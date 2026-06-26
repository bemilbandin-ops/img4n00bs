import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import HelpWikiPage from './HelpWikiPage';
import { toolbarToolGroups } from './Toolbar';

describe('HelpWikiPage', () => {
  it('renders every toolbar tool once with beginner help', () => {
    const html = renderToStaticMarkup(<HelpWikiPage />);

    expect(html).toContain('Help Wiki');
    for (const tool of toolbarToolGroups.flatMap(group => group.tools)) {
      expect(html).toContain(tool.label);
      expect(html).toContain(tool.desc);
    }
  });
});
