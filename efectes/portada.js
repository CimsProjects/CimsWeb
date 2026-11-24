// La portada: els estels del cel de nit i els animals amagats. La marmota (i, de nit, el mussol) diuen una frase
// graciosa quan els cliques (o prems Enter o espai). Les frases van en ordre i no se'n repeteix cap fins que surten totes.
const FRASES = {
  dia: [
    'Xiuuut! Fa sis mesos que dormo. M\'he perdut gaire cosa de la IA?',
    'Aquí dalt la cobertura és fatal, però les vistes van de conya.',
    'El Martí i el Pol són més avall. Jo no baixo, que fa calor.',
    'Aquest sol té forma de logo. Jo no hi veig res d\'estrany.',
    'No em feu fotos, que no estic pentinada.',
    'Pas a pas, diuen. Jo ho faig de sis mesos en sis mesos.',
    'Si busqueu el cim, és aquí al costat. Si busqueu nous, també.',
  ],
  nit: [
    'Ei, que són hores de dormir! Torna demà, que farem cim.',
    'Estic comptant estrelles per adormir-me. Ja en porto 947.',
    'La lluna té forma de C. Casualitat? No ho crec.',
    'Si veus un estel fugaç, demana una web. Ah, no, que per això ja hi ha el Martí i el Pol.',
    'Zzz… La IA també somia? Jo somio amb la primavera.',
  ],
  mussol: [
    'Uuu-uuu! Jo vigilo de nit; la marmota fa el torn de dia.',
    'Sí, sóc un mussol. No, no sé res de SEO.',
    'Hi veig a les fosques, però el codi sense comentaris no el llegeix ningú.',
    'No t\'espantis, només són dos ulls. Bé, i un mussol al darrere.',
  ],
};

/** Un generador de nombres pseudoaleatoris amb llavor, perquè els estels surtin sempre al mateix lloc. */
function atzar(llavor) {
  return () => { llavor = (llavor * 16807) % 2147483647; return llavor / 2147483647; };
}

function estels(caixa) {
  const r = atzar(947);
  const parts = [];
  for (let i = 0; i < 90; i++) {
    const m = r() < .12 ? 3 : r() < .5 ? 2 : 1.4;
    parts.push(`<i style="--x:${(r() * 100).toFixed(2)}%;--y:${(r() * 62).toFixed(2)}%;--m:${m}px;--o:${(.35 + r() * .6).toFixed(2)};--t:${(3 + r() * 4).toFixed(1)}s;--d:${(-r() * 6).toFixed(1)}s"></i>`);
  }
  caixa.innerHTML = parts.join('');
}

export function iniciaPortada() {
  const portada = document.querySelector('.portada-nit');
  if (!portada) return;
  const caixaEstels = portada.querySelector('.pn-estels');
  if (caixaEstels) estels(caixaEstels);

  const diu = portada.querySelector('#pn-diu');
  if (!diu) return;
  const index = { dia: 0, nit: 0, mussol: 0 };
  let tancar = null, actiu = null;
  const amaga = () => { diu.classList.remove('visible'); actiu?.classList.remove('parla'); actiu = null; };

  const parla = (animal) => {
    const nit = document.documentElement.dataset.tema === 'fosc';
    const llista = animal.classList.contains('pn-mussol') ? 'mussol' : nit ? 'nit' : 'dia';
    diu.textContent = FRASES[llista][index[llista]];
    index[llista] = (index[llista] + 1) % FRASES[llista].length;
    if (actiu && actiu !== animal) actiu.classList.remove('parla');
    actiu = animal;
    animal.classList.add('parla');
    // La bafarada surt just a sobre de l'animal, sense sortir de la pantalla.
    const r = animal.getBoundingClientRect(), c = portada.getBoundingClientRect();
    const centre = r.left + r.width / 2 - c.left;
    const marge = Math.min(150, c.width / 2 - 16);
    const x = Math.min(Math.max(centre, marge + 16), c.width - marge - 16);
    diu.style.left = `${x}px`;
    diu.style.top = `${r.top - c.top - 14}px`;
    diu.style.setProperty('--punta', `calc(50% + ${centre - x}px)`);
    diu.classList.add('visible');
    clearTimeout(tancar);
    tancar = setTimeout(amaga, 5000);
  };

  for (const animal of portada.querySelectorAll('.pn-animal')) animal.addEventListener('click', () => parla(animal));
  // Si canvia el tema, la bafarada d'abans ja no toca.
  new MutationObserver(() => { clearTimeout(tancar); amaga(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
}

const LLETRES = 'abcdefghijlmnopqrstuvxyz';
const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Canvia el text de `el` a `despres` remenant les lletres: es fixen d'una en una, d'esquerra a dreta. */
function remena(el, despres, acaba) {
  // Sempre hi ha tantes lletres com la paraula nova: les ja fixades i, a la dreta, lletres a l'atzar.
  const majuscules = despres === despres.toUpperCase();
  const aleatoria = () => { const l = LLETRES[Math.floor(Math.random() * LLETRES.length)]; return majuscules ? l.toUpperCase() : l; };
  let pas = 0;
  const total = despres.length * 2 + 2; // cada lletra es remena un parell de cops abans de fixar-se
  const tic = () => {
    const fixades = Math.max(0, Math.floor((pas - 2) / 2));
    let html = despres.slice(0, fixades);
    for (let i = fixades; i < despres.length; i++) html += `<span class="remena">${aleatoria()}</span>`;
    el.innerHTML = html;
    if (++pas <= total) setTimeout(tic, 26);
    else { el.textContent = despres; acaba?.(); }
  };
  tic();
}

/** «Fem CIMS» → «Fem Consultoria» → … → «Fem CIMS», i torna a començar. S'atura si la portada no es veu. */
export function iniciaTitol() {
  const el = document.querySelector('.pn-paraula');
  if (!el || quiet()) return;
  const paraules = el.dataset.paraules.split(' ');
  let i = 0, visible = true, espera = null, corrent = false;
  const seguent = () => {
    clearTimeout(espera);
    if (corrent || !visible || document.hidden) return;
    corrent = true;
    const abans = paraules[i];
    i = (i + 1) % paraules.length;
    if (paraules[i] === abans) i = (i + 1) % paraules.length; // «CIMS» final i «CIMS» inicial són el mateix
    remena(el, paraules[i], () => { corrent = false; espera = setTimeout(seguent, paraules[i] === 'CIMS' ? 2800 : 1100); });
  };
  new IntersectionObserver(([e]) => {
    const ara = e.isIntersecting;
    if (ara && !visible) { visible = true; espera = setTimeout(seguent, 1200); }
    visible = ara;
  }).observe(el);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) { clearTimeout(espera); espera = setTimeout(seguent, 1200); } });
  espera = setTimeout(seguent, 1800);
}
