// Esegui con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTools } from "../web/tools.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../web/data/${f}`, import.meta.url), "utf8"));
const data = { percorsi: load("percorsi.json"), uffici: load("uffici.json") };

function setup() {
  const fx = { downloads: [], printed: [], handoffs: [] };
  const t = createTools(data, {
    download: (name, content) => fx.downloads.push({ name, content }),
    print: (html) => fx.printed.push(html),
    onHandoff: (m) => fx.handoffs.push(m),
  });
  return { t, fx, call: (name, p = {}) => JSON.parse(t[name](p)) };
}

// Dichiara di avere tutti i documenti obbligatori del percorso (come farebbe l'utente a voce).
function possiedi(call, pathId) {
  const p = data.percorsi.percorsi.find((x) => x.id === pathId);
  const ids = p.prerequisiti.filter((x) => x.obbligatorio !== false).map((x) => x.id).join(",");
  return call("check_prerequisites", { path_id: pathId, posseduti: ids });
}

// Registra i passi uno alla volta, come impone next_step: una chiamata per ogni passo dichiarato.
function completa(call, pathId, ids) {
  let r;
  for (const id of ids.split(",")) r = call("next_step", { path_id: pathId, completati: id });
  return r;
}

test("list_paths elenca tutti i percorsi", () => {
  const { call } = setup();
  const ids = call("list_paths").map((p) => p.id);
  assert.deepEqual(ids, ["iscrizione_anagrafica", "iscrizione_ssn", "rinnovo_permesso_lavoro", "carta_identita"]);
});

test("percorso sconosciuto restituisce errore e non inventa", () => {
  const { call } = setup();
  assert.match(call("start_path", { path_id: "cittadinanza" }).errore, /sconosciuto/);
});

test("solo gli elementi non verificati sono marcati", () => {
  const { call } = setup();
  const r = call("start_path", { path_id: "iscrizione_anagrafica" });
  assert.ok(r.prerequisiti.every((p) => !p.testo.includes("NON VERIFICATO")));
  possiedi(call, "iscrizione_anagrafica");
  const ultimo = completa(call, "iscrizione_anagrafica", "a1,a2,a3,a4");
  // a5 è un'informazione: non si segna, ma si legge con la sua etichetta
  assert.equal(ultimo.completato, true);
  assert.equal(ultimo.informazioni[0].id, "a5");
  assert.ok(ultimo.informazioni[0].testo.includes("NON VERIFICATO"));
  assert.equal(ultimo.informazioni[0].stato, "non_verificato");
});

test("check_prerequisites calcola i mancanti", () => {
  const { call } = setup();
  call("start_path", { path_id: "iscrizione_anagrafica" });
  const r = call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: "passaporto, codice_fiscale" });
  assert.equal(r.ha_tutto, false);
  assert.deepEqual(r.mancanti.map((m) => m.id), ["permesso_o_ricevuta", "titolo_alloggio", "dati_occupazione"]);
});

test("next_step segue l'ordine e poi propone le scadenze", () => {
  const { call } = setup();
  assert.equal(call("next_step", { path_id: "iscrizione_anagrafica" }).passo.id, "a1");
  possiedi(call, "iscrizione_anagrafica");
  assert.equal(completa(call, "iscrizione_anagrafica", "a1,a2").passo.id, "a3");
  const fine = completa(call, "iscrizione_anagrafica", "a3,a4");
  assert.equal(fine.completato, true);
  assert.equal(fine.scadenze_da_ricordare[0].id, "aggiorna_dopo_rinnovo");
});

test("la carta d'identità è bloccata finché manca la residenza", () => {
  const { call } = setup();
  assert.equal(call("next_step", { path_id: "carta_identita" }).bloccato, true);
  possiedi(call, "iscrizione_anagrafica");
  completa(call, "iscrizione_anagrafica", "a1,a2,a3,a4");
  assert.equal(call("next_step", { path_id: "carta_identita" }).passo.id, "c1");
});

test("per il Municipio VIII find_office dà gli sportelli ASL, per gli altri no", () => {
  const { call } = setup();
  const r = call("find_office", { path_id: "iscrizione_ssn", municipio: "VIII" });
  assert.ok(r.sportelli_vicini.elenco.some((s) => /San Nemesio 21/.test(s.indirizzo)));
  assert.equal(call("find_office", { path_id: "iscrizione_ssn", municipio: "I" }).sportelli_vicini, undefined);
  assert.equal(call("find_office", { path_id: "iscrizione_anagrafica", municipio: "VIII" }).sportelli_vicini, undefined);
});

