// El tema clar o fosc. El primer cop el posa l'script curt del <head> (sense parpadeig); aquí hi ha el desplegable per
// canviar-lo. «Automàtic» segueix el mòbil o l'ordinador. Es recorda al navegador (localStorage), i res més.
const CLAU = 'bocins-tema';
const sistema = matchMedia('(prefers-color-scheme: light)');

function llegeix() {
  try { return localStorage.getItem(CLAU) || 'auto'; } catch { return 'auto'; }
}

function aplica(tria) {
  document.documentElement.dataset.tema = tria === 'auto' ? (sistema.matches ? 'clar' : 'fosc') : tria;
  for (const b of document.querySelectorAll('#tema-menu [data-tema]')) b.setAttribute('aria-checked', String(b.dataset.tema === tria));
}

export function iniciaTema() {
  const caixa = document.getElementById('tema');
  if (!caixa) return;
  const boto = caixa.querySelector('button[aria-haspopup]');
  const tanca = () => { caixa.classList.remove('obert'); boto.setAttribute('aria-expanded', 'false'); };
  aplica(llegeix());
  sistema.addEventListener('change', () => { if (llegeix() === 'auto') aplica('auto'); });
  boto.addEventListener('click', () => {
    const obert = caixa.classList.toggle('obert');
    boto.setAttribute('aria-expanded', String(obert));
    if (obert) caixa.querySelector('[aria-checked="true"]')?.focus();
  });
  caixa.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tema]');
    if (!b) return;
    try { localStorage.setItem(CLAU, b.dataset.tema); } catch { /* Sense memòria: només per a aquesta visita. */ }
    aplica(b.dataset.tema);
    tanca();
    boto.focus();
  });
  caixa.addEventListener('keydown', (e) => {
    const items = [...caixa.querySelectorAll('[data-tema]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { tanca(); boto.focus(); }
    if (i >= 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    }
  });
  document.addEventListener('click', (e) => { if (!caixa.contains(e.target)) tanca(); });
}
