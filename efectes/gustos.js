// «No t'agrada la web?»: un qüestionari sobre com t'agraden les webs, i la web s'hi adapta.
// Els colors de CIMS (el corall i el gris pissarra) hi són sempre: l'ambient només canvia el to del fons i la força del corall.
// Cada resposta és un eix independent (colors, lletra, mida, formes, espai, moviment, paisatge i to del text), així
// que qualsevol combinació té la seva web sense haver de duplicar pàgines: cada eix és un atribut data-g-<eix> a <html>
// que cims.css fa servir. El tema clar/fosc i el mode interactiu fan servir les claus que ja tenia la web.
// Es desa al navegador (localStorage «cims-gustos») i s'aplica a totes les pàgines de CIMS amb l'script del <head>.
const CLAU = 'cims-gustos';

const PREGUNTES = [
  { clau: 'colors', titol: 'Quin ambient de colors t\'agrada més?', opcions: [
    ['calid', 'Càlid', 'Fons de paper crema, com fins ara'],
    ['neutre', 'Neutre', 'Fons blanc net'],
    ['fresc', 'Fresc', 'Fons blanc amb un toc blavós'],
    ['intens', 'Intens', 'Més contrast i el corall més viu'],
    ['suau', 'Suau', 'Tons apagats i tranquils'],
  ] },
  { clau: 'tema', titol: 'Clar o fosc?', opcions: [
    ['clar', 'Clar', 'Fons clar, com un full de paper'],
    ['fosc', 'Fosc', 'Fons fosc, que descansa la vista'],
    ['auto', 'Com el meu aparell', 'Segueix el mòbil o l\'ordinador'],
  ] },
  { clau: 'lletra', titol: 'Quin tipus de lletra prefereixes?', opcions: [
    ['moderna', 'Moderna', 'Neta i geomètrica'],
    ['classica', 'Clàssica', 'Amb serifa, com un llibre'],
    ['amigable', 'Amigable', 'Rodona i propera'],
    ['tecnica', 'Tècnica', 'Amb aire de codi'],
  ] },
  { clau: 'mida', titol: 'Com de gran vols el text?', opcions: [
    ['petita', 'Petit', 'Hi cap més coses a la pantalla'],
    ['normal', 'Normal', 'Ni gran ni petit'],
    ['gran', 'Gran', 'Es llegeix sense esforç'],
  ] },
  { clau: 'formes', titol: 'Com t\'agraden els botons i les caixes?', opcions: [
    ['rodones', 'Rodons', 'Com una píndola'],
    ['suaus', 'Amb les cantonades suaus', 'Una mica arrodonits'],
    ['quadrades', 'Quadrats', 'Rectes i nets'],
  ] },
  { clau: 'espai', titol: 'Quant d\'espai entre blocs?', opcions: [
    ['compacte', 'Poc', 'Tot més a prop, menys scroll'],
    ['normal', 'Normal', 'L\'equilibri'],
    ['aireig', 'Molt', 'Molt d\'aire, sense presses'],
  ] },
  { clau: 'moviment', titol: 'I el moviment?', opcions: [
    ['molt', 'Molt', 'Efectes en passar el ratolí i en baixar'],
    ['poc', 'Poc', 'Només el just'],
    ['gens', 'Gens', 'Tot quiet'],
  ] },
  { clau: 'paisatge', titol: 'La pantalla de les muntanyes del principi…', opcions: [
    ['si', 'M\'encanta', 'Que hi sigui sempre'],
    ['no', 'Prefereixo anar al gra', 'Vull veure el contingut de seguida'],
  ] },
  { clau: 'to', titol: 'Com vols que et parlem?', opcions: [
    ['proper', 'De tu a tu', 'Proper, com fins ara'],
    ['formal', 'Formal', 'Seriós i professional'],
    ['divertit', 'Divertit', 'Amb una mica de gràcia'],
  ] },
];

// Les lletres de cada opció (Google Fonts, com la resta de la web). La moderna ja és la de sempre.
const LLETRES = {
  classica: 'family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Source+Serif+4:opsz,wght@8..60,400..700',
  amigable: 'family=Nunito:wght@400..800',
  tecnica: 'family=Space+Grotesk:wght@500..700&family=IBM+Plex+Mono:wght@400;600',
};

const llegeix = () => { try { return JSON.parse(localStorage.getItem(CLAU)) || null; } catch { return null; } };
const desa = (g) => { try { localStorage.setItem(CLAU, JSON.stringify(g)); return true; } catch { return false; } };

function aplicaLletra(g) {
  const fam = g && LLETRES[g.lletra];
  if (!fam || document.querySelector('link[data-gustos]')) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.dataset.gustos = '';
  l.href = `https://fonts.googleapis.com/css2?${fam}&display=swap`;
  document.head.append(l);
}

