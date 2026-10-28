// Els noms de les medalles a partir dels identificadors que desa l'app (comarca_24_or, municipis_100, cartells_25,
// capitals), per a la vitrina i per als logros.
export const NIVELLS = { bronze: 'Bronze', plata: 'Plata', or: 'Or' };
export const ORDRE_NIVELLS = ['bronze', 'plata', 'or'];

/** { tipus: 'comarca' | 'fita', nom, nivell, codi?, ordre } o null si no és cap medalla coneguda. */
export function llegeixMedalla(id, comarques) {
  const c = /^comarca_(\d+)_(bronze|plata|or)$/.exec(id);
  if (c) return { tipus: 'comarca', codi: c[1], nom: comarques.get(c[1]) || `Comarca ${c[1]}`, nivell: c[2], ordre: 0 };
  const m = /^municipis_(\d+)$/.exec(id);
  if (m) return { tipus: 'fita', nom: `${m[1]} municipis`, nivell: 'or', ordre: Number(m[1]) };
  const t = /^cartells_(\d+)$/.exec(id);
  if (t) return { tipus: 'fita', nom: t[1] === '1' ? '1 cartell' : `${t[1]} cartells`, nivell: 'or', ordre: 10000 + Number(t[1]) };
  if (id === 'capitals') return { tipus: 'fita', nom: 'Totes les capitals de comarca', nivell: 'or', ordre: 20000 };
  return null;
}

/** La vitrina: el nivell més alt de cada comarca i, després, les fites. */
export function vitrina(ids, comarques) {
  const perComarca = new Map();
  const fites = [];
  for (const id of ids) {
    const m = llegeixMedalla(id, comarques);
    if (!m) continue;
    if (m.tipus === 'fita') { fites.push(m); continue; }
    const actual = perComarca.get(m.codi);
    if (!actual || ORDRE_NIVELLS.indexOf(m.nivell) > ORDRE_NIVELLS.indexOf(actual.nivell)) perComarca.set(m.codi, m);
  }
  const deComarca = [...perComarca.values()]
    .sort((a, b) => ORDRE_NIVELLS.indexOf(b.nivell) - ORDRE_NIVELLS.indexOf(a.nivell) || a.nom.localeCompare(b.nom, 'ca'));
  return [...deComarca, ...fites.sort((a, b) => a.ordre - b.ordre)];
}
