// Mode revisió de la web de CIMS: mostra una pàgina original dins d'un iframe (mateix origen) i hi
// afegeix, sense tocar-ne el codi, una capa per deixar comentaris sobre qualsevol element.
// Les còpies (revisio/<pàgina>.html) només carreguen aquest script, així sempre són idèntiques a l'original.
// Comentaris: localStorage «cims.revisio» (array). Exportables en Markdown o JSON.
// Els colors i la lletra de la barra es copien de la pàgina de dins (marca CIMS o Bocins, clar o fosc).
// Basat en el sistema de revisió de tempCat (docs/sistema-revisio-comentaris.md).
(() => {
  const KEY = "cims.revisio";
  const me = document.currentScript;
  const PAGES = {
    "index.html": "Inici", "consultoria.html": "Consultoria", "municipis.html": "Bocins de Catalunya",
    "andanes.html": "Andana 947", "perfil.html": "Explorador", "ranquing.html": "Rànquing",
    "collabora.html": "Espai de col·laboració", "404.html": "Pàgina no trobada",
  };
  // Tokens d'estil.css (comuns a les dues marques) que la barra copia de la pàgina de dins.
  const TOKENS = ["--fons", "--sup", "--sup2", "--linia", "--text", "--cos-text", "--suau", "--accent", "--error"];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  // ---------- Dades ----------
  const load = () => { try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch { return []; } };
  const save = list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { say("No s'ha pogut desar: l'emmagatzematge del navegador no està disponible."); } };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const clip = (s, n) => { s = (s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

  // ---------- Elements de la pàgina ----------
  const isOurs = el => !!(el && el.closest && el.closest("[data-revisio]"));

  // Selector CSS estable i únic: #id si n'hi ha, si no camí de tags amb :nth-of-type des de l'avantpassat amb id.
  function selectorFor(el) {
    const doc = el.ownerDocument;
    const css = doc.defaultView.CSS;
    const uniqId = e => e.id && doc.querySelectorAll("#" + css.escape(e.id)).length === 1;
    if (el === doc.body) return "body";
    if (uniqId(el)) return "#" + css.escape(el.id);
    const parts = [];
    let cur = el;
    while (cur && cur !== doc.body && cur !== doc.documentElement) {
      if (uniqId(cur)) { parts.unshift("#" + css.escape(cur.id)); break; }
      let part = cur.localName;
      if (part.includes(":")) part = "*"; // elements amb espai de noms (p. ex. svg:…)
      const p = cur.parentElement;
      if (p) {
        const same = [...p.children].filter(c => c.localName === cur.localName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      cur = p;
      if (cur === doc.body) parts.unshift("body");
    }
    return parts.join(" > ");
  }

  // Descripció curta i llegible: tag#id.classe · «text»
  function describe(el) {
    let d = el.localName;
    if (el.id) d += "#" + el.id;
    const cls = [...el.classList].slice(0, 2);
    if (cls.length) d += "." + cls.join(".");
    return d;
  }
  function textOf(el) {
    return clip(el.getAttribute("aria-label") || el.getAttribute("alt") || el.getAttribute("title") || el.getAttribute("placeholder") || el.innerText || el.textContent || "", 80);
  }
  // Secció on és l'element: primer títol o aria-label d'un avantpassat.
  function contextOf(el) {
    const own = textOf(el).toLowerCase();
    const ok = t => { t = clip(t, 60); return t && t.toLowerCase() !== own ? t : ""; };
    for (let a = el.parentElement; a && a !== a.ownerDocument.documentElement; a = a.parentElement) {
      let t = a.getAttribute("aria-label");
      const ref = a.getAttribute("aria-labelledby");
      if (!t && ref) { const r = a.ownerDocument.getElementById(ref.split(" ")[0]); if (r && !r.contains(el)) t = r.textContent; }
      if (!t) { const h = a.querySelector(":scope > h1, :scope > h2, :scope > h3, :scope > header h1, :scope > header h2, :scope > .head h2"); if (h && !h.contains(el)) t = h.textContent; }
      if (t && (t = ok(t))) return t;
    }
    return "";
  }

  // ---------- Exportació ----------
  function toMarkdown(list = load()) {
    const when = new Date().toLocaleString("ca-ES", { dateStyle: "short", timeStyle: "short" });
    let md = `# Comentaris de revisió de la web de CIMS\n\nExportat: ${when} · ${list.length} ${list.length === 1 ? "comentari" : "comentaris"}\n`;
    const pages = [...new Set(list.map(c => c.pagina))];
    for (const p of pages) {
      md += `\n## ${p}${PAGES[p] ? ` (${PAGES[p]})` : ""}\n\n`;
      list.filter(c => c.pagina === p).forEach((c, i) => {
        const bits = [`\`${c.element}\``];
        if (c.text) bits.push(`«${c.text}»`);
        if (c.context) bits.push(`dins de «${c.context}»`);
        bits.push(`vista de ${c.amplada} px`);
        md += `${i + 1}. **\`${c.selector}\`** (${bits.join(" · ")})\n`;
        md += c.comentari.split("\n").map(l => `   > ${l}`).join("\n") + "\n";
      });
    }
    return md;
  }

  // ---------- Interfície (pàgina contenidora) ----------
  const target = (me && me.dataset.pagina) || "index.html";
  // Tema inicial, igual que l'script del <head> de la web, perquè la barra no parpellegi abans que carregui la pàgina.
  try { const t = localStorage.getItem("bocins-tema"); document.documentElement.dataset.tema = t === "clar" || t === "fosc" ? t : matchMedia("(prefers-color-scheme: light)").matches ? "clar" : "fosc"; } catch {}
  const html = String.raw;
  document.body.insertAdjacentHTML("beforeend", html`
<iframe id="pagina" name="pagina" title="Pàgina en revisió"></iframe>
<div class="rv-bar" role="toolbar" aria-label="Revisió">
  <p class="rv-hint" id="rv-hint" hidden>Toca qualsevol element per comentar-lo<span class="rv-kbd"> · Esc per sortir</span></p>
  <button type="button" class="rv-btn" id="rv-list-btn" aria-haspopup="dialog"><span aria-hidden="true">🗒️</span> <span class="rv-lab">Comentaris</span> <span class="rv-badge" id="rv-count">0</span></button>
  <button type="button" class="rv-btn rv-primary" id="rv-mode" aria-pressed="false"><span aria-hidden="true">💬</span> <span>Comentar</span></button>
</div>
<p class="sr" id="rv-live" aria-live="polite"></p>

<dialog id="rv-editor" class="rv-sheet" aria-labelledby="rv-ed-h">
  <form method="dialog" id="rv-form">
    <h2 id="rv-ed-h">Comentari</h2>
    <div class="rv-target">
      <p id="rv-target"></p>
      <button type="button" class="rv-btn rv-small" id="rv-parent">Tot el contenidor <span aria-hidden="true">↑</span></button>
    </div>
    <label for="rv-text">Què en vols dir?</label>
    <textarea id="rv-text" rows="4" required placeholder="P. ex. aquest text es llegeix malament en fosc"></textarea>
    <div class="rv-actions">
      <button type="button" class="rv-btn rv-danger" id="rv-delete" hidden>Esborra</button>
      <span class="rv-sp"></span>
      <button type="button" class="rv-btn" id="rv-cancel">Cancel·la</button>
      <button type="submit" class="rv-btn rv-primary" id="rv-save">Desa</button>
    </div>
  </form>
</dialog>

<dialog id="rv-panel" class="rv-sheet rv-side" aria-labelledby="rv-pn-h">
  <div class="rv-head"><h2 id="rv-pn-h">Comentaris</h2><button type="button" class="rv-btn rv-icon" id="rv-close" aria-label="Tanca"><span aria-hidden="true">✕</span></button></div>
  <p class="rv-muted" id="rv-empty">Encara no hi ha cap comentari en aquesta pàgina. Prem <b>Comentar</b> i toca un element.</p>
  <ol id="rv-items"></ol>
  <p class="rv-muted" id="rv-others"></p>
  <h3>Passa-ho a Claude</h3>
  <p class="rv-muted">Inclou els comentaris de totes les pàgines, amb el selector de cada element.</p>
  <div class="rv-actions rv-wrap">
    <button type="button" class="rv-btn rv-primary" id="rv-copy">Copia en Markdown</button>
    <button type="button" class="rv-btn" id="rv-dl-md">Descarrega .md</button>
    <button type="button" class="rv-btn" id="rv-dl-json">Descarrega .json</button>
  </div>
  <div class="rv-actions"><button type="button" class="rv-btn rv-danger" id="rv-clear">Esborra'ls tots</button></div>
</dialog>`);

  const $ = id => document.getElementById(id);
  const frame = $("pagina"), editor = $("rv-editor"), panel = $("rv-panel");
  let mode = false, current = null, editing = null, hovered = null, idoc = null, iwin = null, layer = null;

  const say = msg => { $("rv-live").textContent = ""; setTimeout(() => { $("rv-live").textContent = msg; }, 30); };
  const pagina = () => {
    try { const f = frame.contentWindow.location.pathname.split("/").pop(); return f || "index.html"; } catch { return target; }
  };
  const mine = () => load().filter(c => c.pagina === pagina());

  // URL: revisio/ruta.html?x#y → ../ruta.html?x#y
  frame.src = "../" + target + location.search + location.hash;

  function setMode(on) {
    mode = on;
    $("rv-mode").setAttribute("aria-pressed", String(on));
    $("rv-hint").hidden = !on;
    if (layer) layer.classList.toggle("rv-on", on);
    if (idoc) idoc.documentElement.classList.toggle("rv-mode-on", on);
    if (!on) highlight(null);
    say(on ? "Mode comentari activat. Toca o prem Enter sobre qualsevol element per comentar-lo." : "Mode comentari desactivat.");
  }

  // ---------- Capa dins de l'iframe ----------
  const STYLE = `
[data-revisio]{position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden;font:600 13px/1 var(--f-body,var(--cos,system-ui,sans-serif))}
[data-revisio] .rv-box{position:absolute;border:2px solid var(--accent,#F2B544);border-radius:4px;background:color-mix(in srgb,var(--accent,#F2B544) 12%,transparent);display:none}
[data-revisio] .rv-box.rv-sel{border-width:3px;display:block}
[data-revisio].rv-on .rv-box.rv-hov{display:block}
[data-revisio] .rv-pin{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;padding:0;border:0;background:none;pointer-events:auto;cursor:pointer;display:grid;place-items:center}
[data-revisio] .rv-pin span{min-width:26px;height:26px;padding:0 6px;border-radius:13px;background:var(--accent,#F2B544);color:var(--fons,#0B0E13);box-shadow:0 0 0 2px var(--fons,#0B0E13),0 2px 6px rgba(0,0,0,.3);display:grid;place-items:center}
[data-revisio] .rv-pin:focus-visible{outline:3px solid var(--accent,#F2B544);outline-offset:-2px;border-radius:50%}
html.rv-mode-on, html.rv-mode-on *{cursor:crosshair !important}
@media (prefers-reduced-motion: no-preference){[data-revisio] .rv-box.rv-flash{animation:rv-flash .9s ease-out 2}}
@keyframes rv-flash{50%{opacity:.2}}`;

  function attach() {
    try { idoc = frame.contentDocument; iwin = frame.contentWindow; } catch { idoc = null; return; }
    if (!idoc || !idoc.body || idoc.querySelector("[data-revisio]")) return;
    const st = idoc.createElement("style"); st.setAttribute("data-revisio-style", ""); st.textContent = STYLE;
    idoc.head.appendChild(st);
    layer = idoc.createElement("div"); layer.setAttribute("data-revisio", ""); layer.setAttribute("aria-hidden", "false");
    layer.innerHTML = `<div class="rv-box rv-hov"></div><div class="rv-box rv-sel"></div><div class="rv-pins"></div>`;
    idoc.body.appendChild(layer);
    layer.classList.toggle("rv-on", mode);
    idoc.documentElement.classList.toggle("rv-mode-on", mode);

    const opts = { capture: true };
    // En mode comentari, el clic tria l'element i no arriba a la pàgina.
    const block = e => { if (mode && !isOurs(e.target)) { e.preventDefault(); e.stopPropagation(); } };
    iwin.addEventListener("mousedown", block, opts);
    iwin.addEventListener("pointerdown", e => { if (mode && !isOurs(e.target)) e.stopPropagation(); }, opts);
    iwin.addEventListener("touchstart", e => { if (mode && !isOurs(e.target)) e.stopPropagation(); }, { capture: true, passive: true });
    iwin.addEventListener("submit", block, opts);
    iwin.addEventListener("click", e => {
      const pin = e.target.closest && e.target.closest(".rv-pin");
      if (pin) { e.preventDefault(); e.stopPropagation(); openEditor(null, load().find(c => c.id === pin.dataset.id)); return; }
      if (!mode || isOurs(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      openEditor(e.target);
    }, opts);
    iwin.addEventListener("mouseover", e => { if (mode && !isOurs(e.target)) { hovered = e.target; schedule(); } }, opts);
    iwin.addEventListener("keydown", e => {
      if (!mode || isOurs(e.target)) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setMode(false); }
      else if ((e.key === "Enter" || e.key === " ") && !e.isComposing) { e.preventDefault(); e.stopPropagation(); openEditor(e.target); }
    }, opts);
    iwin.addEventListener("focusin", e => { if (mode && !isOurs(e.target)) { hovered = e.target; schedule(); } });
    iwin.addEventListener("scroll", schedule, { capture: true, passive: true });
    iwin.addEventListener("resize", schedule);
    new iwin.MutationObserver(muts => { if (muts.some(m => !isOurs(m.target))) schedule(); })
      .observe(idoc.body, { childList: true, subtree: true, attributes: true, characterData: true });

    // Adreça i títol segons la pàgina de dins
    const p = pagina();
    if (PAGES[p] || p.endsWith(".html")) {
      const loc = frame.contentWindow.location;
      history.replaceState(null, "", p + loc.search + loc.hash);
    }
    document.title = "Revisió: " + (idoc.title || p);
    frame.title = "Pàgina en revisió: " + (idoc.title || p);
    syncTheme();
    new iwin.MutationObserver(syncTheme).observe(idoc.documentElement, { attributes: true, attributeFilter: ["data-tema", "data-marca", "style", "class"] });
    renderPins(); refreshCount();
  }
  frame.addEventListener("load", attach);

  // La barra pren els colors i la lletra de la pàgina de dins: si allà es canvia el tema, aquí també.
  function syncTheme() {
    if (!idoc) return;
    const root = document.documentElement, src = idoc.documentElement;
    if (src.dataset.tema) root.dataset.tema = src.dataset.tema;
    const cs = iwin.getComputedStyle(src);
    for (const t of TOKENS) { const v = cs.getPropertyValue(t).trim(); if (v) root.style.setProperty(t, v); else root.style.removeProperty(t); }
    const font = iwin.getComputedStyle(idoc.body).fontFamily;
    if (font) root.style.setProperty("--rv-font", font);
  }

  // ---------- Posicions (marques i ressaltat), un cop per fotograma ----------
  let queued = false;
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; layout(); }); } }
  const visible = r => r && (r.width > 0 || r.height > 0);
  function place(box, el) {
    const r = el && el.isConnected ? el.getBoundingClientRect() : null;
    if (!visible(r)) { box.style.cssText = "display:none"; return; }
    box.style.cssText = `left:${r.left - 2}px;top:${r.top - 2}px;width:${r.width + 4}px;height:${r.height + 4}px`;
  }
  function layout() {
    if (!layer || !layer.isConnected) return;
    avoidBottomBar();
    const [hov, sel] = layer.querySelectorAll(".rv-box");
    place(hov, mode ? hovered : null);
    place(sel, current);
    if (!current) sel.style.cssText = "display:none";
    const vw = iwin.innerWidth;
    for (const pin of layer.querySelectorAll(".rv-pin")) {
      let el = null;
      try { el = idoc.querySelector(pin.dataset.sel); } catch {}
      const r = el ? el.getBoundingClientRect() : null;
      if (!visible(r)) { pin.hidden = true; continue; }
      pin.hidden = false;
      // Cantonada superior dreta de l'element, dins de la pantalla
      pin.style.left = Math.min(Math.max(r.right - 4, 22), vw - 22) + "px";
      pin.style.top = Math.max(r.top + 4, 22) + "px";
    }
  }
  function highlight(el) { hovered = el; schedule(); }

  // Si la pàgina té una barra fixa a baix (el menú del mòbil), la barra de revisió s'hi posa al damunt.
  let lift = -1;
  function avoidBottomBar() {
    const vh = iwin.innerHeight;
    let top = vh;
    for (const x of [8, iwin.innerWidth / 2, iwin.innerWidth - 8]) {
      for (let el = idoc.elementFromPoint(x, vh - 2); el && el !== idoc.body && el !== idoc.documentElement; el = el.parentElement) {
        if (isOurs(el)) break;
        if (iwin.getComputedStyle(el).position === "fixed") { top = Math.min(top, el.getBoundingClientRect().top); break; }
      }
    }
    const h = Math.max(0, Math.round(vh - top));
    if (h > vh / 3 || h === lift) return; // un element fix massa alt no és una barra
    lift = h;
    document.documentElement.style.setProperty("--rv-lift", h + "px");
  }

  function renderPins() {
    if (!layer) return;
    const list = mine();
    layer.querySelector(".rv-pins").innerHTML = list.map((c, i) =>
      `<button type="button" class="rv-pin" data-id="${esc(c.id)}" data-sel="${esc(c.selector)}" aria-label="Comentari ${i + 1}: ${esc(clip(c.comentari, 60))}" title="${esc(clip(c.comentari, 120))}"><span>${i + 1}</span></button>`).join("");
    schedule();
  }
  function refreshCount() {
    const n = mine().length;
    $("rv-count").textContent = n;
    $("rv-list-btn").setAttribute("aria-label", `Comentaris d'aquesta pàgina: ${n}`);
  }

  // ---------- Editor ----------
  function showTarget() {
    const c = editing;
    const el = current;
    const sel = el ? selectorFor(el) : c.selector;
    const desc = el ? describe(el) : c.element;
    const txt = el ? textOf(el) : c.text;
    const ctx = el ? contextOf(el) : c.context;
    $("rv-target").innerHTML = `<code>${esc(sel)}</code><br><span>${esc(desc)}${txt ? ` · «${esc(txt)}»` : ""}${ctx ? ` · dins de «${esc(ctx)}»` : ""}</span>`;
    $("rv-parent").hidden = !el || !el.parentElement || el.parentElement === idoc.documentElement;
  }
  function openEditor(el, comment) {
    editing = comment || null;
    current = el || (comment ? (() => { try { return idoc.querySelector(comment.selector); } catch { return null; } })() : null);
    $("rv-ed-h").textContent = comment ? "Edita el comentari" : "Nou comentari";
    $("rv-text").value = comment ? comment.comentari : "";
    $("rv-delete").hidden = !comment;
    showTarget();
    if (current && iwin.innerWidth < 700) current.scrollIntoView({ block: "start", behavior: reduce.matches ? "auto" : "smooth" });
    schedule();
    if (!editor.open) editor.showModal();
    $("rv-text").focus();
  }
  function closeEditor() {
    if (editor.open) editor.close();
  }
  editor.addEventListener("close", () => { current = null; editing = null; schedule(); });
  $("rv-cancel").onclick = closeEditor;
  $("rv-parent").onclick = () => {
    if (!current || !current.parentElement) return;
    current = current.parentElement;
    if (current === idoc.documentElement) current = idoc.body;
    showTarget(); schedule();
    say("Seleccionat: " + describe(current));
  };
  $("rv-form").addEventListener("submit", e => {
    e.preventDefault();
    const text = $("rv-text").value.trim();
    if (!text) { $("rv-text").focus(); return; }
    const list = load();
    if (editing) {
      const c = list.find(x => x.id === editing.id);
      if (c) {
        c.comentari = text; c.editat = new Date().toISOString();
        if (current) Object.assign(c, { selector: selectorFor(current), element: describe(current), text: textOf(current), context: contextOf(current) });
      }
    } else if (current) {
      list.push({ id: uid(), pagina: pagina(), selector: selectorFor(current), element: describe(current), text: textOf(current), context: contextOf(current), comentari: text, creat: new Date().toISOString(), amplada: iwin.innerWidth });
    }
    save(list);
    closeEditor();
    renderPins(); refreshCount(); renderList();
    say("Comentari desat.");
  });
  $("rv-delete").onclick = () => {
    if (!editing) return;
    save(load().filter(c => c.id !== editing.id));
    closeEditor();
    renderPins(); refreshCount(); renderList();
    say("Comentari esborrat.");
  };

  // ---------- Llista i exportació ----------
  function renderList() {
    const list = mine();
    $("rv-empty").hidden = list.length > 0;
    $("rv-items").innerHTML = list.map((c, i) => {
      let found = false; try { found = !!idoc.querySelector(c.selector); } catch {}
      return `<li><button type="button" class="rv-open" data-id="${esc(c.id)}"><span class="rv-n" aria-hidden="true">${i + 1}</span><span class="rv-body"><span class="rv-c">${esc(c.comentari)}</span><span class="rv-muted">${esc(c.element)}${c.text ? ` · «${esc(c.text)}»` : ""}${found ? "" : " · ara no és a la pàgina"}</span></span></button></li>`;
    }).join("");
    const others = load().filter(c => c.pagina !== pagina());
    const by = {}; others.forEach(c => { by[c.pagina] = (by[c.pagina] || 0) + 1; });
    $("rv-others").innerHTML = others.length ? "Altres pàgines: " + Object.entries(by).map(([p, n]) => `<a href="${esc(p)}">${esc(PAGES[p] || p)}</a> (${n})`).join(", ") : "";
  }
  $("rv-items").addEventListener("click", e => {
    const b = e.target.closest(".rv-open"); if (!b) return;
    const c = load().find(x => x.id === b.dataset.id); if (!c) return;
    panel.close();
    let el = null; try { el = idoc.querySelector(c.selector); } catch {}
    if (el) {
      el.scrollIntoView({ block: "center", behavior: reduce.matches ? "auto" : "smooth" });
      const sel = layer.querySelectorAll(".rv-box")[1];
      sel.classList.add("rv-flash"); setTimeout(() => sel.classList.remove("rv-flash"), 1900);
    }
    openEditor(null, c);
  });
  $("rv-list-btn").onclick = () => { renderList(); panel.showModal(); };
  $("rv-close").onclick = () => panel.close();
  panel.addEventListener("click", e => { if (e.target === panel) panel.close(); }); // clic al fons
  editor.addEventListener("click", e => { if (e.target === editor) closeEditor(); });
  $("rv-mode").onclick = () => setMode(!mode);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && mode && !editor.open && !panel.open) setMode(false); });

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const t = document.createElement("textarea"); t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0";
      panel.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand("copy"); } catch {} t.remove(); return ok;
    }
  }
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
  function flashLabel(btn, txt) { const o = btn.textContent; btn.textContent = txt; setTimeout(() => { btn.textContent = o; }, 1800); say(txt); }
  $("rv-copy").onclick = async () => flashLabel($("rv-copy"), (await copy(toMarkdown())) ? "Copiat ✓" : "No s'ha pogut copiar");
  $("rv-dl-md").onclick = () => download(`cims-comentaris-${stamp()}.md`, toMarkdown(), "text/markdown");
  $("rv-dl-json").onclick = () => download(`cims-comentaris-${stamp()}.json`, JSON.stringify(load(), null, 2), "application/json");
  let clearArmed = null;
  $("rv-clear").onclick = () => {
    const b = $("rv-clear");
    if (!clearArmed) {
      b.textContent = `Segur? Esborra els ${load().length}`;
      clearArmed = setTimeout(() => { clearArmed = null; b.textContent = "Esborra'ls tots"; }, 4000);
      return;
    }
    clearTimeout(clearArmed); clearArmed = null; b.textContent = "Esborra'ls tots";
    save([]); renderPins(); refreshCount(); renderList(); say("Tots els comentaris esborrats.");
  };
  // Si els comentaris canvien en una altra pestanya
  addEventListener("storage", e => { if (e.key === KEY) { renderPins(); refreshCount(); if (panel.open) renderList(); } });

  window.Revisio = { selectorFor: el => selectorFor(el), toMarkdown, pagina, load, ready: true };
})();
