// Regole di affidabilità: stati di verifica e vincoli imposti dagli strumenti (non dal prompt).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTools, statoOf, riepilogoVerifica } from "../web/tools.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../web/data/${f}`, import.meta.url), "utf8"));
const data = { percorsi: load("percorsi.json"), uffici: load("uffici.json") };
const percorsi = data.percorsi.percorsi;
const tutte = (p) => [...p.prerequisiti, ...p.passi, ...p.scadenze];

// Registra i passi uno alla volta, come impone next_step: una chiamata per ogni passo dichiarato.
function completa(call, pathId, ids) {
  let r;
  for (const id of ids.split(",")) r = call("next_step", { path_id: pathId, completati: id });
  return r;
}

function setup(dati = data) {
  const fx = { printed: [] };
  const t = createTools(dati, { print: (h) => fx.printed.push(h) });
  return { fx, call: (name, p = {}) => JSON.parse(t[name](p)) };
}
const obbligatori = (pathId) =>
  percorsi.find((p) => p.id === pathId).prerequisiti.filter((x) => x.obbligatorio !== false).map((x) => x.id);

// ---------- stati di verifica ----------

test("statoOf distingue umano, automatico e non verificato", () => {
  assert.equal(statoOf({ verificato: false }), "non_verificato");
  assert.equal(statoOf({ verificato: false, controllo: "umano" }), "non_verificato");
  assert.equal(statoOf({ verificato: true, controllo: "automatico" }), "automatico");
  assert.equal(statoOf({ verificato: true }), "automatico");
  assert.equal(statoOf({ verificato: true, controllo: "umano" }), "umano");
  assert.equal(statoOf({ verificato: true, fonte: "interno" }), "umano");
});

test("nei dati nessun controllo automatico è promosso a verifica umana", () => {
  for (const p of percorsi) {
    for (const x of tutte(p)) {
      if (statoOf(x) === "umano") {
        assert.ok(x.controllo === "umano" || x.fonte === "interno", `${p.id}/${x.id} risulta umano senza motivo`);
      }
      if (x.controllo === "automatico") assert.notEqual(statoOf(x), "umano", `${p.id}/${x.id}`);
    }
  }
});

test("ogni voce verificata ha fonte e data (o è un testo interno)", () => {
  for (const p of percorsi) {
    for (const x of tutte(p)) {
      if (!x.verificato) continue;
      assert.ok(x.fonte, `${p.id}/${x.id} senza fonte`);
      if (x.fonte !== "interno") assert.ok(x.verificato_il, `${p.id}/${x.id} senza data di verifica`);
      assert.ok(["automatico", "umano", undefined].includes(x.controllo), `${p.id}/${x.id}: controllo non valido`);
    }
  }
});

test("start_path espone lo stato di ogni documento e l'avviso sul controllo automatico", () => {
  const { call } = setup();
  const r = call("start_path", { path_id: "iscrizione_anagrafica" });
  assert.ok(r.prerequisiti.every((x) => ["umano", "automatico", "non_verificato"].includes(x.stato)));
  const n = r.verifica;
  assert.equal(n.umano + n.automatico + n.non_verificato, percorsi[0].prerequisiti.length + percorsi[0].passi.length + percorsi[0].scadenze.length);
  assert.ok(n.automatico > 0);
  assert.match(r.avviso_verifica, /AUTOMATICO/);
  assert.match(r.avviso_verifica, /Non dire mai/);
});

test("se tutto fosse verificato da una persona non compare nessun avviso", () => {
  const copia = structuredClone(data);
  for (const p of copia.percorsi.percorsi) for (const x of tutte(p)) { x.verificato = true; x.controllo = "umano"; }
  const { call } = setup(copia);
  assert.equal(call("start_path", { path_id: "iscrizione_ssn" }).avviso_verifica, undefined);
});

test("il foglio con tutto verificato da una persona lo dice, altrimenti no", () => {
  const copia = structuredClone(data);
  for (const p of copia.percorsi.percorsi) for (const x of tutte(p)) { x.verificato = true; x.controllo = "umano"; x.verificato_il = "2026-11-13"; }
  const a = setup(copia);
  a.call("prepare_summary", { path_id: "iscrizione_ssn" });
  assert.match(a.fx.printed[0], /verificate da una persona il 2026-11-13/);
  const b = setup();
  b.call("prepare_summary", { path_id: "iscrizione_ssn" });
  assert.ok(!/verificate da una persona/.test(b.fx.printed[0]));
});

test("find_office: un ufficio controllato in automatico non risulta verificato", () => {
  const { call } = setup();
  const r = call("find_office", { path_id: "iscrizione_ssn", municipio: "VIII" });
  assert.equal(r.stato, "automatico");
  assert.equal(r.verificato, false);
  assert.match(r.avviso, /non ancora da una persona/);
});

