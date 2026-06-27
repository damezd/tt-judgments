import { useState, useEffect } from 'react';
import { listCases, getNotices } from '../api/client';
import { copyText } from './ui';
import { CaseIllustration } from './CaseIllustrations';
import { NoticeIllustration } from './NoticeIllustration';
import NoticeViewer from './NoticeViewer';
import { detectType, typeLabel, parseAmount, fmtDate, PRIO } from './caseMeta';
import { noticeMeta, allegationsFrom } from './noticeUtils';

// One combined, date-sorted stream of court judgments + gazette notices.
export default function CombinedFeed({ onOpenCase }) {
  const [state, setState] = useState({ loading: true });
  const [notice, setNotice] = useState(null);

  async function load() {
    setState({ loading: true });
    try {
      const [cases, notices] = await Promise.all([listCases({}), getNotices()]);
      const items = [
        ...(cases.cases || []).map(c => ({ kind: 'case', date: c.case_date || '', c })),
        ...(notices.notices || []).map(n => ({ kind: 'notice', date: n.date_published || n.date_made || '', n })),
      ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setState({ loading: false, items });
    } catch (e) {
      if (e.message === 'UNAUTHORIZED') throw e;
      setState({ loading: false, error: e.message || 'Failed to load feed.' });
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const share = (headline) => copyText(`${headline} — InsightTT`);

  return (
    <div className="panel-in">
      <div className="feed">
        <div className="section-label">Latest · Judgments &amp; Notices</div>

        {state.loading && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Loading…</p>}
        {state.error && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ color: 'var(--red)', fontSize: 13 }}>{state.error}</p>
            <button className="btn-secondary" style={{ marginTop: 12, fontSize: 13 }} onClick={load}>Retry</button>
          </div>
        )}

        {(state.items || []).map((item, i) => {
          if (item.kind === 'case') {
            const c = item.c;
            const t = detectType(c);
            const [prioClass, prioLabel] = PRIO[(c.osint_value || 'low').toLowerCase()] || PRIO.low;
            const amount = parseAmount(c);
            const headline = c.social_headline || c.title;
            const bodyText = c.social_post || c.outcome || '';
            const excerpt = bodyText.length > 180 ? bodyText.slice(0, 180).trimEnd() + '…' : bodyText;
            return (
              <article key={`c${c.id}`} className={`case-card type-${t}`} onClick={() => onOpenCase(c.slug)}
                role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') onOpenCase(c.slug); }}>
                <div className="rail" />
                <div className="card-illustration"><CaseIllustration type={t} /></div>
                <div className="card-body">
                  <div className="badge-row">
                    <span className={`badge ${prioClass}`}>{prioLabel}</span>
                    <span className={`badge badge-type-${t}`}>{typeLabel(t, c)}</span>
                    {c.fetch_failed ? <span className="badge badge-medium">Not retrieved</span> : null}
                  </div>
                  {amount && (
                    <div className="amount-tag"><span className="sym">{amount.sym}</span>{amount.num}<span className="unit">{amount.unit}</span></div>
                  )}
                  <div className="card-headline">{headline}</div>
                  {excerpt && <div className="card-excerpt">{excerpt}</div>}
                </div>
                <div className="card-footer">
                  <span className="card-date">{fmtDate(c.case_date)}</span>
                  <button className="share-btn" onClick={e => { e.stopPropagation(); share(headline); }}>Share · @insighttt</button>
                </div>
              </article>
            );
          }
          const n = item.n;
          const meta = noticeMeta(n);
          const type = meta.type;
          const grounds = allegationsFrom(n.summary, n.person_name);
          const headline = n.social_headline || n.title;
          const bodyText = n.social_post || n.summary || '';
          const excerpt = bodyText.length > 180 ? bodyText.slice(0, 180).trimEnd() + '…' : bodyText;
          return (
            <article key={`n${n.id}`} className={`case-card type-${type}`} onClick={() => setNotice(n)}
              role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setNotice(n); }}>
              <div className="rail" />
              <div className="card-illustration"><NoticeIllustration /></div>
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
                <button className="share-btn" onClick={e => { e.stopPropagation(); share(headline); }}>Share · @insighttt</button>
              </div>
            </article>
          );
        })}

        {state.items && state.items.length === 0 && !state.loading && (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Nothing on record.</p>
        )}
      </div>

      {notice && <NoticeViewer n={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}
