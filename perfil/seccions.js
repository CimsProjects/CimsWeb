// Les seccions del perfil: les xifres, la vitrina de medalles, les comarques, el passaport i la col·lecció dels sacs.
import { NIVELLS, vitrina } from './medalles.js';
import { compta, revela } from '../efectes/moviment.js';
import { carrusel } from '../efectes/carrusel.js';
import { obreVisor } from '../efectes/galeria.js';

const $ = (id) => document.getElementById(id);
const nombre = (n) => n.toLocaleString('ca');

function crea(etiqueta, classe, text) {
  const e = document.createElement(etiqueta);
  if (classe) e.className = classe;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Una xifra que compta fins al valor quan es veu. `format` dona el text (per exemple, amb # al davant). */
function xifra(contenidor, valor, text, format = nombre) {
  const div = crea('div', 'xifra brilla');
  const b = crea('b');
  div.append(b, document.createTextNode(text));
  contenidor.appendChild(div);
  contenidor.hidden = false;
  compta(b, valor, format);
  revela([div], { esglaons: true });
  div.style.setProperty('--i', contenidor.children.length - 1);
}

/** Com Nivells.kt del mòdul joc: per passar del nivell n al n+1 calen puntsPrimerNivell + increment × (n − 1) punts. */
export function nivell(punts, config) {
  const llindar = (n) => config.puntsPrimerNivell * (n - 1) + (config.increment * (n - 1) * (n - 2)) / 2;
  let n = 1;
  while (llindar(n + 1) <= punts) n++;
  return { numero: n, progres: (punts - llindar(n)) / (llindar(n + 1) - llindar(n)) };
}

export function pintaXifres(perfil, joc) {
  const lloc = $('xifres');
  if (perfil.punts != null) {
    // El nivell i les missions només hi són quan el servidor té la migració 20261027130000.
    if (perfil.punts_nivell != null) xifra(lloc, nivell(perfil.punts_nivell, joc.nivells).numero, 'nivell');
    xifra(lloc, perfil.punts, 'punts al rànquing');
    xifra(lloc, perfil.municipis, perfil.municipis === 1 ? 'municipi descobert de 947' : 'municipis descoberts de 947');
    if (perfil.missions != null) xifra(lloc, perfil.missions, perfil.missions === 1 ? 'missió feta' : 'missions fetes');
  }
  // Null si ha triat no mostrar-la o si no surt al rànquing (els desenvolupadors).
  if (perfil.ranquing) {
    const r = perfil.ranquing;
    xifra(lloc, r.punts, `al rànquing per punts, de ${nombre(r.participants)} (#${nombre(r.municipis)} per municipis)`, (n) => `#${nombre(n)}`);
  }
}

export function pintaMedalles(ids, comarques) {
  const llista = $('llista-medalles');
  const totes = vitrina(ids, comarques);
  if (totes.length === 0) llista.appendChild(crea('li', 'buida', "Encara no n'ha guanyat cap."));
  for (const m of totes) {
    const li = crea('li', `medalla brilla ${m.nivell}`);
    li.append(crea('b', null, m.nom), crea('span', null, m.tipus === 'comarca' ? NIVELLS[m.nivell] : 'Fita'));
    llista.appendChild(li);
  }
  $('medalles').hidden = false;
  carrusel(llista, { anterior: $('medalles-anterior'), seguent: $('medalles-seguent') });
}

export function pintaComarques(descoberts, missions, dades) {
  const fets = new Set(descoberts);
  const files = dades.comarques.map((c) => {
    const tots = dades.municipis.filter((m) => m.comarca === c.codi);
    const seus = tots.filter((m) => fets.has(m.codi)).sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));
    return { nom: c.nom, total: tots.length, seus };
  }).filter((c) => c.seus.length > 0)
    .sort((a, b) => b.seus.length / b.total - a.seus.length / a.total || a.nom.localeCompare(b.nom, 'ca'));

  $('comarques-resum').textContent = files.length === 0
    ? "Encara no n'ha descobert cap."
    : `${nombre(fets.size)} municipis de ${files.length} ${files.length === 1 ? 'comarca' : 'comarques'}.`;
  for (const c of files) {
    const det = crea('details', 'brilla');
    const resum = crea('summary');
    const barra = crea('span', 'barra-progres');
    barra.style.setProperty('--fi', `${(100 * c.seus.length) / c.total}%`);
    resum.append(crea('span', null, c.nom), crea('span', 'compte', `${c.seus.length}/${c.total}`), barra);
    const noms = crea('ul', 'municipis');
    for (const m of c.seus) {
      const [f, t] = missions[m.codi] || [0, 0];
      const li = crea('li', null, m.nom);
      if (f) li.appendChild(crea('span', 'compte', ` · ${f}/${t} missions`));
      noms.appendChild(li);
    }
    det.append(resum, noms);
    $('llista-comarques').appendChild(det);
  }
  $('comarques').hidden = false;
  revela($('llista-comarques').children, { esglaons: true });
}

