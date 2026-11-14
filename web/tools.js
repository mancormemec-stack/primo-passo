// Client tools dell'agente. Funzioni pure sui dati + effetti iniettati
// (download, stampa, aggiornamento UI), così girano sia nel browser sia nei test Node.
// Lo stato vive solo in memoria: nessun dato lascia il dispositivo.

const NV = "[NON VERIFICATO - confermare allo sportello]";

const splitIds = (s) =>
  (s || "").split(",").map((x) => x.trim()).filter(Boolean);

// Tre livelli di verifica:
//  - "umano": una persona ha controllato la fonte (controllo: "umano"), oppure è un testo nostro
//    di raccordo che non afferma nulla di amministrativo (fonte: "interno");
//  - "automatico": letto e confrontato con la fonte ufficiale da uno strumento, non ancora da una persona;
//  - "non_verificato": nessun controllo.
// Un controllo automatico non diventa mai "umano" da solo.
export function statoOf(item) {
  if (!item.verificato) return "non_verificato";
  if (item.controllo === "umano" || item.fonte === "interno") return "umano";
  return "automatico";
}

export function riepilogoVerifica(items) {
  const n = { umano: 0, automatico: 0, non_verificato: 0 };
  for (const i of items) n[statoOf(i)]++;
  return n;
}

const tuttiGliElementi = (p) => [...p.prerequisiti, ...p.passi, ...p.scadenze];

// Un passo `informativo` non è un'azione dell'utente: si legge, non si segna come fatto,
// non conta nel completamento del percorso né nel «N su M».
export const azioniDi = (p) => p.passi.filter((x) => !x.informativo);
export const informazioniDi = (p) => p.passi.filter((x) => x.informativo);

// Tutto ciò che si registra è una dichiarazione dell'utente: nessun ufficio l'ha confermato.
export const ORIGINE = "dichiarato dall'utente";
const LEGENDA_FOGLIO =
  "☑ = dichiarato dall'utente: non è verificato da Primo Passo né confermato da un ufficio. ℹ = informazione, non un passo da fare.";
const NOTA_ORIGINE ="Registrato sulla parola dell'utente («dichiarato dall'utente»): non è verificato da Primo Passo né confermato da un ufficio.";

function avvisoVerifica(n) {
  if (!n.automatico && !n.non_verificato) return undefined;
  return (
    "Le informazioni di questo percorso sono state controllate sulle fonti ufficiali in modo AUTOMATICO, non ancora da una persona" +
    ` (controllo automatico: ${n.automatico}; non verificate: ${n.non_verificato}). ` +
    "Ricordalo all'utente UNA sola volta e consiglia di confermare allo sportello. " +
    "Non dire mai che sono 'verificate da una persona'. Le voci con stato non_verificato vanno sempre segnalate."
  );
}

// Le voci non verificate portano l'etichetta nel testo; quelle controllate in automatico hanno solo `stato`.
const mark = (item) => (statoOf(item) === "non_verificato" ? `${item.testo} ${NV}` : item.testo);

const out = (obj) => JSON.stringify(obj, null, 1);

