import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { getNotices } from '../api/client';
import { copyText, toast } from './ui';
import NoticePoster, { POSTER_W, POSTER_H } from './NoticePoster';

const TYPE = {
  detention_order: { label: 'Detention Order', tag: 'Emergency Powers', accent: '#c0392b', tint: '#fdeceb' },
  detention_revocation: { label: 'Detention Revoked', tag: 'Emergency Powers', accent: '#1e8449', tint: '#e9f7ef' },
  proceeds_of_crime: { label: 'Proceeds of Crime', tag: 'Seized Assets', accent: '#1a5276', tint: '#eaf1f8' },
  default: { label: 'Legal Notice', tag: 'Gazette', accent: '#1a1814', tint: '#efece5' },
};

// Feed-card illustration (light)
function NoticeArt({ no, accent, tint }) {
  return (
    <svg viewBox="0 0 430 168" xmlns="http://www.w3.org/2000/svg">
      <rect width="430" height="168" fill={tint} />
      <g stroke={accent} strokeWidth="1" opacity="0.18">
        <line x1="40" y1="40" x2="86" y2="40" /><line x1="40" y1="128" x2="86" y2="128" />
        <line x1="344" y1="40" x2="390" y2="40" /><line x1="344" y1="128" x2="390" y2="128" />
      </g>
      <rect x="120" y="20" width="190" height="132" rx="3" fill="#fff" stroke={accent} strokeWidth="2" />
      <rect x="120" y="20" width="190" height="24" rx="3" fill={accent} />
      <text x="215" y="36" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#fff" letterSpacing="2" fontWeight="600">LEGAL NOTICE</text>
      <text x="200" y="86" textAnchor="middle" fontFamily="DM Serif Display, Georgia, serif" fontSize="34" fill={accent}>No. {no}</text>
      <g fill={accent} opacity="0.14">
        <rect x="138" y="98" width="120" height="5" rx="2" /><rect x="138" y="110" width="150" height="5" rx="2" />
        <rect x="138" y="122" width="96" height="5" rx="2" /><rect x="138" y="134" width="134" height="5" rx="2" />
      </g>
      <circle cx="296" cy="120" r="22" fill="#fff" stroke={accent} strokeWidth="2" />
      <path d="M296 109 l3.2 6.6 7.2 0.9 -5.3 5 1.3 7.1 -6.4 -3.5 -6.4 3.5 1.3 -7.1 -5.3 -5 7.2 -0.9 z" fill={accent} opacity="0.85" />
      <path d="M288 140 l8 6 8 -6 0 14 -8 -5 -8 5 z" fill={accent} opacity="0.8" />
    </svg>
  );
}

// ── Detail modal: shows the shared poster (scaled) with Back / Copy / Share ──
function NoticeDetail({ n, onClose, onCopy, onShare }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!n) return null;
  const W = Math.min((typeof window !== 'undefined' ? window.innerWidth : 460) - 20, 460);
  const scale = W / POSTER_W;
  const btn = { fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', border: 'none', borderRadius: 999, padding: '9px 16px' };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflow: 'auto', padding: '3vh 10px 5vh' }}>
      <div onClick={e => e.stopPropagation()} className="panel-in" style={{ width: W }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={onClose} style={{ ...btn, background: 'rgba(255,255,255,.14)', color: '#fff' }}>‹ Back</button>
          <button onClick={onShare} style={{ ...btn, background: '#b8763a', color: '#fff' }}>Share ↗</button>
        </div>
        <div style={{ width: W, height: POSTER_H * scale, overflow: 'hidden', borderRadius: 16, boxShadow: '0 30px 70px rgba(0,0,0,.5)' }}>
          <div style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <NoticePoster n={n} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
          <button onClick={onCopy} style={{ ...btn, background: 'rgba(255,255,255,.14)', color: '#fff' }}>Copy post</button>
          <button onClick={onShare} style={{ ...btn, background: '#b8763a', color: '#fff' }}>Share card ↗</button>
        </div>
      </div>
    </div>
  );
}

export default function NoticesBrowse() {
  const [state, setState] = useState({ loading: true });
  const [selected, setSelected] = useState(null);
  const [capturing, setCapturing] = useState(null);
  const capRef = useRef(null);

  async function load() {
    setState({ loading: true });
    try {
      const data = await getNotices();
      setState({ loading: false, ...data });
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') throw e;
      setState({ loading: false, error: e.message || 'Failed to load notices.' });
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const copyPost = (n) => { copyText(`${n.social_headline ? n.social_headline + '\n\n' : ''}${n.social_post || n.summary || ''}`); toast('Post copied'); };
  const share = (n) => { toast('Building card…'); setCapturing(n); };

  // Capture the off-screen full-size poster → PNG, then share or download.
  useEffect(() => {
    if (!capturing) return;
    let cancelled = false;
    (async () => {
      await new Promise(r => setTimeout(r, 200));
      try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        const dataUrl = await toPng(capRef.current, { width: POSTER_W, height: POSTER_H, pixelRatio: 1, cacheBust: true });
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `insighttt-notice-${capturing.notice_no}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'InsightTT', text: capturing.social_headline || capturing.title });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
          toast('Card downloaded');
        }
      } catch (e) {
        copyText(`${capturing.social_headline || capturing.title} — InsightTT`);
        toast('Shared text (image unavailable)');
      }
      if (!cancelled) setCapturing(null);
    })();
    return () => { cancelled = true; };
  }, [capturing]);

  return (
    <div className="panel-in">
      <div className="feed" style={{ padding: '4px 0 16px' }}>
        <div className="section-label">Gazette · Legal Notices</div>

        {state.loading && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Loading…</p>}
        {state.error && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: 'var(--red)', fontSize: 13 }}>{state.error}</p>
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: 13 }} onClick={load}>Retry</button>
          </div>
        )}
        {state.notices && state.notices.length === 0 && !state.loading && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>No notices on record.</p>
        )}

        {(state.notices || []).map(n => {
          const t = TYPE[n.ntype] || TYPE.default;
          const body = n.social_post || n.summary || '';
          const excerpt = body.length > 200 ? body.slice(0, 200).trimEnd() + '…' : body;
          return (
            <article key={n.id} className="case-card" style={{ cursor: 'pointer' }} onClick={() => setSelected(n)}
              role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelected(n); }}>
              <div className="rail" style={{ background: t.accent }} />
              <div className="card-illustration"><NoticeArt no={n.notice_no} accent={t.accent} tint={t.tint} /></div>
              <div className="card-body">
                <div className="badge-row">
                  <span className="badge" style={{ background: t.tint, color: t.accent, border: `1px solid ${t.accent}40` }}>{t.label}</span>
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{t.tag}</span>
                </div>
                <div className="card-headline">{n.social_headline || n.title}</div>
                {excerpt && <div className="card-excerpt">{excerpt}</div>}
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>Tap for the full breakdown →</div>
              </div>
              <div className="card-footer">
                <span className="card-date">{n.citation}</span>
                <button className="share-btn" onClick={(e) => { e.stopPropagation(); share(n); }}>Share · @insighttt</button>
              </div>
            </article>
          );
        })}
      </div>

      {selected && <NoticeDetail n={selected} onClose={() => setSelected(null)} onCopy={() => copyPost(selected)} onShare={() => share(selected)} />}

      {/* off-screen full-size poster used for image capture */}
      {capturing && (
        <div style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }} aria-hidden="true">
          <div ref={capRef}><NoticePoster n={capturing} /></div>
        </div>
      )}
    </div>
  );
}
