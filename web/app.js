import { Conversation } from "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.29.0/+esm";
import { createTools } from "./tools.js?v=14";
import { BANDIERA } from "./flags.js?v=14";
import { creaPino } from "./pino.js?v=14";
import { creaRegia } from "./pino-regia.js?v=14";
import { esitoPositivo, contaFatti } from "./pino-state.js?v=14";
import {
  PRINCIPALI, ALTRE, TUTTE, direzione, nomePerAgente, nomeNativo, provataAVoce,
  traduttore, linguaUI, traduzioneAutomatica, SALUTI, linguaSalvata, salvaLingua,
} from "./i18n.js?v=14";

// ID dell'agente ElevenLabs (pubblico per la demo). Si può anche passare come ?agent=...
const parametri = new URLSearchParams(location.search);
const AGENT_ID = parametri.get("agent") || "agent_0601m7b42fyaf8ybzmhabg67wy0w";

const $ = (id) => document.getElementById(id);
const [percorsi, uffici] = await Promise.all([
  fetch("data/percorsi.json?v=14").then((r) => r.json()),
  fetch("data/uffici.json?v=14").then((r) => r.json()),
]);

// ---------- Stato della pagina ----------
let lingua = null; // codice scelto
let t = traduttore("it");
let conv = null; // sessione ElevenLabs attiva
let spoke = false;
let soloTesto = false;
let fattiOra = 0; // passi fatti in tutti i percorsi (per riconoscere un successo vero)

function applicaLingua(code) {
  lingua = code;
  t = traduttore(code);
  const html = document.documentElement;
  html.lang = linguaUI(code);
  html.dir = direzione(code);
  for (const el of document.querySelectorAll("[data-t]")) el.textContent = t(el.dataset.t);
  for (const el of document.querySelectorAll("[data-tp]")) el.placeholder = t(el.dataset.tp);
  for (const el of document.querySelectorAll("[data-ta]")) el.setAttribute("aria-label", t(el.dataset.ta));
  $("lingua-nome").textContent = nomeNativo(code);
  $("lingua").setAttribute("aria-label", `${t("lingua.cambia")}: ${nomeNativo(code)}`);
  for (const el of document.querySelectorAll(".nota-trad")) el.hidden = !traduzioneAutomatica(code);
  didascalia(regia.stato);
}

// ---------- Pino ----------
// Pino segue solo eventi reali: sessione, modalità di ElevenLabs, messaggi, strumenti.
const regia = creaRegia({ onStato: (s) => didascalia(s) });
regia.aggiungi(creaPino($("pino")));

function didascalia(stato) {
  $("app").querySelector(".palco").dataset.stato = stato;
  const chiave = stato === "idle" ? (conv && soloTesto ? "stato.idleTesto" : "stato.idle") : `stato.${stato}`;
  const testo = t(chiave);
  if ($("didascalia").textContent !== testo) $("didascalia").textContent = testo;
}

// ---------- Strumenti (logica invariata: tools.js) ----------
const tools = createTools({ percorsi, uffici }, {
  onState: (st) => {
    fattiOra = contaFatti(st);
    renderSteps(st);
  },
  download(name, content, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    log("sys", `📅 ${t("sys.promemoria", { nome: name })}`);
  },
  print(html) {
    // Il foglio si apre dentro la pagina: nessun popup da consentire.
    $("foglio")?.remove();
    const box = document.createElement("div");
    box.id = "foglio";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", t("foglio.titolo"));
    const bar = document.createElement("div");
    bar.className = "bar";
    const frame = document.createElement("iframe");
    frame.title = t("foglio.titolo");
    frame.srcdoc = html;
    for (const [label, fn] of [
      [t("foglio.stampa"), () => frame.contentWindow.print()],
      [t("foglio.chiudi"), () => box.remove()],
    ]) {
      const b = document.createElement("button");
      b.textContent = label;
      b.onclick = fn;
      bar.append(b);
    }
    box.append(bar, frame);
    document.body.append(box);
    log("sys", `📄 ${t("sys.foglio")}`);
  },
  onHandoff: () => log("sys", `↪ ${t("sys.handoff")}`),
});

