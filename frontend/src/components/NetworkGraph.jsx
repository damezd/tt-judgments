import { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import { getNetwork } from '../api/client';

const COL = { company: '#2E5BA6', bank: '#E0A800', group: '#7b4fa3', director: '#127a6b', person: '#9aa3ad' };
const CASECOL = { high: '#C0392B', medium: '#3B73B9', low: '#c9ced6' };

export default function NetworkGraph({ onOpenCase }) {
  const host = useRef(null);
  const netRef = useRef(null);
  const dsRef = useRef(null);
  const dataRef = useRef(null);
  const [info, setInfo] = useState('Click any node for details.');
  const [err, setErr] = useState('');
  const [F, setF] = useState({ company: true, bank: true, group: true, director: true, party: false, caseV: { high: true, medium: true, low: true } });

  useEffect(() => {
    let alive = true;
    getNetwork().then(data => {
      if (!alive) return;
      dataRef.current = data;
      const directorIds = new Set(data.edges.filter(e => e[2] === 'director/officer').map(e => e[0]));
      const nodes = data.nodes.map(n => {
        const isDir = n.type === 'person' && directorIds.has(n.id);
        let color = n.type === 'case' ? (CASECOL[n.value] || '#c9ced6')
          : n.type === 'person' ? (isDir ? COL.director : COL.person) : (COL[n.type] || '#888');
        return {
          id: n.id, label: n.label, _type: n.type, _value: n.value, _slug: n.slug,
          _isDir: isDir, _ncase: n.ncase || 0, _deg: n.deg,
          shape: n.type === 'case' ? 'box' : 'dot',
          color: { background: color, border: '#ffffff' },
          size: Math.max(8, Math.min(34, 6 + (n.deg || 1) * 2.2)),
          font: { size: n.type === 'case' ? 12 : 13, color: '#e8eefc' },
          hidden: !visible({ _type: n.type, _value: n.value, _isDir: isDir }, F),
        };
      });
      const edges = data.edges.map((e, i) => ({
        id: 'e' + i, from: e[0], to: e[1], title: e[2],
        color: { color: e[2] === 'director/officer' ? '#127a6b' : (e[2] === 'member of' ? '#7b4fa3' : '#5b6a86') },
        width: e[2] === 'director/officer' ? 2 : 1, smooth: false,
      }));
      const ds = new DataSet(nodes);
      dsRef.current = ds;
      const net = new Network(host.current, { nodes: ds, edges: new DataSet(edges) }, {
        physics: { stabilization: { iterations: 200 }, barnesHut: { gravitationalConstant: -9000, springLength: 130, springConstant: 0.03, avoidOverlap: 0.3 } },
        interaction: { hover: true, tooltipDelay: 120 }, nodes: { borderWidth: 1.5 },
      });
      netRef.current = net;
      net.on('click', p => {
        if (!p.nodes.length) return;
        const n = ds.get(p.nodes[0]);
        const conn = net.getConnectedNodes(n.id).map(x => ds.get(x)).filter(Boolean);
        let h = `${n.label}  ·  ${n._type === 'person' ? (n._isDir ? 'director/officer' : 'party/person') : n._type}`;
        if (n._type === 'case') h += `  ·  ${n._value}`;
        if ((n._type === 'company' || n._type === 'bank') && n._ncase > 1) h += `  ·  appears in ${n._ncase} cases`;
        h += `  —  connected: ${conn.map(c => c.label).join(', ')}`;
        setInfo(h);
        if (n._type === 'case' && n._slug && onOpenCase) onOpenCase(n._slug);
      });
    }).catch(() => alive && setErr('Failed to load network.'));
    return () => { alive = false; netRef.current?.destroy(); };
    // eslint-disable-next-line
  }, []);

  function visible(n, f) {
    if (n._type === 'company') return f.company;
    if (n._type === 'bank') return f.bank;
    if (n._type === 'group') return f.group;
    if (n._type === 'person') return n._isDir ? f.director : f.party;
    if (n._type === 'case') return f.caseV[n._value];
    return true;
  }
  function apply(f) {
    const ds = dsRef.current; if (!ds) return;
    ds.update(ds.map(n => ({ id: n.id, hidden: !visible(n, f) })));
  }
  function toggle(key) { const f = { ...F, [key]: !F[key] }; setF(f); apply(f); }
  function toggleV(v) { const f = { ...F, caseV: { ...F.caseV, [v]: !F.caseV[v] } }; setF(f); apply(f); }
  function bridges() {
    const ds = dsRef.current; if (!ds) return;
    ds.update(ds.map(n => {
      let keep = n._type === 'case';
      if ((n._type === 'company' || n._type === 'bank' || n._type === 'group') && n._ncase > 1) keep = true;
      return { id: n.id, hidden: !keep };
    }));
  }
  function reset() { apply(F); netRef.current?.fit(); }

  const Chk = ({ k, label, dot }) => (
    <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#dce8ff' }}>
      <input type="checkbox" checked={F[k]} onChange={() => toggle(k)} />
      <span style={{ width: 11, height: 11, borderRadius: 6, background: dot, display: 'inline-block' }} /> {label}
    </label>
  );

  return (
    <div className="panel-in">
      <div className="glass p-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Chk k="company" label="Companies" dot={COL.company} />
        <Chk k="bank" label="Banks/FIs" dot={COL.bank} />
        <Chk k="group" label="Groups" dot={COL.group} />
        <Chk k="director" label="Directors" dot={COL.director} />
        <Chk k="party" label="Parties/witnesses" dot={COL.person} />
        <span className="text-xs" style={{ color: 'rgba(238,244,255,.5)' }}>|</span>
        {['high', 'medium', 'low'].map(v => (
          <label key={v} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#dce8ff' }}>
            <input type="checkbox" checked={F.caseV[v]} onChange={() => toggleV(v)} />
            <span style={{ width: 11, height: 11, borderRadius: 6, background: CASECOL[v], display: 'inline-block' }} /> {v} cases
          </label>
        ))}
        <span className="flex gap-2 ml-auto">
          <button className="tab" onClick={bridges}>Cross-case only</button>
          <button className="tab" onClick={reset}>Reset</button>
        </span>
      </div>
      {err && <p className="text-center text-red-300 text-sm">{err}</p>}
      <div ref={host} className="net-host" />
      <p className="text-xs mt-2" style={{ color: 'rgba(238,244,255,.8)' }}>{info}</p>
    </div>
  );
}
