// Stato visibile di Pino, ricavato SOLO dagli eventi reali della conversazione.
// Logica pura (niente DOM): l'app le passa gli eventi e l'ora, e disegna lo stato che esce.
//
// ElevenLabs dice quando la sessione è connessa e se l'agente parla o ascolta.
// "Pensa" non esiste nell'SDK: lo ricaviamo dalla fine del turno dell'utente fino alla prima
// risposta, e da quando lavora uno strumento. Un tempo massimo evita che resti bloccato.

export const STATI = ["idle", "listening", "thinking", "speaking", "success"];

export const DEFAULT = { thinkMax: 12000, successMs: 1500, testoMs: 1800 };

export function inizio() {
  return {
    connesso: false,
    soloTesto: false,
    agenteParla: false, // voce: modalità "speaking" di ElevenLabs
    pensaDa: null, // istante in cui l'utente ha finito il turno
    strumenti: 0, // strumenti in esecuzione
    successoFino: 0,
    testoFino: 0, // chat scritta: risposta appena arrivata
    scrive: false, // chat scritta: l'utente sta scrivendo
    voceUtente: false, // voce: l'utente sta parlando (VAD)
  };
}

// Applica un evento. Restituisce un nuovo oggetto: lo stato precedente non cambia.
export function evento(s, e, t, opz = DEFAULT) {
  const n = { ...s };
  switch (e.type) {
    case "status":
      n.connesso = e.status === "connected";
      if (!n.connesso) Object.assign(n, inizio(), { soloTesto: s.soloTesto, successoFino: s.successoFino });
      break;
    case "sessione":
      n.soloTesto = !!e.soloTesto;
      break;
    case "mode":
      n.agenteParla = e.mode === "speaking";
      if (n.agenteParla) n.pensaDa = null;
      break;
    case "turnoUtente":
      n.pensaDa = t;
      n.scrive = false;
      n.testoFino = 0;
      break;
    case "rispostaAgente":
      n.pensaDa = null;
      if (n.soloTesto) n.testoFino = t + (e.ms ?? opz.testoMs);
      break;
    case "strumentoInizio":
      n.strumenti = s.strumenti + 1;
      break;
    case "strumentoFine":
      n.strumenti = Math.max(0, s.strumenti - 1);
      // dopo uno strumento l'agente deve ancora rispondere: continua a pensare
      if (n.pensaDa == null && !n.agenteParla) n.pensaDa = t;
      if (e.successo) n.successoFino = t + opz.successMs;
      break;
    case "scrive":
      n.scrive = !!e.on;
      break;
    case "vad":
      n.voceUtente = e.score >= 0.5;
      break;
  }
  return n;
}

// Lo stato da mostrare all'istante t. Precedenza: success > speaking > thinking > listening > idle.
export function vista(s, t, opz = DEFAULT) {
  if (s.successoFino > t) return "success";
  if (!s.connesso) return "idle";
  if (s.agenteParla || s.testoFino > t) return "speaking";
  if (s.strumenti > 0 || (s.pensaDa != null && t - s.pensaDa < opz.thinkMax)) return "thinking";
  if (s.soloTesto) return s.scrive ? "listening" : "idle";
  return "listening";
}

// Prossimo istante in cui la vista può cambiare da sola (per programmare un solo timer).
export function prossimaScadenza(s, t, opz = DEFAULT) {
  const c = [s.successoFino, s.testoFino, s.pensaDa != null ? s.pensaDa + opz.thinkMax : 0].filter((x) => x > t);
  return c.length ? Math.min(...c) : null;
}

// Un esito è un successo solo se lo strumento ha davvero fatto qualcosa:
// un passo in più segnato come fatto, un foglio o un promemoria creati.
export function esitoPositivo(nome, risultato, fattiPrima, fattiDopo) {
  let r;
  try {
    r = typeof risultato === "string" ? JSON.parse(risultato) : risultato;
  } catch {
    return false;
  }
  if (!r || typeof r !== "object" || r.errore) return false;
  if (nome === "next_step") return fattiDopo > fattiPrima;
  if (nome === "prepare_summary" || nome === "create_reminders") return r.creato === true;
  return false;
}

// Passi fatti in tutti i percorsi, dallo stato che tools.js manda con onState.
export function contaFatti(statoStrumenti) {
  return Object.values(statoStrumenti?.percorsi || {}).reduce((n, p) => n + (p.completati?.length || 0), 0);
}
