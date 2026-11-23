// Versió interactiva de la web de CIMS. És opcional: el visitant l'activa i la desactiva amb el botó de la barra,
// i la tria es recorda. El contingut és el mateix en les dues versions; aquí només s'hi afegeix una capa d'efectes.
// Amb «reduir moviment» no es mou res: només queden els canvis de color i la barra de progrés.
const CLAU = 'cims-interactiu';
const arrel = document.documentElement;
const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ratoli = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

let desfer = [];
const escolta = (on, tipus, fn, opc = { passive: true }) => { on.addEventListener(tipus, fn, opc); desfer.push(() => on.removeEventListener(tipus, fn, opc)); };

/** Barra de progrés de lectura a dalt de tot. */
function progres() {
  const barra = Object.assign(document.createElement('div'), { className: 'int-progres' });
  barra.setAttribute('aria-hidden', 'true');
  document.body.append(barra);
  desfer.push(() => barra.remove());
  let pendent = false;
  const pinta = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    barra.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max) : 0);
    pendent = false;
  };
  escolta(window, 'scroll', () => { if (!pendent) { pendent = true; requestAnimationFrame(pinta); } });
  pinta();
}

/** Una llum suau segueix el cursor dins de les files i les targetes. */
function llum() {
  const sel = '.index li, .serveis dl > div, .compromisos li, .passos-s li, .preguntes details, .fitxa, .legal section';
  document.querySelectorAll(sel).forEach((el) => el.classList.add('int-llum'));
  desfer.push(() => document.querySelectorAll('.int-llum').forEach((el) => el.classList.remove('int-llum')));
  escolta(document, 'pointermove', (e) => {
    const el = e.target.closest?.('.int-llum');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - r.left}px`);
    el.style.setProperty('--y', `${e.clientY - r.top}px`);
  });
}

/** El logo gran s'inclina cap al cursor i els dos cims es mouen a profunditats diferents. */
function inclinaLogo() {
  const heroi = document.querySelector('.heroi');
  const logo = heroi?.querySelector('.logo-gran');
  if (!logo) return;
  let pendent = false;
  escolta(heroi, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse' || pendent) return;
    pendent = true;
    requestAnimationFrame(() => {
      const r = logo.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 200)));
      const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 200)));
      logo.style.setProperty('--ix', x.toFixed(3));
      logo.style.setProperty('--iy', y.toFixed(3));
      logo.classList.add('int-viu');
      pendent = false;
    });
  });
  escolta(heroi, 'pointerleave', () => { logo.classList.remove('int-viu'); logo.style.setProperty('--ix', 0); logo.style.setProperty('--iy', 0); });
  // Un clic al logo fa saltar els cims una vegada (menys d'un segon).
  escolta(logo, 'click', () => { logo.classList.remove('int-salta'); void logo.offsetWidth; logo.classList.add('int-salta'); });
  escolta(logo, 'animationend', () => logo.classList.remove('int-salta'));
  desfer.push(() => { logo.classList.remove('int-viu', 'int-salta'); logo.style.removeProperty('--ix'); logo.style.removeProperty('--iy'); });
}

/** Els botons principals s'acosten una mica al cursor. */
function iman() {
  document.querySelectorAll('.bt').forEach((bt) => {
    escolta(bt, 'pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = bt.getBoundingClientRect();
      bt.style.setProperty('--mx', `${((e.clientX - r.left) / r.width - 0.5) * 10}px`);
      bt.style.setProperty('--my', `${((e.clientY - r.top) / r.height - 0.5) * 8}px`);
    });
    escolta(bt, 'pointerleave', () => { bt.style.removeProperty('--mx'); bt.style.removeProperty('--my'); });
  });
  desfer.push(() => document.querySelectorAll('.bt').forEach((bt) => { bt.style.removeProperty('--mx'); bt.style.removeProperty('--my'); }));
}

/** Un cercle suau que segueix el cursor i creix damunt dels enllaços i els botons. */
function halo() {
  const h = Object.assign(document.createElement('div'), { className: 'int-halo' });
  h.setAttribute('aria-hidden', 'true');
  document.body.append(h);
  let x = -100, y = -100, ax = x, ay = y, viu = false, id = 0;
  const pas = () => {
    ax += (x - ax) * 0.22; ay += (y - ay) * 0.22;
    h.style.transform = `translate(${ax}px, ${ay}px)`;
    // S'atura sol quan arriba al cursor: res no es mou si el ratolí és quiet.
    id = Math.abs(x - ax) + Math.abs(y - ay) > 0.3 ? requestAnimationFrame(pas) : 0;
  };
  escolta(document, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!viu) { ax = x; ay = y; viu = true; h.classList.add('visible'); }
    h.classList.toggle('gran', !!e.target.closest?.('a, button, summary, .int-llum'));
    if (!id) id = requestAnimationFrame(pas);
  });
  escolta(document.documentElement, 'pointerleave', () => { viu = false; h.classList.remove('visible'); });
  desfer.push(() => { cancelAnimationFrame(id); h.remove(); });
}

/** Les peces que encara no s'han vist entren en fer scroll, una darrere l'altra. El que ja és a la pantalla no s'amaga mai. */
function entrades() {
  if (!('IntersectionObserver' in window)) return;
  const sel = 'main h2, main .gran, .index li, .serveis dl > div, .compromisos li, .passos-s li, .preguntes details, .fitxa, .lletres li, .banda p, .legal section';
  const obs = new IntersectionObserver((llista) => {
    for (const e of llista) {
      if (!e.isIntersecting) continue;
      e.target.classList.remove('int-abans');
      obs.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -6% 0px' });
  const comptador = new Map();
  document.querySelectorAll(sel).forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight) return;
    const i = comptador.get(el.parentElement) ?? 0;
    comptador.set(el.parentElement, i + 1);
    el.style.setProperty('--i', Math.min(i, 8));
    el.classList.add('int-abans');
    obs.observe(el);
  });
  desfer.push(() => { obs.disconnect(); document.querySelectorAll('.int-abans').forEach((el) => el.classList.remove('int-abans')); });
}

function activa() {
  arrel.dataset.interactiu = '';
  progres();
  llum();
  if (quiet()) return;
  entrades();
  if (!ratoli()) return;
  inclinaLogo();
  iman();
  halo();
}

function desactiva() {
  delete arrel.dataset.interactiu;
  desfer.forEach((f) => f());
  desfer = [];
}

function posa(si, boto, avis) {
  desactiva();
  if (si) activa();
  boto.setAttribute('aria-pressed', String(si));
  boto.title = si ? 'Desactiva el mode interactiu' : 'Activa el mode interactiu';
  if (avis) avis.textContent = si ? 'Mode interactiu activat' : 'Mode interactiu desactivat';
}

export function iniciaInteractiu() {
  const boto = document.getElementById('interactiu');
  if (!boto) return;
  const avis = document.getElementById('avis-interactiu');
  let desat = null;
  try { desat = localStorage.getItem(CLAU); } catch {}
  posa(desat === 'si', boto, null);
  boto.addEventListener('click', () => {
    const si = boto.getAttribute('aria-pressed') !== 'true';
    try { localStorage.setItem(CLAU, si ? 'si' : 'no'); } catch {}
    posa(si, boto, avis);
  });
  // Si el visitant canvia «reduir moviment» amb la pàgina oberta, es torna a muntar.
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => {
    if (boto.getAttribute('aria-pressed') === 'true') posa(true, boto, null);
  });
}

iniciaInteractiu();
