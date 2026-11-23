// La marmota de la portada: en clicar-la (o prémer Enter o espai) treu el cap i diu una frase graciosa.
// Les frases van en ordre i no se'n repeteix cap fins que surten totes.
const FRASES = [
  'Xiuuut! Fa sis mesos que dormo. M\'he perdut gaire cosa de la IA?',
  'Aquí dalt la cobertura és fatal, però les vistes van de conya.',
  'El Martí i el Pol són més avall. Jo no baixo, que fa calor.',
  'Jo també vull una app: una que m\'avisi quan arribi la primavera.',
  'No em feu fotos, que no estic pentinada.',
  'Pas a pas, diuen. Jo ho faig de sis mesos en sis mesos.',
  'Si busqueu el cim, és aquí al costat. Si busqueu nous, també.',
];

export function iniciaPortada() {
  const marmota = document.querySelector('.paisatge .marmota');
  const diu = document.getElementById('marmota-diu');
  if (!marmota || !diu) return;
  const caixa = marmota.closest('.paisatge');
  let i = 0, tancar = null;
  const parla = () => {
    diu.textContent = FRASES[i];
    i = (i + 1) % FRASES.length;
    marmota.classList.add('surt');
    const r = marmota.querySelector('.marmota-cos').getBoundingClientRect(), c = caixa.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2 - c.left, 170), c.width - 170);
    diu.style.left = `${x}px`;
    diu.style.top = `${r.top - c.top - 46}px`;
    diu.classList.add('visible');
    clearTimeout(tancar);
    tancar = setTimeout(() => { diu.classList.remove('visible'); marmota.classList.remove('surt'); }, 4500);
  };
  marmota.addEventListener('click', parla);
  marmota.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); parla(); } });
}