export function createTools(data, effects = {}) {
  const { percorsi } = data.percorsi;
  const uffici = data.uffici;
  const state = { percorsi: {} }; // path_id -> { posseduti: [], completati: [] }
  const notify = () => effects.onState?.(structuredClone(state));

  const getPath = (id) => percorsi.find((p) => p.id === id);
  const unknown = (id) =>
    out({ errore: `Percorso "${id}" sconosciuto. Usa list_paths, oppure handoff se nessun percorso si applica.` });

  function pathState(id) {
    state.percorsi[id] ??= { posseduti: [], completati: [] };
    return state.percorsi[id];
  }

  // Documenti obbligatori che l'utente non ha ancora dichiarato di avere (via check_prerequisites).
  const mancantiObbligatori = (p, s) =>
    p.prerequisiti.filter((x) => x.obbligatorio !== false && !s.posseduti.includes(x.id));

  const itemOut = (x) => ({ id: x.id, testo: mark(x), stato: statoOf(x), obbligatorio: x.obbligatorio !== false });

  function dependencies(p) {
    return (p.dipende_da || []).map((d) => {
      const dep = getPath(d.percorso);
      const s = state.percorsi[d.percorso];
      // Un percorso è completato quando lo sono le sue azioni: i passi informativi non contano.
      const fatto = s && dep && azioniDi(dep).every((x) => s.completati.includes(x.id));
      return {
        percorso: d.percorso,
        titolo: dep?.titolo,
        obbligatorio: d.obbligatorio,
        nota: d.nota,
        stato: fatto ? "completato" : "da fare o non noto (chiedi all'utente)",
      };
    });
  }

  return {
    state,

    list_paths() {
      return out(
        percorsi.map((p) => ({
          id: p.id,
          titolo: p.titolo,
          ente: p.ente,
          quando_si_applica: p.quando_si_applica,
          non_si_applica: p.non_si_applica,
          avviso: p._avviso,
          verifica: riepilogoVerifica(tuttiGliElementi(p)),
        }))
      );
    },

    start_path({ path_id }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      pathState(path_id);
      notify();
      const verifica = riepilogoVerifica(tuttiGliElementi(p));
      return out({
        titolo: p.titolo,
        ente: p.ente,
        prima_di_iniziare: dependencies(p),
        prerequisiti: p.prerequisiti.map(itemOut),
        numero_passi: azioniDi(p).length,
        scadenze_disponibili: p.scadenze.map((x) => ({ id: x.id, testo: mark(x), stato: statoOf(x), evento: x.evento })),
        verifica,
        avviso_verifica: avvisoVerifica(verifica),
        istruzione:
          "Chiedi all'utente quali prerequisiti ha, poi chiama check_prerequisites. Le scadenze di scadenze_disponibili si possono ricordare con create_reminders appena l'utente dà la data dell'evento, senza aspettare la fine del percorso.",
      });
    },

    check_prerequisites({ path_id, posseduti }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      // I documenti già dichiarati si conservano: ogni chiamata AGGIUNGE quelli nuovi. Per togliere
      // un documento dichiarato per errore si scrive il suo id preceduto da «-» (es. "-codice_fiscale").
      // Un id sconosciuto non si scarta in silenzio: farebbe risultare "mancante" un documento
      // che l'utente ha (es. "permesso_soggiorno" invece di "permesso_o_ricevuta").
      // Nessun cambiamento di stato finché gli id non sono tutti validi.
      const dati = splitIds(posseduti);
      const daTogliere = dati.filter((x) => x.startsWith("-")).map((x) => x.slice(1).trim());
      const daAggiungere = dati.filter((x) => !x.startsWith("-"));
      const sconosciuti = [...daAggiungere, ...daTogliere].filter((id) => !p.prerequisiti.some((x) => x.id === id));
      if (sconosciuti.length) {
        return out({
          errore:
            `Id non riconosciuti: ${sconosciuti.join(", ")}. Nulla è stato registrato. ` +
            "Richiama check_prerequisites usando SOLO gli id di id_validi. Non dire all'utente che gli manca un documento prima di averlo fatto.",
          id_non_riconosciuti: sconosciuti,
          id_validi: p.prerequisiti.map((x) => ({ id: x.id, testo: mark(x).slice(0, 80) })),
        });
      }
      const s = pathState(path_id);
      s.posseduti = [...new Set([...s.posseduti, ...daAggiungere])].filter((id) => !daTogliere.includes(id));
      notify();
      const mancanti = p.prerequisiti.filter((x) => !s.posseduti.includes(x.id));
      const obbligatori = mancantiObbligatori(p, s);
      return out({
        ha_tutto: obbligatori.length === 0,
        dichiarati_dall_utente: s.posseduti,
        mancanti: mancanti.map(itemOut),
        mancanti_obbligatori: obbligatori.map(itemOut),
        dipendenze: dependencies(p).filter((d) => d.stato !== "completato"),
        nota: NOTA_ORIGINE,
        istruzione: obbligatori.length
          ? "Mancano documenti obbligatori: i passi in cui si presentano i documenti non possono essere segnati come fatti finché non li ha."
          : undefined,
      });
    },

    // I passi si completano solo in ordine, e quelli in cui si presentano i documenti
    // (richiede_prerequisiti) solo se i documenti obbligatori sono stati dichiarati con check_prerequisites.
    // Il rispetto di queste regole non dipende dal prompt: lo impone questo strumento.
    next_step({ path_id, completati }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      const s = pathState(path_id);
      const bloccanti = dependencies(p).filter((d) => d.obbligatorio && d.stato !== "completato");
      if (bloccanti.length) {
        return out({
          bloccato: true,
          motivo: `Prima serve: ${bloccanti.map((d) => d.titolo).join(", ")}`,
          suggerimento: `Se l'utente non l'ha ancora fatto, avvia quel percorso con start_path.`,
        });
      }
      const richiesti = new Set(splitIds(completati));
      const rifiutati = [];
      const registrati = []; // passi registrati in QUESTA chiamata (al massimo uno)
      p.passi.forEach((step, i) => {
        if (!richiesti.has(step.id) || s.completati.includes(step.id)) return;
        // Un passo informativo si legge, non si segna.
        if (step.informativo) {
          rifiutati.push({ passo: step.id, motivo: "informativo" });
          return;
        }
        const prima = p.passi.slice(0, i).filter((x) => !x.informativo && !s.completati.includes(x.id));
        if (prima.length) {
          rifiutati.push({ passo: step.id, motivo: "ordine", da_fare_prima: prima.map((x) => x.id) });
          return;
        }
        if (step.richiede_prerequisiti) {
          const mancanti = mancantiObbligatori(p, s);
          if (mancanti.length) {
            rifiutati.push({ passo: step.id, motivo: "documenti_mancanti", mancanti: mancanti.map(itemOut) });
            return;
          }
        }
        // Un solo passo nuovo per chiamata: niente avanzamenti in blocco per fare prima.
        if (registrati.length >= 1) {
          rifiutati.push({ passo: step.id, motivo: "uno_alla_volta" });
          return;
        }
        s.completati.push(step.id);
        registrati.push(step.id);
      });
      notify();
      const rifiuto = rifiutati.length
        ? {
            rifiutati,
            istruzione_rifiuto:
              "Alcuni passi NON sono stati segnati come fatti: spiega all'utente cosa manca o cosa va fatto prima. Non dire che sono completati." +
              (rifiutati.some((r) => r.motivo === "uno_alla_volta")
                ? " Si registra UN solo passo per chiamata: richiama next_step per il passo successivo solo se l'utente lo ha dichiarato in modo chiaro."
                : "") +
              (rifiutati.some((r) => r.motivo === "informativo")
                ? " Un passo informativo non è un'azione dell'utente: non si registra, lo si legge come informazione."
                : ""),
          }
        : {};
      const azioni = azioniDi(p);
      const comuni = {
        registrato_ora: registrati.map((id) => ({ id, origine: ORIGINE })),
        registrati: azioni.filter((x) => s.completati.includes(x.id)).map((x) => x.id),
        origine_registrazione: NOTA_ORIGINE,
        fatti: azioni.filter((x) => s.completati.includes(x.id)).length,
        totale: azioni.length,
      };
      const prossimo = azioni.find((x) => !s.completati.includes(x.id));
      if (!prossimo) {
        return out({
          completato: true,
          ...comuni,
          informazioni: informazioniDi(p).map((x) => ({ id: x.id, testo: mark(x), stato: statoOf(x) })),
          scadenze_da_ricordare: p.scadenze.map((x) => ({ id: x.id, testo: mark(x), stato: statoOf(x), evento: x.evento })),
          istruzione:
            "Hai registrato tutti i passi che l'utente ha dichiarato di aver fatto («dichiarato dall'utente»). Non vuol dire che la pratica sia conclusa o accettata: l'esito lo decide l'ufficio. " +
            "Le informazioni sono da leggere come tali, non come passi da fare. Proponi create_reminders e prepare_summary.",
          ...rifiuto,
        });
      }
      return out({
        passo: { id: prossimo.id, testo: mark(prossimo), stato: statoOf(prossimo), richiede_prerequisiti: !!prossimo.richiede_prerequisiti },
        ...comuni,
        ...rifiuto,
      });
    },

    find_office({ path_id, municipio }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      const m = (municipio || "").trim().toUpperCase();
      const info = uffici.municipi[m];
      if (!info) return out({ errore: "Municipio non valido: chiedi il quartiere all'utente e ricava il Municipio (I-XV)." });
      const u = uffici.uffici[p.ufficio];
      const fill = (t) => t.replace("{municipio}", m).replace("{asl}", info.asl);
      pathState(path_id).ufficio = fill(u.nome);
      notify();
      const contatti = p.ufficio === "anagrafe_municipio" && info.pec
        ? { pec: info.pec, telefono: info.telefono, nota: "Contatti generali del Municipio: chiedi a loro l'ufficio anagrafe giusto." }
        : undefined;
      // La mappa Municipio -> ASL fa parte della risposta: se non è verificata, l'ufficio non lo è.
      const su = p.ufficio === "asl" && !uffici.mappa_verificata ? "non_verificato" : statoOf(u);
      const sportelli = p.ufficio === "asl" && info.sportelli_asl
        ? { elenco: info.sportelli_asl, nota: info.sportelli_nota, fonte: info.sportelli_fonte }
        : undefined;
      return out({
        ufficio: fill(u.nome),
        dove: u.dove,
        come: u.come,
        contatti_municipio: contatti,
        sportelli_vicini: sportelli,
        stato: su,
        // `verificato` vale solo se una persona ha controllato la fonte.
        verificato: su === "umano",
        avviso:
          su === "non_verificato"
            ? NV
            : su === "automatico"
              ? "Controllato in modo automatico sulle fonti ufficiali, non ancora da una persona: consiglia di confermare orari e indirizzo."
              : undefined,
      });
    },

    create_reminders({ path_id, scadenza_id, data_evento }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      const sc = p.scadenze.find((x) => x.id === scadenza_id);
      if (!sc) return out({ errore: `Scadenza sconosciuta. Disponibili: ${p.scadenze.map((x) => x.id).join(", ") || "nessuna"}` });
      const base = new Date(`${data_evento}T09:00:00`);
      if (isNaN(base)) return out({ errore: "data_evento deve essere AAAA-MM-GG" });
      const giorni = sc.giorni_dopo_evento ?? -(sc.giorni_prima_evento ?? 0);
      const quando = new Date(base);
      quando.setDate(quando.getDate() + giorni);
      const ics = buildIcs(sc.testo, p.titolo, quando);
      effects.download?.(`promemoria-${sc.id}.ics`, ics, "text/calendar");
      return out({
        creato: true,
        data_promemoria: quando.toISOString().slice(0, 10),
        testo: mark(sc),
        istruzione: "Di' all'utente di aprire il file scaricato per aggiungerlo al calendario del telefono.",
      });
    },

    prepare_summary({ path_id, lingua, traduzione }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      const s = pathState(path_id);
      // In un'altra lingua il foglio deve avere la traduzione di tutto: altrimenti si rifiuta e si danno i testi.
      const altraLingua = (lingua || "").trim() && !/^(it|ital)/i.test(lingua.trim());
      if (altraLingua && (traduzione || "").trim().length < 150) {
        return out({
          creato: false,
          errore: `Traduzione mancante o troppo breve. Traduci in ${lingua} TUTTI i documenti e TUTTI i passi qui sotto, nello stesso ordine e senza riassumere, poi richiama prepare_summary con il parametro traduzione.`,
          testi_da_tradurre: {
            documenti: p.prerequisiti.map(mark),
            passi: azioniDi(p).map(mark),
            informazioni: informazioniDi(p).map(mark),
            legenda: LEGENDA_FOGLIO,
          },
        });
      }
      const html = buildSummaryHtml(p, s, lingua, traduzione);
      effects.print?.(html);
      return out({ creato: true, istruzione: "Di' all'utente che può stamparlo o salvarlo come PDF e portarlo allo sportello." });
    },

    handoff({ motivo, municipio }) {
      effects.onHandoff?.(motivo);
      return out({
        messaggio: "Su questo non posso darti un'informazione sicura.",
        dove_chiedere: uffici.aiuto_gratuito.map((a) => ({ nome: a.nome, per: a.per, contatto: a.contatto })),
        municipio: municipio || undefined,
      });
    },
  };
}

