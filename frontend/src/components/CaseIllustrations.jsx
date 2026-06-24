// Poster-card illustrations, copied verbatim from the InsightTT reference design
// (SVG attributes converted to JSX camelCase). One per case type.

export function EmploymentSVG() {
  return (
    <svg viewBox="0 0 430 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky-c1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fce8e6" />
          <stop offset="100%" stopColor="#fdf4f3" />
        </linearGradient>
      </defs>
      <rect width="430" height="120" fill="url(#sky-c1)" />
      <rect x="0" y="110" width="430" height="10" fill="#f5c0bb" />
      {/* Flanking trees */}
      <rect x="28" y="86" width="4" height="24" fill="#a0522d" />
      <ellipse cx="30" cy="82" rx="14" ry="9" fill="#c0392b" opacity="0.2" />
      <rect x="398" y="86" width="4" height="24" fill="#a0522d" />
      <ellipse cx="400" cy="82" rx="14" ry="9" fill="#c0392b" opacity="0.2" />
      {/* Main block */}
      <rect x="65" y="30" width="300" height="80" fill="#fff" rx="2" />
      <rect x="65" y="30" width="300" height="80" fill="none" stroke="#c0392b" strokeWidth="2" rx="2" />
      {/* Horizontal bands */}
      <rect x="65" y="46" width="300" height="5" fill="#fde8e6" />
      <rect x="65" y="62" width="300" height="5" fill="#fde8e6" />
      <rect x="65" y="78" width="300" height="5" fill="#fde8e6" />
      <rect x="65" y="94" width="300" height="5" fill="#fde8e6" />
      {/* Columns */}
      <g fill="#fde8e6">
        <rect x="98" y="30" width="6" height="80" />
        <rect x="138" y="30" width="6" height="80" />
        <rect x="178" y="30" width="6" height="80" />
        <rect x="218" y="30" width="6" height="80" />
        <rect x="258" y="30" width="6" height="80" />
        <rect x="298" y="30" width="6" height="80" />
        <rect x="338" y="30" width="6" height="80" />
      </g>
      {/* Windows */}
      <g fill="#c0392b" opacity="0.1">
        <rect x="74" y="35" width="18" height="8" rx="1" /><rect x="106" y="35" width="18" height="8" rx="1" /><rect x="146" y="35" width="18" height="8" rx="1" /><rect x="186" y="35" width="18" height="8" rx="1" /><rect x="226" y="35" width="18" height="8" rx="1" /><rect x="266" y="35" width="18" height="8" rx="1" /><rect x="306" y="35" width="18" height="8" rx="1" /><rect x="346" y="35" width="18" height="8" rx="1" />
        <rect x="74" y="52" width="18" height="8" rx="1" /><rect x="106" y="52" width="18" height="8" rx="1" /><rect x="146" y="52" width="18" height="8" rx="1" /><rect x="186" y="52" width="18" height="8" rx="1" /><rect x="226" y="52" width="18" height="8" rx="1" /><rect x="266" y="52" width="18" height="8" rx="1" /><rect x="306" y="52" width="18" height="8" rx="1" /><rect x="346" y="52" width="18" height="8" rx="1" />
        <rect x="74" y="68" width="18" height="8" rx="1" /><rect x="106" y="68" width="18" height="8" rx="1" /><rect x="146" y="68" width="18" height="8" rx="1" /><rect x="186" y="68" width="18" height="8" rx="1" /><rect x="226" y="68" width="18" height="8" rx="1" /><rect x="266" y="68" width="18" height="8" rx="1" /><rect x="306" y="68" width="18" height="8" rx="1" /><rect x="346" y="68" width="18" height="8" rx="1" />
      </g>
      <rect x="146" y="35" width="18" height="8" rx="1" fill="#c0392b" opacity="0.55" />
      <rect x="266" y="52" width="18" height="8" rx="1" fill="#c0392b" opacity="0.55" />
      <rect x="186" y="68" width="18" height="8" rx="1" fill="#c0392b" opacity="0.55" />
      {/* Top bar */}
      <rect x="65" y="26" width="300" height="5" fill="#c0392b" rx="1" />
      {/* Rooftop */}
      <rect x="188" y="16" width="54" height="12" fill="#f5c0bb" rx="1" />
      <rect x="188" y="16" width="54" height="12" fill="none" stroke="#c0392b" strokeWidth="1.5" rx="1" />
      {/* Scales icon */}
      <line x1="215" y1="6" x2="215" y2="17" stroke="#c0392b" strokeWidth="1.5" opacity="0.4" />
      <line x1="207" y1="10" x2="223" y2="10" stroke="#c0392b" strokeWidth="1.5" opacity="0.4" />
      <circle cx="207" cy="13" r="3" fill="none" stroke="#c0392b" strokeWidth="1" opacity="0.4" />
      <circle cx="223" cy="13" r="3" fill="none" stroke="#c0392b" strokeWidth="1" opacity="0.4" />
      {/* Entrance */}
      <rect x="188" y="90" width="54" height="20" fill="#fde8e6" rx="1" />
      <rect x="188" y="90" width="54" height="20" fill="none" stroke="#c0392b" strokeWidth="1.2" rx="1" />
      <rect x="198" y="95" width="10" height="15" rx="5" fill="#c0392b" opacity="0.15" />
      <rect x="215" y="95" width="10" height="15" rx="5" fill="#c0392b" opacity="0.15" />
      <rect x="232" y="95" width="6" height="15" fill="#c0392b" opacity="0.15" />
      {/* Steps */}
      <rect x="176" y="108" width="78" height="3" fill="#f5c0bb" rx="1" />
    </svg>
  );
}

