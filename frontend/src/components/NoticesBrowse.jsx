import { useState, useEffect } from 'react';
import { getNotices } from '../api/client';
import { copyText } from './ui';
import { fmtDate } from './caseMeta';

const TYPE = {
  detention_order: { label: 'Detention Order', tag: 'Emergency Powers', accent: '#c0392b', tint: '#fdeceb' },
  proceeds_of_crime: { label: 'Proceeds of Crime', tag: 'Seized Assets', accent: '#1a5276', tint: '#eaf1f8' },
  default: { label: 'Legal Notice', tag: 'Gazette', accent: '#1a1814', tint: '#efece5' },
};

// Simple Gazette-style illustration: an official notice sheet with a seal.
function NoticeArt({ no, accent, tint }) {
  return (
    <svg viewBox="0 0 430 168" xmlns="http://www.w3.org/2000/svg">
      <rect width="430" height="168" fill={tint} />
      {/* side flourishes */}
      <g stroke={accent} strokeWidth="1" opacity="0.18">
        <line x1="40" y1="40" x2="86" y2="40" /><line x1="40" y1="128" x2="86" y2="128" />
        <line x1="344" y1="40" x2="390" y2="40" /><line x1="344" y1="128" x2="390" y2="128" />
      </g>
      {/* document sheet */}
      <rect x="120" y="20" width="190" height="132" rx="3" fill="#fff" stroke={accent} strokeWidth="2" />
      {/* header band */}
      <rect x="120" y="20" width="190" height="24" rx="3" fill={accent} />
      <text x="215" y="36" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#fff" letterSpacing="2" fontWeight="600">LEGAL NOTICE</text>
      {/* notice number */}
      <text x="200" y="86" textAnchor="middle" fontFamily="DM Serif Display, Georgia, serif" fontSize="34" fill={accent}>No. {no}</text>
      {/* text lines */}
      <g fill={accent} opacity="0.14">
        <rect x="138" y="98" width="120" height="5" rx="2" />
        <rect x="138" y="110" width="150" height="5" rx="2" />
        <rect x="138" y="122" width="96" height="5" rx="2" />
        <rect x="138" y="134" width="134" height="5" rx="2" />
      </g>
      {/* seal */}
      <circle cx="296" cy="120" r="22" fill="#fff" stroke={accent} strokeWidth="2" />
      <circle cx="296" cy="120" r="15" fill="none" stroke={accent} strokeWidth="1" opacity="0.7" />
      <path d="M296 109 l3.2 6.6 7.2 0.9 -5.3 5 1.3 7.1 -6.4 -3.5 -6.4 3.5 1.3 -7.1 -5.3 -5 7.2 -0.9 z" fill={accent} opacity="0.85" />
      {/* ribbon */}
      <path d="M288 140 l8 6 8 -6 0 14 -8 -5 -8 5 z" fill={accent} opacity="0.8" />
    </svg>
  );
}

// Full-detail modal for a single notice.
function NoticeModal({ n, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!n) return null;
  const t = TYPE[n.ntype] || TYPE.default;
  const addresses = (n.address || '').split(';').map(s => s.trim()).filter(Boolean);

  const Row = ({ label, children }) =>
    children ? (
      <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ flex: '0 0 116px', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', paddingTop: 2 }}>{label}</div>
        <div style={{ flex: 1, fontSize: 14, lineHeight: 1.5 }}>{children}</div>
      </div>
    ) : null;

  const share = () => {
    const text = `${n.social_headline || n.title} — InsightTT`;
    if (navigator.share) navigator.share({ title: 'InsightTT', text }).catch(() => {});
    else copyText(text);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,16,12,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '32px 16px', overflowY: 'auto' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg)', color: 'var(--text, inherit)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}
      >
        {/* header band */}
        <div style={{ background: t.accent, color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, letterSpacing: 1 }}>
            {t.label.toUpperCase()} · LEGAL NOTICE NO. {n.notice_no}
          </span>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: 0 }}>×</button>
        </div>

        <div style={{ padding: '18px' }}>
          <div style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 22, lineHeight: 1.25, marginBottom: 12 }}>
            {n.social_headline || n.title}
          </div>

          <Row label="Type">{t.label}</Row>
          <Row label="Act">{n.act}</Row>
          <Row label="Instrument">{n.instrument}</Row>
          <Row label="Person">{n.person_name}</Row>
          <Row label="Aliases">{n.alias}</Row>
          <Row label="Address">{addresses.length ? addresses.map((a, i) => <div key={i}>{a}</div>) : null}</Row>
          <Row label="Detained at">{n.detained_at}</Row>
          <Row label="Ordered by">{[n.official, n.official_role].filter(Boolean).join(' · ')}</Row>
          <Row label="Date made">{fmtDate(n.date_made)}</Row>
          <Row label="Published">{fmtDate(n.date_published)}</Row>
          <Row label="Grounds">{n.summary}</Row>
          <Row label="Summary">{n.social_post}</Row>
          <Row label="Citation">{n.citation}</Row>
          <Row label="Source">{n.source_file}</Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="share-btn" onClick={share}>Share · @insighttt</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NoticesBrowse() {
  const [state, setState] = useState({ loading: true });
  const [selected, setSelected] = useState(null);

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

  const share = (n) => {
    const text = `${n.social_headline || n.title} — InsightTT`;
    if (navigator.share) navigator.share({ title: 'InsightTT', text }).catch(() => {});
    else copyText(text);
  };

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
            <article
              key={n.id}
              className="case-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelected(n); }}
            >
              <div className="rail" style={{ background: t.accent }} />
              <div className="card-illustration"><NoticeArt no={n.notice_no} accent={t.accent} tint={t.tint} /></div>
              <div className="card-body">
                <div className="badge-row">
                  <span className="badge" style={{ background: t.tint, color: t.accent, border: `1px solid ${t.accent}40` }}>{t.label}</span>
                  <span className="badge" style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>{t.tag}</span>
                </div>
                <div className="card-headline">{n.social_headline || n.title}</div>
                {excerpt && <div className="card-excerpt">{excerpt}</div>}
              </div>
              <div className="card-footer">
                <span className="card-date">{n.citation}</span>
                <button className="share-btn" onClick={(e) => { e.stopPropagation(); share(n); }}>Share · @insighttt</button>
              </div>
            </article>
          );
        })}
      </div>

      {selected && <NoticeModal n={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
