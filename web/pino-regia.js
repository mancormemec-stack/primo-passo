// Collega gli eventi reali della conversazione ai Pino della pagina.
// Lo stato lo decide pino-state.js; qui ci sono solo timer, volume della voce e DOM.
import { inizio, evento, vista, prossimaScadenza } from "./pino-state.js?v=6";

const ora = () => performance.now();

export function creaRegia({ onStato } = {}) {
  const pini = new Set();
  let s = inizio();
  let ultimo = null;
  let timer = null;
  let raf = 0;
  let ultimoFrame = 0;
  let conv = null;

  // Volume in uscita -> apertura della bocca, al massimo ~30 volte al secondo e solo mentre parla.
  function bocca(t) {
    raf = 0;
    if (ultimo !== "speaking" || !conv) return;
    if (!document.hidden && t - ultimoFrame > 33) {
      ultimoFrame = t;
      let v = null;
      try {
        if (typeof conv.getOutputVolume === "function") v = Math.min(1, conv.getOutputVolume() * 1.6);
      } catch {
        v = null;
      }
      for (const p of pini) p.livello(Number.isFinite(v) ? v : null);
    }
    raf = requestAnimationFrame(bocca);
  }

  function disegna() {
    const t = ora();
    const v = vista(s, t);
    const sente = v === "listening" && s.voceUtente;
    for (const p of pini) {
      p.stato(v);
      p.sente(sente);
    }
    if (v !== ultimo) {
      ultimo = v;
      onStato?.(v);
    }
    clearTimeout(timer);
    const n = prossimaScadenza(s, t);
    if (n != null) timer = setTimeout(disegna, n - t + 5);
    if (v === "speaking" && !s.soloTesto && conv && !raf) raf = requestAnimationFrame(bocca);
  }

  document.addEventListener("visibilitychange", () => document.documentElement.classList.toggle("paused", document.hidden));

  return {
    aggiungi(p) {
      pini.add(p);
      disegna();
      return p;
    },
    conversazione(c) {
      conv = c;
    },
    invia(e) {
      const prima = s;
      s = evento(s, e, ora());
      // Il VAD arriva molte volte al secondo: ridisegna solo se cambia qualcosa.
      if (e.type === "vad" && prima.voceUtente === s.voceUtente) return;
      disegna();
    },
    get stato() {
      return ultimo ?? "idle";
    },
  };
}