test("find_office: con la mappa Municipio-ASL non verificata l'ufficio è non verificato", () => {
  const copia = structuredClone(data);
  copia.uffici.mappa_verificata = false;
  const r = setup(copia).call("find_office", { path_id: "iscrizione_ssn", municipio: "VIII" });
  assert.equal(r.stato, "non_verificato");
  assert.match(r.avviso, /NON VERIFICATO/);
});

// ---------- vincoli imposti dagli strumenti ----------

test("un passo non si completa fuori ordine", () => {
  const { call } = setup();
  const r = call("next_step", { path_id: "iscrizione_anagrafica", completati: "a2" });
  assert.equal(r.rifiutati[0].passo, "a2");
  assert.equal(r.rifiutati[0].motivo, "ordine");
  assert.deepEqual(r.rifiutati[0].da_fare_prima, ["a1"]);
  assert.equal(r.passo.id, "a1");
  assert.equal(r.fatti, 0);
});

test("senza documenti obbligatori non si completa nemmeno il primo passo (raccogliere i documenti)", () => {
  const { call } = setup();
  const r = call("next_step", { path_id: "iscrizione_anagrafica", completati: "a1,a2,a3" });
  assert.equal(r.fatti, 0);
  assert.equal(r.passo.id, "a1");
  assert.equal(r.rifiutati[0].passo, "a1");
  assert.equal(r.rifiutati[0].motivo, "documenti_mancanti");
  assert.ok(r.rifiutati[0].mancanti.some((m) => m.id === "passaporto"));
  assert.match(r.istruzione_rifiuto, /NON sono stati segnati/);
});

test("anche un solo documento obbligatorio mancante blocca il passo", () => {
  const { call } = setup();
  const senzaPassaporto = obbligatori("iscrizione_anagrafica").filter((id) => id !== "passaporto").join(",");
  call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: senzaPassaporto });
  const r = completa(call, "iscrizione_anagrafica", "a1");
  assert.deepEqual(r.rifiutati[0].mancanti.map((m) => m.id), ["passaporto"]);
  assert.equal(r.fatti, 0);
  // con il documento che mancava, il passo si registra
  call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: "passaporto" });
  assert.equal(completa(call, "iscrizione_anagrafica", "a1").fatti, 1);
});

test("con i documenti obbligatori il passo si completa, anche senza quelli facoltativi", () => {
  const { call } = setup();
  const ids = obbligatori("iscrizione_anagrafica");
  assert.ok(!ids.includes("titolo_alloggio"), "titolo_alloggio è condizionale e non deve bloccare");
  const c = call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: ids.join(",") });
  assert.equal(c.ha_tutto, true);
  assert.ok(c.mancanti.some((m) => m.id === "titolo_alloggio"), "resta nell'elenco dei mancanti non obbligatori");
  const r = completa(call, "iscrizione_anagrafica", "a1,a2,a3");
  assert.equal(r.rifiutati, undefined);
  assert.equal(r.passo.id, "a4");
});

test("un id di documento sconosciuto è un errore, non un documento mancante", () => {
  const { call } = setup();
  // caso reale (conversazione conv_3701m7bj0h6ke1grhethc4pcm7xc): l'agente ha scritto "permesso_soggiorno"
  const r = call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: "passaporto,permesso_soggiorno" });
  assert.match(r.errore, /permesso_soggiorno/);
  assert.match(r.errore, /Nulla è stato registrato/);
  assert.deepEqual(r.id_non_riconosciuti, ["permesso_soggiorno"]);
  assert.ok(r.id_validi.some((x) => x.id === "permesso_o_ricevuta"));
  assert.equal(r.mancanti_obbligatori, undefined, "nessun elenco di mancanti da riferire all'utente");
  assert.equal(r.ha_tutto, undefined);
});

test("con un id sconosciuto lo stato non cambia: i documenti dichiarati prima restano", () => {
  const { call } = setup();
  const ids = obbligatori("iscrizione_anagrafica").join(",");
  call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: ids });
  call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: "passaporto,xyz" });
  const r = completa(call, "iscrizione_anagrafica", "a1,a2,a3");
  assert.equal(r.rifiutati, undefined, "i documenti validi dichiarati prima valgono ancora");
  assert.equal(r.passo.id, "a4");
});

test("dopo la correzione degli id il risultato è quello giusto", () => {
  const { call } = setup();
  call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: "passaporto,permesso_soggiorno" });
  const r = call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: "passaporto, permesso_o_ricevuta" });
  assert.equal(r.errore, undefined);
  assert.deepEqual(r.mancanti_obbligatori.map((m) => m.id), ["codice_fiscale", "dati_occupazione"]);
});

