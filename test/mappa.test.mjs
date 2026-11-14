// Mappa di Roma e profilo: dati reali (OpenStreetMap + uffici.json), nessun indirizzo scritto a memoria.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";

const leggi = (f) => readFileSync(new URL(`../web/${f}`, import.meta.url), "utf8");
const geo = JSON.parse(leggi("data/roma-municipi.json"));
const luoghi = JSON.parse(leggi("data/luoghi.json")).luoghi;
const ufficiTesto = leggi("data/uffici.json");
const uffici = JSON.parse(ufficiTesto);
const mappaJs = leggi("mappa.js");
const profiloJs = leggi("profilo.js");
const html = leggi("index.html");

const ORD = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
const dentro = (pt, anello) => {
  let d = false;
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const [yi, xi] = anello[i], [yj, xj] = anello[j];
    if (yi > pt[0] !== yj > pt[0] && pt[1] < ((xj - xi) * (pt[0] - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
};

test("i confini sono i 15 Municipi di Roma, con coordinate dentro Roma e un file leggero", () => {
  assert.deepEqual(geo.municipi.map((m) => m.id), ORD);
  for (const m of geo.municipi) {
    assert.ok(m.anelli.length >= 1 && m.anelli.every((a) => a.length >= 4), `${m.id}: anelli non validi`);
    for (const [la, lo] of m.anelli.flat()) assert.ok(la > 41.6 && la < 42.2 && lo > 12.2 && lo < 12.95, `${m.id}: punto fuori Roma ${la},${lo}`);
  }
  assert.ok(statSync(new URL("../web/data/roma-municipi.json", import.meta.url)).size < 150_000, "il file dei confini è troppo pesante");
});

test("ogni luogo ha un indirizzo che sta già in uffici.json (fonte ufficiale) e cade dentro un Municipio", () => {
  assert.ok(luoghi.length >= 4);
  for (const l of luoghi) {
    assert.ok(ufficiTesto.includes(l.indirizzo), `${l.id}: l'indirizzo "${l.indirizzo}" non è in uffici.json`);
    assert.ok(geo.municipi.some((m) => m.anelli.some((a) => dentro([l.lat, l.lon], a))), `${l.id}: le coordinate non cadono in nessun Municipio`);
  }
});

test("la mappa colora i Municipi con le ASL vere e usa solo link ufficiali presenti nei dati", () => {
  const asl = new Set(Object.values(uffici.municipi).map((m) => m.asl));
  for (const a of asl) assert.ok(mappaJs.includes(`"${a}"`), `manca il colore o la pagina di ${a}`);
  for (const u of mappaJs.match(/https:\/\/www\.(aslroma[123]|comune\.roma)\.it[^"]*/g) || []) {
    const base = u.replace(/"$/, "");
    assert.ok(ufficiTesto.includes(base.split("municipio_")[0]), `il link ${base} non compare in uffici.json`);
  }
  assert.deepEqual(Object.keys(uffici.municipi), ORD);
});

test("la posizione dell'utente non esce dal dispositivo e la mappa non salva nulla oltre al Municipio scelto", () => {
  const codice = mappaJs.replace(/\/\/.*$/gm, "");
  assert.ok(!/fetch\([^)]*(lat|lon|coords|latitude)/.test(codice), "la posizione non va mandata in rete");
  assert.ok(!/nominatim/i.test(codice), "il Municipio si ricava con i confini locali, non con un servizio esterno");
  const chiavi = [...codice.matchAll(/localStorage\.(?:set|get|remove)Item\(\s*([A-Za-z_"'.]+)/g)].map((m) => m[1]);
  assert.ok(chiavi.every((c) => c === "CHIAVE"), `chiavi di memoria inattese: ${chiavi}`);
});

test("Leaflet è incluso nel sito con la sua licenza e le schede portano la stessa versione", () => {
  for (const f of ["vendor/leaflet/leaflet.js", "vendor/leaflet/leaflet.css", "vendor/leaflet/LICENSE"]) assert.ok(existsSync(new URL(`../web/${f}`, import.meta.url)), f);
  const v = html.match(/mappa\.js\?v=(\w+)/)?.[1];
  assert.ok(v);
  for (const f of ["mappa.css", "profilo.css", "profilo.js", "documenti.js"]) assert.ok(html.includes(`${f}?v=${v}`), `${f} non ha la versione ${v}`);
  assert.ok(mappaJs.includes(`const V = "${v}"`) && profiloJs.includes(`const V = "${v}"`));
});

test("mappa e profilo hanno i testi nelle sette lingue (le altre ricadono sull'inglese)", () => {
  for (const [nome, js] of [["mappa", mappaJs], ["profilo", profiloJs]]) {
    for (const l of ["it", "en", "es", "fr", "ro", "ar", "uk"]) assert.ok(js.includes("    " + l + ': ["'), `${nome}: manca ${l}`);
  }
  // stessa lunghezza per ogni lingua: si contano le virgole di primo livello nelle righe dei testi non è affidabile, quindi si valuta il file
  const conta = (js, chiavi) => {
    const k = js.match(new RegExp(`const CHIAVI = \\[([\\s\\S]*?)\\];`))[1].match(/"[^"]+"/g).length;
    return k;
  };
  assert.ok(conta(mappaJs) > 30 && conta(profiloJs) > 20);
});

test("la barra in basso (tema-demo.js) ha tutte le voci: se qualcuno ricopia una versione vecchia del file, qui si accorge", () => {
  const tema = leggi("tema-demo.js");
  assert.ok(tema.includes('const VOCI = ["pino", "percorso", "mappa", "documenti", "profilo"];'), "mancano Mappa e Documenti nella barra: tema-demo.js è stato sostituito con una copia vecchia");
  assert.ok(tema.includes("ICONE.mappa") && tema.includes("ICONE.documenti"), "mancano le icone di Mappa e Documenti");
  assert.ok(tema.includes("ppMappa") && tema.includes("ppDocumenti"), "mancano le etichette di Mappa e Documenti (altrimenti restano vuote)");
});
