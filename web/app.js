import { Conversation } from "https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.29.0/+esm";
import { createTools } from "./tools.js";

// ID dell'agente ElevenLabs (pubblico per la demo). Si può anche passare come ?agent=...
const AGENT_ID = new URLSearchParams(location.search).get("agent") || "INSERISCI_AGENT_ID";

const $ = (id) => document.getElementById(id);
const [percorsi, uffici] = await Promise.all([
  fetch("data/percorsi.json").then((r) => r.json()),
  fetch("data/uffici.json").then((r) => r.json()),
]);

const tools = createTools({ percorsi, uffici }, {
  onState: renderSteps,
  download(name, content, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    log("sys", `📅 Promemoria scaricato: ${name}`);
  },
  print(html) {
    const w = window.open("", "_blank");
    if (!w) return log("sys", "Consenti i popup per vedere il riepilogo.");
    w.document.write(html);
    w.document.close();
  },
  onHandoff: (motivo) => log("sys", `↪ Indirizzato a uno sportello: ${motivo}`),
});

// Ogni tool viene registrato così com'è; i log aiutano in demo a mostrare cosa fa l'agente.
const clientTools = Object.fromEntries(
  Object.entries(tools)
    .filter(([, fn]) => typeof fn === "function")
    .map(([name, fn]) => [name, async (params) => {
      log("sys", `🔧 ${name}`);
      return fn(params || {});
    }])
);

let conv = null;

async function start(textOnly) {
  if (AGENT_ID.startsWith("INSERISCI")) return log("sys", "Imposta AGENT_ID in app.js o aggiungi ?agent=... all'URL.");
  try {
    conv = await Conversation.startSession({
      agentId: AGENT_ID,
      textOnly,
      overrides: { agent: { language: $("lang").value } },
      clientTools,
      onMessage: ({ message, role }) => log(role === "user" ? "user" : "ai", message),
      onError: (m) => log("sys", `Errore: ${m}`),
      onDisconnect: () => setRunning(false),
    });
    setRunning(true);
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
  conv.sendUserMessage(t);
  $("q").value = "";
};

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
