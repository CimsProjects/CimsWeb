// El cercador d'exploradors: troba els noms d'usuari que comencen pel text i porta al seu perfil. Valida mentre
// s'escriu (només lletres, xifres i _, com els noms d'usuari, i com a mínim 3), mostra quan està buscant i quants n'ha
// trobat.
import { cercaExploradors } from './servidor.js';
import { MISSATGES } from './missatges.js';
import { revela } from '../efectes/moviment.js';

const $ = (id) => document.getElementById(id);
const ESPERA_MS = 300;
const VALID = /^[a-z0-9_]*$/;

export function iniciaCerca() {
  const form = $('cerca');
  const camp = $('cerca-text');
  const llista = $('cerca-resultats');
  const estat = $('cerca-estat');
  let temporitzador = null;
  let darrera = 0;

  const mostra = (text, tipus = '') => {
    estat.textContent = text;
    estat.className = `missatge ${tipus}`;
    camp.setAttribute('aria-invalid', String(tipus === 'error'));
  };
  const cercant = (si) => {
    form.classList.toggle('cercant', si);
    camp.setAttribute('aria-busy', String(si));
  };

  async function busca() {
    const text = camp.value.trim().toLowerCase();
    const aquesta = ++darrera;
    llista.replaceChildren();
    cercant(false);
    if (!VALID.test(text)) return mostra(MISSATGES.cercaCaracters, 'error');
    if (text.length < 3) return mostra(text ? MISSATGES.cercaCurta : '');
    mostra('');
    cercant(true);
    let trobats;
    try {
      trobats = await cercaExploradors(text);
    } catch (e) {
      if (aquesta === darrera) { cercant(false); mostra(e.message, 'error'); }
      return;
    }
    if (aquesta !== darrera) return;
    cercant(false);
    if (trobats.length === 0) return mostra(MISSATGES.cercaBuida);
    mostra(trobats.length === 1 ? 'Un explorador trobat.' : `${trobats.length} exploradors trobats.`, 'be');
    for (const t of trobats) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `perfil.html?u=${encodeURIComponent(t.nom)}`;
      a.className = 'brilla';
      const nom = document.createElement('b');
      nom.textContent = t.nom;
      const tipus = document.createElement('span');
      tipus.textContent = t.public ? 'Compte públic' : 'Compte privat';
      a.append(nom, tipus);
      li.appendChild(a);
      llista.appendChild(li);
    }
    revela(llista.children, { esglaons: true });
  }

  camp.addEventListener('input', () => {
    clearTimeout(temporitzador);
    temporitzador = setTimeout(busca, ESPERA_MS);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(temporitzador);
    const primer = llista.querySelector('a');
    if (primer) location.href = primer.href;
    else busca();
  });
}
