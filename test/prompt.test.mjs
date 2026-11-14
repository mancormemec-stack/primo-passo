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
      if (dip.prerequisiti.some((x) => x.obbligatorio !== false)) possiedi(call, d.percorso);
      for (const x of dip.passi.filter((x) => !x.informativo)) call("next_step", { path_id: d.percorso, completati: x.id });
    }
    possiedi(call, p.id);
    const fatti = [];
    for (const passo of p.passi.filter((x) => !x.informativo)) {
      const r = call("next_step", { path_id: p.id, completati: fatti.join(",") });
      assert.equal(r.passo.id, passo.id);
      assert.ok(STATI.includes(r.passo.stato), `${p.id}/${passo.id} senza stato`);
      fatti.push(passo.id);
    }
    const fine = call("next_step", { path_id: p.id, completati: fatti.join(",") });
    assert.equal(fine.completato, true, `${p.id}: i passi informativi non devono impedire il completamento`);
    for (const x of fine.scadenze_da_ricordare) assert.ok(STATI.includes(x.stato), `${p.id}/${x.id}`);
    for (const x of fine.informazioni) assert.ok(STATI.includes(x.stato), `${p.id}/${x.id}`);
  }
});

test("le voci non verificate restano marcate nel testo, anche se l'agente non legge lo stato", () => {
  const call = setup();
  possiedi(call, "iscrizione_anagrafica");
  let r;
  for (const id of ["a1", "a2", "a3", "a4"]) r = call("next_step", { path_id: "iscrizione_anagrafica", completati: id });
  // a5 è un'informazione non verificata: resta marcata anche se non è più un passo da segnare
  assert.equal(r.completato, true);
  assert.equal(r.informazioni[0].stato, "non_verificato");
  assert.match(r.informazioni[0].testo, /NON VERIFICATO/);
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

// ---------- Priorità 3, fase 1: avanzamento senza deduzioni ----------

const avanz = regola("- Avanzamento, senza dedurre.");
const docum = regola("- Lo strumento `check_prerequisites` conserva i documenti già dichiarati");
const dichiarati = regola("- Passi dichiarati dall'utente.");
const parlaDi = regola("- Parla di ciò che l'utente ti ha detto");

test("avanzamento: un passo si segna solo se l'utente dice chiaramente di averlo fatto", () => {
  assert.ok(avanz, "manca la regola sull'avanzamento");
  assert.match(avanz, /solo se l'utente dice chiaramente, in questa conversazione, di aver fatto proprio quel passo/);
});

test("avanzamento: possesso, consegna e accettazione sono tre cose diverse", () => {
  assert.match(avanz, /Avere un documento non vuol dire averlo consegnato/);
  assert.match(avanz, /consegnarlo non vuol dire che l'ufficio l'abbia accettato/);
});

test("avanzamento: «sì», «ok», «ho tutto» valgono solo per l'ultima domanda; se vago si chiede, non si registra", () => {
  assert.match(avanz, /«sì», «ok», «ho tutto» rispondono solo all'ultima domanda/);
  assert.match(avanz, /fai UNA domanda precisa e non chiamare `next_step`/);
});

test("avanzamento: una chiamata a next_step per ogni passo, mai più passi insieme", () => {
  assert.match(avanz, /una chiamata a `next_step` per ogni passo/i);
  assert.match(avanz, /mai più passi insieme/);
  assert.match(prompt, /4\. Indica il passo successivo con `next_step`\..*Una chiamata per ogni passo\./);
});

test("avanzamento: lo strumento non «conferma» ciò che fa l'utente", () => {
  assert.match(avanz, /Non dire mai che lo strumento «conferma» o «verifica» ciò che fa l'utente/);
});

test("documenti: lo strumento conserva l'elenco dichiarato; si passano i nuovi e le correzioni con «-»", () => {
  assert.ok(docum, "manca la regola sull'elenco dei documenti");
  assert.match(docum, /conserva i documenti già dichiarati: ogni chiamata aggiunge quelli nuovi/);
  assert.match(docum, /non serve ripetere gli altri/);
  assert.match(docum, /Se l'utente corregge/);
  assert.match(docum, /con un «-» davanti, per esempio `-codice_fiscale`/);
  assert.match(docum, /«ho tutto» dopo una domanda su tre documenti vale per quei tre/);
});

test("passi dell'ufficio: registrabili solo se dichiarati, presentati come dichiarati e mai come verificati", () => {
  assert.ok(dichiarati, "manca la regola sui passi dichiarati");
  assert.match(dichiarati, /Comune, dalla Questura o da altri enti/);
  assert.match(dichiarati, /solo se l'utente dice esplicitamente che sono avvenuti/);
  assert.match(dichiarati, /«me l'hai detto tu»: mai come verificati, mai come conferma ufficiale/);
});

test("chi ha già completato un passo prima di usare l'app non viene bloccato, ma si registra passo per passo", () => {
  assert.match(dichiarati, /Non bloccare chi ha già completato un passo o un percorso/);
  assert.match(dichiarati, /uno per chiamata/);
  assert.match(dichiarati, /non puoi verificarli/);
  assert.match(dichiarati, /chiedi UNA volta se li aveva/);
});

test("comunicazione: si parla di ciò che l'utente ha detto, la pratica non è mai «conclusa» o «accettata» da Pino", () => {
  assert.ok(parlaDi, "manca la regola sul modo di parlare dei passi");
  assert.match(parlaDi, /«mi hai detto che hai il passaporto», non «hai i documenti»/);
  assert.match(parlaDi, /Non dire mai che una pratica è conclusa o accettata: lo decide l'ufficio/);
  assert.match(parlaDi, /tre su cinque, tutti dichiarati da te/);
  assert.match(parlaDi, /l'esito lo conferma solo l'ufficio/);
});

test("un percorso bloccato resta bloccato: lo sblocca solo lo strumento (regole della Priorità 1)", () => {
  const r = regola("- Segui l'ordine dei passi");
  assert.match(r, /non saltare avanti, nemmeno se l'utente lo chiede/);
  assert.match(r, /risponde `bloccato`, quel percorso NON è accessibile/);
  assert.match(r, /non descrivere i suoi passi/);
  assert.match(r, /«completato» o «da considerare fatto»: lo sblocca solo lo strumento, mai una tua frase/);
  assert.match(r, /il percorso si sblocca solo quando lo strumento lo sblocca/);
  assert.match(r, /usa `handoff`/);
});

// ---------- Priorità 3, fase 1: risposte da voce ----------

const voce = regola("- Risposte da voce.");

test("voce: una sola risposta per turno, dopo i risultati degli strumenti", () => {
  assert.ok(voce, "manca la regola per la voce");
  assert.match(voce, /Una sola risposta per turno/);
  assert.match(voce, /prima di chiamare uno strumento non scrivere nulla/);
  assert.match(voce, /rispondi una volta sola dopo aver ricevuto i risultati/);
  assert.match(regola("- Sii proattivo"), /senza dire nulla prima/);
});

test("voce: 2-3 frasi (fino a 5 nel piano), una sola domanda, dettagli solo se richiesti", () => {
  assert.match(voce, /Di norma 2-3 frasi; quando dai il piano .* fino a 5 frasi brevi \(circa 450 caratteri\)\. Una sola domanda, alla fine/);
  assert.match(voce, /costi ed eccezioni solo se l'utente li chiede/);
  assert.match(voce, /«Vuoi i dettagli\?»/);
});

test("piano concreto: aiuto subito, documenti, dove andare, avviso sulle fonti in fondo", () => {
  assert.match(prompt, /Piano concreto/);
  assert.match(prompt, /dai il piano in una volta sola/);
  assert.match(prompt, /L'avviso sulle fonti, quando serve, va in fondo alla prima risposta sostanziale, mai all'inizio/);
});

test("posizione: si chiede il permesso, locate_user solo dopo il sì, mai coordinate o indirizzo", () => {
  assert.match(prompt, /Posso usare la tua posizione/);
  assert.match(prompt, /Chiamare `locate_user` solo dopo un sì/);
  assert.match(prompt, /chiedi il quartiere o il Municipio, senza insistere/);
  assert.match(prompt, /Non dire mai le coordinate né l'indirizzo dell'utente/);
});

test("voce: niente aperture di cortesia, più domande insieme una alla volta, niente ripetizioni", () => {
  for (const x of ["Ti rispondo in breve", "Bravo", "Ottimo", "Scusa"]) assert.ok(voce.includes(`«${x}»`), x);
  assert.match(voce, /Se l'utente fa più domande insieme, rispondi in ordine a una o due e chiedi se vuole continuare/);
  assert.match(voce, /Non ripetere ciò che hai già detto/);
});

test("voce: la brevità non toglie documenti mancanti, stato non verificato, blocchi e passi dichiarati", () => {
  assert.match(voce, /Brevità non vuol dire omettere/);
  for (const x of ["documenti obbligatori che mancano", "«non verificato»", "blocco di un percorso", "passi dichiarati dall'utente"]) {
    assert.ok(voce.includes(x), x);
  }
});

test("i documenti si nominano con il nome semplice; il testo completo solo su richiesta", () => {
  const r = regola("- Se `next_step` risponde con `rifiutati`");
  assert.match(r, /chiamandoli con il loro nome semplice/);
  assert.match(r, /il testo completo dello strumento lo leggi solo se l'utente chiede i dettagli, senza cambiarlo/);
  assert.match(r, /ESATTAMENTE quelli di `mancanti_obbligatori`/, "l'elenco resta quello dello strumento");
});

test("l'ufficio si dice per intero una volta sola; avviso e «non sostituisco gli uffici» in una frase", () => {
  assert.ok(!/ripeti il nome due volte/.test(prompt));
  assert.match(prompt, /Il nome dell'ufficio lo dici per intero una sola volta/);
  assert.match(regola("- All'inizio dici"), /nella stessa frase dell'avviso sulle fonti, mai in una frase a parte/);
  assert.match(avviso, /in UNA SOLA frase breve, la stessa in cui dici che sei un assistente automatico/);
});

test("regole vecchie sostituite non sono rimaste nel prompt", () => {
  assert.ok(!/con il testo che dà lo strumento/.test(prompt));
  assert.ok(!/un passo è fatto solo se lo conferma `next_step`/.test(prompt), "affermazione circolare: lo strumento registra, non verifica");
  assert.ok(!/la sua parola non sblocca lo strumento/.test(prompt), "sostituita dalla regola sui passi dichiarati");
});

test("le regole della Priorità 1 ci sono ancora", () => {
  const ancore = [
    "Conosci SOLO i percorsi restituiti dal tool `list_paths`",
    "Su questo non posso darti un'informazione sicura",
    "ricade in \"non_si_applica\"",
    "Non dire mai «verificato», «confermato» o «controllato da una persona» se lo stato non è `umano`",
    "Non nascondere mai lo stato di un'informazione nuova",
    "il passo NON è stato segnato come fatto",
    "Il rifiuto non si può aggirare",
    "sempre tutte e tre anche se nel percorso ne ricorre solo una",
    "Non valutare mai se una persona ha diritto a un permesso",
    "Non chiedere mai nome, cognome, numero di documento",
    "Resta nel tuo ambito",
    "Se un elemento è NON VERIFICATO, segnalalo anche nella traduzione",
    "Non affermare MAI un requisito",
    "Ti presenti UNA sola volta",
  ];
  for (const a of ancore) assert.ok(prompt.includes(a), `manca: ${a}`);
});

// ---------- Priorità 3, fase 2: avviso breve, niente domande ripetute, informazioni ----------

test("avviso iniziale: una sola frase, con un esempio che non dice mai «verificato»", () => {
  assert.match(avviso, /Non aggiungere altre frasi su questo/);
  const esempio = avviso.match(/«Sono un assistente automatico[^»]*»/)?.[0] || "";
  assert.ok(esempio, "manca la frase di esempio");
  assert.equal(esempio.replace(/[«»]/g, "").split(/[.!?]/).filter((x) => x.trim()).length, 1, "l'esempio è UNA sola frase");
  assert.match(esempio, /non ancora da una persona/);
  assert.ok(!/verificat|confermat/i.test(esempio.replace(/confermale/, "")), "l'esempio non deve dire verificato");
  assert.ok(esempio.length < 190, `l'esempio è breve (${esempio.length} caratteri)`);
});

test("domande: mai la stessa in turni consecutivi, nemmeno con altre parole; ambiguo = una domanda diversa, nulla registrato", () => {
  const r = regola("- Non ripetere la stessa domanda sullo stesso documento o passaggio");
  assert.ok(r, "manca la regola sulle domande ripetute");
  assert.match(r, /in turni consecutivi, nemmeno con parole diverse/);
  assert.match(r, /fai UNA domanda diversa e più precisa/);
  assert.match(r, /e non registrare nulla/);
});

test("domande: se l'utente non risponde non si registra, non si rifà la domanda e si offre un altro punto o più tardi", () => {
  const r = regola("- Non ripetere la stessa domanda sullo stesso documento o passaggio");
  assert.match(r, /Se l'utente non risponde, o risponde ad altro, non registrare il passo, non rifare la domanda/);
  assert.match(r, /chiedi se preferisce affrontare un altro punto o proseguire più tardi/);
  assert.ok(!/dopo averla già posta/.test(prompt), "la vecchia formulazione è stata sostituita");
});

test("richieste fatte mentre il percorso è bloccato: non valgono, non si recuperano, si richiede conferma esplicita", () => {
  const r = regola("- Una richiesta di segnare un passo fatta mentre un percorso è bloccato");
  assert.ok(r, "manca la regola sulle richieste durante il blocco");
  assert.match(r, /non vale e non resta in attesa/);
  assert.match(r, /non recuperarla mai da sola/);
  assert.match(r, /Chiedi di nuovo all'utente se ha davvero fatto quel passo, aspetta la sua risposta esplicita e solo dopo chiama `next_step`/);
  assert.match(r, /`richiesta_durante_il_blocco`/);
});

test("i controlli sui documenti obbligatori e sull'ordine restano nel prompt (correzioni finali)", () => {
  const r = regola("- Se `next_step` risponde con `rifiutati`");
  assert.match(r, /ESATTAMENTE quelli di `mancanti_obbligatori`/);
  assert.match(r, /Il rifiuto non si può aggirare/);
  assert.match(regola("- Avanzamento, senza dedurre."), /solo se l'utente dice chiaramente/);
});

test("le informazioni di next_step non sono passi: non si chiedono, non si registrano, non si contano", () => {
  const r = regola("- Le `informazioni` che dà `next_step`");
  assert.ok(r, "manca la regola sulle informazioni");
  assert.match(r, /non sono passi da fare/);
  assert.match(r, /non chiedere all'utente se le ha fatte, non registrarle e non contarle nel «N su M»/);
  assert.match(r, /con il loro stato di verifica/);
});

test("l'avviso e le regole di affidabilità della Priorità 1 restano (fase 2)", () => {
  assert.match(avviso, /Poi non ripeterlo nei messaggi successivi della stessa conversazione/);
  assert.match(avviso, /Non nascondere mai lo stato di un'informazione nuova/);
  assert.match(avviso, /Non dire mai «verificato», «confermato» o «controllato da una persona» se lo stato non è `umano`/);
  assert.match(regola("- Segui l'ordine dei passi"), /lo sblocca solo lo strumento, mai una tua frase/);
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

test("avvio: se l'utente parla insieme a [AVVIO] Pino risponde anche a lui, non solo alla presentazione", () => {
  assert.match(prompt, /insieme a \[AVVIO\] \(o subito dopo, prima che tu abbia parlato\) c'è già qualcosa detto dall'utente/);
  assert.match(prompt, /a «come stai\?»: «Bene, grazie!»/);
  assert.match(prompt, /non più di due frasi brevi/);
});
