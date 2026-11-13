// Impronta del prompt di sistema, per controllare che quello pubblicato su ElevenLabs
// coincida con agent/prompt-sistema.md (il testo tra le due righe "---").
//
//   npm run impronta        stampa { len, fnv } del file
//
// Per il prompt pubblicato: aprite l'agente su ElevenLabs (scheda "Agente"), console del
// browser, e incollate la funzione `impronta` qui sotto applicata a
// document.querySelector('.ProseMirror').innerText. I due risultati devono essere uguali.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function testoPrompt(file) {
  const parti = file.split(/^---$/m);
  if (parti.length < 3) throw new Error("mancano le righe --- che delimitano il prompt");
  return parti[1];
}

// Spazi a fine riga e righe vuote non contano: l'editor di ElevenLabs li cambia.
export function impronta(testo) {
  const t = testo.replace(/ /g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n+/g, "\n").trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return { len: t.length, fnv: h };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = readFileSync(new URL("../agent/prompt-sistema.md", import.meta.url), "utf8");
  console.log(JSON.stringify(impronta(testoPrompt(file))));
}