export function PropertySVG() {
  return (
    <svg viewBox="0 0 430 110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky-c2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9e7" />
          <stop offset="100%" stopColor="#fdf8ed" />
        </linearGradient>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#b7950b" opacity="0.6" />
        </marker>
      </defs>
      <rect width="430" height="110" fill="url(#sky-c2)" />
      {/* Road / landscape */}
      <rect x="0" y="90" width="430" height="20" fill="#e8d58a" />
      <rect x="0" y="98" width="430" height="4" fill="#d4c070" opacity="0.5" />
      {/* Highway / road */}
      <rect x="0" y="85" width="430" height="10" fill="#c8b840" />
      {/* Highway lane markings */}
      <g fill="#fff" opacity="0.5">
        <rect x="40" y="88" width="30" height="3" rx="1" />
        <rect x="100" y="88" width="30" height="3" rx="1" />
        <rect x="160" y="88" width="30" height="3" rx="1" />
        <rect x="220" y="88" width="30" height="3" rx="1" />
        <rect x="280" y="88" width="30" height="3" rx="1" />
        <rect x="340" y="88" width="30" height="3" rx="1" />
      </g>
      {/* Land plot */}
      <rect x="60" y="40" width="160" height="46" fill="#e6d080" rx="2" />
      <rect x="60" y="40" width="160" height="46" fill="none" stroke="#b7950b" strokeWidth="2" strokeDasharray="6,3" rx="2" />
      {/* Survey markers */}
      <circle cx="60" cy="40" r="4" fill="#b7950b" />
      <circle cx="220" cy="40" r="4" fill="#b7950b" />
      <circle cx="60" cy="86" r="4" fill="#b7950b" />
      <circle cx="220" cy="86" r="4" fill="#b7950b" />
      {/* Land label */}
      <text x="140" y="68" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#b7950b" opacity="0.7" letterSpacing="1">5.11 ACRES</text>
      <text x="140" y="80" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="7" fill="#b7950b" opacity="0.5" letterSpacing="0.5">JOKHAN TRACE, PENAL</text>
      {/* Arrow — NIDCO acquisition */}
      <path d="M230 62 L290 62" stroke="#b7950b" strokeWidth="2" markerEnd="url(#arrow)" opacity="0.6" />
      {/* NIDCO label */}
      <rect x="295" y="52" width="80" height="22" fill="#fff8e0" rx="4" />
      <rect x="295" y="52" width="80" height="22" fill="none" stroke="#b7950b" strokeWidth="1.5" rx="4" />
      <text x="335" y="63" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#b7950b" fontWeight="600">NIDCO</text>
      <text x="335" y="72" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="7" fill="#b7950b" opacity="0.6">STATE</text>
      {/* Trees */}
      <ellipse cx="30" cy="65" rx="20" ry="14" fill="#8bc34a" opacity="0.4" />
      <ellipse cx="20" cy="58" rx="14" ry="10" fill="#7cb342" opacity="0.35" />
      <ellipse cx="405" cy="60" rx="20" ry="14" fill="#8bc34a" opacity="0.4" />
      <ellipse cx="415" cy="54" rx="14" ry="10" fill="#7cb342" opacity="0.35" />
      {/* SF-PF highway label */}
      <text x="215" y="96" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="7" fill="#fff" opacity="0.7" letterSpacing="1">SAN FERNANDO — POINT FORTIN HIGHWAY</text>
    </svg>
  );
}

