// Les crides al servidor (Supabase) i a les dades estàtiques de la web. No hi ha sessió: és la clau pública (anon), i
// només es poden cridar perfil_compartit, cerca_exploradors (supabase/migrations/20261027130000_web_explorador.sql) i
// ranquing_public (20261028180000_ranquing_web.sql).
import { ErrorPerfil } from './missatges.js';

const CONFIG = window.CONFIG || {};

function capcaleres() {
  return {
    'Content-Type': 'application/json',
    apikey: CONFIG.anonKey,
    Authorization: `Bearer ${CONFIG.anonKey}`,
    'Content-Profile': 'descobreix',
    'Accept-Profile': 'descobreix',
  };
}

async function rpc(funcio, cos, error) {
  if (!CONFIG.supabaseUrl || !CONFIG.anonKey) throw new ErrorPerfil('senseServidor');
  let r;
  try {
    r = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/${funcio}`, { method: 'POST', headers: capcaleres(), body: JSON.stringify(cos) });
  } catch {
    throw new ErrorPerfil(error);
  }
  if (!r.ok) throw new ErrorPerfil(error);
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}

/** El perfil que es veu a l'enllaç, o null si no hi ha ningú amb aquest nom. */
export const perfilCompartit = (nom) => rpc('perfil_compartit', { nom }, 'noCarrega');

/** Fins a 8 exploradors el nom dels quals comença pel text: [{ nom, public }]. */
export const cercaExploradors = (text) => rpc('cerca_exploradors', { text_cerca: text }, 'cercaFalla');

/** El rànquing per PUNTS o per MUNICIPIS: { participants, files: [{ posicio, nom, punts, municipis }] }. */
export const ranquingPublic = (criteri) => rpc('ranquing_public', { criteri }, 'ranquingFalla');

/** La foto de perfil (bucket privat: la política de Storage només la deixa llegir si es mostra a l'enllaç). */
export async function fotoPerfil(ruta) {
  const r = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/authenticated/descobreix-avatars/${ruta}`, {
    headers: { apikey: CONFIG.anonKey, Authorization: `Bearer ${CONFIG.anonKey}` },
  });
  if (!r.ok) throw new Error(`Error ${r.status}`);
  return URL.createObjectURL(await r.blob());
}

const memoria = new Map();

/** Les dades que genera scripts/generar-web.js: municipis.json, mapa.json i joc.json. */
export function dades(fitxer) {
  if (!memoria.has(fitxer)) {
    memoria.set(fitxer, fetch(`dades/${fitxer}`).then((r) => {
      if (!r.ok) throw new ErrorPerfil('senseDades');
      return r.json();
    }));
  }
  return memoria.get(fitxer);
}
