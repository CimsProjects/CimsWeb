// Muntanyes als costats de les pàgines de CIMS (només a les pantalles amples, ho decideix cims.css).
// Cinc carenes, de la més llunyana (clara) a la més propera (fosca), i el cim de la marca: el gris i el corall del logo.
// En baixar per la pàgina, el dibuix puja (--baixada de 0 a 1): comences al cim i acabes a la vall.
// Amb «reduir moviment», el dibuix no es mou.
const NS = 'http://www.w3.org/2000/svg';

// Nombres pseudoaleatoris amb llavor: el dibuix és sempre el mateix.
function llavor(n) {
  return () => { n = (n * 1664525 + 1013904223) % 4294967296; return n / 4294967296; };
}

// Una carena: base (y), alçada dels pics i nombre de pics. Els pics són més alts als costats, que és on es veuen.
function carena(base, alcada, pics, atzar) {
  const punts = [[0, 300]];
  const pas = 100 / pics;
  for (let i = 0; i <= pics; i++) {
    const x = i * pas;
    const costat = 0.35 + 0.65 * Math.abs(x - 50) / 50;
    const pic = base - alcada * costat * (0.55 + 0.45 * atzar());
    punts.push([x, pic]);
    if (i < pics) {
      // Coll entre dos pics, desplaçat a l'atzar
      const xc = x + pas * (0.35 + 0.3 * atzar());
      punts.push([xc, base - alcada * costat * 0.25 * atzar()]);
    }
  }
  punts.push([100, 300]);
  return 'M' + punts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L') + 'Z';
}

export function iniciaMuntanyes() {
  if (document.documentElement.dataset.marca !== 'cims' || document.querySelector('.muntanyes')) return;
  const atzar = llavor(947);
  const capes = [
    // [base, alçada, pics, color]
    [66, 24, 6, '--m-1'],
    [122, 26, 7, '--m-2'],
    [178, 26, 8, '--m-3'],
    [232, 22, 9, '--m-4'],
    [284, 14, 10, '--m-5'],
  ];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 300');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const camins = capes.map(([base, alcada, pics, color]) => `<path d="${carena(base, alcada, pics, atzar)}" fill="var(${color})"/>`);
  // El cim de la marca, a la dreta i dalt de tot, davant de la primera carena: el gris i el corall del logo, amb neu.
  // Els peus arriben fins a baix de tot; les carenes de davant els tapen.
  const cim = `<path d="M55.4 150L91 24L126.6 150Z" fill="var(--m-cim)"/><path d="M88.6 32.5L91 24L93.4 32.5L92 31L91 33L90 31Z" fill="var(--m-neu)"/>`
    + `<path d="M66.5 150L96.5 44L126.5 150Z" fill="var(--c-accent)"/>`
    + `<path d="M-28.8 150L6 34L40.8 150Z" fill="var(--m-cim)"/><path d="M3.6 42L6 34L8.4 42L7 40.6L6 42.6L5 40.6Z" fill="var(--m-neu)"/>`;
  svg.innerHTML = camins[0] + cim + camins.slice(1).join('');
  const capa = document.createElement('div');
  capa.className = 'muntanyes';
  capa.append(svg);
  document.body.prepend(capa);

  const quiet = matchMedia('(prefers-reduced-motion: reduce)');
  let pendent = false;
  const pinta = () => {
    pendent = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = quiet.matches || max <= 0 ? 0 : Math.min(1, Math.max(0, scrollY / max));
    capa.style.setProperty('--baixada', p.toFixed(4));
  };
  const demana = () => { if (!pendent) { pendent = true; requestAnimationFrame(pinta); } };
  addEventListener('scroll', demana, { passive: true });
  addEventListener('resize', demana);
  quiet.addEventListener('change', demana);
  pinta();
}