export function CorporateSVG() {
  return (
    <svg viewBox="0 0 430 110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky-c3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f0f8" />
          <stop offset="100%" stopColor="#f0f4f8" />
        </linearGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6aab8a" />
          <stop offset="100%" stopColor="#4a8a6a" />
        </linearGradient>
      </defs>
      <rect width="430" height="110" fill="url(#sky-c3)" />
      {/* Diego Martin hills background */}
      <ellipse cx="100" cy="110" rx="130" ry="55" fill="url(#hill)" opacity="0.35" />
      <ellipse cx="330" cy="115" rx="140" ry="50" fill="url(#hill)" opacity="0.3" />
      <ellipse cx="215" cy="105" rx="100" ry="40" fill="url(#hill)" opacity="0.25" />
      {/* Ground */}
      <rect x="0" y="96" width="430" height="14" fill="#a8c8b0" />
      {/* Office building / land firm HQ */}
      <rect x="148" y="28" width="134" height="70" fill="#fff" rx="2" />
      <rect x="148" y="28" width="134" height="70" fill="none" stroke="#1a5276" strokeWidth="2" rx="2" />
      {/* Floor lines */}
      <line x1="148" y1="46" x2="282" y2="46" stroke="#e8f0f8" strokeWidth="1" />
      <line x1="148" y1="64" x2="282" y2="64" stroke="#e8f0f8" strokeWidth="1" />
      <line x1="148" y1="82" x2="282" y2="82" stroke="#e8f0f8" strokeWidth="1" />
      <line x1="215" y1="28" x2="215" y2="98" stroke="#e8f0f8" strokeWidth="1" />
      {/* Windows */}
      <g fill="#1a5276" opacity="0.12">
        <rect x="156" y="33" width="22" height="10" rx="1" /><rect x="184" y="33" width="22" height="10" rx="1" /><rect x="224" y="33" width="22" height="10" rx="1" /><rect x="252" y="33" width="22" height="10" rx="1" />
        <rect x="156" y="51" width="22" height="10" rx="1" /><rect x="184" y="51" width="22" height="10" rx="1" /><rect x="224" y="51" width="22" height="10" rx="1" /><rect x="252" y="51" width="22" height="10" rx="1" />
        <rect x="156" y="69" width="22" height="10" rx="1" /><rect x="184" y="69" width="22" height="10" rx="1" /><rect x="224" y="69" width="22" height="10" rx="1" /><rect x="252" y="69" width="22" height="10" rx="1" />
      </g>
      <rect x="184" y="33" width="22" height="10" rx="1" fill="#1a5276" opacity="0.55" />
      <rect x="252" y="51" width="22" height="10" rx="1" fill="#1a5276" opacity="0.55" />
      {/* Top bar */}
      <rect x="148" y="24" width="134" height="5" fill="#1a5276" rx="1" />
      {/* Company name plate */}
      <rect x="168" y="84" width="94" height="14" fill="#e8f0f8" rx="2" />
      <text x="215" y="94" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="7" fill="#1a5276" letterSpacing="0.5">CAPILDEO LANDS LTD</text>
      {/* Small flanking building */}
      <rect x="52" y="52" width="72" height="46" fill="#dce8f0" rx="2" />
      <rect x="52" y="52" width="72" height="46" fill="none" stroke="#1a5276" strokeWidth="1.5" opacity="0.4" rx="2" />
      <rect x="52" y="48" width="72" height="5" fill="#1a5276" opacity="0.4" rx="1" />
      <rect x="310" y="48" width="72" height="50" fill="#dce8f0" rx="2" />
      <rect x="310" y="48" width="72" height="50" fill="none" stroke="#1a5276" strokeWidth="1.5" opacity="0.4" rx="2" />
      <rect x="310" y="44" width="72" height="5" fill="#1a5276" opacity="0.4" rx="1" />
      {/* Diego Martin label */}
      <text x="215" y="14" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill="#1a5276" opacity="0.4" letterSpacing="1">DIEGO MARTIN</text>
    </svg>
  );
}

// Employment (court) art doubles for criminal (court) cases.
export function CaseIllustration({ type }) {
  if (type === 'property') return <PropertySVG />;
  if (type === 'corporate') return <CorporateSVG />;
  return <EmploymentSVG />; // employment + criminal
}
