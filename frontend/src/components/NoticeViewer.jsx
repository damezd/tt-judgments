import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { copyText } from './ui';
import { NoticeIllustration } from './NoticeIllustration';
import NoticeFull from './NoticeFull';
import { fmtDate, ACCENT, ACCENT_TINT } from './caseMeta';
import { noticeMeta, allegationsFrom, gangRole, firstSentences } from './noticeUtils';

// Up to 3 punchy insight points from whatever the notice carries.
function buildPoints(n) {
  const pts = [];
  const grounds = allegationsFrom(n.summary, n.person_name);
  if (grounds.length) pts.push(['ALLEGED GROUNDS', grounds.map(g => g.label).join(' · ')]);
  const { gang, role } = gangRole(n.summary);
  if (role || gang) pts.push(['THE PERSON', [role, gang].filter(Boolean).join(' · ') + ' (alleged)']);
  if (n.detained_at) pts.push(['DETAINED AT', n.detained_at.split(',').slice(0, 2).join(',').trim()]);
  const basis = (n.act || '').replace(/^The\s+/i, '');
  if (basis && pts.length < 3) pts.push(['LEGAL BASIS', basis + (n.official ? ` · ${n.official}` : '')]);
  return pts.slice(0, 3);
}

export default function NoticeViewer({ n, onClose }) {
  const [page, setPage] = useState(0);
  const [showFull, setShowFull] = useState(false);
  const trackRef = useRef(null);

  const goTo = (i) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setPage(i);
  };
  const onScroll = () => {
    const el = trackRef.current;
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth));
  };
  const share = () => {
    const text = `${n.social_headline || n.title} — InsightTT`;
    const url = 'https://tt-judgments.vercel.app';
    if (navigator.share) navigator.share({ title: 'InsightTT', text, url }).catch(() => {});
    else copyText(`${text}\n${url}`);
  };

  const meta = noticeMeta(n);
  const type = meta.type;
  const accent = ACCENT[type];
  const tint = ACCENT_TINT[type];
  const headline = n.social_headline || n.title;
  const grounds = allegationsFrom(n.summary, n.person_name);
  const points = buildPoints(n);
  const body = n.social_post || n.summary || '';
  const basis = (n.act || '').replace(/^The\s+/i, '');

  return createPortal((
    <>
      <div className="viewer-overlay" onClick={onClose}>
        <div className="viewer-sheet" onClick={e => e.stopPropagation()}>
          <div className="viewer-bar">
            <button className="viewer-x" onClick={onClose}>‹ Back</button>
            <div className="viewer-dots">
              <span className={page === 0 ? 'on' : ''} onClick={() => goTo(0)} />
              <span className={page === 1 ? 'on' : ''} onClick={() => goTo(1)} />
            </div>
            <button className="viewer-x" onClick={share}>Share ↗</button>
          </div>

          <div className="viewer-track" ref={trackRef} onScroll={onScroll}>
            {/* PAGE 1 — poster */}
            <section className={`vpage type-${type}`}>
              <div className="vposter">
                <div className="rail" />
                <div className="card-illustration"><NoticeIllustration /></div>
                <div className="card-body">
                  <div className="badge-row">
                    <span className={`badge badge-type-${type}`}>{meta.label}</span>
                    {grounds.length ? <span className="badge badge-high">{grounds[0].label}</span> : null}
                  </div>
                  <div className="card-headline">{headline}</div>
                  <div className="card-meta">{[n.person_name, n.citation, basis].filter(Boolean).join(' · ')}</div>
                  {body && <div className="card-excerpt">{body.slice(0, 240)}{body.length > 240 ? '…' : ''}</div>}
                </div>
              </div>
              <button className="vhint" onClick={() => goTo(1)}>Insights  ›</button>
            </section>

            {/* PAGE 2 — Instagram-style insights */}
            <section className="vpage">
              <div className="ig-card" style={{ ['--accent']: accent }}>
                <div className="ig-head" style={{ background: tint }}>
                  <div className="ig-rail" />
                  <div className="ig-brand-row">
                    <div>
                      <div className="ig-brand">Insight<span>TT</span></div>
                      <div className="ig-sub">Court Judgments</div>
                    </div>
                    <div className="ig-handle">@insighttt</div>
                  </div>
                  <span className={`badge badge-type-${type}`} style={{ background: '#fff' }}>{meta.label}</span>
                  <div className="ig-verdict">{firstSentences(n.summary, 70) || (basis ? `Detained under the ${basis}` : 'Legal notice published')}</div>
                </div>

                <div className="ig-body">
                  <div className="ig-headline">{headline}</div>
                  <div className="ig-div" />
                  {points.map(([label, text], i) => (
                    <div className="ig-point" key={i}>
                      <span className="ig-bar" />
                      <div>
                        <div className="ig-plabel">{label}</div>
                        <div className="ig-ptext">{text}</div>
                      </div>
                    </div>
                  ))}
                  <button className="ig-full" onClick={() => setShowFull(true)}>View full notice  ›</button>
                </div>

                <div className="ig-foot">
                  <span>{[n.citation, fmtDate(n.date_published || n.date_made)].filter(Boolean).join(' · ')}</span>
                  <span>tt-judgments.vercel.app</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      {showFull && <NoticeFull n={n} onClose={() => setShowFull(false)} />}
    </>
  ), document.body);
}
