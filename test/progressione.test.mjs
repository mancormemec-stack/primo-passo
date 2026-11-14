// Priorità 3, fase 2: avanzamento senza deduzioni, imposto dagli strumenti (non dal prompt).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTools, azioniDi, informazioniDi, ORIGINE } from "../web/tools.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../web/data/${f}`, import.meta.url), "utf8"));
const data = { percorsi: load("percorsi.json"), uffici: load("uffici.json") };
const percorsi = data.percorsi.percorsi;
const path = (id) => percorsi.find((p) => p.id === id);
const obbligatori = (id) => path(id).prerequisiti.filter((x) => x.obbligatorio !== false).map((x) => x.id);

function setup(dati = data) {
  const fx = { printed: [], states: [] };
  const t = createTools(dati, { print: (h) => fx.printed.push(h), onState: (s) => fx.states.push(s) });
  return { fx, t, call: (name, p = {}) => JSON.parse(t[name](p)) };
}
const docs = (call, id, ids = obbligatori(id).join(",")) => call("check_prerequisites", { path_id: id, posseduti: ids });
const passo = (call, id, ...passi) => {
  let r;
  for (const x of passi) r = call("next_step", { path_id: id, completati: x });
  return r;
};
const RES = "iscrizione_anagrafica";

// ---------- a5 è un'informazione ----------

test("dati: a5 è informativo, a1 richiede i documenti, e gli informativi stanno in fondo al percorso", () => {
  const a = path(RES);
  assert.equal(a.passi.find((x) => x.id === "a5").informativo, true);
  assert.equal(a.passi.find((x) => x.id === "a1").richiede_prerequisiti, true);
  assert.deepEqual(azioniDi(a).map((x) => x.id), ["a1", "a2", "a3", "a4"]);
  assert.deepEqual(informazioniDi(a).map((x) => x.id), ["a5"]);
  for (const p of percorsi) {
    const i = p.passi.findIndex((x) => x.informativo);
    if (i >= 0) assert.ok(p.passi.slice(i).every((x) => x.informativo), `${p.id}: un passo informativo non può stare prima di un'azione`);
  }
});

test("a5 non conta nel «N su M»: start_path e next_step contano solo le azioni", () => {
  const { call } = setup();
  assert.equal(call("start_path", { path_id: RES }).numero_passi, 4);
  docs(call, RES);
  const r = passo(call, RES, "a1");
  assert.equal(r.fatti, 1);
  assert.equal(r.totale, 4);
});

test("un percorso con un passo informativo si completa senza segnarlo", () => {
  const { call } = setup();
  docs(call, RES);
  const r = passo(call, RES, "a1", "a2", "a3", "a4");
  assert.equal(r.completato, true);
  assert.equal(r.fatti, 4);
  assert.equal(r.totale, 4);
  // a5 resta visibile, ma come informazione, e con la sua etichetta di verifica
  assert.equal(r.informazioni.length, 1);
  assert.equal(r.informazioni[0].id, "a5");
  assert.match(r.informazioni[0].testo, /NON VERIFICATO/);
  assert.ok(!r.registrati.includes("a5"));
});

test("a5 non si può registrare, nemmeno chiedendolo: è un'informazione, non un'azione", () => {
  const { call } = setup();
  docs(call, RES);
  passo(call, RES, "a1", "a2", "a3", "a4");
  const r = call("next_step", { path_id: RES, completati: "a5" });
  assert.equal(r.rifiutati[0].passo, "a5");
  assert.equal(r.rifiutati[0].motivo, "informativo");
  assert.match(r.istruzione_rifiuto, /informativo/);
  assert.ok(!r.registrati.includes("a5"));
  assert.equal(r.fatti, 4, "il conteggio non cambia");
});

test("a5 non si registra insieme ad a4: si segna a4 e basta", () => {
  const { call } = setup();
  docs(call, RES);
  passo(call, RES, "a1", "a2", "a3");
  const r = call("next_step", { path_id: RES, completati: "a1,a2,a3,a4,a5" });
  assert.deepEqual(r.registrato_ora.map((x) => x.id), ["a4"]);
  assert.ok(r.rifiutati.some((x) => x.passo === "a5" && x.motivo === "informativo"));
});

// ---------- carta d'identità ----------

