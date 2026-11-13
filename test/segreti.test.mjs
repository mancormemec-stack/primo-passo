// Controlla che nella repository non finiscano chiavi o file .env.
// La cartella web/ è quella che viene pubblicata: deve contenere solo codice e dati pubblici.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SKIP = new Set(["node_modules", ".git"]);

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

// Forme tipiche di chiavi: assegnazioni con un valore lungo, chiavi sk_..., header con valore.
const PATTERNS = [
  /\bsk_[A-Za-z0-9]{16,}/,
  /(api[_-]?key|secret|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i,
  /xi-api-key["']?\s*:\s*["'][A-Za-z0-9]{16,}/i,
  /x-api-key["']?\s*:\s*["'][A-Za-z0-9\-]{16,}/i,
];

test("nessun file .env nella repository", () => {
  const envFiles = files(root).filter((f) => /(^|[\\/])\.env(\.|$)/.test(f));
  assert.deepEqual(envFiles, []);
});

test("nessuna chiave nei file", () => {
  const hits = [];
  for (const f of files(root)) {
    if (!/\.(m?js|json|html|md|txt|ya?ml)$/.test(f)) continue;
    const text = readFileSync(f, "utf8");
    for (const re of PATTERNS) if (re.test(text)) hits.push(`${f}: ${re}`);
  }
  assert.deepEqual(hits, []);
});