test("ha_tutto è falso finché manca un documento obbligatorio", () => {
  const { call } = setup();
  const c = call("check_prerequisites", { path_id: "iscrizione_ssn", posseduti: "codice_fiscale" });
  assert.equal(c.ha_tutto, false);
  assert.ok(c.mancanti_obbligatori.length > 0);
  assert.match(c.istruzione, /obbligatori/);
});

test("in un percorso bloccato da un altro non si segna nessun passo", () => {
  const { call } = setup();
  const b = call("next_step", { path_id: "carta_identita", completati: "c1,c2,c3" });
  assert.equal(b.bloccato, true);
  assert.equal(b.fatti, undefined);
  // dopo aver fatto la residenza, la carta riparte dal primo passo: niente è stato segnato di nascosto
  call("check_prerequisites", { path_id: "iscrizione_anagrafica", posseduti: obbligatori("iscrizione_anagrafica").join(",") });
  completa(call, "iscrizione_anagrafica", "a1,a2,a3,a4");
  assert.equal(call("next_step", { path_id: "carta_identita" }).passo.id, "c1");
});

test("tutti i percorsi: nessun passo con i documenti si completa senza check_prerequisites", () => {
  for (const p of percorsi) {
    const gated = p.passi.filter((s) => s.richiede_prerequisiti);
    for (const g of gated) {
      const { call } = setup();
      if (p.dipende_da?.some((d) => d.obbligatorio)) continue; // coperto dal test sulle dipendenze
      // si dichiarano i passi uno alla volta fino a quello vincolato: senza documenti, a un certo punto si ferma
      const fino = p.passi.slice(0, p.passi.indexOf(g) + 1).filter((s) => !s.informativo);
      let rifiuto = null;
      for (const s of fino) {
        const r = call("next_step", { path_id: p.id, completati: s.id });
        rifiuto = r.rifiutati?.find((x) => x.motivo === "documenti_mancanti");
        if (rifiuto) break;
      }
      assert.ok(rifiuto, `${p.id}/${g.id} si è completato senza documenti`);
      assert.ok(fino.indexOf(p.passi.find((x) => x.id === rifiuto.passo)) <= fino.indexOf(g), `${p.id}: fermato dopo ${g.id}`);
    }
  }
});

// ---------- integrità dei dati ----------

test("integrità: id unici, dipendenze e uffici esistono, passi vincolati hanno documenti", () => {
  const ids = percorsi.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of percorsi) {
    for (const lista of [p.prerequisiti, p.passi, p.scadenze]) {
      const i = lista.map((x) => x.id);
      assert.equal(new Set(i).size, i.length, `${p.id}: id duplicati`);
    }
    for (const d of p.dipende_da || []) assert.ok(ids.includes(d.percorso), `${p.id}: dipendenza ${d.percorso} inesistente`);
    assert.ok(data.uffici.uffici[p.ufficio], `${p.id}: ufficio ${p.ufficio} inesistente`);
    if (p.passi.some((s) => s.richiede_prerequisiti)) {
      assert.ok(p.prerequisiti.some((x) => x.obbligatorio !== false), `${p.id}: passi vincolati senza documenti obbligatori`);
    }
  }
});

test("integrità: tutti i Municipi I-XV hanno la ASL", () => {
  const romani = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
  for (const m of romani) assert.match(data.uffici.municipi[m]?.asl || "", /^ASL Roma [123]$/, `Municipio ${m}`);
});

test("riepilogoVerifica conta ogni voce una volta", () => {
  const p = percorsi[0];
  const n = riepilogoVerifica(tutte(p));
  assert.equal(n.umano + n.automatico + n.non_verificato, tutte(p).length);
});

test("lo script di verifica elenca le voci non umane e nessuna umana", async () => {
  const { elencoDaVerificare } = await import("../scripts/da-verificare.mjs");
  const righe = elencoDaVerificare(data.percorsi, data.uffici);
  assert.ok(righe.length > 0);
  assert.ok(righe.every((r) => r.stato === "automatico" || r.stato === "non_verificato"));
  assert.ok(righe.some((r) => r.fonti.length > 0));
  const copia = structuredClone(data);
  for (const p of copia.percorsi.percorsi) for (const x of tutte(p)) { x.verificato = true; x.controllo = "umano"; }
  for (const u of Object.values(copia.uffici.uffici)) { u.verificato = true; u.controllo = "umano"; }
  for (const a of copia.uffici.aiuto_gratuito) { a.verificato = true; a.controllo = "umano"; }
  assert.equal(elencoDaVerificare(copia.percorsi, copia.uffici).length, 0);
});
