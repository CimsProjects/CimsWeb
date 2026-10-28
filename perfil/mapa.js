// El mapa de l'explorador, com el de l'app: els municipis que no ha descobert, a la boira; els descoberts, en gris, i
// s'omplen a mesura que hi fa missions (els graus de configuracio_joc.json, bloc mapa.graus).
const NS = 'http://www.w3.org/2000/svg';

/** De 0 (cap missió) a graus.length (totes), segons el percentatge de missions fetes. */
export function grau(fetes, total, graus) {
  if (!total || !fetes) return 0;
  const percent = (100 * fetes) / total;
  return graus.filter((g) => percent >= g).length;
}

function cami(d, classe) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('class', classe);
  return p;
}

export function pintaMapa(contenidor, mapa, descoberts, missions, municipis, graus) {
  const fets = new Set(descoberts);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${mapa.amplada} ${mapa.alcada}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Mapa de Catalunya amb ${fets.size} municipis descoberts de 947`);

  // La boira, en un sol camí: són la majoria i no s'hi pot fer res.
  const boira = Object.entries(mapa.camins).filter(([codi]) => !fets.has(codi)).map(([, d]) => d).join('');
  if (boira) svg.appendChild(cami(boira, 'boira'));
  for (const codi of fets) {
    const d = mapa.camins[codi];
    if (!d) continue;
    const [f, t] = missions[codi] || [0, 0];
    const p = cami(d, `descobert g${grau(f, t, graus)}`);
    const titol = document.createElementNS(NS, 'title');
    const nom = municipis.get(codi)?.nom || codi;
    titol.textContent = t ? `${nom}: ${f} de ${t} missions` : nom;
    p.appendChild(titol);
    svg.appendChild(p);
  }
  contenidor.replaceChildren(svg);
}