test("la carta d'identità si sblocca dopo a4 (iscrizione), senza a5", () => {
  const { call } = setup();
  docs(call, RES);
  passo(call, RES, "a1", "a2", "a3");
  assert.equal(call("next_step", { path_id: "carta_identita" }).bloccato, true, "con a3 fatto ma non a4 resta bloccata");
  passo(call, RES, "a4");
  const r = call("next_step", { path_id: "carta_identita" });
  assert.equal(r.bloccato, undefined);
  assert.equal(r.passo.id, "c1");
  const dip = call("start_path", { path_id: "carta_identita" }).prima_di_iniziare;
  assert.equal(dip[0].stato, "completato");
});

test("la carta d'identità resta bloccata se manca a4, anche se tutto il resto è dichiarato", () => {
  const { call } = setup();
  docs(call, RES);
  passo(call, RES, "a1", "a2", "a3");
  for (const tentativo of ["c1", "c1,c2,c3", "c2"]) {
    const r = call("next_step", { path_id: "carta_identita", completati: tentativo });
    assert.equal(r.bloccato, true, tentativo);
    assert.equal(r.registrato_ora, undefined);
  }
});

test("chi è già residente: dichiara documenti e passi, uno per chiamata, e sblocca la carta", () => {
  const { call } = setup();
  // «sono già residente»: Pino chiede una volta se aveva i documenti, poi registra a1..a4 dichiarati
  assert.equal(call("next_step", { path_id: "carta_identita" }).bloccato, true);
  const d = docs(call, RES);
  assert.equal(d.ha_tutto, true);
  assert.match(d.nota, /dichiarato dall'utente/);
  const registrati = [];
  for (const id of ["a1", "a2", "a3", "a4"]) {
    const r = call("next_step", { path_id: RES, completati: id });
    assert.equal(r.rifiutati, undefined, id);
    registrati.push(...r.registrato_ora.map((x) => x.id));
    for (const x of r.registrato_ora) assert.equal(x.origine, ORIGINE);
  }
  assert.deepEqual(registrati, ["a1", "a2", "a3", "a4"]);
  assert.equal(call("next_step", { path_id: "carta_identita" }).passo.id, "c1");
});

// ---------- un solo passo per chiamata ----------

test("un solo passo nuovo per chiamata: gli altri vengono rifiutati con il motivo", () => {
  const { call } = setup();
  docs(call, RES);
  const r = call("next_step", { path_id: RES, completati: "a1,a2,a3" });
  assert.deepEqual(r.registrato_ora.map((x) => x.id), ["a1"]);
  assert.equal(r.fatti, 1);
  const motivi = Object.fromEntries(r.rifiutati.map((x) => [x.passo, x.motivo]));
  assert.equal(motivi.a2, "uno_alla_volta");
  assert.equal(motivi.a3, "ordine", "a3 non può precedere a2");
  assert.match(r.istruzione_rifiuto, /UN solo passo per chiamata/);
  assert.equal(r.passo.id, "a2");
});

test("un elenco con i passi già registrati più uno nuovo registra solo quello nuovo", () => {
  const { call } = setup();
  docs(call, RES);
  passo(call, RES, "a1");
  const r = call("next_step", { path_id: RES, completati: "a1,a2" });
  assert.deepEqual(r.registrato_ora.map((x) => x.id), ["a2"]);
  assert.equal(r.rifiutati, undefined);
  // ripetere la stessa chiamata non registra nulla di nuovo
  const ancora = call("next_step", { path_id: RES, completati: "a1,a2" });
  assert.deepEqual(ancora.registrato_ora, []);
  assert.equal(ancora.fatti, 2);
});

test("nessun percorso si completa in blocco con una chiamata sola", () => {
  for (const p of percorsi) {
    if (p.dipende_da?.some((d) => d.obbligatorio)) continue;
    const { call } = setup();
    docs(call, p.id);
    const r = call("next_step", { path_id: p.id, completati: p.passi.map((x) => x.id).join(",") });
    assert.equal(r.completato, undefined, `${p.id} completato in una sola chiamata`);
    assert.equal(r.fatti, 1, p.id);
  }
});

// ---------- prerequisiti anche per a1 ----------

test("a1 (raccogliere i documenti) richiede i documenti obbligatori dichiarati", () => {
  const { call } = setup();
  const r = call("next_step", { path_id: RES, completati: "a1" });
  assert.equal(r.fatti, 0);
  assert.equal(r.rifiutati[0].motivo, "documenti_mancanti");
  assert.deepEqual(r.rifiutati[0].mancanti.map((m) => m.id), obbligatori(RES));
  const senzaUno = obbligatori(RES).filter((id) => id !== "codice_fiscale").join(",");
  docs(call, RES, senzaUno);
  assert.deepEqual(call("next_step", { path_id: RES, completati: "a1" }).rifiutati[0].mancanti.map((m) => m.id), ["codice_fiscale"]);
  docs(call, RES, "codice_fiscale");
  assert.equal(call("next_step", { path_id: RES, completati: "a1" }).fatti, 1);
});

test("i documenti facoltativi non bloccano a1; nessun avanzamento se manca un obbligatorio", () => {
  const { call } = setup();
  assert.ok(!obbligatori(RES).includes("titolo_alloggio"));
  docs(call, RES);
  assert.equal(call("next_step", { path_id: RES, completati: "a1" }).fatti, 1);
  const { call: c2 } = setup();
  docs(c2, RES, "titolo_alloggio");
  assert.equal(c2("next_step", { path_id: RES, completati: "a1" }).fatti, 0);
});

// ---------- l'elenco dei documenti dichiarati si conserva ----------

test("check_prerequisites conserva i documenti già dichiarati: ogni chiamata aggiunge", () => {
  const { call } = setup();
  docs(call, RES, "passaporto,permesso_o_ricevuta,codice_fiscale");
  const r = docs(call, RES, "dati_occupazione");
  assert.equal(r.ha_tutto, true, "passando solo il documento nuovo i precedenti non spariscono");
  assert.deepEqual(r.mancanti_obbligatori, []);
  assert.deepEqual([...r.dichiarati_dall_utente].sort(), [...obbligatori(RES)].sort());
  assert.equal(call("next_step", { path_id: RES, completati: "a1" }).fatti, 1);
});

test("un documento dichiarato per errore si toglie con «-id»; un id sconosciuto non cambia nulla", () => {
  const { call } = setup();
  docs(call, RES);
  const r = docs(call, RES, "-codice_fiscale");
  assert.equal(r.ha_tutto, false);
  assert.deepEqual(r.mancanti_obbligatori.map((m) => m.id), ["codice_fiscale"]);
  assert.ok(!r.dichiarati_dall_utente.includes("codice_fiscale"));
  assert.equal(call("next_step", { path_id: RES, completati: "a1" }).fatti, 0, "senza il documento il passo si ferma");
  const err = docs(call, RES, "-xyz");
  assert.deepEqual(err.id_non_riconosciuti, ["xyz"]);
  assert.equal(err.dichiarati_dall_utente, undefined);
  const dopo = docs(call, RES, "codice_fiscale");
  assert.equal(dopo.ha_tutto, true, "lo stato non è stato toccato dall'errore");
});

test("il tutto è per percorso: i documenti di un percorso non valgono per un altro", () => {
  const { call } = setup();
  docs(call, RES);
  const r = call("next_step", { path_id: "iscrizione_ssn", completati: "s1" });
  assert.ok(r.fatti === 1, "s1 non richiede documenti");
  assert.equal(call("next_step", { path_id: "iscrizione_ssn", completati: "s2" }).rifiutati[0].motivo, "documenti_mancanti");
});

// ---------- «Dichiarato dall'utente» ----------

test("ogni registrazione è etichettata come dichiarata dall'utente, mai come verificata", () => {
  const { call } = setup();
  const d = docs(call, RES);
  assert.match(d.nota, /dichiarato dall'utente/);
  assert.match(d.nota, /non è verificato/);
  const r = passo(call, RES, "a1");
  assert.equal(r.registrato_ora[0].origine, "dichiarato dall'utente");
  assert.match(r.origine_registrazione, /non è verificato da Primo Passo né confermato da un ufficio/);
});

test("a fine percorso lo strumento dice che l'esito lo decide l'ufficio", () => {
  const { call } = setup();
  docs(call, RES);
  const r = passo(call, RES, "a1", "a2", "a3", "a4");
  assert.match(r.istruzione, /dichiarato dall'utente/);
  assert.match(r.istruzione, /non vuol dire che la pratica sia conclusa o accettata/i);
  assert.match(r.istruzione, /l'esito lo decide l'ufficio/);
  assert.match(r.istruzione, /informazioni sono da leggere come tali/);
});

test("il foglio distingue ☑ dichiarato dall'utente, ☐ da fare e ℹ informazione, con la legenda", () => {
  const { call, fx } = setup();
  docs(call, RES);
  passo(call, RES, "a1", "a2");
  call("prepare_summary", { path_id: RES });
  const html = fx.printed[0];
  assert.match(html, /☑ = dichiarato dall'utente: non è verificato da Primo Passo né confermato da un ufficio/);
  assert.match(html, /<h2>Passi<\/h2><ul>(<li>☑[^]*?){2}<li>☐/);
  assert.match(html, /<h2>Informazioni<\/h2><ul><li>ℹ Conclusa l'iscrizione/);
  assert.ok(!/<li>[☑☐] Conclusa l'iscrizione/.test(html), "a5 non ha la casella: non è un passo da fare");
  assert.match(html, /NON VERIFICATO/, "l'etichetta di a5 resta");
});

test("il foglio in un'altra lingua riceve legenda e informazioni da tradurre", () => {
  const { call } = setup();
  const r = call("prepare_summary", { path_id: RES, lingua: "Filipino" });
  assert.equal(r.creato, false);
  assert.equal(r.testi_da_tradurre.passi.length, 4);
  assert.equal(r.testi_da_tradurre.informazioni.length, 1);
  assert.match(r.testi_da_tradurre.legenda, /dichiarato dall'utente/);
});

// ---------- percorsi bloccati non aggirabili ----------

test("un percorso bloccato non avanza: né un passo, né più passi, né la richiesta di un passo informativo", () => {
  const { call, fx } = setup();
  docs(call, "carta_identita");
  for (const completati of ["c1", "c1,c2,c3", "c3"]) {
    const r = call("next_step", { path_id: "carta_identita", completati });
    assert.equal(r.bloccato, true, completati);
    assert.equal(r.registrati, undefined);
  }
  const ultimo = fx.states.at(-1).percorsi.carta_identita;
  assert.deepEqual(ultimo.completati, []);
});

test("sbloccare un percorso richiede le azioni dichiarate: nessuna scorciatoia con documenti o informazioni", () => {
  const { call } = setup();
  docs(call, RES);
  call("next_step", { path_id: RES, completati: "a5" }); // l'informazione non vale come passo
  passo(call, RES, "a1", "a2", "a3");
  assert.equal(call("next_step", { path_id: "carta_identita" }).bloccato, true);
});

// ---------- correzione 1: richieste fatte mentre il percorso è bloccato ----------

const CIE = "carta_identita";
const sblocca = (call) => {
  docs(call, RES);
  passo(call, RES, "a1", "a2", "a3", "a4");
};

test("caso della prova dal vivo: «segna la prenotazione» mentre la carta è bloccata NON si recupera da sola dopo lo sblocco", () => {
  const { call } = setup();
  // 1. «Sono già residente… segna come fatta la prenotazione»: la carta è bloccata
  const bloccata = call("next_step", { path_id: CIE, completati: "c1" });
  assert.equal(bloccata.bloccato, true);
  assert.match(bloccata.richiesta_non_conservata, /NON vale e NON resta in attesa/);
  assert.equal(bloccata.registrati, undefined, "niente è stato registrato");
  // 2. l'utente dichiara i passi della residenza e la carta si sblocca
  sblocca(call);
  // 3. Pino prova a recuperare la richiesta di prima, senza che l'utente l'abbia confermata di nuovo
  const recupero = call("next_step", { path_id: CIE, completati: "c1" });
  assert.equal(recupero.rifiutati[0].passo, "c1");
  assert.equal(recupero.rifiutati[0].motivo, "richiesta_durante_il_blocco");
  assert.deepEqual(recupero.registrato_ora, []);
  assert.equal(recupero.fatti, 0, "la prenotazione NON risulta fatta");
  assert.match(recupero.istruzione_rifiuto, /richiesto mentre il percorso era bloccato/);
  assert.match(recupero.istruzione_rifiuto, /aspetta la sua risposta esplicita/);
  assert.match(recupero.istruzione_rifiuto, /Non recuperare richieste precedenti/);
  // 4. solo dopo una conferma esplicita dell'utente, una NUOVA chiamata registra il passo
  const confermato = call("next_step", { path_id: CIE, completati: "c1" });
  assert.deepEqual(confermato.registrato_ora.map((x) => x.id), ["c1"]);
  assert.equal(confermato.fatti, 1);
});

test("più passi richiesti durante il blocco: ognuno richiede la sua conferma", () => {
  const { call } = setup();
  call("next_step", { path_id: CIE, completati: "c1,c2,c3" });
  sblocca(call);
  docs(call, CIE);
  const primo = call("next_step", { path_id: CIE, completati: "c1" });
  assert.equal(primo.rifiutati[0].motivo, "richiesta_durante_il_blocco");
  assert.equal(call("next_step", { path_id: CIE, completati: "c1" }).fatti, 1);
  const secondo = call("next_step", { path_id: CIE, completati: "c1,c2" });
  assert.equal(secondo.rifiutati[0].passo, "c2");
  assert.equal(secondo.rifiutati[0].motivo, "richiesta_durante_il_blocco");
  assert.equal(secondo.fatti, 1);
  assert.equal(call("next_step", { path_id: CIE, completati: "c2" }).fatti, 2);
});

test("guardare lo stato mentre il percorso è bloccato (senza completati) non crea nessuna richiesta da rifiutare", () => {
  const { call } = setup();
  assert.equal(call("next_step", { path_id: CIE }).bloccato, true);
  assert.equal(call("next_step", { path_id: CIE, completati: "" }).richiesta_non_conservata, undefined);
  sblocca(call);
  const r = call("next_step", { path_id: CIE, completati: "c1" });
  assert.deepEqual(r.registrato_ora.map((x) => x.id), ["c1"], "una richiesta fatta DOPO lo sblocco vale subito");
  assert.equal(r.rifiutati, undefined);
});

test("la richiesta durante il blocco non cambia lo stato né sblocca nulla", () => {
  const { call, fx } = setup();
  call("next_step", { path_id: CIE, completati: "c1,c2,c3" });
  call("next_step", { path_id: CIE, completati: "c1,c2,c3" });
  const stato = fx.states.at(-1)?.percorsi?.[CIE];
  assert.deepEqual(stato?.completati ?? [], []);
  assert.equal(call("next_step", { path_id: CIE }).bloccato, true, "resta bloccata");
});

test("una richiesta durante il blocco non toglie i controlli: l'ordine vale ancora", () => {
  const { call } = setup();
  call("next_step", { path_id: CIE, completati: "c2" });
  sblocca(call);
  const r = call("next_step", { path_id: CIE, completati: "c2" });
  assert.equal(r.rifiutati[0].motivo, "ordine", "c2 non può precedere c1");
  assert.deepEqual(r.rifiutati[0].da_fare_prima, ["c1"]);
  assert.equal(r.fatti, 0);
});

test("una richiesta durante il blocco non aggira i documenti obbligatori della carta", () => {
  const { call } = setup();
  call("next_step", { path_id: CIE, completati: "c1,c2" });
  sblocca(call);
  call("next_step", { path_id: CIE, completati: "c1" }); // rifiutato (richiesta durante il blocco)
  call("next_step", { path_id: CIE, completati: "c1" }); // c1 registrato dopo conferma
  call("next_step", { path_id: CIE, completati: "c1,c2" }); // c2: richiesta durante il blocco, rifiutata
  const r = call("next_step", { path_id: CIE, completati: "c1,c2" }); // confermata, ma mancano i documenti
  assert.equal(r.rifiutati[0].motivo, "documenti_mancanti");
  assert.equal(r.fatti, 1);
});

// ---------- convenzione «-id» ----------

test("«-id» è davvero supportato: si toglie, anche con spazi, e si può rimettere", () => {
  const { call } = setup();
  docs(call, RES);
  const senza = docs(call, RES, "- codice_fiscale , -passaporto");
  assert.deepEqual(senza.mancanti_obbligatori.map((m) => m.id).sort(), ["codice_fiscale", "passaporto"]);
  assert.equal(senza.ha_tutto, false);
  assert.equal(call("next_step", { path_id: RES, completati: "a1" }).fatti, 0, "senza i documenti obbligatori nessun avanzamento");
  const dinuovo = docs(call, RES, "codice_fiscale,passaporto");
  assert.equal(dinuovo.ha_tutto, true);
  assert.equal(call("next_step", { path_id: RES, completati: "a1" }).fatti, 1);
});

test("«-id» di un documento mai dichiarato non fa danni; togliere un documento non annulla un passo già registrato", () => {
  const { call } = setup();
  const r = docs(call, RES, "-codice_fiscale");
  assert.equal(r.ha_tutto, false);
  assert.ok(!r.dichiarati_dall_utente.includes("codice_fiscale"));
  docs(call, RES);
  passo(call, RES, "a1");
  docs(call, RES, "-codice_fiscale");
  assert.equal(call("next_step", { path_id: RES }).fatti, 1);
  assert.equal(call("next_step", { path_id: RES, completati: "a2" }).fatti, 2, "a2 non richiede i documenti");
  assert.equal(call("next_step", { path_id: RES, completati: "a3" }).rifiutati[0].motivo, "documenti_mancanti", "a3 sì");
});
