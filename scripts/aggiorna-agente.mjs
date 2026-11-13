// Aggiorna l'agente esistente su ElevenLabs: prompt, modello LLM e domini ammessi.
// Rinomina l'agente in Pino e svuota il primo messaggio fisso: il saluto lo genera l'LLM
// quando l'app manda [AVVIO]. Non tocca i tool e le lingue.
//
// Uso (la chiave resta solo nella vostra shell, mai nel codice):
//   ELEVENLABS_API_KEY=... node scripts/aggiorna-agente.mjs
//   node scripts/aggiorna-agente.mjs --dry-run
// Opzioni: LLM=claude-haiku-5-5 per cambiare modello (default claude-sonnet-5-5),
//          AGENT_ID=... se non è quello scritto in web/app.js.
import { readFileSync } from "node:fs";

const dryRun = process.argv.includes("--dry-run");
const key = process.env.ELEVENLABS_API_KEY;
if (!dryRun && !key) {
  console.error("Imposta ELEVENLABS_API_KEY oppure usa --dry-run.");
  process.exit(1);
}

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const agentId =
  process.env.AGENT_ID || read("web/app.js").match(/\|\|\s*"(agent_[A-Za-z0-9]+)"/)?.[1];
if (!agentId) {
  console.error("ID agente non trovato: impostate AGENT_ID.");
  process.exit(1);
}

const prompt = read("agent/prompt-sistema.md").split(/^---$/m)[1].trim();
const llm = process.env.LLM || "claude-sonnet-5-5";

const body = {
  name: "Pino",
  conversation_config: { agent: { first_message: "", prompt: { prompt, llm } } },
  platform_settings: {
    auth: {
      allowlist: [{ hostname: "mancormemec-stack.github.io" }, { hostname: "localhost" }],
    },
  },
};

const url = `https://api.elevenlabs.io/v1/convai/agents/${agentId}`;
if (dryRun) {
  console.log(`PATCH ${url}\n${JSON.stringify(body, null, 2)}`);
  process.exit(0);
}

const res = await fetch(url, {
  method: "PATCH",
  headers: { "xi-api-key": key, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`${res.status}: ${JSON.stringify(json)}`);
  process.exit(1);
}
console.log(`Agente ${agentId} aggiornato. Modello: ${llm}.`);
console.log(
  `Modello e prompt letti dall'agente: ${json.conversation_config?.agent?.prompt?.llm}, ${json.conversation_config?.agent?.prompt?.prompt?.length} caratteri.`
);
console.log(`Domini ammessi: ${(json.platform_settings?.auth?.allowlist || []).map((x) => x.hostname).join(", ")}`);
