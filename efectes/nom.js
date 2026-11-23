// «El nom» de la portada: la frase del costat canvia segons la paraula de CIMS que tinguis a sobre
// (ratolí), amb el focus (teclat) o tocada (mòbil). En sortir de la llista torna la frase de sempre.
// Les frases són als atributs data-frase de l'HTML.
export function iniciaNom() {
  const llista = document.querySelector('.lletres');
  const frase = document.getElementById('frase-nom');
  if (!llista || !frase) return;
  const original = frase.textContent;
  const botons = [...llista.querySelectorAll('button[data-frase]')];
  const posa = (boto) => {
    const text = boto ? boto.dataset.frase : original;
    for (const b of botons) b.setAttribute('aria-pressed', String(b === boto));
    llista.classList.toggle('amb-actiu', !!boto);
    if (frase.textContent === text) return;
    frase.classList.remove('canvi');
    void frase.offsetWidth; // reinicia l'animació
    frase.textContent = text;
    frase.classList.add('canvi');
  };
  for (const b of botons) {
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') posa(b); });
    b.addEventListener('focus', () => posa(b));
    b.addEventListener('click', () => posa(b));
  }
  llista.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !llista.contains(document.activeElement)) posa(null); });
  llista.addEventListener('focusout', (e) => { if (!llista.contains(e.relatedTarget)) posa(null); });
}
