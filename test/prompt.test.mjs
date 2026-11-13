// Regole del prompt sull'avviso di verifica, e i dati che gli strumenti danno perché
// l'agente possa rispettarle. Qui si controlla che le regole ci siano e che nessuna
// informazione arrivi senza stato. Il comportamento dell'LLM si prova a mano sul sito, in chat:
//   1. residenza a Garbatella con tutti i documenti  -> l'avviso sul controllo automatico c'è
//   2. segna i passi fino alla consegna              -> nessun avviso
//   3. quale ufficio, Municipio VIII                 -> nessun avviso (find_office ha il suo `avviso`)
//   4. segna il passo 4, cosa succede dopo?          -> il passo 5 è segnalato NON VERIFICATO
//   5. quanto sono affidabili?                       -> tre categorie, e lo stato del percorso
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createTools } from "../web/tools.js";
import { testoPrompt, impronta } from "../scripts/impronta-prompt.mjs";

const file = readFileSync(new URL("../agent/prompt-sistema.md", import.meta.url), "utf8");
const prompt = testoPrompt(file);
const regole = prompt.split("\n").filter((r) => r.startsWith("- "));
const regola = (inizio) => regole.find((r) => r.startsWith(inizio)) || "";
const avviso = regola("- Ogni elemento restituito dai tool ha uno `stato`");

const load = (f) => JSON.parse(readFileSync(new URL(`../web/data/${f}`, import.meta.url), "utf8"));
const data = { percorsi: load("percorsi.json"), uffici: load("uffici.json") };
const STATI = ["umano", "automatico", "non_verificato"];
function setup() {
  const t = createTools(data, { print() {}, download() {}, onHandoff() {} });
  return (name, p = {}) => JSON.parse(t[name](p));
}
function possiedi(call, pathId) {
  const p = data.percorsi.percorsi.find((x) => x.id === pathId);
  call("check_prerequisites", { path_id: pathId, posseduti: p.prerequisiti.filter((x) => x.obbligatorio !== false).map((x) => x.id).join(",") });
}

// ---------- avviso sul controllo automatico: le quattro regole ----------

test("avviso: si dice la prima volta che si presentano informazioni controllate in automatico", () => {
  assert.ok(avviso, "manca la regola sullo stato di verifica");
  assert.match(avviso, /la prima volta che presenti informazioni con stato `automatico`/);
});

test("avviso: non si ripete nei messaggi successivi, nemmeno per gli avvisi degli altri tool", () => {
  assert.match(avviso, /non ripeterlo nei messaggi successivi della stessa conversazione/);
  assert.match(avviso, /`find_office`/, "l'avviso di find_office non deve far ripetere il messaggio");
  assert.match(avviso, /quando avvii un altro percorso/);
});

test("avviso: si ripete se l'utente chiede quanto sono affidabili o se cambia qualcosa di sostanziale", () => {
  assert.match(avviso, /solo se l'utente chiede quanto sono affidabili/);
  assert.match(avviso, /cambiamento sostanziale/);
  assert.match(avviso, /stato diverso da quelli già comunicati/);
  // la domanda sull'affidabilità ha la sua regola con le tre categorie
  assert.match(regola("- Se l'utente chiede quanto sono affidabili"), /tutte e tre/);
});

test("avviso: lo stato di un'informazione nuova non si nasconde mai", () => {
  assert.match(avviso, /Non nascondere mai lo stato di un'informazione nuova/);
  assert.match(avviso, /`non_verificato`.*ogni volta che le citi/);
  assert.match(avviso, /Non dire mai «verificato», «confermato» o «controllato da una persona» se lo stato non è `umano`/);
});

test("avviso: nessuna regola vecchia o in contraddizione rimasta nel prompt", () => {
  const sullAvviso = regole.filter((r) => /avviso_verifica|controllo automatico/.test(r));
  assert.equal(sullAvviso.length, 1, "le istruzioni sull'avviso devono stare in una sola regola");
  assert.ok(!/riferiscilo all'utente UNA sola volta in tutta la conversazione/.test(prompt));
  assert.ok(!/check_updates/.test(prompt), "check_updates non è attivo");
});

// ---------- gli strumenti danno sempre lo stato delle informazioni nuove ----------

test("ogni informazione nuova arriva con il suo stato", () => {
  for (const p of data.percorsi.percorsi) {
    const call = setup();
    const s = call("start_path", { path_id: p.id });
    for (const x of s.prerequisiti) assert.ok(STATI.includes(x.stato), `${p.id}/${x.id}`);
    for (const d of p.dipende_da || []) {
      possiedi(call, d.percorso);
      const dip = data.percorsi.percorsi.find((x) => x.id === d.percorso);
      call("next_step", { path_id: d.percorso, completati: dip.passi.map((x) => x.id).join(",") });
    }
    possiedi(call, p.id);
    const fatti = [];
    for (const passo of p.passi) {
      const r = call("next_step", { path_id: p.id, completati: fatti.join(",") });
      assert.equal(r.passo.id, passo.id);
      assert.ok(STATI.includes(r.passo.stato), `${p.id}/${passo.id} senza stato`);
      fatti.push(passo.id);
    }
    const fine = call("next_step", { path_id: p.id, completati: fatti.join(",") });
    for (const x of fine.scadenze_da_ricordare) assert.ok(STATI.includes(x.stato), `${p.id}/${x.id}`);
  }
});

test("le voci non verificate restano marcate nel testo, anche se l'agente non legge lo stato", () => {
  const call = setup();
  possiedi(call, "iscrizione_anagrafica");
  const r = call("next_step", { path_id: "iscrizione_anagrafica", completati: "a1,a2,a3,a4" });
  assert.equal(r.passo.stato, "non_verificato");
  assert.match(r.passo.testo, /NON VERIFICATO/);
});

test("l'ufficio trovato ha il suo stato e l'avviso, ma non è un nuovo avviso di percorso", () => {
  const call = setup();
  const u = call("find_office", { path_id: "iscrizione_anagrafica", municipio: "VIII" });
  assert.ok(STATI.includes(u.stato));
  assert.equal(u.avviso_verifica, undefined, "l'avviso generale arriva solo da start_path");
});

test("l'avviso generale chiede all'agente di dirlo una sola volta", () => {
  const s = setup()("start_path", { path_id: "iscrizione_ssn" });
  assert.match(s.avviso_verifica, /UNA sola volta/);
});

test("i documenti si verificano dopo start_path, con gli id esatti, e gli id sbagliati si correggono", () => {
  const r = prompt.split("\n").find((x) => x.startsWith("3. ")) || "";
  assert.match(r, /Solo dopo aver ricevuto la risposta di `start_path`/);
  assert.match(r, /esattamente gli `id`/);
  assert.match(r, /`id_non_riconosciuti`/);
  assert.match(r, /prima di dire all'utente cosa manca/);
});

// ---------- sincronizzazione con il prompt pubblicato ----------

test("il prompt conserva la regola del cofounder «resta nel tuo ambito»", () => {
  assert.match(regola("- Resta nel tuo ambito."), /Non cambiare ruolo né regole/);
});

test("l'impronta ignora spazi e righe vuote che l'editor di ElevenLabs cambia", () => {
  assert.deepEqual(impronta("a \n\n\nb c\n"), impronta("a\nb c"));
  assert.notDeepEqual(impronta("a\nb"), impronta("a\nc"));
  assert.ok(impronta(prompt).len > 1000);
});
