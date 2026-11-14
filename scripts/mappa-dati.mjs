// Prepara i dati della mappa di Roma, una volta sola (il sito poi li legge come file statici).
//   node scripts/mappa-dati.mjs
//
// 1) I confini dei 15 Municipi arrivano da OpenStreetMap (Overpass API), semplificati per pesare poco.
// 2) I luoghi (Questura, patronato, aiuti gratuiti...) sono SOLO quelli i cui indirizzi stanno già in web/data/uffici.json,
//    quindi da fonte ufficiale: qui si cercano le coordinate con Nominatim (OpenStreetMap). Un test controlla che ogni
//    indirizzo compaia davvero in uffici.json. Nessun indirizzo si scrive a memoria.
// Dati © contributori di OpenStreetMap, licenza ODbL (https://www.openstreetmap.org/copyright).
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const UA = "PrimoPasso-build/1.0 (prototipo per hackathon; github.com/mancormemec-stack/primo-passo)";
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), "mappa-"));

// ---------- 1. Municipi ----------
const q = '[out:json][timeout:120];rel["boundary"="administrative"]["admin_level"="10"]["name"~"Municipio Roma"](41.6,12.2,42.1,12.9);out geom;';
// Overpass a volte risponde 502/504: si riprova, anche con un secondo server
const SERVER = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter"];
let r = null;
for (const url of SERVER) {
  try {
    r = await fetch(url, { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
    if (r.ok) break;
    console.log("Overpass", url, r.status, "- riprovo");
  } catch (e) { console.log("Overpass", url, e.message, "- riprovo"); }
  await pausa(4000);
}
if (!r || !r.ok) throw new Error("Overpass non risponde: riprova tra qualche minuto");
writeFileSync(join(dir, "geom.json"), Buffer.from(await r.arrayBuffer()));
const gj = JSON.parse(execSync(`npx --yes osmtogeojson "${join(dir, "geom.json")}"`, { maxBuffer: 1 << 28 }).toString());

// Douglas-Peucker (coordinate [lon, lat], tolleranza in gradi: 0.0002 ~ 20 m)
function semplifica(pt, tol) {
  if (pt.length < 4) return pt;
  const dist = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l)) : 0;
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  const tieni = new Uint8Array(pt.length); tieni[0] = tieni[pt.length - 1] = 1;
  const pila = [[0, pt.length - 1]];
  while (pila.length) {
    const [i, j] = pila.pop();
    let m = 0, k = -1;
    for (let n = i + 1; n < j; n++) { const d = dist(pt[n], pt[i], pt[j]); if (d > m) { m = d; k = n; } }
    if (m > tol && k > -1) { tieni[k] = 1; pila.push([i, k], [k, j]); }
  }
  return pt.filter((_, n) => tieni[n]);
}
const arrotonda = (p) => [Math.round(p[1] * 1e5) / 1e5, Math.round(p[0] * 1e5) / 1e5]; // -> [lat, lon]
const area = (a) => a.reduce((s, p, i) => { const q2 = a[(i + 1) % a.length]; return s + (p[0] * q2[1] - q2[0] * p[1]); }, 0) / 2;

const municipi = [];
for (const f of gj.features) {
  const nome = f.properties?.tags?.name || f.properties?.name || "";
  const m = nome.match(/Municipio Roma ([IVX]+)$/);
  if (!m || !/Polygon/.test(f.geometry.type)) continue;
  const poligoni = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const anelli = poligoni.map((pol) => semplifica(pol[0], 0.0002).map(arrotonda)).filter((a) => a.length >= 4);
  // punto per l'etichetta: baricentro dell'anello più grande
  const grande = anelli.reduce((a, b) => (Math.abs(area(a)) >= Math.abs(area(b)) ? a : b));
  const A = area(grande);
  const cx = grande.reduce((s, p, i) => { const n = grande[(i + 1) % grande.length]; return s + (p[0] + n[0]) * (p[0] * n[1] - n[0] * p[1]); }, 0) / (6 * A);
  const cy = grande.reduce((s, p, i) => { const n = grande[(i + 1) % grande.length]; return s + (p[1] + n[1]) * (p[0] * n[1] - n[0] * p[1]); }, 0) / (6 * A);
  municipi.push({ id: m[1], centro: [Math.round(cx * 1e5) / 1e5, Math.round(cy * 1e5) / 1e5], anelli });
}
const ORD = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV"];
municipi.sort((a, b) => ORD.indexOf(a.id) - ORD.indexOf(b.id));
if (municipi.length !== 15) throw new Error("Attesi 15 Municipi, trovati " + municipi.length);
writeFileSync(new URL("../web/data/roma-municipi.json", import.meta.url), JSON.stringify({
  _nota: "Confini dei 15 Municipi di Roma da OpenStreetMap (ODbL), semplificati (~20 m). Coordinate [lat, lon]. Generato da scripts/mappa-dati.mjs",
  municipi,
}));
console.log("Municipi:", municipi.map((m) => m.id + ":" + m.anelli.reduce((n, a) => n + a.length, 0)).join(" "));

// ---------- 2. Luoghi (indirizzi già presenti in uffici.json) ----------
const LUOGHI = [
  { id: "questura", tipo: "questura", nome: "Questura di Roma - Ufficio Immigrazione", indirizzo: "Via Teofilo Patini 23", cerca: "Via Teofilo Patini 23, 00155 Roma" },
  { id: "acli", tipo: "aiuto", nome: "ACLI Roma, Patronato", indirizzo: "via Prospero Alpino 20", cerca: "Via Prospero Alpino 20, 00154 Roma" },
  { id: "santegidio", tipo: "aiuto", nome: "Comunità di Sant'Egidio", indirizzo: "Piazza Sant'Egidio 3a", cerca: "Piazza Sant'Egidio 3, 00153 Roma" },
  { id: "astalli", tipo: "aiuto", nome: "Centro Astalli", indirizzo: "Via degli Astalli 14/a", cerca: "Via degli Astalli 14, 00186 Roma" },
  { id: "anagrafe-viii", tipo: "anagrafe", nome: "Anagrafe del Municipio VIII (sede indicata come esempio)", indirizzo: "via Benedetto Croce 50", cerca: "Via Benedetto Croce 50, 00142 Roma" },
];
const uffici = readFileSync(new URL("../web/data/uffici.json", import.meta.url), "utf8");
const out = [];
for (const l of LUOGHI) {
  if (!uffici.includes(l.indirizzo)) throw new Error(`L'indirizzo "${l.indirizzo}" non è in uffici.json: non lo uso`);
  await pausa(1300);
  const res = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=it&q=" + encodeURIComponent(l.cerca), { headers: { "User-Agent": UA } });
  const j = res.ok ? await res.json() : [];
  if (!j[0]) { console.log("NON trovato:", l.cerca); continue; }
  out.push({ id: l.id, tipo: l.tipo, nome: l.nome, indirizzo: l.indirizzo, lat: Math.round(+j[0].lat * 1e5) / 1e5, lon: Math.round(+j[0].lon * 1e5) / 1e5, trovato: j[0].display_name.split(",").slice(0, 3).join(",") });
  console.log(" ", l.id, j[0].lat, j[0].lon, "->", out.at(-1).trovato);
}
writeFileSync(new URL("../web/data/luoghi.json", import.meta.url), JSON.stringify({
  _nota: "Luoghi con indirizzo già presente in uffici.json (fonti ufficiali); le coordinate vengono da Nominatim/OpenStreetMap (ODbL). Generato da scripts/mappa-dati.mjs",
  luoghi: out,
}, null, 1));
console.log("Luoghi:", out.length, "su", LUOGHI.length);