// Ogni tool viene registrato così com'è; i log aiutano in demo a mostrare cosa fa l'agente.
const clientTools = Object.fromEntries(
  Object.entries(tools)
    .filter(([, fn]) => typeof fn === "function")
    .map(([name, fn]) => [name, async (params) => {
      log("sys", `🔧 ${name}`);
      const prima = fattiOra;
      regia.invia({ type: "strumentoInizio" });
      let risultato;
      try {
        risultato = fn(params || {});
      } finally {
        regia.invia({ type: "strumentoFine", successo: esitoPositivo(name, risultato, prima, fattiOra) });
      }
      return risultato;
    }])
);

// ---------- Sessione ElevenLabs (opzioni invariate) ----------

const erroreMicrofono = (e) => /NotAllowed|Permission|denied|NotFound|microphone/i.test(`${e?.name} ${e?.message}`);

// Collegamento in corso: "Fine" premuto adesso chiude la sessione appena si apre.
let inAvvio = false;
let annullato = false;
let erroreMostrato = false;
// Ogni sessione ha un numero: le notifiche di una sessione già chiusa non toccano quella nuova.
let numeroSessione = 0;

async function start(textOnly) {
  if (AGENT_ID.startsWith("INSERISCI")) return log("sys", "Imposta AGENT_ID in app.js o aggiungi ?agent=... all'URL.");
  if (conv || inAvvio) return;
  $("text").classList.remove("evidenzia");
  inAvvio = true;
  annullato = false;
  const mio = ++numeroSessione;
  const attiva = () => mio === numeroSessione;
  erroreMostrato = false;
  try {
    spoke = false;
    soloTesto = textOnly;
    regia.invia({ type: "sessione", soloTesto: textOnly });
    setRunning(true);
    const sessione = await Conversation.startSession({
      agentId: AGENT_ID,
      // WebSocket anche per la voce: più robusto di WebRTC su reti con UDP bloccato (WiFi di eventi, uffici).
      connectionType: parametri.get("conn") || "websocket",
      textOnly,
      overrides: { agent: { language: lingua, firstMessage: "" } },
      clientTools,
      // Il modello vocale può aggiungere indicazioni di tono tipo [happy]: non vanno mostrate.
      onMessage: ({ message, role }) => {
        if (!attiva()) return;
        // Il messaggio di avvio non si mostra; quando parla l'agente, il saluto è già arrivato.
        if (role === "user" && message.startsWith("[AVVIO]")) return;
        if (role !== "user") spoke = true;
        const testo = message.replace(/\[[a-z ]{2,20}\]\s*/g, "").trim();
        if (role === "user") regia.invia({ type: "turnoUtente" });
        else regia.invia({ type: "rispostaAgente", ms: Math.min(4000, Math.max(1200, testo.length * 30)) });
        log(role === "user" ? "user" : "ai", testo);
      },
      onStatusChange: ({ status }) => attiva() && regia.invia({ type: "status", status }),
      onModeChange: ({ mode }) => attiva() && regia.invia({ type: "mode", mode }),
      onVadScore: ({ vadScore }) => attiva() && regia.invia({ type: "vad", score: vadScore }),
      onError: (m) => {
        console.warn("ElevenLabs:", m);
        // Durante l'avvio ci pensa il catch qui sotto; dopo, l'utente lo deve sapere (una volta sola).
        if (attiva() && conv && !erroreMostrato) {
          erroreMostrato = true;
          log("sys errore", t("err.sessione"));
        }
      },
      onDisconnect: (d) => {
        if (!attiva()) return;
        regia.invia({ type: "status", status: "disconnected" });
        if (d?.reason === "error") log("sys errore", t("err.rete"));
        setRunning(false);
      },
    });
    inAvvio = false;
    if (annullato) {
      // L'utente ha premuto "Fine" mentre ci collegavamo: niente saluto, si chiude subito.
      numeroSessione++; // da qui le sue notifiche vengono ignorate
      sessione.endSession();
      regia.invia({ type: "status", status: "disconnected" });
      setRunning(false);
      return;
    }
    conv = sessione;
    regia.conversazione(conv);
    regia.invia({ type: "status", status: "connected" });
    // Il saluto lo genera l'agente (LLM) nella lingua scelta. Se l'agente ha ancora un primo messaggio fisso, parla da solo e questo non serve.
    const nome = nomePerAgente(lingua);
    setTimeout(() => {
      if (conv && !spoke) {
        regia.invia({ type: "turnoUtente" }); // l'agente sta preparando il saluto
        conv.sendUserMessage(`[AVVIO] Saluta e presentati in breve, in ${nome}.`);
      }
    }, 1500);
  } catch (e) {
    console.warn("Avvio non riuscito:", e);
    inAvvio = false;
    conv = null;
    setRunning(false);
    regia.invia({ type: "status", status: "disconnected" });
    if (annullato) return; // l'utente aveva già chiuso: nessun messaggio d'errore
    if (!textOnly && erroreMicrofono(e)) {
      log("sys errore", t("err.mic"));
      $("text").classList.add("evidenzia");
      $("text").focus();
    } else {
      log("sys errore", t("err.avvio"));
    }
  }
}

