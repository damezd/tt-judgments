import { useState, useEffect, useRef } from 'react';
import { getCase } from '../api/client';
import { copyText } from './ui';
import CaseDetail from './CaseDetail';
import { CaseIllustration } from './CaseIllustrations';
import { detectType, typeLabel, parseAmount, fmtDate, PRIO, ACCENT, ACCENT_TINT } from './caseMeta';

const fmtNum = n => Number(n).toLocaleString();
const firstSentence = (s, n = 90) => {
  const seg = (s || '').split(/(?<=[.;])\s/)[0].trim();
  return seg.length > n ? seg.slice(0, n).trimEnd() + '…' : seg;
};

// Largest numeric TTD figure on the case (fallback hero when the headline has none).
function topFigure(c) {
  const nums = (c.financials || [])
    .map(f => ({ v: parseFloat(String(f.amount).replace(/,/g, '')), what: f.what_it_is }))
    .filter(f => !isNaN(f.v))
    .sort((a, b) => b.v - a.v);
  return nums[0] || null;
}

// Build up to 3 punchy insight points from whatever data the case has.
function buildPoints(c) {
  const pts = [];
  const ruling = firstSentence(c.outcome || c.social_post);
  if (ruling) pts.push(['THE RULING', ruling]);

  const figs = (c.financials || [])
    .map(f => ({ v: parseFloat(String(f.amount).replace(/,/g, '')), what: f.what_it_is }))
    .filter(f => !isNaN(f.v)).sort((a, b) => b.v - a.v);
  if (figs.length) {
    const top = figs.slice(0, 2).map(f => `$${fmtNum(f.v)} ${(f.what || '').split(/[;(]/)[0].trim().toLowerCase()}`.slice(0, 38));
    pts.push(['FINANCIALS', top.join('  +  ') + (figs.length > 2 ? ` +${figs.length - 2} more` : '')]);
  }

  if (c.properties && c.properties.length) {
    const p = c.properties[0];
    pts.push(['PROPERTY', (p.description || '').split(/[;(]/)[0].trim().slice(0, 60)]);
  }
  if (c.related_litigation && c.related_litigation.length) {
    pts.push(['LINKED', `${c.related_litigation.length} related matter${c.related_litigation.length > 1 ? 's' : ''} on file`]);
  }
  if (c.crime_flags && c.crime_flags.length) {
    pts.push(['FLAGS', c.crime_flags.join(' · ').slice(0, 60)]);
  }
  return pts.slice(0, 3);
}

export default function CaseViewer({ slug, onClose }) {
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  const [page, setPage] = useState(0);
  const [showFull, setShowFull] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getCase(slug).then(d => alive && setC(d)).catch(() => alive && setErr('Failed to load case.'));
    return () => { alive = false; };
  }, [slug]);

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
    const text = `${c.social_headline || c.title} — InsightTT`;
    const url = c.url || 'https://tt-judgments.vercel.app';
    if (navigator.share) navigator.share({ title: 'InsightTT', text, url }).catch(() => {});
    else copyText(`${text}\n${url}`);
  };

  const type = c ? detectType(c) : 'corporate';
  const accent = ACCENT[type];
  const tint = ACCENT_TINT[type];
  const amount = c && (parseAmount(c) || (() => {
    const t = topFigure(c); return t ? { sym: '$', num: fmtNum(t.v), unit: 'TTD' } : null;
  })());
  const [prioClass, prioLabel] = c ? (PRIO[(c.osint_value || 'low').toLowerCase()] || PRIO.low) : PRIO.low;
  const headline = c && (c.social_headline || c.title);
  const points = c ? buildPoints(c) : [];

  return (
    <>
    <div className="viewer-overlay" onClick={onClose}>
      <div className="viewer-sheet" onClick={e => e.stopPropagation()}>
        <div className="viewer-bar">
          <button className="viewer-x" onClick={onClose}>Close</button>
          <div className="viewer-dots">
            <span className={page === 0 ? 'on' : ''} onClick={() => goTo(0)} />
            <span className={page === 1 ? 'on' : ''} onClick={() => goTo(1)} />
          </div>
          <button className="viewer-x" onClick={share} disabled={!c}>Share</button>
        </div>

        {err && <p className="text-center text-red-300" style={{ padding: 24 }}>{err}</p>}
        {!c && !err && <p className="text-center" style={{ color: 'var(--muted)', padding: 24 }}>Loading…</p>}

        {c && (
          <div className="viewer-track" ref={trackRef} onScroll={onScroll}>
            {/* PAGE 1 — poster */}
            <section className={`vpage type-${type}`}>
              <div className="vposter">
                <div className="rail" />
                <div className="card-illustration"><CaseIllustration type={type} /></div>
                <div className="card-body">
                  <div className="badge-row">
                    <span className={`badge ${prioClass}`}>{prioLabel}</span>
                    <span className={`badge badge-type-${type}`}>{typeLabel(type, c)}</span>
                    {c.fetch_failed ? <span className="badge badge-medium">Not retrieved</span> : null}
                  </div>
                  {amount && (
                    <div className="amount-tag"><span className="sym">{amount.sym}</span>{amount.num}<span className="unit">{amount.unit}</span></div>
                  )}
                  <div className="card-headline">{headline}</div>
                  <div className="card-meta">{[c.title, c.citation, c.court].filter(Boolean).join(' · ')}</div>
                  {(c.social_post || c.outcome) && (
                    <div className="card-excerpt">{(c.social_post || c.outcome).slice(0, 240)}{(c.social_post || c.outcome).length > 240 ? '…' : ''}</div>
                  )}
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
                  <span className={`badge badge-type-${type}`} style={{ background: '#fff' }}>{typeLabel(type, c)}</span>
                  {amount ? (
                    <>
                      <div className="ig-stat-label">AWARDED</div>
                      <div className="ig-stat"><span className="s">{amount.sym}</span>{amount.num}<span className="u">{amount.unit}</span></div>
                    </>
                  ) : (
                    <div className="ig-verdict">{firstSentence(c.outcome, 70) || 'Judgment delivered'}</div>
                  )}
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
                  <button className="ig-full" onClick={() => setShowFull(true)}>View full case  ›</button>
                </div>

                <div className="ig-foot">
                  <span>{[c.citation, fmtDate(c.case_date)].filter(Boolean).join(' · ')}</span>
                  <span>tt-judgments.vercel.app</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
    {showFull && <CaseDetail slug={slug} onClose={() => setShowFull(false)} />}
    </>
  );
}
