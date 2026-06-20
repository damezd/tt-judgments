// Small shared UI helpers.

export function Badge({ value }) {
  const v = (value || 'low').toLowerCase();
  return <span className={`badge ${v}`}>{v}</span>;
}

export function webSearch(name) {
  return `https://www.google.com/search?q=${encodeURIComponent((name || '') + ' Trinidad')}`;
}

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('copy-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('Copied!'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('Copied!');
  }
}

export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
