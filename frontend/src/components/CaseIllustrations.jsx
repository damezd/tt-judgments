import hallOfJustice from '../assets/hall-of-justice-crime.png';
import property from '../assets/property.png';

// Poster-card illustrations. Corporate is an inline SVG; court cards
// (employment + criminal) use the Hall of Justice illustration; property uses
// the surveyed-house illustration.

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

// Court cards (employment + criminal) show the Hall of Justice illustration.
export function CaseIllustration({ type }) {
  if (type === 'property') return <img src={property} alt="Surveyed property" loading="lazy" />;
  if (type === 'corporate') return <CorporateSVG />;
  return <img src={hallOfJustice} alt="Hall of Justice" loading="lazy" />; // employment + criminal
}
