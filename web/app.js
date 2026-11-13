import { Conversation } from "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.29.0/+esm";
import { createTools } from "./tools.js";
import { creaPino } from "./pino.js";
import { creaRegia } from "./pino-regia.js";
import { esitoPositivo, contaFatti } from "./pino-state.js";

// ID dell'agente ElevenLabs (pubblico per la demo). Si può anche passare come ?agent=...
const AGENT_ID = new URLSearchParams(location.search).get("agent") || "agent_0601m7b42fyaf8ybzmhabg67wy0w";

const $ = (id) => document.getElementById(id);
const [percorsi, uffici] = await Promise.all([
  fetch("data/percorsi.json").then((r) => r.json()),
  fetch("data/uffici.json").then((r) => r.json()),
]);

// Pino segue solo eventi reali: sessione, modalità di ElevenLabs, messaggi, strumenti.
const regia = creaRegia();
regia.aggiungi(creaPino($("pino"), { etichetta: "Pino" }));
let fattiOra = 0;

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
    log("sys", `📅 Promemoria scaricato: ${name}`);
  },
  print(html) {
    // Il foglio si apre dentro la pagina: nessun popup da consentire.
    $("foglio")?.remove();
    const box = document.createElement("div");
    box.id = "foglio";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Foglio da portare allo sportello");
    const bar = document.createElement("div");
    bar.className = "bar";
    const frame = document.createElement("iframe");
    frame.title = "Foglio da portare allo sportello";
    frame.srcdoc = html;
    for (const [label, fn] of [
      ["Stampa / salva PDF", () => frame.contentWindow.print()],
      ["Chiudi", () => box.remove()],
    ]) {
      const b = document.createElement("button");
      b.textContent = label;
      b.onclick = fn;
      bar.append(b);
    }
    box.append(bar, frame);
    document.body.append(box);
    log("sys", "📄 Foglio pronto: puoi stamparlo o salvarlo come PDF.");
  },
  onHandoff: (motivo) => log("sys", `↪ Indirizzato a uno sportello: ${motivo}`),
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

let conv = null;
let spoke = false;

async function start(textOnly) {
  if (AGENT_ID.startsWith("INSERISCI")) return log("sys", "Imposta AGENT_ID in app.js o aggiungi ?agent=... all'URL.");
  try {
    spoke = false;
    regia.invia({ type: "sessione", soloTesto: textOnly });
    conv = await Conversation.startSession({
      agentId: AGENT_ID,
      // WebSocket anche per la voce: più robusto di WebRTC su reti con UDP bloccato (WiFi di eventi, uffici).
      connectionType: new URLSearchParams(location.search).get("conn") || "websocket",
      textOnly,
      overrides: { agent: { language: $("lang").value, firstMessage: "" } },
      clientTools,
      // Il modello vocale può aggiungere indicazioni di tono tipo [happy]: non vanno mostrate.
      onMessage: ({ message, role }) => {
        // Il messaggio di avvio non si mostra; quando parla l'agente, il saluto è già arrivato.
        if (role === "user" && message.startsWith("[AVVIO]")) return;
        if (role !== "user") spoke = true;
        const testo = message.replace(/\[[a-z ]{2,20}\]\s*/g, "").trim();
        if (role === "user") regia.invia({ type: "turnoUtente" });
        else regia.invia({ type: "rispostaAgente", ms: Math.min(4000, Math.max(1200, testo.length * 30)) });
        log(role === "user" ? "user" : "ai", testo);
      },
      onStatusChange: ({ status }) => regia.invia({ type: "status", status }),
      onModeChange: ({ mode }) => regia.invia({ type: "mode", mode }),
      onVadScore: ({ vadScore }) => regia.invia({ type: "vad", score: vadScore }),
      onError: (m) => log("sys", `Errore: ${m}`),
      onDisconnect: () => {
        regia.invia({ type: "status", status: "disconnected" });
        setRunning(false);
      },
    });
    regia.conversazione(conv);
    regia.invia({ type: "status", status: "connected" });
    setRunning(true);
    // Il saluto lo genera l'agente (LLM) nella lingua scelta. Se l'agente ha ancora un primo messaggio fisso, parla da solo e questo non serve.
    const lingua = ($("lang").selectedOptions[0]?.textContent || "").replace(/\s*\(.*\)/, "").trim();
    setTimeout(() => {
      if (conv && !spoke) {
        regia.invia({ type: "turnoUtente" }); // l'agente sta preparando il saluto
        conv.sendUserMessage(`[AVVIO] Saluta e presentati in breve, in ${lingua}.`);
      }
    }, 1500);
  } catch (e) {
    log("sys", `Impossibile avviare: ${e.message}`);
  }
}

function setRunning(on) {
  $("voice").disabled = $("text").disabled = $("lang").disabled = on;
  $("stop").disabled = !on;
  $("q").disabled = $("chat").querySelector("button").disabled = !on;
  if (!on) conv = null;
}

$("voice").onclick = () => start(false);
$("text").onclick = () => start(true);
$("stop").onclick = () => conv?.endSession();
$("chat").onsubmit = (e) => {
  e.preventDefault();
  const t = $("q").value.trim();
  if (!t || !conv) return;
  regia.invia({ type: "turnoUtente" });
  conv.sendUserMessage(t);
  $("q").value = "";
};

$("q").addEventListener("input", () => regia.invia({ type: "scrive", on: $("q").value.trim() !== "" }));
$("q").addEventListener("blur", () => regia.invia({ type: "scrive", on: false }));

function log(kind, text) {
  const d = document.createElement("div");
  d.className = `msg ${kind}`;
  d.textContent = text;
  $("log").append(d);
  $("log").scrollTop = $("log").scrollHeight;
}

function renderSteps(state) {
  const box = $("steps");
  box.replaceChildren(Object.assign(document.createElement("h2"), { textContent: "Il tuo percorso" }));
  for (const [id, s] of Object.entries(state.percorsi)) {
    const p = percorsi.percorsi.find((x) => x.id === id);
    const h = document.createElement("h3");
    h.textContent = p.titolo;
    h.style.fontSize = "15px";
    const ul = document.createElement("ul");
    for (const step of p.passi) {
      const li = document.createElement("li");
      const done = s.completati.includes(step.id);
      li.textContent = `${done ? "✓" : "○"} ${step.testo}`;
      if (done) li.className = "done";
      ul.append(li);
    }
    box.append(h, ul);
  }
}