// Els textos amb data-formal / data-divertit canvien segons el to triat.
function aplicaTo(g) {
  const to = g && g.to;
  if (to !== 'formal' && to !== 'divertit') return;
  for (const el of document.querySelectorAll(`[data-${to}]`)) el.textContent = el.dataset[to];
}

function preguntaActual(dlg, i, respostes) {
  const q = PREGUNTES[i];
  dlg.querySelector('#gustos-pas').textContent = `Pregunta ${i + 1} de ${PREGUNTES.length}`;
  dlg.querySelector('#gustos-barra').style.setProperty('--p', (i + 1) / PREGUNTES.length);
  dlg.querySelector('#gustos-titol').textContent = q.titol;
  const opcions = dlg.querySelector('#gustos-opcions');
  opcions.innerHTML = '';
  for (const [valor, nom, desc] of q.opcions) {
    const id = `g-${q.clau}-${valor}`;
    const lab = document.createElement('label');
    lab.className = 'gustos-opcio';
    lab.htmlFor = id;
    lab.innerHTML = `<input type="radio" name="${q.clau}" id="${id}" value="${valor}"><span class="nom"></span><span class="desc"></span>`;
    lab.querySelector('.nom').textContent = nom;
    lab.querySelector('.desc').textContent = desc;
    const input = lab.querySelector('input');
    if (respostes[q.clau] === valor) input.checked = true;
    input.addEventListener('change', () => { respostes[q.clau] = valor; actualitzaBotons(); });
    opcions.append(lab);
  }
  const enrere = dlg.querySelector('#gustos-enrere'), seguent = dlg.querySelector('#gustos-seguent');
  enrere.hidden = i === 0;
  seguent.textContent = i === PREGUNTES.length - 1 ? 'Transforma la web' : 'Següent';
  function actualitzaBotons() { seguent.disabled = !respostes[q.clau]; }
  actualitzaBotons();
  (opcions.querySelector('input:checked') || opcions.querySelector('input')).focus();
}

export function iniciaGustos() {
  if (document.documentElement.dataset.marca !== 'cims') return;
  const g = llegeix();
  aplicaLletra(g);
  aplicaTo(g);

  const obre = document.getElementById('obre-gustos');
  const treu = document.getElementById('treu-gustos');
  if (!obre) return;
  if (g) { treu.hidden = false; obre.textContent = 'Torna a fer el qüestionari'; }
  treu.addEventListener('click', () => {
    try { localStorage.removeItem(CLAU); localStorage.removeItem('bocins-tema'); localStorage.removeItem('cims-interactiu'); } catch { /* res */ }
    location.reload();
  });

  const dlg = document.createElement('dialog');
  dlg.className = 'gustos-dialeg';
  dlg.setAttribute('aria-labelledby', 'gustos-titol');
  dlg.innerHTML = `
    <form method="dialog" class="gustos-form">
      <div class="gustos-cap">
        <p id="gustos-pas" class="gustos-pas"></p>
        <button type="button" class="gustos-tanca" id="gustos-tanca" aria-label="Tanca el qüestionari"><span aria-hidden="true">✕</span></button>
      </div>
      <div class="gustos-barra" id="gustos-barra" aria-hidden="true"><span></span></div>
      <fieldset class="gustos-pregunta">
        <legend><h2 id="gustos-titol"></h2></legend>
        <div id="gustos-opcions" class="gustos-opcions"></div>
      </fieldset>
      <div class="gustos-botons">
        <button type="button" class="bt sec" id="gustos-enrere">Enrere</button>
        <button type="submit" class="bt" id="gustos-seguent">Següent</button>
      </div>
    </form>`;
  document.body.append(dlg);

  let i = 0;
  let respostes = {};
  const tema = () => { try { return localStorage.getItem('bocins-tema') || 'auto'; } catch { return 'auto'; } };
  obre.addEventListener('click', () => {
    i = 0;
    respostes = { ...(llegeix() || {}) };
    if (!respostes.tema) respostes.tema = tema();
    preguntaActual(dlg, i, respostes);
    dlg.showModal();
  });
  dlg.querySelector('#gustos-tanca').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.querySelector('#gustos-enrere').addEventListener('click', () => { if (i > 0) preguntaActual(dlg, --i, respostes); });
  dlg.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!respostes[PREGUNTES[i].clau]) return;
    if (i < PREGUNTES.length - 1) { preguntaActual(dlg, ++i, respostes); return; }
    const { tema: t, ...resta } = respostes;
    try {
      localStorage.setItem('bocins-tema', t);
      localStorage.setItem('cims-interactiu', resta.moviment === 'molt' ? 'si' : 'no');
    } catch { /* res */ }
    desa(resta);
    location.href = location.pathname; // torna a dalt amb la web nova
  });
}
