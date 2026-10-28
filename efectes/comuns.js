// Els efectes de totes les pàgines de la web.
import { iniciaTema } from './tema.js';
import { iniciaNavegacio } from './navegacio.js';
import { iniciaCursor, iniciaParallax, revela } from './moviment.js';

iniciaTema();
iniciaNavegacio();
iniciaParallax();
iniciaCursor();
revela(document.querySelectorAll('main > h2, main > p, .targeta, main > .xifres > .xifra, ol.passos li'), { esglaons: true });
