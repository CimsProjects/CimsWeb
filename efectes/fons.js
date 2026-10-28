// El fons de la pàgina de l'explorador: el mapa de Catalunya, fix i amb una deriva lenta, amb els municipis que ha
// descobert una mica il·luminats. Un vel per sobre (efectes.css) deixa llegir el text. Es dibuixa una sola vegada com a
// imatge, perquè moure-la no costi res al mòbil, i es torna a dibuixar si canvia el tema.
let dades = null;

function imatge({ mapa, seus }) {
  const estil = getComputedStyle(document.documentElement);
  const color = (v) => estil.getPropertyValue(v).trim();
  const camins = Object.entries(mapa.camins);
  const resta = camins.filter(([c]) => !seus.has(c)).map(([, d]) => d).join('');
  const meus = camins.filter(([c]) => seus.has(c)).map(([, d]) => d).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${mapa.amplada} ${mapa.alcada}">`
    + `<path d="${resta}" fill="none" stroke="${color('--linia')}" stroke-width="1.6"/>`
    + (meus ? `<path d="${meus}" fill="${color('--ambre')}" fill-opacity=".28" stroke="${color('--ambre-f')}" stroke-width="1.6"/>` : '')
    + '</svg>';
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
}

function pinta() {
  const fons = document.getElementById('fons');
  if (!fons || !dades) return;
  const img = fons.querySelector('img') || fons.appendChild(Object.assign(document.createElement('img'), { alt: '' }));
  const abans = img.src;
  img.src = imatge(dades);
  if (abans) URL.revokeObjectURL(abans);
}

export function pintaFons(mapa, descoberts = []) {
  dades = { mapa, seus: new Set(descoberts) };
  pinta();
  new MutationObserver(pinta).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
}
