// Gli stati di Pino seguono solo eventi reali della conversazione.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STATI, inizio, evento, vista, prossimaScadenza, esitoPositivo, contaFatti, DEFAULT } from "../web/pino-state.js";
import { createTools } from "../web/tools.js";

// Esegue una sequenza [istante, evento] e restituisce lo stato finale.
const run = (eventi, s = inizio()) => eventi.reduce((acc, [t, e]) => evento(acc, e, t), s);
const voce = (t = 0) => [[t, { type: "sessione", soloTesto: false }], [t, { type: "status", status: "connected" }]];
const chat = (t = 0) => [[t, { type: "sessione", soloTesto: true }], [t, { type: "status", status: "connected" }]];

test("cinque stati, nell'ordine di precedenza", () => {
  assert.deepEqual(STATI, ["idle", "listening", "thinking", "speaking", "success"]);
});

test("senza sessione Pino è fermo; in connessione resta fermo", () => {
  assert.equal(vista(inizio(), 0), "idle");
  assert.equal(vista(run([[0, { type: "status", status: "connecting" }]]), 0), "idle");
});

test("voce: connesso ascolta, l'agente parla, poi torna ad ascoltare", () => {
  let s = run(voce());
  assert.equal(vista(s, 1), "listening");
  s = evento(s, { type: "mode", mode: "speaking" }, 2);
  assert.equal(vista(s, 2), "speaking");
  s = evento(s, { type: "mode", mode: "listening" }, 3);
  assert.equal(vista(s, 3), "listening");
});

test("voce: dalla fine del turno dell'utente alla risposta Pino pensa", () => {
  let s = run([...voce(), [100, { type: "turnoUtente" }]]);
  assert.equal(vista(s, 200), "thinking");
  s = evento(s, { type: "mode", mode: "speaking" }, 900);
  assert.equal(vista(s, 900), "speaking");
  s = evento(s, { type: "mode", mode: "listening" }, 3000);
  assert.equal(vista(s, 3000), "listening", "dopo aver parlato non torna a pensare");
});

test("pensare non dura per sempre: dopo il tempo massimo torna ad ascoltare", () => {
  const s = run([...voce(), [0, { type: "turnoUtente" }]]);
  assert.equal(vista(s, DEFAULT.thinkMax - 1), "thinking");
  assert.equal(vista(s, DEFAULT.thinkMax), "listening");
  assert.equal(prossimaScadenza(s, 10), DEFAULT.thinkMax);
});

test("mentre lavora uno strumento Pino pensa, anche oltre il tempo massimo", () => {
  let s = run([...voce(), [0, { type: "strumentoInizio" }]]);
  assert.equal(vista(s, DEFAULT.thinkMax * 3), "thinking");
  s = evento(s, { type: "strumentoFine", successo: false }, 50000);
  assert.equal(vista(s, 50001), "thinking", "dopo lo strumento l'agente deve ancora rispondere");
  assert.equal(vista(s, 50000 + DEFAULT.thinkMax), "listening");
});

test("due strumenti in parallelo: pensa finché non finiscono entrambi", () => {
  let s = run([...voce(), [0, { type: "strumentoInizio" }], [0, { type: "strumentoInizio" }], [10, { type: "strumentoFine" }]]);
  assert.equal(s.strumenti, 1);
  s = evento(evento(s, { type: "strumentoFine" }, 20), { type: "strumentoFine" }, 30);
  assert.equal(s.strumenti, 0, "non scende sotto zero");
});

test("successo: solo per un attimo, poi torna allo stato reale", () => {
  let s = run([...voce(), [0, { type: "strumentoInizio" }], [100, { type: "strumentoFine", successo: true }]]);
  assert.equal(vista(s, 100), "success");
  assert.equal(vista(s, 100 + DEFAULT.successMs - 1), "success");
  assert.equal(vista(s, 100 + DEFAULT.successMs), "thinking");
  s = evento(s, { type: "mode", mode: "speaking" }, 200);
  assert.equal(vista(s, 200), "success", "il successo ha la precedenza anche se parla");
  assert.equal(vista(s, 100 + DEFAULT.successMs), "speaking");
});

test("uno strumento senza esito positivo non mostra il successo", () => {
  const s = run([...voce(), [0, { type: "strumentoInizio" }], [10, { type: "strumentoFine", successo: false }]]);
  assert.notEqual(vista(s, 11), "success");
});

