// La pàgina del rànquing: les posicions per punts o per municipis de qui comparteix la seva posició a l'enllaç. Les
// posicions es calculen al servidor amb tothom, com a l'app; aquí només es pinten.
import { ranquingPublic } from './servidor.js';
import { MISSATGES } from './missatges.js';
import { revela } from '../efectes/moviment.js';

const $ = (id) => document.getElementById(id);
const nombre = new Intl.NumberFormat('ca');
const MEDALLA = { 1: 'or', 2: 'plata', 3: 'bronze' };

function fila(f, criteri) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = `perfil.html?u=${encodeURIComponent(f.nom)}`;
  a.className = 'brilla';
  const pos = document.createElement('b');
  pos.className = `posicio ${MEDALLA[f.posicio] || ''}`.trim();
  pos.textContent = f.posicio;
  const nom = document.createElement('span');
  nom.className = 'nom';
  nom.textContent = f.nom;
  const valor = document.createElement('span');
  valor.className = 'valor';
  const xifra = criteri === 'PUNTS' ? f.punts : f.municipis;
  // Qui no comparteix les xifres surt a la seva posició, però sense el número.
  if (xifra != null) valor.textContent = `${nombre.format(xifra)} ${criteri === 'PUNTS' ? 'punts' : xifra === 1 ? 'municipi' : 'municipis'}`;
  a.append(pos, nom, valor);
  li.append(a);
  return li;
}

async function carrega(criteri) {
  const llista = $('ranquing');
  const estat = $('ranquing-estat');
  llista.setAttribute('aria-busy', 'true');
  estat.className = 'missatge';
  estat.textContent = '';
  try {
    const r = await ranquingPublic(criteri);
    llista.replaceChildren(...r.files.map((f) => fila(f, criteri)));
    if (!r.files.length) estat.textContent = MISSATGES.ranquingBuit;
    else estat.textContent = `${r.participants} exploradors en total. Toca un nom per veure'n el perfil.`;
    revela(llista.querySelectorAll('li'), { esglaons: true });
  } catch (e) {
    llista.replaceChildren();
    estat.className = 'missatge error';
    estat.textContent = e.clau ? e.message : MISSATGES.ranquingFalla;
  } finally {
    llista.removeAttribute('aria-busy');
  }
}

const botons = document.querySelectorAll('[data-criteri]');
botons.forEach((b) => b.addEventListener('click', () => {
  botons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  carrega(b.dataset.criteri);
}));
carrega('PUNTS');
