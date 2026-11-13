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
  const ultimo = call("next_step", { path_id: "iscrizione_anagrafica", completati: "a1,a2,a3,a4" });
  assert.equal(ultimo.passo.id, "a5");
  assert.ok(ultimo.passo.testo.includes("NON VERIFICATO"));
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
  assert.equal(call("next_step", { path_id: "iscrizione_anagrafica", completati: "a1,a2" }).passo.id, "a3");
  const fine = call("next_step", { path_id: "iscrizione_anagrafica", completati: "a3,a4,a5" });
  assert.equal(fine.completato, true);
  assert.equal(fine.scadenze_da_ricordare[0].id, "aggiorna_dopo_rinnovo");
});

test("la carta d'identità è bloccata finché manca la residenza", () => {
  const { call } = setup();
  assert.equal(call("next_step", { path_id: "carta_identita" }).bloccato, true);
  call("next_step", { path_id: "iscrizione_anagrafica", completati: "a1,a2,a3,a4,a5" });
  assert.equal(call("next_step", { path_id: "carta_identita" }).passo.id, "c1");
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
  const r = call("create_reminders", { path_id: "rinnovo_permesso_lavoro", scadenza_id: "presenta_rinnovo", data_evento: "2027-03-31" });
  assert.equal(r.data_promemoria, "2027-01-30");
  assert.match(fx.downloads[0].content, /DTSTART;VALUE=DATE:20270130/);
  assert.match(call("create_reminders", { path_id: "rinnovo_permesso_lavoro", scadenza_id: "x", data_evento: "2027-03-31" }).errore, /sconosciuta/);
});

test("prepare_summary produce HTML con escaping", () => {
  const { call, fx } = setup();
  call("prepare_summary", { path_id: "iscrizione_ssn", lingua: "Română", traduzione: "<b>pași</b>" });
  assert.match(fx.printed[0], /&lt;b&gt;pași&lt;\/b&gt;/);
});

test("il foglio riporta l'ufficio trovato e le fonti con la data", () => {
  const { call, fx } = setup();
  call("find_office", { path_id: "iscrizione_ssn", municipio: "VIII" });
  call("prepare_summary", { path_id: "iscrizione_ssn" });
  assert.match(fx.printed[0], /ASL Roma 2/);
  assert.match(fx.printed[0], /verificate il 2026-11-13/);
  assert.match(fx.printed[0], /aslroma1\.it/);
  assert.ok(!/Distretto VIII/.test(fx.printed[0]));
});

test("handoff restituisce aiuto gratuito", () => {
  const { call, fx } = setup();
  const r = call("handoff", { motivo: "richiesta di asilo" });
  assert.ok(r.dove_chiedere.length > 0);
  assert.deepEqual(fx.handoffs, ["richiesta di asilo"]);
});