function buildIcs(testo, titolo, quando) {
  const d = quando.toISOString().slice(0, 10).replaceAll("-", "");
  const esc = (t) => t.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Primo Passo//IT",
    "BEGIN:VEVENT",
    `UID:${d}-${Math.random().toString(36).slice(2)}@primopasso`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${d}`,
    `SUMMARY:${esc(titolo)}`,
    `DESCRIPTION:${esc(testo)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(titolo)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// Fonti ufficiali citate dalle voci del percorso, con la data dell'ultima verifica.
function sourcesHtml(p, esc) {
  const items = [...p.prerequisiti, ...p.passi, ...p.scadenze];
  const urls = [...new Set(items.flatMap((x) => (x.fonte || "").match(/https?:\/\/[^\s;)]+/g) || []))];
  if (!urls.length) return "";
  const dates = items.map((x) => x.verificato_il).filter(Boolean).sort();
  const n = riepilogoVerifica(items);
  const tutteUmane = !n.automatico && !n.non_verificato;
  const d = dates.length ? esc(dates[dates.length - 1]) : "";
  // Un controllo automatico non si presenta mai come verifica fatta da una persona.
  const when = !dates.length
    ? "Fonti ufficiali:"
    : tutteUmane
      ? `Fonti ufficiali, verificate da una persona il ${d}:`
      : `Fonti ufficiali, controllate in modo automatico il ${d} (non ancora confermate da una persona):`;
  const nota = n.non_verificato ? "<br>Alcune voci sono segnate come non verificate: confermale allo sportello." : "";
  return `<p class="nota">${when}<br>${urls.map(esc).join("<br>")}${nota}</p>`;
}

function buildSummaryHtml(p, s, lingua, traduzione) {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const li = (items, done = []) =>
    items.map((x) => `<li>${done.includes(x.id) ? "☑" : "☐"} ${esc(mark(x))}</li>`).join("");
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(p.titolo)}</title>
<style>body{font:15px/1.5 system-ui,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#111}
h1{font-size:20px}h2{font-size:16px;margin-top:20px}ul{list-style:none;padding:0}li{margin:6px 0}
.tr{border-top:1px solid #ccc;margin-top:24px;padding-top:12px;white-space:pre-wrap}.nota{font-size:12px;color:#555}</style></head>
<body><h1>${esc(p.titolo)}</h1><p>${esc(s.ufficio || p.ente)}</p>
<h2>Documenti da portare</h2><ul>${li(p.prerequisiti, s.posseduti)}</ul>
<h2>Passi</h2><ul>${li(azioniDi(p), s.completati)}</ul>
${informazioniDi(p).length ? `<h2>Informazioni</h2><ul>${informazioniDi(p).map((x) => `<li>ℹ ${esc(mark(x))}</li>`).join("")}</ul>` : ""}
<p class="nota">${esc(LEGENDA_FOGLIO)}</p>
${traduzione ? `<div class="tr"><strong>${esc(lingua || "")}</strong>\n${esc(traduzione)}<p class="nota">Traduzione automatica: in caso di dubbio vale il testo italiano.</p></div>` : ""}
${sourcesHtml(p, esc)}
<p class="nota">Foglio informativo generato da un assistente automatico. Non sostituisce gli uffici. Nessun dato personale è stato salvato.</p>
</body></html>`;
}
