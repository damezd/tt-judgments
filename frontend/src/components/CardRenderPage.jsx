// Standalone render target for the batch screenshotter (Playwright) and quick
// previews. The notice object is injected as window.__NOTICE__ before load.
import { useEffect } from 'react';
import NoticePoster, { POSTER_W, POSTER_H } from './NoticePoster';

export default function CardRenderPage() {
  const n = typeof window !== 'undefined' ? window.__NOTICE__ : null;
  useEffect(() => {
    // signal readiness once fonts + images have settled
    const done = () => { window.__cardReady = true; };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(done, 150));
    else setTimeout(done, 400);
  }, []);
  return (
    <div id="card-root" style={{ width: POSTER_W, height: POSTER_H, background: '#fff' }}>
      <NoticePoster n={n} />
    </div>
  );
}
