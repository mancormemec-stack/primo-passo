// Crea su ElevenLabs i 9 client tool e l'agente "Primo Passo".
//
// Uso (la chiave resta solo nella vostra shell, mai nel codice):
//   ELEVENLABS_API_KEY=... node scripts/crea-agente.mjs
//   node scripts/crea-agente.mjs --dry-run      # mostra cosa verrebbe inviato
//   LLM=claude-haiku-5-5 node scripts/crea-agente.mjs   # modello opzionale
import { readFileSync } from "node:fs";

const API = "https://api.elevenlabs.io/v1/convai";
const dryRun = process.argv.includes("--dry-run");
const key = process.env.ELEVENLABS_API_KEY;
if (!dryRun && !key) {
  console.error("Imposta ELEVENLABS_API_KEY oppure usa --dry-run.");
  process.exit(1);
}

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

// Il prompt sta tra il primo "---" e la sezione del primo messaggio.
const doc = read("agent/prompt-sistema.md");
const prompt = doc.split(/^---$/m)[1].trim();
const firstMessage = doc.split(/^## Primo messaggio.*$/m)[1].trim().split("\n").filter(Boolean).pop();

const tools = JSON.parse(read("agent/tools.json")).map((t) => ({
  tool_config: {
    type: "client",
    name: t.name,
    description: t.description,
    expects_response: true,
    response_timeout_secs: 20,
    parameters: {
      type: "object",
      required: t.required || [],
      properties: Object.fromEntries(
        Object.entries(t.params).map(([k, d]) => [k, { type: "string", description: d }])
      ),
    },
  },
}));

async function post(path, body) {
  if (dryRun) {
    console.log(`POST ${API}${path}\n${JSON.stringify(body, null, 2)}\n`);
    return { id: `dry_${body.tool_config?.name || "agent"}`, agent_id: "dry_agent" };
  }
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

const toolIds = [];
for (const t of tools) {
  const { id } = await post("/tools", t);
  toolIds.push(id);
  console.log(`tool ${t.tool_config.name}: ${id}`);
}

const agent = await post("/agents/create", {
  name: "Primo Passo",
  tags: ["agentic-hack-rome"],
  conversation_config: {
    agent: {
      first_message: firstMessage,
      language: "it",
      prompt: { prompt, tool_ids: toolIds, ...(process.env.LLM ? { llm: process.env.LLM } : {}) },
    },
  },
  platform_settings: {
    overrides: {
      conversation_config_override: {
        agent: { language: true, first_message: true },
        conversation: { text_only: true },
      },
    },
  },
});

console.log(`\nAgente creato: ${agent.agent_id}`);
console.log(`Apri: http://localhost:8080/?agent=${agent.agent_id}`);
