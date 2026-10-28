// La pàgina de l'explorador (perfil.html?u=<nom_usuari>): el cercador i el perfil compartit. Només mostra el que torna
// descobreix.perfil_compartit: el nom i el que l'usuari ha triat (d'un compte públic que no ho ha triat, tot).
import { dades, fotoPerfil, perfilCompartit } from './servidor.js';
import { MISSATGES } from './missatges.js';
import { iniciaCerca } from './cerca.js';
import { pintaLogros } from './logros.js';
import { pintaMapa } from './mapa.js';
import { pintaColleccio, pintaComarques, pintaMedalles, pintaPassaport, pintaXifres } from './seccions.js';
import { iniciaCarrega } from '../efectes/carrega.js';
import { pintaFons } from '../efectes/fons.js';

const $ = (id) => document.getElementById(id);

function estat(text, error = false) {
  $('estat').textContent = text;
  $('estat').className = error ? 'missatge error' : 'missatge';
}

async function pintaFoto(ruta, nom) {
  const avatar = $('avatar');
  avatar.textContent = nom.slice(0, 1).toUpperCase();
  if (!ruta) return;
  try {
    const img = document.createElement('img');
    img.src = await fotoPerfil(ruta);
    img.alt = '';
    avatar.replaceChildren(img);
  } catch {
    // Sense foto, es queda la inicial.
  }
}

// Sense nom a l'enllaç, la pàgina és només el cercador.
function senseNom() {
  document.body.classList.add('nomes-cerca');
  $('nom').textContent = 'Busca un explorador';
  estat('Escriu el seu nom d\'usuari per veure com va recorrent Catalunya.');
  $('cerca-text').focus();
}

async function pintaPerfil(perfil) {
  document.title = `${perfil.nom} · Bocins de Catalunya`;
  $('nom').textContent = perfil.nom;
  // Fins que no s'apliqui la migració 20261027130000, el servidor no diu si el compte és públic.
  if (typeof perfil.public === 'boolean') {
    $('tipus-compte').textContent = perfil.public ? 'Compte públic' : 'Compte privat';
    $('tipus-compte').hidden = false;
  }
  estat('');
  pintaFoto(perfil.foto, perfil.nom);
  if (perfil.mostra.length === 0) return estat(MISSATGES.nomesNom);
  if (perfil.public === false) estat(MISSATGES.privatParcial);

  const necessita = ['descoberts', 'medalles', 'logros', 'passaport', 'colleccio', 'punts'].some((c) => perfil[c] != null);
  if (!necessita) return pintaXifres(perfil, null);
  let municipisJson;
  let joc;
  try {
    [municipisJson, joc] = await Promise.all([dades('municipis.json'), dades('joc.json')]);
  } catch (e) {
    return estat(e.message, true);
  }
  const comarques = new Map(municipisJson.comarques.map((c) => [c.codi, c.nom]));
  const municipis = new Map(municipisJson.municipis.map((m) => [m.codi, m]));

  pintaXifres(perfil, joc);
  if (perfil.logros != null) pintaLogros(perfil.logros, { comarques, municipis });
  if (perfil.descoberts != null) {
    pintaComarques(perfil.descoberts, perfil.missions_municipi || {}, municipisJson);
    $('mapa').hidden = false;
    dades('mapa.json')
      .then((m) => pintaMapa($('mapa-svg'), m, perfil.descoberts, perfil.missions_municipi || {}, municipis, joc.graus))
      .catch((e) => { $('mapa-svg').textContent = e.message; });
  }
  if (perfil.medalles != null) pintaMedalles(perfil.medalles, comarques);
  if (perfil.passaport != null) pintaPassaport(perfil.passaport, municipis);
  if (perfil.colleccio != null) pintaColleccio(perfil.colleccio, joc.objectes);
}

// El fons és el mapa de Catalunya, amb els municipis descoberts si es poden veure. Si no es pot carregar, no passa res.
function fons(descoberts) {
  dades('mapa.json').then((m) => pintaFons(m, descoberts || [])).catch(() => {});
}

async function inicia() {
  iniciaCarrega();
  iniciaCerca();
  const nom = (new URLSearchParams(location.search).get('u') || '').trim().toLowerCase();
  if (!nom) { fons(); return senseNom(); }
  $('cerca-text').value = '';
  let perfil;
  try {
    perfil = await perfilCompartit(nom);
  } catch (e) {
    $('nom').textContent = nom;
    fons();
    return estat(e.message, true);
  }
  if (!perfil) {
    $('nom').textContent = 'Perfil no trobat';
    fons();
    return estat(MISSATGES.noTrobat);
  }
  fons(perfil.descoberts);
  await pintaPerfil(perfil);
}

inicia();
