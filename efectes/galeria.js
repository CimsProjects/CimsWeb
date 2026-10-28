// Visor (lightbox) de la col·lecció: s'obre en tocar un objecte, es passa d'un a l'altre amb les fletxes del teclat o
// lliscant, i es tanca amb Esc. Torna el focus on era.
let visor = null;

function creaVisor() {
  const d = document.createElement('dialog');
  d.className = 'visor';
  d.setAttribute('aria-label', 'Objecte de la col·lecció');
  d.innerHTML = `
    <button class="icona tanca" type="button" aria-label="Tanca"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    <figure><div class="peca"></div><figcaption><b></b><span class="insignia"></span><span class="posicio"></span></figcaption></figure>
    <button class="icona anterior" type="button" aria-label="Anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <button class="icona seguent" type="button" aria-label="Següent"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
  document.body.appendChild(d);
  return d;
}

/** `items`: [{ nom, raresa, textRaresa, dibuix?, color? }]. Obre el visor a la posició `i`. */
export function obreVisor(items, i, origen) {
  visor ??= creaVisor();
  let actual = i;
  const peca = visor.querySelector('.peca');
  const mostra = (n) => {
    actual = (n + items.length) % items.length;
    const o = items[actual];
    peca.replaceChildren();
    peca.className = `peca ${o.raresa}`;
    if (o.dibuix) peca.appendChild(Object.assign(document.createElement('img'), { src: o.dibuix, alt: '' }));
    else peca.appendChild(Object.assign(document.createElement('span'), { className: 'mostra' })).style.background = o.color || 'var(--sup2)';
    visor.querySelector('figcaption b').textContent = o.nom;
    const ins = visor.querySelector('.insignia');
    ins.textContent = o.textRaresa;
    ins.className = `insignia ${o.raresa}`;
    visor.querySelector('.posicio').textContent = `${actual + 1} de ${items.length}`;
  };
  const tecla = (e) => {
    if (e.key === 'ArrowRight') mostra(actual + 1);
    if (e.key === 'ArrowLeft') mostra(actual - 1);
  };
  let x0 = null;
  const toca = (e) => { x0 = e.clientX; };
  const deixa = (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) mostra(actual + (e.clientX < x0 ? 1 : -1)); x0 = null; };
  visor.querySelector('.anterior').onclick = () => mostra(actual - 1);
  visor.querySelector('.seguent').onclick = () => mostra(actual + 1);
  visor.querySelector('.tanca').onclick = () => visor.close();
  visor.onclick = (e) => { if (e.target === visor) visor.close(); };
  visor.addEventListener('keydown', tecla);
  peca.addEventListener('pointerdown', toca);
  peca.addEventListener('pointerup', deixa);
  visor.onclose = () => {
    visor.removeEventListener('keydown', tecla);
    peca.removeEventListener('pointerdown', toca);
    peca.removeEventListener('pointerup', deixa);
    document.body.classList.remove('overlay-actiu');
    origen?.focus();
  };
  mostra(i);
  document.body.classList.add('overlay-actiu');
  visor.showModal();
}
