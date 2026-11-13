// Elenca le voci che nessuna persona ha ancora controllato, con le fonti da aprire.
//
//   npm run verifica          elenco leggibile
//   npm run verifica -- --json
//
// Dopo aver aperto la fonte e confrontato il testo, nel JSON mettete "controllo": "umano"
// (e lasciate "verificato": true e la data in "verificato_il"). Solo allora l'agente
// smette di dire che la voce è controllata in automatico.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { statoOf } from "../web/tools.js";

const read = (f) => JSON.parse(readFileSync(new URL(`../web/data/${f}`, import.meta.url), "utf8"));
const urls = (fonte) => [...new Set((fonte || "").match(/https?:\/\/[^\s;)]+/g) || [])];

export function elencoDaVerificare(percorsi, uffici) {
  const righe = [];
  for (const p of percorsi.percorsi) {
    for (const [tipo, lista] of [["documento", p.prerequisiti], ["passo", p.passi], ["scadenza", p.scadenze]]) {
      for (const x of lista) {
        const stato = statoOf(x);
        if (stato !== "umano") righe.push({ dove: p.id, tipo, id: x.id, stato, testo: x.testo, fonti: urls(x.fonte) });
      }
    }
  }
  const altri = [
    ...Object.entries(uffici.uffici).map(([id, u]) => ["ufficio", id, u, u.nome]),
    ...uffici.aiuto_gratuito.map((a, i) => ["aiuto", String(i), a, a.nome]),
  ];
  for (const [tipo, id, x, nome] of altri) {
    const stato = statoOf(x);
    if (stato !== "umano") righe.push({ dove: "uffici", tipo, id, stato, testo: nome, fonti: urls(x.fonte) });
  }
  return righe;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const righe = elencoDaVerificare(read("percorsi.json"), read("uffici.json"));
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(righe, null, 2));
  } else {
    const per = Object.groupBy(righe, (r) => r.dove);
    for (const [dove, voci] of Object.entries(per)) {
      console.log(`\n${dove} (${voci.length})`);
      for (const v of voci) {
        const marca = v.stato === "non_verificato" ? "[ ! ]" : "[ ~ ]";
        console.log(`  ${marca} ${v.tipo} ${v.id}: ${v.testo.slice(0, 90)}${v.testo.length > 90 ? "…" : ""}`);
        for (const u of v.fonti) console.log(`        ${u}`);
      }
    }
    const nv = righe.filter((r) => r.stato === "non_verificato").length;
    console.log(`\nDa confermare a mano: ${righe.length} voci (${nv} non verificate [ ! ], ${righe.length - nv} controllate in automatico [ ~ ]).`);
  }
}
