// Proves de les pàgines de revisió (revisio/*.html + revisio/revisio.js).
// Executa: node tests/revisio.test.mjs   (fa servir el Playwright i el Chromium instal·lats; si no hi és, npm i -g playwright)
// Serveix el repo en local i bloqueja totes les peticions externes perquè siguin deterministes.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = fileURLToPath(new URL("..", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" };

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = normalize(join(root, p));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try { const b = await readFile(file); res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(b); }
  catch { res.writeHead(404).end("no"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
let failed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

async function open(path, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 800 }, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  await ctx.route("**/*", r => r.request().url().startsWith(base) ? r.continue() : r.abort());
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(base + path);
  await page.waitForFunction(() => window.Revisio && window.Revisio.ready);
  const frame = page.frameLocator("#pagina");
  return { ctx, page, frame, errors };
}

// La pàgina de dins de l'iframe
const inner = page => page.frames().find(f => f.name() === "pagina" || f.url().includes(".html") && f !== page.mainFrame());

const PAGINES = ["index", "consultoria", "municipis", "andanes", "perfil", "ranquing", "collabora", "404"];
const KEY = "cims.revisio";

test("cada còpia carrega la pàgina original sense errors de la revisió", async () => {
  for (const nom of PAGINES) {
    const { ctx, page, errors } = await open(`/revisio/${nom}.html`);
    const src = await page.$eval("#pagina", f => new URL(f.src).pathname);
    assert.equal(src, `/${nom}.html`);
    await page.waitForFunction(() => document.title.startsWith("Revisió: "));
    const h = await inner(page).evaluate(() => document.title);
    assert.ok(h.length > 0, "l'original té títol");
    await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
    assert.deepEqual(errors.filter(e => /revisio/i.test(e)), [], `sense errors de revisio.js a ${nom}`);
    await ctx.close();
  }
});

test("el selector de cada element el torna a trobar (únic)", async () => {
  for (const nom of ["index", "municipis", "perfil"]) {
    const { ctx, page } = await open(`/revisio/${nom}.html`);
    await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
    const bad = await page.evaluate(() => {
      const doc = document.getElementById("pagina").contentDocument;
      const out = [];
      for (const el of doc.body.querySelectorAll("*")) {
        if (el.closest("[data-revisio]")) continue;
        const s = window.Revisio.selectorFor(el);
        if (doc.querySelector(s) !== el) out.push(s);
      }
      return out;
    });
    assert.deepEqual(bad, [], nom);
    await ctx.close();
  }
});

test("comentar un element: es guarda, surt la marca i persisteix", async () => {
  const { ctx, page } = await open("/revisio/index.html");
  await page.click("#rv-mode");
  assert.equal(await page.getAttribute("#rv-mode", "aria-pressed"), "true");
  // Clicar un enllaç en mode comentari no ha de navegar
  await inner(page).click(".projectes li:first-child .nom");
  await page.waitForSelector("#rv-editor[open]");
  // Cada clic tria l'element més concret; «Tot el contenidor» puja fins a l'enllaç sencer
  const enllac = /li:nth-of-type\(1\) > a$/;
  while (!enllac.test(await page.textContent("#rv-target code"))) await page.click("#rv-parent");
  await page.fill("#rv-text", "Aquest enllaç hauria de ser més gran");
  await page.click("#rv-save");
  await page.waitForSelector("#rv-editor:not([open])", { state: "attached" });
  assert.equal(new URL(inner(page).url()).pathname, "/index.html", "no ha navegat");
  const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].pagina, "index.html");
  assert.match(saved[0].selector, enllac);
  assert.match(saved[0].text, /Bocins de Catalunya/);
  assert.equal(saved[0].context, "Què fem");
  assert.equal(saved[0].comentari, "Aquest enllaç hauria de ser més gran");
  assert.equal(saved[0].amplada, 1280);
  assert.match(await page.textContent("#rv-count"), /1/);
  await inner(page).waitForSelector("[data-revisio] .rv-pin");
  // Recarrega: la marca hi torna a ser
  await page.reload();
  await page.waitForFunction(() => window.Revisio && window.Revisio.ready);
  await inner(page).waitForSelector("[data-revisio] .rv-pin");
  await ctx.close();
});

test("en mode comentari els botons de la pàgina no fan res", async () => {
  const { ctx, page } = await open("/revisio/index.html");
  await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
  await page.click("#rv-mode");
  await inner(page).click("#tema > button");
  await page.waitForSelector("#rv-editor[open]");
  assert.equal(await inner(page).getAttribute("#tema > button", "aria-expanded"), "false", "el menú del tema no s'obre");
  await ctx.close();
});

test("ampliar la selecció a l'element contenidor", async () => {
  const { ctx, page } = await open("/revisio/index.html");
  await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
  await page.click("#rv-mode");
  await inner(page).click("#projectes");
  await page.waitForSelector("#rv-editor[open]");
  assert.equal(await page.textContent("#rv-target code"), "#projectes");
  await page.click("#rv-parent");
  assert.equal(await page.textContent("#rv-target code"), "body > main > section:nth-of-type(2)");
  await page.keyboard.press("Escape");
  await page.waitForSelector("#rv-editor:not([open])", { state: "attached" });
  await ctx.close();
});

