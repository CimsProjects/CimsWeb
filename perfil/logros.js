// Els logros de l'explorador: una línia de temps, del més recent al més antic, agrupada per mesos i amb filtres.
// Surten de descobreix.logros_de (MUNICIPI, COMARCA_NOVA, MUNICIPI_COMPLET, MEDALLA).
import { llegeixMedalla } from './medalles.js';
import { quiet, revela } from '../efectes/moviment.js';

const $ = (id) => document.getElementById(id);
const PER_PAGINA = 15;
const DE_NIVELL = { bronze: 'Medalla de bronze', plata: 'Medalla de plata', or: "Medalla d'or" };
const FILTRES = [
  { id: 'tots', nom: 'Tots', tipus: null },
  { id: 'municipis', nom: 'Municipis', tipus: ['MUNICIPI'] },
  { id: 'comarques', nom: 'Comarques', tipus: ['COMARCA_NOVA'] },
  { id: 'missions', nom: 'Missions', tipus: ['MUNICIPI_COMPLET'] },
  { id: 'medalles', nom: 'Medalles', tipus: ['MEDALLA'] },
];
const MES = new Intl.DateTimeFormat('ca', { month: 'long', year: 'numeric' });
const DIA = new Intl.DateTimeFormat('ca', { day: 'numeric', month: 'short' });

/** { que, on, classe } per pintar un logro, o null si no se sap llegir (un tipus nou, per exemple). */
export function textLogro(l, ctx) {
  switch (l.tipus) {
    case 'MUNICIPI': {
      const m = ctx.municipis.get(l.referencia);
      return m ? { que: 'Municipi descobert', on: m.nom, detall: ctx.comarques.get(m.comarca), classe: 'municipi' } : null;
    }
    case 'COMARCA_NOVA': {
      const c = ctx.comarques.get(l.referencia);
      return c ? { que: 'Comarca nova', on: c, classe: 'comarca' } : null;
    }
    case 'MUNICIPI_COMPLET': {
      const m = ctx.municipis.get(l.referencia);
      return m ? { que: 'Totes les missions', on: m.nom, detall: ctx.comarques.get(m.comarca), classe: 'complet' } : null;
    }
    case 'MEDALLA': {
      const m = llegeixMedalla(l.referencia, ctx.comarques);
      if (!m) return null;
      return m.tipus === 'comarca'
        ? { que: DE_NIVELL[m.nivell], on: m.nom, classe: `medalla ${m.nivell}` }
        : { que: 'Medalla', on: m.nom, classe: 'medalla or' };
    }
    default:
      return null;
  }
}

function element(l, t) {
  const li = document.createElement('li');
  li.className = `logro brilla ${t.classe}`;
  const data = document.createElement('time');
  const quan = new Date(l.creat_el);
  data.dateTime = quan.toISOString();
  data.textContent = DIA.format(quan);
  const cos = document.createElement('div');
  const que = document.createElement('span');
  que.className = 'que';
  que.textContent = t.que;
  const on = document.createElement('b');
  on.textContent = t.on;
  cos.append(que, on);
  if (t.detall) {
    const detall = document.createElement('span');
    detall.className = 'detall';
    detall.textContent = t.detall;
    cos.append(detall);
  }
  li.append(data, cos);
  return li;
}

// Una cinta amb els darrers logros que passa sense parar (decorativa: la llista de sota diu el mateix). Es duplica el
// contingut perquè el bucle no tingui salt, i s'atura en passar-hi el ratolí.
function pintaMarquee(tots) {
  const cinta = document.querySelector('#marquee .cinta');
  const darrers = tots.slice(0, 10);
  if (darrers.length < 3) return;
  const tram = () => darrers.map((x) => {
    const span = document.createElement('span');
    span.className = x.t.classe;
    span.textContent = `${x.t.que} · ${x.t.on}`;
    return span;
  });
  cinta.replaceChildren(...tram(), ...tram());
  cinta.style.setProperty('--durada', `${darrers.length * 4}s`);
  $('marquee').classList.add('actiu');
}

export function pintaLogros(logros, ctx) {
  const tots = logros.map((l) => ({ l, t: textLogro(l, ctx) })).filter((x) => x.t);
  const llista = $('llista-logros');
  const mes = $('mes-logros');
  let filtre = FILTRES[0];
  let quants = PER_PAGINA;

  function pinta(animat = false) {
    if (animat && !quiet()) {
      // Filtre animat: la llista marxa, es torna a pintar i torna a entrar amb esglaons.
      llista.classList.add('canvia');
      setTimeout(() => { llista.classList.remove('canvia'); pinta(); revela(llista.querySelectorAll('.logro'), { esglaons: true }); }, 180);
      return;
    }
    const fets = tots.filter((x) => !filtre.tipus || filtre.tipus.includes(x.l.tipus));
    llista.replaceChildren();
    let mesActual = null;
    let grup = null;
    for (const x of fets.slice(0, quants)) {
      const nomMes = MES.format(new Date(x.l.creat_el));
      if (nomMes !== mesActual) {
        mesActual = nomMes;
        const titol = document.createElement('h3');
        titol.className = 'mes';
        titol.textContent = nomMes;
        grup = document.createElement('ol');
        grup.className = 'logros';
        llista.append(titol, grup);
      }
      grup.appendChild(element(x.l, x.t));
    }
    if (fets.length === 0) {
      const p = document.createElement('p');
      p.className = 'buida';
      p.textContent = tots.length === 0 ? "Encara no té cap fita." : 'No n\'hi ha cap d\'aquest tipus.';
      llista.appendChild(p);
    }
    mes.hidden = fets.length <= quants;
  }

  const filtres = $('filtres-logros');
  for (const f of FILTRES) {
    const n = tots.filter((x) => !f.tipus || f.tipus.includes(x.l.tipus)).length;
    if (f.tipus && n === 0) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'xip';
    b.textContent = `${f.nom} ${n}`;
    b.setAttribute('aria-pressed', String(f === filtre));
    b.addEventListener('click', () => {
      filtre = f;
      quants = PER_PAGINA;
      for (const altre of filtres.children) altre.setAttribute('aria-pressed', String(altre === b));
      pinta(true);
    });
    filtres.appendChild(b);
  }
  mes.addEventListener('click', () => {
    const abans = llista.querySelectorAll('.logro').length;
    quants += PER_PAGINA;
    pinta();
    revela([...llista.querySelectorAll('.logro')].slice(abans), { esglaons: true });
  });
  pinta();
  pintaMarquee(tots);
  $('logros').hidden = false;
  revela(llista.querySelectorAll('.logro'), { esglaons: true });
}
