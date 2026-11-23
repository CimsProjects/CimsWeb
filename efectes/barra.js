// La barra de dalt és de vidre: quan hi passa per sota un bloc fosc (la banda d'«El nom»), el text es torna clar.
export function iniciaBarra() {
  const barra = document.querySelector('html[data-marca="cims"] body > .barra');
  if (!barra) return;
  let pendent = false;
  const mira = () => {
    pendent = false;
    const r = barra.getBoundingClientRect();
    const y = r.top + r.height / 2;
    const sota = document.elementsFromPoint(innerWidth / 2, y).find((el) => !barra.contains(el));
    const banda = sota?.closest('.banda');
    let fosc = false;
    if (banda) {
      // La banda es fon amb el paper a dalt i a baix (--fosa): només és fosca de debò al mig.
      const b = banda.getBoundingClientRect();
      const fosa = parseFloat(getComputedStyle(banda).getPropertyValue('--fosa')) || 0;
      fosc = y > b.top + fosa * .5 && y < b.bottom - fosa * .5;
    }
    barra.classList.toggle('sobre-fosc', fosc);
  };
  const demana = () => { if (!pendent) { pendent = true; requestAnimationFrame(mira); } };
  addEventListener('scroll', demana, { passive: true });
  addEventListener('resize', demana);
  mira();
}
