// Client tools dell'agente. Funzioni pure sui dati + effetti iniettati
// (download, stampa, aggiornamento UI), così girano sia nel browser sia nei test Node.
// Lo stato vive solo in memoria: nessun dato lascia il dispositivo.

const NV = "[NON VERIFICATO - confermare allo sportello]";

const splitIds = (s) =>
  (s || "").split(",").map((x) => x.trim()).filter(Boolean);

const mark = (item) => (item.verificato ? item.testo : `${item.testo} ${NV}`);

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

  function dependencies(p) {
    return (p.dipende_da || []).map((d) => {
      const dep = getPath(d.percorso);
      const s = state.percorsi[d.percorso];
      const fatto = s && dep && dep.passi.every((x) => s.completati.includes(x.id));
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
        }))
      );
    },

    start_path({ path_id }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      pathState(path_id);
      notify();
      return out({
        titolo: p.titolo,
        ente: p.ente,
        prima_di_iniziare: dependencies(p),
        prerequisiti: p.prerequisiti.map((x) => ({ id: x.id, testo: mark(x) })),
        numero_passi: p.passi.length,
        istruzione: "Chiedi all'utente quali prerequisiti ha, poi chiama check_prerequisites.",
      });
    },

    check_prerequisites({ path_id, posseduti }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      const s = pathState(path_id);
      s.posseduti = splitIds(posseduti).filter((id) => p.prerequisiti.some((x) => x.id === id));
      notify();
      const mancanti = p.prerequisiti.filter((x) => !s.posseduti.includes(x.id));
      return out({
        ha_tutto: mancanti.length === 0,
        mancanti: mancanti.map((x) => ({ id: x.id, testo: mark(x) })),
        dipendenze: dependencies(p).filter((d) => d.stato !== "completato"),
      });
    },

    next_step({ path_id, completati }) {
      const p = getPath(path_id);
      if (!p) return unknown(path_id);
      const s = pathState(path_id);
      for (const id of splitIds(completati)) {
        if (p.passi.some((x) => x.id === id) && !s.completati.includes(id)) s.completati.push(id);
      }
      notify();
      const bloccanti = dependencies(p).filter((d) => d.obbligatorio && d.stato !== "completato");
      if (bloccanti.length) {
        return out({
          bloccato: true,
          motivo: `Prima serve: ${bloccanti.map((d) => d.titolo).join(", ")}`,
          suggerimento: `Se l'utente non l'ha ancora fatto, avvia quel percorso con start_path.`,
        });
      }
      const prossimo = p.passi.find((x) => !s.completati.includes(x.id));
      if (!prossimo) {
        return out({
          completato: true,
          scadenze_da_ricordare: p.scadenze.map((x) => ({ id: x.id, testo: mark(x), evento: x.evento })),
          istruzione: "Proponi create_reminders e prepare_summary.",
        });
      }
      return out({
        passo: { id: prossimo.id, testo: mark(prossimo) },
        fatti: s.completati.length,
        totale: p.passi.length,
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
      return out({
        ufficio: fill(u.nome),
        dove: u.dove,
        come: u.come,
        contatti_municipio: contatti,
        verificato: u.verificato && (p.ufficio !== "asl" || uffici.mappa_verificata),
        avviso: u.verificato ? undefined : NV,
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
            passi: p.passi.map(mark),
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
  const when = dates.length ? `Fonti ufficiali, verificate il ${esc(dates[dates.length - 1])}:` : "Fonti ufficiali:";
  return `<p class="nota">${when}<br>${urls.map(esc).join("<br>")}</p>`;
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
<h2>Passi</h2><ul>${li(p.passi, s.completati)}</ul>
${traduzione ? `<div class="tr"><strong>${esc(lingua || "")}</strong>\n${esc(traduzione)}<p class="nota">Traduzione automatica: in caso di dubbio vale il testo italiano.</p></div>` : ""}
${sourcesHtml(p, esc)}
<p class="nota">Foglio informativo generato da un assistente automatico. Non sostituisce gli uffici. Nessun dato personale è stato salvato.</p>
</body></html>`;
}