test("editar, exportar i esborrar", async () => {
  const { ctx, page } = await open("/revisio/index.html");
  await page.evaluate(k => localStorage.setItem(k, JSON.stringify([
    { id: "a", pagina: "index.html", selector: "#projectes", element: "h2#projectes", text: "Què fem", context: "", comentari: "Primer", creat: "2026-11-23T09:00:00Z", amplada: 390 },
    { id: "b", pagina: "municipis.html", selector: "h1", element: "h1", text: "Bocins", context: "", comentari: "Altra pàgina", creat: "2026-11-23T09:01:00Z", amplada: 1280 },
  ])), KEY);
  await page.reload();
  await page.waitForFunction(() => window.Revisio && window.Revisio.ready);
  await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
  const md = await page.evaluate(() => window.Revisio.toMarkdown());
  assert.match(md, /^# Comentaris de revisió de la web de CIMS/);
  assert.match(md, /## index\.html \(Inici\)/);
  assert.match(md, /## municipis\.html \(Bocins de Catalunya\)/);
  assert.match(md, /`#projectes`/);
  assert.match(md, /Primer/);
  // Llista: només els d'aquesta pàgina; obrir-ne un i esborrar-lo
  await page.click("#rv-list-btn");
  await page.waitForSelector("#rv-panel[open]");
  assert.equal(await page.locator("#rv-items > li").count(), 1);
  assert.match(await page.textContent("#rv-others"), /Bocins de Catalunya \(1\)/);
  await page.click("#rv-items > li button.rv-open");
  await page.waitForSelector("#rv-editor[open]");
  assert.equal(await page.inputValue("#rv-text"), "Primer");
  await page.click("#rv-delete");
  const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
  assert.deepEqual(saved.map(c => c.id), ["b"]);
  await ctx.close();
});

test("teclat: Enter comenta l'element amb focus; Esc surt del mode comentari", async () => {
  const { ctx, page } = await open("/revisio/index.html");
  await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
  await page.click("#rv-mode");
  await inner(page).focus(".accions-portada .boto");
  await page.keyboard.press("Enter");
  await page.waitForSelector("#rv-editor[open]");
  assert.match(await page.textContent("#rv-target"), /Mira els projectes/);
  await page.keyboard.press("Escape");
  await page.waitForSelector("#rv-editor:not([open])", { state: "attached" });
  await inner(page).focus(".accions-portada .boto");
  await page.keyboard.press("Escape");
  assert.equal(await page.getAttribute("#rv-mode", "aria-pressed"), "false");
  await ctx.close();
});

test("navegar dins la còpia manté el mode revisió i actualitza l'adreça", async () => {
  const { ctx, page } = await open("/revisio/index.html");
  await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
  await inner(page).click("#menu a[href='consultoria.html']");
  await page.waitForFunction(() => location.pathname.endsWith("/revisio/consultoria.html"));
  await page.waitForFunction(() => window.Revisio.pagina() === "consultoria.html");
  await ctx.close();
});

test("la barra pren el tema i els colors de la pàgina (clar i fosc)", async () => {
  const { ctx, page } = await open("/revisio/municipis.html");
  await page.evaluate(() => localStorage.setItem("bocins-tema", "clar"));
  await page.reload();
  await page.waitForFunction(() => window.Revisio && window.Revisio.ready);
  await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
  const fons = () => page.evaluate(() => {
    const d = document.getElementById("pagina").contentDocument;
    return [document.documentElement.dataset.tema, getComputedStyle(document.documentElement).getPropertyValue("--fons").trim(),
      getComputedStyle(d.documentElement).getPropertyValue("--fons").trim()];
  });
  let [tema, meu, seu] = await fons();
  assert.equal(tema, "clar");
  assert.equal(meu, seu);
  // Canviar el tema dins la pàgina també canvia la barra
  await inner(page).evaluate(() => { document.documentElement.dataset.tema = "fosc"; });
  await page.waitForFunction(() => document.documentElement.dataset.tema === "fosc");
  [tema, meu, seu] = await fons();
  assert.equal(meu, seu);
  assert.notEqual(meu, "#FFFFFF");
  await ctx.close();
});

test("mòbil: tocar un element obre l'editor i els botons fan 44 px", async () => {
  const { ctx, page } = await open("/revisio/index.html", { viewport: { width: 390, height: 844 }, touch: true });
  await inner(page).waitForSelector("[data-revisio]", { state: "attached" });
  await page.tap("#rv-mode");
  await inner(page).tap(".accions-portada .boto");
  await page.waitForSelector("#rv-editor[open]");
  for (const sel of ["#rv-parent", "#rv-cancel", "#rv-save"]) {
    const box = await page.locator(sel).boundingBox();
    assert.ok(box.height >= 44 && box.width >= 44, `${sel} de 44 px o més`);
  }
  await page.click("#rv-cancel");
  for (const sel of ["#rv-mode", "#rv-list-btn"]) {
    const box = await page.locator(sel).boundingBox();
    assert.ok(box.height >= 44 && box.width >= 44, `${sel} de 44 px o més`);
  }
  await ctx.close();
});

for (const [name, fn] of tests) {
  try { await fn(); console.log("✓", name); }
  catch (e) { failed++; console.log("✗", name, "\n ", e.message); }
}
await browser.close();
server.close();
console.log(failed ? `${failed} proves han fallat` : "Totes les proves passen");
process.exit(failed ? 1 : 0);
