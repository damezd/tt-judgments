import hallOfJustice from '../assets/hall-of-justice-crime.png';
import property from '../assets/property.png';
import corporate from '../assets/corporate.png';

// Poster-card illustrations, one per case type (all uploaded line-art):
//   employment + criminal -> Hall of Justice
//   property              -> surveyed house
//   corporate             -> Twin Towers (Eric Williams Financial Complex)
export function CaseIllustration({ type }) {
  if (type === 'property') return <img src={property} alt="Surveyed property" loading="lazy" />;
  if (type === 'corporate') return <img src={corporate} alt="Twin Towers" loading="lazy" />;
  return <img src={hallOfJustice} alt="Hall of Justice" loading="lazy" />; // employment + criminal
}