test("find_office usa la ASL del Municipio", () => {
  const { call } = setup();
  assert.match(call("find_office", { path_id: "iscrizione_ssn", municipio: "viii" }).ufficio, /ASL Roma 2/);
  assert.match(call("find_office", { path_id: "iscrizione_ssn", municipio: "XX" }).errore, /non valido/);
  assert.equal(call("find_office", { path_id: "iscrizione_anagrafica", municipio: "VIII" }).contatti_municipio.pec, "protocollo.municipioroma08@pec.comune.roma.it");
  assert.equal(call("find_office", { path_id: "iscrizione_ssn", municipio: "VIII" }).contatti_municipio, undefined);
});

test("create_reminders crea un .ics alla data giusta", () => {
  const { call, fx } = setup();
  const giorni = data.percorsi.percorsi.find((p) => p.id === "rinnovo_permesso_lavoro").scadenze.find((s) => s.id === "presenta_rinnovo").giorni_prima_evento;
  const atteso = new Date(Date.UTC(2027, 2, 31) - giorni * 86400000).toISOString().slice(0, 10);
  const r = call("create_reminders", { path_id: "rinnovo_permesso_lavoro", scadenza_id: "presenta_rinnovo", data_evento: "2027-03-31" });
  assert.equal(r.data_promemoria, atteso);
  assert.match(fx.downloads[0].content, new RegExp("DTSTART;VALUE=DATE:" + atteso.replaceAll("-", "")));
  assert.match(call("create_reminders", { path_id: "rinnovo_permesso_lavoro", scadenza_id: "x", data_evento: "2027-03-31" }).errore, /sconosciuta/);
});

test("start_path dà le scadenze e il promemoria si crea senza finire il percorso", () => {
  const { call, fx } = setup();
  for (const p of data.percorsi.percorsi) {
    const s = call("start_path", { path_id: p.id });
    assert.deepEqual(s.scadenze_disponibili.map((x) => x.id), p.scadenze.map((x) => x.id));
    for (const x of s.scadenze_disponibili) assert.ok(["umano", "automatico", "non_verificato"].includes(x.stato), `${p.id}/${x.id}`);
  }
  const p = data.percorsi.percorsi.find((x) => x.scadenze.length);
  const s = call("start_path", { path_id: p.id });
  const r = call("create_reminders", { path_id: p.id, scadenza_id: s.scadenze_disponibili[0].id, data_evento: "2027-03-31" });
  assert.equal(r.creato, true);
  assert.equal(fx.downloads.length, 1);
});

test("prepare_summary produce HTML con escaping", () => {
  const { call, fx } = setup();
  const lunga = "<b>pași</b> " + "x".repeat(200);
  call("prepare_summary", { path_id: "iscrizione_ssn", lingua: "Română", traduzione: lunga });
  assert.match(fx.printed[0], /&lt;b&gt;pași&lt;\/b&gt;/);
});

test("in un'altra lingua senza traduzione il foglio non si crea e arrivano i testi", () => {
  const { call, fx } = setup();
  const r = call("prepare_summary", { path_id: "iscrizione_ssn", lingua: "Filipino" });
  assert.equal(r.creato, false);
  assert.equal(fx.printed.length, 0);
  assert.equal(r.testi_da_tradurre.passi.length, 4);
  assert.equal(r.testi_da_tradurre.documenti.length, 4);
});

test("in italiano il foglio si crea anche senza traduzione", () => {
  const { call, fx } = setup();
  assert.equal(call("prepare_summary", { path_id: "iscrizione_ssn" }).creato, true);
  assert.equal(call("prepare_summary", { path_id: "iscrizione_ssn", lingua: "Italiano" }).creato, true);
  assert.equal(fx.printed.length, 2);
});

test("il foglio riporta l'ufficio trovato e le fonti con la data", () => {
  const { call, fx } = setup();
  call("find_office", { path_id: "iscrizione_ssn", municipio: "VIII" });
  call("prepare_summary", { path_id: "iscrizione_ssn" });
  assert.match(fx.printed[0], /ASL Roma 2/);
  assert.match(fx.printed[0], /controllate in modo automatico il 2026-11-13/);
  assert.ok(!/verificate da una persona/.test(fx.printed[0]), "un controllo automatico non è una verifica umana");
  assert.match(fx.printed[0], /aslroma1\.it/);
  assert.ok(!/Distretto VIII/.test(fx.printed[0]));
});

test("handoff restituisce aiuto gratuito", () => {
  const { call, fx } = setup();
  const r = call("handoff", { motivo: "richiesta di asilo" });
  assert.ok(r.dove_chiedere.length > 0);
  assert.deepEqual(fx.handoffs, ["richiesta di asilo"]);
});
