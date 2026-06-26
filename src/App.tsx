import { useEffect, useState } from 'react';
import EditorApp from './EditorApp';
import HelpWikiPage from './components/HelpWikiPage';

function getHashPath() {
  return window.location.hash || '#/';
}

export default function App() {
  const [hashPath, setHashPath] = useState(getHashPath);

  useEffect(() => {
    const handleHashChange = () => setHashPath(getHashPath());

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return hashPath === '#/help-wiki' ? <HelpWikiPage /> : <EditorApp />;
}
