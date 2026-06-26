import { useState, useEffect } from 'react';
import { getNotices } from '../api/client';
import { copyText } from './ui';
import { CaseIllustration } from './CaseIllustrations';
import NoticeViewer from './NoticeViewer';
import { fmtDate } from './caseMeta';
import { noticeMeta, allegationsFrom } from './noticeUtils';

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

  return (
    <div className="panel-in">
      <div className="feed">
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
          const meta = noticeMeta(n);
          const type = meta.type;
          const grounds = allegationsFrom(n.summary, n.person_name);
          const headline = n.social_headline || n.title;
          const body = n.social_post || n.summary || '';
          const excerpt = body.length > 180 ? body.slice(0, 180).trimEnd() + '…' : body;
          return (
            <article key={n.id} className={`case-card type-${type}`} onClick={() => setSelected(n)}
              role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setSelected(n); }}>
              <div className="rail" />
              <div className="card-illustration"><CaseIllustration type={type} /></div>
              <div className="card-body">
                <div className="badge-row">
                  <span className={`badge badge-type-${type}`}>{meta.label}</span>
                  {grounds.length ? <span className="badge badge-high">{grounds[0].label}</span> : null}
                </div>
                <div className="card-headline">{headline}</div>
                {excerpt && <div className="card-excerpt">{excerpt}</div>}
              </div>
              <div className="card-footer">
                <span className="card-date">{fmtDate(n.date_published || n.date_made)}</span>
                <button className="share-btn" onClick={(e) => { e.stopPropagation(); copyText(`${headline} — InsightTT`); }}>Share · @insighttt</button>
              </div>
            </article>
          );
        })}
      </div>

      {selected && <NoticeViewer n={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
