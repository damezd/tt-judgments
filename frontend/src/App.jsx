import { useState, useEffect } from 'react';
import LoginPage    from './components/LoginPage';
import PeopleSearch from './components/PeopleSearch';
import EntitySearch from './components/EntitySearch';
import CasesBrowse  from './components/CasesBrowse';
import CombinedFeed from './components/CombinedFeed';
import CaseViewer   from './components/CaseViewer';
import Insights     from './components/Insights';
import NetworkGraph from './components/NetworkGraph';
import CrimeView    from './components/CrimeView';
import NoticesBrowse from './components/NoticesBrowse';
import { getToken, logout } from './api/auth';

const TABS = [
  { id: 'feed',     label: 'Feed' },
  { id: 'cases',    label: 'Cases' },
  { id: 'notices',  label: 'Notices' },
  { id: 'people',   label: 'People' },
  { id: 'entities', label: 'Companies' },
  { id: 'crime',    label: 'Crime' },
  { id: 'insights', label: 'Insights' },
  { id: 'network',  label: 'Network' },
];

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab]       = useState('feed');
  const [openSlug, setOpenSlug] = useState(null);
  const [casesInit, setCasesInit] = useState(null);
  const [caseCount, setCaseCount] = useState(null);

  // When any request hits a 401 (expired/invalid token), bounce to login.
  useEffect(() => {
    const onExpired = () => { setOpenSlug(null); setAuthed(false); };
    window.addEventListener('ttj-auth-expired', onExpired);
    return () => window.removeEventListener('ttj-auth-expired', onExpired);
  }, []);

  const handleLogout = () => { logout(); setAuthed(false); };
  const openCase = (slug) => setOpenSlug(slug);
  // Jump to the Cases tab with a filter pre-applied (used by Insights tiles).
  const filterCases = (filter) => { setCasesInit(filter); setTab('cases'); };

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  const edgeToEdge = tab === 'cases' || tab === 'feed';

  return (
    <>
      <nav className="nav">
        <div className="nav-top">
          <div>
            <div className="nav-brand">Insight<em>TT</em></div>
            <div className="nav-sub">Court Judgments</div>
          </div>
          {caseCount != null && <div className="nav-count">{caseCount} cases</div>}
        </div>
      </nav>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => { setCasesInit(null); setTab(t.id); }}>{t.label}</button>
        ))}
        <button className="tab" style={{ marginLeft: 'auto' }} onClick={handleLogout}>Sign out</button>
      </div>

      <main style={edgeToEdge ? undefined : { padding: '16px 14px' }}>
        {tab === 'feed'     && <CombinedFeed onOpenCase={openCase} />}
        {tab === 'cases'    && <CasesBrowse  onOpenCase={openCase} initial={casesInit} onCount={setCaseCount} />}
        {tab === 'notices'  && <NoticesBrowse />}
        {tab === 'people'   && <PeopleSearch onOpenCase={openCase} />}
        {tab === 'entities' && <EntitySearch onOpenCase={openCase} />}
        {tab === 'crime'    && <CrimeView    onOpenCase={openCase} />}
        {tab === 'insights' && <Insights     onOpenCase={openCase} onFilterCases={filterCases} />}
        {tab === 'network'  && <NetworkGraph onOpenCase={openCase} />}
      </main>

      {openSlug && <CaseViewer slug={openSlug} onClose={() => setOpenSlug(null)} />}
      <div id="copy-toast" />

      <p className="text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '.08em', padding: '20px 16px 28px', textTransform: 'uppercase' }}>
        Facts extracted from published judgments
      </p>
    </>
  );
}
