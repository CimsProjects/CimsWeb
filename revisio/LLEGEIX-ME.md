# Revisió amb comentaris

Còpies de cada pàgina de la web per deixar-hi comentaris sobre qualsevol element i passar-los a Claude. És el mateix sistema que tempCat (`docs/sistema-revisio-comentaris.md` de MartiFarranC/tempCat).

- Les còpies (`revisio/<pàgina>.html`) carreguen l'original en un iframe del mateix origen, així que mai no queden desfasades. Les pàgines originals no es toquen.
- **💬 Comentar** activa el mode comentari: tocar, fer clic o prémer Enter sobre un element obre l'editor. «Tot el contenidor ↑» amplia la selecció a l'element pare. Esc surt del mode.
- **🗒️ Comentaris** mostra la llista d'aquesta pàgina i exporta els de totes les pàgines: **Copia en Markdown**, **Descarrega .md** o **.json**.
- Es guarden al navegador (`localStorage`, clau `cims.revisio`): pàgina, selector CSS únic, descripció, text visible, secció i amplada de la pantalla. Els del mòbil i els de l'ordinador no es comparteixen.
- La barra pren els colors i la lletra de la pàgina de dins (marca CIMS o Bocins, clar o fosc). Si la pàgina té el menú fix a baix (mòbil), la barra s'hi posa al damunt.

## Pàgines

`index`, `consultoria`, `avis-legal`, `municipis`, `andanes`, `perfil`, `ranquing`, `collabora` i `404`. Si se n'afegeix una de nova, crea `revisio/<nom>.html` (copia'n una i canvia `data-pagina`) i afegeix-ne el nom a `PAGES` de `revisio.js`.

## Prompt per passar els comentaris a Claude

> Aquí tens els comentaris de revisió exportats. Cada un porta la pàgina, el selector CSS de l'element, el text visible i l'amplada de pantalla on el vaig fer. Aplica'ls a les pàgines originals (no a les còpies de `revisio/`). Quan un comentari sigui ambigu, tria la interpretació més probable i digues-me quina has triat. Prova-ho en mòbil i escriptori i puja-ho.

## Proves

```bash
NODE_PATH=$(npm root -g) node tests/revisio.test.mjs   # Playwright i Chromium instal·lats globalment
```
