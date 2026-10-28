// La navegació: el menú a pantalla completa del mòbil i el botó per tornar amunt.
const $ = (id) => document.getElementById(id);

function iniciaMenu() {
  const boto = $('obre-menu');
  const menu = $('menu');
  if (!boto || !menu) return;
  menu.querySelectorAll('a').forEach((a, i) => a.style.setProperty('--i', i + 1));
  const posa = (obert) => {
    document.body.classList.toggle('menu-obert', obert);
    document.body.classList.toggle('overlay-actiu', obert);
    boto.setAttribute('aria-expanded', String(obert));
    boto.setAttribute('aria-label', obert ? 'Tanca el menú' : 'Obre el menú');
  };
  boto.addEventListener('click', () => posa(!document.body.classList.contains('menu-obert')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) posa(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-obert')) { posa(false); boto.focus(); } });
  matchMedia('(min-width: 641px)').addEventListener('change', (m) => { if (m.matches) posa(false); });
}

function iniciaAmunt() {
  const boto = $('amunt');
  if (!boto) return;
  let visible = false;
  const mira = () => {
    const ara = scrollY > innerHeight * .8;
    if (ara !== visible) { visible = ara; boto.classList.toggle('visible', ara); }
  };
  addEventListener('scroll', mira, { passive: true });
  boto.addEventListener('click', () => { scrollTo({ top: 0 }); document.querySelector('.marca')?.focus({ preventScroll: true }); });
  mira();
}

export function iniciaNavegacio() {
  iniciaMenu();
  iniciaAmunt();
}
