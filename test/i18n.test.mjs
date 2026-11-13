// Lingue, traduzioni dell'interfaccia e direzione della scrittura.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRINCIPALI, ALTRE, TUTTE, RTL, direzione, nomePerAgente, nomeNativo, provataAVoce,
  TESTI, linguaUI, traduttore, linguaSalvata, salvaLingua,
} from "../web/i18n.js";

test("le lingue sono le stesse 89 del menu di prima, senza doppioni", () => {
  // confrontate una volta con il menu del commit 35a55fb: nessuna lingua aggiunta o persa
  assert.equal(TUTTE.length, 89);
  assert.equal(new Set(TUTTE).size, TUTTE.length);
  for (const c of ["it", "en", "ro", "ar", "uk", "fil", "bn", "zh", "ckb", "yue", "ast", "zu"]) assert.ok(TUTTE.includes(c), c);
  for (const c of ["ff", "ln", "ceb", "kam"]) assert.ok(!TUTTE.includes(c), `${c} non è accettata dall'agente`);
});

test("ogni lingua tradotta ha tutti i testi dell'italiano, e nessuno vuoto", () => {
  const chiavi = Object.keys(TESTI.it).sort();
  for (const [code, d] of Object.entries(TESTI)) {
    assert.deepEqual(Object.keys(d).sort(), chiavi, `${code}: chiavi diverse`);
    for (const k of chiavi) assert.ok(d[k].trim(), `${code}.${k} vuoto`);
  }
});

test("i segnaposto {nome} restano in ogni traduzione", () => {
  for (const [code, d] of Object.entries(TESTI)) {
    for (const [k, v] of Object.entries(TESTI.it)) {
      const attesi = (v.match(/\{\w+\}/g) || []).sort();
      assert.deepEqual((d[k].match(/\{\w+\}/g) || []).sort(), attesi, `${code}.${k}`);
    }
  }
});

test("le lingue principali e il bengali hanno l'interfaccia tradotta, le altre l'inglese", () => {
  for (const l of PRINCIPALI) assert.equal(linguaUI(l.code), l.code);
  assert.equal(linguaUI("bn"), "bn");
  assert.equal(linguaUI("de"), "en");
  assert.equal(traduttore("de")("stato.listening"), "I'm listening");
  assert.equal(traduttore("ar")("sys.promemoria", { nome: "x.ics" }), "تم تنزيل التذكير: x.ics");
});

test("arabo, ebraico, persiano, urdu, pashto, sindhi e curdo si scrivono da destra", () => {
  for (const c of ["ar", "he", "fa", "ur", "ps", "sd", "ckb"]) assert.equal(direzione(c), "rtl", c);
  for (const c of ["it", "en", "uk", "bn", "zh", "am"]) assert.equal(direzione(c), "ltr", c);
  for (const c of RTL) assert.ok(TUTTE.includes(c), `${c} non è tra le lingue`);
});

test("all'agente arriva lo stesso nome di lingua di prima", () => {
  assert.equal(nomePerAgente("it"), "Italiano");
  assert.equal(nomePerAgente("ar"), "العربية");
  assert.equal(nomePerAgente("zh"), "Chinese");
  assert.equal(nomePerAgente("ckb"), "Kurdish");
  assert.equal(nomeNativo("de"), "Deutsch");
  assert.equal(provataAVoce("fil"), true);
  assert.equal(provataAVoce("bn"), false, "il bengali non è ancora provato a voce");
});

test("si salva solo una lingua valida; senza memoria non si rompe nulla", () => {
  const m = new Map();
  const storage = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
  salvaLingua("xx", storage);
  assert.equal(linguaSalvata(storage), null);
  salvaLingua("uk", storage);
  assert.equal(linguaSalvata(storage), "uk");
  assert.deepEqual([...m.keys()], ["primoPasso.lingua"], "nient'altro viene salvato");
  salvaLingua(null, storage);
  assert.equal(linguaSalvata(storage), null);
  const rotto = { getItem() { throw new Error("bloccato"); }, setItem() { throw new Error("bloccato"); } };
  assert.equal(linguaSalvata(rotto), null);
  assert.doesNotThrow(() => salvaLingua("it", rotto));
  assert.equal(linguaSalvata(undefined), null);
});

test("ALTRE ha nome inglese e nome nella lingua", () => {
  for (const l of ALTRE) assert.ok(l.inglese && l.nativo, l.code);
});

test("ogni testo usato dalla pagina e da app.js esiste nelle traduzioni", async () => {
  const { readFileSync } = await import("node:fs");
  const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
  const js = readFileSync(new URL("../web/app.js", import.meta.url), "utf8");
  const chiavi = new Set([
    ...[...html.matchAll(/data-t[pa]?="([^"]+)"/g)].map((m) => m[1]),
    ...[...js.matchAll(/\bt\("([^"]+)"/g)].map((m) => m[1]),
    ...["idle", "idleTesto", "listening", "thinking", "speaking", "success"].map((s) => `stato.${s}`),
  ]);
  for (const k of chiavi) assert.ok(k in TESTI.it, `manca la chiave ${k}`);
});

test("la pagina conserva gli elementi su cui contano app e prove dal vivo", async () => {
  const { readFileSync } = await import("node:fs");
  const html = readFileSync(new URL("../web/index.html", import.meta.url), "utf8");
  for (const id of ["voice", "text", "stop", "q", "chat", "log", "steps", "pino", "onboarding", "avanti"]) {
    assert.match(html, new RegExp(`id="${id}"`), `manca #${id}`);
  }
  assert.ok(!/<select id="lang"/.test(html), "la lingua si sceglie nell'onboarding, non più nel menu");
});

test("pagina e moduli locali portano la stessa versione (niente file vecchi dalla cache)", async () => {
  const { readFileSync } = await import("node:fs");
  const leggi = (f) => readFileSync(new URL(`../web/${f}`, import.meta.url), "utf8");
  const html = leggi("index.html");
  const riferimenti = [
    ...[...html.matchAll(/(?:src|href)="([\w-]+\.(?:js|css)[^"]*)"/g)].map((m) => m[1]),
    ...["app.js", "pino-regia.js"].flatMap((f) => [...leggi(f).matchAll(/from "\.\/([^"]+)"/g)].map((m) => m[1])),
  ];
  assert.ok(riferimenti.length >= 8);
  const versioni = new Set(riferimenti.map((r) => r.match(/\?v=(\w+)$/)?.[1] ?? "nessuna"));
  assert.equal(versioni.size, 1, `versioni diverse: ${riferimenti.join(", ")}`);
  assert.ok(!versioni.has("nessuna"), "ogni file locale deve avere ?v=");
});