test("chat scritta: ferma, ascolta mentre scrivi, pensa dopo l'invio, parla quando arriva la risposta", () => {
  let s = run(chat());
  assert.equal(vista(s, 1), "idle");
  s = evento(s, { type: "scrive", on: true }, 2);
  assert.equal(vista(s, 2), "listening");
  s = evento(s, { type: "turnoUtente" }, 3);
  assert.equal(vista(s, 3), "thinking");
  s = evento(s, { type: "rispostaAgente" }, 1000);
  assert.equal(vista(s, 1000), "speaking");
  assert.equal(vista(s, 1000 + DEFAULT.testoMs), "idle");
  assert.equal(prossimaScadenza(s, 1001), 1000 + DEFAULT.testoMs);
});

test("in voce la risposta scritta non tiene Pino a parlare: conta la modalità di ElevenLabs", () => {
  const s = run([...voce(), [0, { type: "turnoUtente" }], [10, { type: "rispostaAgente" }]]);
  assert.equal(vista(s, 11), "listening");
});

test("alla disconnessione si azzera tutto (salvo un successo appena mostrato)", () => {
  let s = run([...voce(), [0, { type: "strumentoInizio" }], [5, { type: "mode", mode: "speaking" }]]);
  s = evento(s, { type: "status", status: "disconnected" }, 10);
  assert.equal(vista(s, 10), "idle");
  assert.equal(s.strumenti, 0);
  assert.equal(s.agenteParla, false);
});

test("la voce dell'utente (VAD) è un dettaglio dell'ascolto, non uno stato", () => {
  const s = run([...voce(), [0, { type: "vad", score: 0.9 }]]);
  assert.equal(s.voceUtente, true);
  assert.equal(vista(s, 1), "listening");
});

// ---------- successo solo da esiti veri degli strumenti ----------

const load = (f) => JSON.parse(readFileSync(new URL(`../web/data/${f}`, import.meta.url), "utf8"));
const data = { percorsi: load("percorsi.json"), uffici: load("uffici.json") };

test("next_step è un successo solo se un passo in più risulta fatto", () => {
  let stato = null;
  const t = createTools(data, { onState: (s) => (stato = s) });
  const prima = contaFatti(stato);
  const r1 = t.next_step({ path_id: "iscrizione_anagrafica", completati: "a1" });
  assert.equal(esitoPositivo("next_step", r1, prima, contaFatti(stato)), true);
  const dopo1 = contaFatti(stato);
  const r2 = t.next_step({ path_id: "iscrizione_anagrafica", completati: "a3" }); // fuori ordine: rifiutato
  assert.equal(esitoPositivo("next_step", r2, dopo1, contaFatti(stato)), false);
  const r3 = t.next_step({ path_id: "carta_identita", completati: "c1" }); // percorso bloccato
  assert.equal(esitoPositivo("next_step", r3, dopo1, contaFatti(stato)), false);
});

test("foglio e promemoria sono un successo solo se creati davvero", () => {
  const t = createTools(data, { print() {}, download() {} });
  assert.equal(esitoPositivo("prepare_summary", t.prepare_summary({ path_id: "iscrizione_ssn" }), 0, 0), true);
  assert.equal(esitoPositivo("prepare_summary", t.prepare_summary({ path_id: "iscrizione_ssn", lingua: "Filipino" }), 0, 0), false);
  const ok = t.create_reminders({ path_id: "rinnovo_permesso_lavoro", scadenza_id: "presenta_rinnovo", data_evento: "2027-03-31" });
  assert.equal(esitoPositivo("create_reminders", ok, 0, 0), true);
  assert.equal(esitoPositivo("create_reminders", t.create_reminders({ path_id: "rinnovo_permesso_lavoro", scadenza_id: "x", data_evento: "2027-03-31" }), 0, 0), false);
});

test("gli altri strumenti, gli errori e le risposte illeggibili non sono successi", () => {
  const t = createTools(data, {});
  assert.equal(esitoPositivo("start_path", t.start_path({ path_id: "iscrizione_ssn" }), 0, 0), false);
  assert.equal(esitoPositivo("handoff", t.handoff({ motivo: "x" }), 0, 0), false);
  assert.equal(esitoPositivo("next_step", "{non json", 0, 1), false);
  assert.equal(esitoPositivo("next_step", JSON.stringify({ errore: "x" }), 0, 1), false);
});