export function pintaPassaport(passaport, municipis) {
  const lloc = $('xifres-passaport');
  xifra(lloc, passaport.segells, passaport.segells === 1 ? 'segell' : 'segells');
  xifra(lloc, passaport.cartells.length, 'cartells al catàleg, de 947');
  const noms = passaport.cartells.map((c) => municipis.get(c)?.nom).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ca'));
  $('cartells').textContent = noms.length ? `Cartells: ${noms.join(', ')}.` : 'Encara no ha fotografiat cap cartell.';
  $('passaport').hidden = false;
}

const GRUPS = [
  { tipus: 'emoji', nom: 'Emojis' },
  { tipus: 'portada', nom: 'Tapes del passaport' },
  { tipus: 'animacio', nom: 'Animacions' },
  { tipus: 'color', nom: 'Colors' },
];
const RARESES = { inicial: 'De sempre', comuna: 'Comuna', rara: 'Rara', llegendaria: 'Llegendària' };

export function pintaColleccio(colleccio, objectes) {
  const seus = new Set(colleccio.objectes);
  $('colleccio-resum').textContent =
    `Ha guanyat ${nombre(colleccio.sacs)} ${colleccio.sacs === 1 ? 'sac' : 'sacs'} i en té ${nombre(seus.size)} de ${nombre(objectes.length)} coses.`;
  for (const g of GRUPS) {
    const tots = objectes.filter((o) => o.tipus === g.tipus);
    const tinc = tots.filter((o) => seus.has(o.clau));
    if (tinc.length === 0) continue;
    const grup = crea('div', 'grup');
    grup.appendChild(crea('h3', null, `${g.nom} · ${tinc.length}/${tots.length}`));
    const llista = crea('ul', `objectes tipus-${g.tipus}`);
    const visor = tinc.map((o) => ({ ...o, dibuix: o.dibuix && `dades/${o.dibuix}`, textRaresa: RARESES[o.raresa] }));
    tinc.forEach((o, i) => {
      const li = crea('li');
      const boto = crea('button', `objecte argila brilla zoom ${o.raresa}`);
      boto.type = 'button';
      boto.setAttribute('aria-label', `${o.nom}, ${RARESES[o.raresa].toLowerCase()}. Obre-ho en gran`);
      if (o.dibuix) {
        const img = crea('img');
        img.src = `dades/${o.dibuix}`;
        img.alt = '';
        img.loading = 'lazy';
        boto.appendChild(img);
      } else if (o.color) {
        const mostra = crea('span', 'mostra');
        mostra.style.background = o.color;
        boto.appendChild(mostra);
      }
      boto.append(crea('b', null, o.nom), crea('span', `insignia ${o.raresa}`, RARESES[o.raresa]));
      boto.addEventListener('click', () => obreVisor(visor, i, boto));
      li.appendChild(boto);
      llista.appendChild(li);
    });
    grup.appendChild(llista);
    $('llista-colleccio').appendChild(grup);
    revela(llista.children, { esglaons: true });
  }
  $('colleccio').hidden = false;
}
