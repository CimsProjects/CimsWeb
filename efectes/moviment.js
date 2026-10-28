// El moviment de la pàgina: revelar en entrar a la pantalla (amb esglaons), parallax, la brillantor i el zoom que
// segueixen el cursor i els comptadors. Amb «reduir moviment», res no es mou: tot apareix de cop.
export const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let observador = null;

/** Revela els elements quan entren a la pantalla. Amb `esglaons`, cada fill surt una mica després de l'anterior. */
export function revela(elements, { esglaons = false } = {}) {
  const llista = [...elements];
  if (quiet() || !('IntersectionObserver' in window)) {
    llista.forEach((el) => el.classList.add('vist'));
    return;
  }
  observador ??= new IntersectionObserver((entrades) => {
    for (const e of entrades) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('vist');
      observador.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  llista.forEach((el, i) => {
    el.classList.add('revela');
    if (esglaons) el.style.setProperty('--i', Math.min(i, 12));
    observador.observe(el);
  });
}

/** El fons i la brillantor de la portada es mouen més a poc a poc que la pàgina. */
export function iniciaParallax() {
  if (quiet()) return;
  const arrel = document.documentElement.style;
  let pendent = false;
  addEventListener('scroll', () => {
    if (pendent) return;
    pendent = true;
    requestAnimationFrame(() => {
      arrel.setProperty('--parallax-fons', `${scrollY * -0.12}px`);
      document.querySelectorAll('.portada').forEach((p) => p.style.setProperty('--parallax', `${scrollY * 0.3}px`));
      pendent = false;
    });
  }, { passive: true });
}

/** La brillantor (.brilla) i el zoom (.zoom) segueixen el cursor. */
export function iniciaCursor() {
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.target.closest?.('.brilla, .zoom');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - r.left}px`);
    el.style.setProperty('--y', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/** Compta de 0 fins al valor quan l'element es veu. El text final és el mateix que sense animació. */
export function compta(el, valor, format) {
  el.textContent = format(valor);
  if (quiet() || valor === 0 || !('IntersectionObserver' in window)) return;
  el.textContent = format(0);
  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    const inici = performance.now();
    const durada = 1100;
    const pas = (ara) => {
      const t = Math.min(1, (ara - inici) / durada);
      el.textContent = format(Math.round(valor * (1 - (1 - t) ** 3)));
      if (t < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  });
  obs.observe(el);
}
