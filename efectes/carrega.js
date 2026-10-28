// La pantalla de càrrega de la pàgina de l'explorador: el logo es dibuixa (stroke-dashoffset), les seves tres capes
// s'apilen en profunditat i la pàgina passa de desenfocada a nítida. Només la primera vegada de cada sessió, es pot
// saltar, i amb «reduir moviment» no surt (ho decideix l'script del <head>, que posa html.amb-carrega).
const DURADA_MS = 2300;

export function iniciaCarrega() {
  const arrel = document.documentElement;
  const capa = document.getElementById('carrega');
  if (!capa || !arrel.classList.contains('amb-carrega')) return;
  try { sessionStorage.setItem('bocins-carrega', '1'); } catch { /* Sense sessionStorage, sortirà cada vegada. */ }
  document.body.classList.add('overlay-actiu');
  const salta = capa.querySelector('.salta');
  let fet = false;
  const acaba = () => {
    if (fet) return;
    fet = true;
    capa.classList.add('surt');
    arrel.classList.remove('amb-carrega');
    document.body.classList.remove('overlay-actiu');
    setTimeout(() => capa.remove(), 700);
    removeEventListener('keydown', escapa);
  };
  const escapa = (e) => { if (e.key === 'Escape') acaba(); };
  salta.addEventListener('click', acaba);
  addEventListener('keydown', escapa);
  setTimeout(acaba, DURADA_MS);
}
