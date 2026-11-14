// Scheda Documenti (mockup): i collegamenti ai percorsi vengono dai prerequisiti reali.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const js = readFileSync(new URL("../web/documenti.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
const dati = JSON.parse(readFileSync(new URL("../web/data/percorsi.json", import.meta.url), "utf8"));

test("ogni prerequisito reale di percorsi.json è collegato a un documento della scheda (nessuno sparisce in silenzio)", () => {
  const di = js.match(/const DI = \{([\s\S]*?)\};/)[1];
  const ids = [...di.matchAll(/(\w+):\s*"(\w+)"/g)].map((m) => m[1]);
  for (const p of dati.percorsi) for (const q of p.prerequisiti) assert.ok(ids.includes(q.id), `${p.id}: il prerequisito ${q.id} non è nella scheda Documenti`);
  const docs = [...js.matchAll(/\{ id: "(\w+)", icona/g)].map((m) => m[1]);
  for (const m of di.matchAll(/(\w+):\s*"(\w+)"/g)) assert.ok(docs.includes(m[2]), `${m[1]} -> ${m[2]}: documento inesistente`);
});

test("la scheda dichiara di essere un mockup con dati di esempio e non carica né salva nulla", () => {
  for (const l of ["it", "en", "es", "fr", "ro", "ar", "uk"]) {
    assert.ok(js.includes("    " + l + ': ["'), `manca la lingua ${l}`);
  }
  assert.ok(js.includes('"Mockup concettuale"'));
  assert.ok(js.includes('"Dati di esempio"'));
  assert.ok(js.includes("Caricato · Esempio"));
  const codice = js.replace(/\/\/.*$/gm, "");
  assert.ok(!/type="file"|FileReader|localStorage|indexedDB|XMLHttpRequest/i.test(codice), "il mockup non deve caricare né salvare nulla");
});

test("pagina e file della scheda portano la stessa versione", () => {
  const hv = html.match(/documenti\.js\?v=(\w+)/)?.[1];
  assert.ok(hv && html.includes(`documenti.css?v=${hv}`));
  assert.equal(js.match(/data\/percorsi\.json\?v=(\w+)/)?.[1], hv);
});