function setRunning(on) {
  $("voice").disabled = $("text").disabled = $("lingua").disabled = on;
  $("stop").disabled = !on;
  $("q").disabled = $("chat").querySelector("button").disabled = !on;
  if (!on) conv = null;
  didascalia(regia.stato);
  if (on && soloTesto) setTimeout(() => $("q").focus(), 0);
}

$("voice").onclick = () => start(false);
$("text").onclick = () => start(true);
$("stop").onclick = () => {
  if (conv) return conv.endSession();
  if (inAvvio) {
    annullato = true;
    $("stop").disabled = true;
  }
};
$("chat").onsubmit = (e) => {
  e.preventDefault();
  const testo = $("q").value.trim();
  if (!testo || !conv) return;
  regia.invia({ type: "turnoUtente" });
  conv.sendUserMessage(testo);
  $("q").value = "";
};
$("q").addEventListener("input", () => regia.invia({ type: "scrive", on: $("q").value.trim() !== "" }));
$("q").addEventListener("blur", () => regia.invia({ type: "scrive", on: false }));

function log(kind, text) {
  const d = document.createElement("div");
  d.className = `msg ${kind}`;
  d.dir = "auto"; // testi misti: nomi di uffici in italiano dentro una frase in arabo
  d.textContent = text;
  $("log").append(d);
  $("log").scrollTop = $("log").scrollHeight;
}

function renderSteps(state) {
  const box = $("steps");
  box.replaceChildren(Object.assign(document.createElement("h2"), { textContent: t("percorso") }));
  for (const [id, s] of Object.entries(state.percorsi)) {
    const p = percorsi.percorsi.find((x) => x.id === id);
    const h = document.createElement("h3");
    h.textContent = p.titolo;
    h.lang = "it";
    const ul = document.createElement("ul");
    ul.lang = "it"; // i passi vengono dai dati verificati, in italiano
    // L'etichetta è nella lingua dell'interfaccia; il testo del passo resta quello verificato, in italiano.
    const etichetta = (chiave) => {
      const tag = document.createElement("small");
      tag.className = "tag";
      tag.lang = document.documentElement.lang;
      tag.textContent = t(chiave);
      return tag;
    };
    for (const step of p.passi) {
      const li = document.createElement("li");
      li.dir = "auto";
      if (step.informativo) {
        // Un'informazione non è un passo da fare: niente casella, e distinta nell'aspetto.
        li.className = "info";
        li.textContent = `ℹ ${step.testo}`;
        li.append(etichetta("passo.info"));
      } else {
        const done = s.completati.includes(step.id);
        li.textContent = `${done ? "✓" : "○"} ${step.testo}`;
        if (done) {
          li.className = "done";
          li.append(etichetta("passo.dichiarato")); // registrato sulla parola dell'utente
        }
      }
      ul.append(li);
    }
    box.append(h, ul);
  }
}

// ---------- Onboarding: senza lingua non si entra ----------
const onbPino = creaPino($("onb-pino"));
let scelta = null;
let timerSaluti = null;

