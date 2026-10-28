// Un carrusel horitzontal que es pot arrossegar amb el ratolí i continua amb inèrcia en deixar-lo anar. Al mòbil fa
// servir el desplaçament natiu (amb el dit ja té inèrcia), i amb el teclat, les fletxes dels botons.
import { quiet } from './moviment.js';

export function carrusel(pista, { anterior, seguent } = {}) {
  let arrossega = false;
  let x = 0;
  let inici = 0;
  let velocitat = 0;
  let darrer = 0;
  let mogut = false;

  const inercia = () => {
    if (quiet() || Math.abs(velocitat) < .3) return;
    pista.scrollLeft -= velocitat;
    velocitat *= .94;
    requestAnimationFrame(inercia);
  };
  pista.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    arrossega = true;
    mogut = false;
    x = e.clientX;
    inici = pista.scrollLeft;
    darrer = e.clientX;
    velocitat = 0;
    pista.classList.add('arrossegant');
  });
  addEventListener('pointermove', (e) => {
    if (!arrossega) return;
    if (Math.abs(e.clientX - x) > 4) mogut = true;
    pista.scrollLeft = inici - (e.clientX - x);
    velocitat = e.clientX - darrer;
    darrer = e.clientX;
  });
  addEventListener('pointerup', () => {
    if (!arrossega) return;
    arrossega = false;
    pista.classList.remove('arrossegant');
    requestAnimationFrame(inercia);
  });
  // Si s'ha arrossegat, no és un clic.
  pista.addEventListener('click', (e) => { if (mogut) { e.preventDefault(); e.stopPropagation(); } }, true);

  const pas = () => pista.clientWidth * .8;
  anterior?.addEventListener('click', () => pista.scrollBy({ left: -pas(), behavior: quiet() ? 'auto' : 'smooth' }));
  seguent?.addEventListener('click', () => pista.scrollBy({ left: pas(), behavior: quiet() ? 'auto' : 'smooth' }));
  const actualitza = () => {
    if (anterior) anterior.disabled = pista.scrollLeft <= 2;
    if (seguent) seguent.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 2;
  };
  pista.addEventListener('scroll', actualitza, { passive: true });
  addEventListener('resize', actualitza);
  actualitza();
}
