import { useState } from 'react';
import LoginPage    from './components/LoginPage';
import PeopleSearch from './components/PeopleSearch';
import EntitySearch from './components/EntitySearch';
import CasesBrowse  from './components/CasesBrowse';
import CaseDetail   from './components/CaseDetail';
import Insights     from './components/Insights';
import NetworkGraph from './components/NetworkGraph';
import CrimeView    from './components/CrimeView';
import { getToken, logout } from './api/auth';

const TABS = [
  { id: 'people',   label: 'People' },
  { id: 'entities', label: 'Companies' },
  { id: 'cases',    label: 'Cases' },
  { id: 'crime',    label: 'Crime' },
  { id: 'insights', label: 'Insights' },
  { id: 'network',  label: 'Network' },
];

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [tab, setTab]       = useState('people');
  const [openSlug, setOpenSlug] = useState(null);
  const [casesInit, setCasesInit] = useState(null);

  const handleLogout = () => { logout(); setAuthed(false); };
  const openCase = (slug) => setOpenSlug(slug);
  // Jump to the Cases tab with a filter pre-applied (used by Insights tiles).
  const filterCases = (filter) => { setCasesInit(filter); setTab('cases'); };

  if (!authed) return <LoginPage onLogin={() => setAuthed(true)} />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
        <h1 className="font-extrabold"
          style={{ fontSize: 'clamp(1.6rem,4vw,2.6rem)', letterSpacing: '-.03em', textShadow: '0 8px 30px rgba(0,0,0,.35)' }}>
          TT Judgments Intel
        </h1>
        <button onClick={handleLogout} className="btn-secondary text-sm px-3 py-1.5">Sign out</button>
      </div>
      <p className="text-sm mb-5" style={{ color: 'rgba(238,244,255,.8)' }}>
        OSINT knowledge base from Trinidad &amp; Tobago court judgments — search people &amp; companies, browse cases, explore the network.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => { setCasesInit(null); setTab(t.id); }}>{t.label}</button>
        ))}
      </div>

      {tab === 'people'   && <PeopleSearch onOpenCase={openCase} />}
      {tab === 'entities' && <EntitySearch onOpenCase={openCase} />}
      {tab === 'cases'    && <CasesBrowse  onOpenCase={openCase} initial={casesInit} />}
      {tab === 'crime'    && <CrimeView    onOpenCase={openCase} />}
      {tab === 'insights' && <Insights     onOpenCase={openCase} onFilterCases={filterCases} />}
      {tab === 'network'  && <NetworkGraph onOpenCase={openCase} />}

      {openSlug && <CaseDetail slug={openSlug} onClose={() => setOpenSlug(null)} />}
      <div id="copy-toast" />

      <p className="text-center text-xs mt-10" style={{ color: 'rgba(239,244,255,.55)' }}>
        Facts extracted from published judgments. Matching is case-insensitive. Batch 2 of 2 (86 cases).
      </p>
    </div>
  );
}