function tessera(code, testo, sotto) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tessera press";
  b.setAttribute("role", "radio");
  b.setAttribute("aria-checked", "false");
  b.dataset.code = code;
  b.lang = code;
  const bandiera = document.createElement("img");
  bandiera.className = "bandiera";
  bandiera.alt = "";
  bandiera.setAttribute("aria-hidden", "true");
  bandiera.loading = "lazy";
  bandiera.width = bandiera.height = 24;
  if (BANDIERA[code]) bandiera.src = `flags/${BANDIERA[code]}.svg`;
  const nome = document.createElement("span");
  nome.className = "nome";
  nome.dir = direzione(code); // la scrittura va nel verso giusto, ma il nome resta allineato a sinistra come gli altri
  nome.textContent = testo;
  if (sotto) nome.append(Object.assign(document.createElement("small"), { textContent: sotto, dir: "ltr" }));
  const spunta = Object.assign(document.createElement("span"), { className: "spunta", textContent: "✓" });
  spunta.setAttribute("aria-hidden", "true");
  b.append(bandiera, nome, spunta);
  b.onclick = () => scegli(code);
  return b;
}

$("lingue").append(...PRINCIPALI.map((l) => tessera(l.code, l.nome)));
$("altre-lista").append(...ALTRE.map((l) => tessera(l.code, l.nativo, l.nativo === l.inglese ? "" : l.inglese)));

function scegli(code) {
  scelta = code;
  for (const b of document.querySelectorAll(".tessera")) b.setAttribute("aria-checked", String(b.dataset.code === code));
  applicaLingua(code); // tutta l'interfaccia cambia subito lingua (e direzione)
  $("nota-lingua").hidden = provataAVoce(code);
  $("avanti").disabled = false;
  onbPino.stato("success");
  setTimeout(() => onbPino.stato("idle"), 900);
}

// Ricerca sotto Pino: filtra tutte le lingue (nome nella lingua, nome inglese o codice, senza accenti).
const senzaAccenti = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const INGLESE_PRINCIPALI = { it: "Italian", en: "English", ro: "Romanian", ar: "Arabic", uk: "Ukrainian", fil: "Filipino" };
$("cerca").oninput = () => {
  const q = senzaAccenti($("cerca").value.trim());
  let visibili = 0;
  for (const b of [...$("lingue").children, ...$("altre-lista").children]) {
    const l = ALTRE.find((x) => x.code === b.dataset.code) || PRINCIPALI.find((x) => x.code === b.dataset.code);
    const nome = l.nativo || l.nome;
    const inglese = l.inglese || INGLESE_PRINCIPALI[l.code] || "";
    const ok = !q || senzaAccenti(`${nome} ${inglese} ${l.code}`).includes(q);
    b.hidden = !ok;
    visibili += ok;
  }
  $("nessuna").hidden = visibili > 0;
};

function mostraOnboarding() {
  $("app").hidden = true;
  $("onboarding").hidden = false;
  scelta = lingua;
  for (const b of document.querySelectorAll(".tessera")) b.setAttribute("aria-checked", String(b.dataset.code === scelta));
  $("avanti").disabled = !scelta;
  $("nota-lingua").hidden = !scelta || provataAVoce(scelta);
  let i = 0;
  clearInterval(timerSaluti);
  timerSaluti = setInterval(() => {
    if (document.hidden) return;
    i = (i + 1) % SALUTI.length;
    const s = $("saluto").lastElementChild;
    const nuovo = s.cloneNode();
    nuovo.textContent = SALUTI[i];
    nuovo.dir = "auto";
    s.replaceWith(nuovo);
  }, 2200);
  $("onb-domanda").focus?.();
}

function entra() {
  if (!scelta) return;
  salvaLingua(scelta);
  applicaLingua(scelta);
  clearInterval(timerSaluti);
  $("onboarding").hidden = true;
  $("app").hidden = false;
  $("voice").focus();
}

$("avanti").onclick = entra;
$("lingua").onclick = () => {
  if (!conv) mostraOnboarding();
};

// ?lang=it salta la scelta (utile in demo); altrimenti vale la lingua ricordata da questo browser.
const daUrl = parametri.get("lang");
const iniziale = daUrl && TUTTE.includes(daUrl) ? daUrl : linguaSalvata();
if (iniziale) {
  scelta = iniziale;
  applicaLingua(iniziale);
  $("app").hidden = false;
} else {
  applicaLingua("it");
  lingua = null;
  mostraOnboarding();
}
