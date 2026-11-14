# Riuso: copia Primo Passo e usalo come se fossi tu lo sviluppatore

Primo Passo è software libero con licenza **MIT** ([LICENSE](LICENSE)). Puoi copiarlo, modificarlo, pubblicarlo e usarlo, anche per scopi commerciali, tenendo la nota di copyright. Vale per il codice, i prompt, i dati dei percorsi, la mascotte Pino e il prototipo grafico nella repository [stock](https://github.com/mancormemec-stack/stock). Non c'è nessuna garanzia e non è consulenza legale: le informazioni sulle pratiche vanno verificate da chi le usa.

## Cosa serve

- un account GitHub (per il fork e per GitHub Pages);
- Node 18 o superiore;
- un account ElevenLabs con una chiave API che può gestire gli agenti (il piano gratuito basta per provare).

Non servono server, database, account per gli utenti né altre chiavi.

## Passi (30-45 minuti)

1. **Copia la repository:** fai un fork (o clonala) e dalla cartella lancia `npm test`. Se i test passano, i dati e gli strumenti sono a posto.
2. **Crea il tuo agente:** `ELEVENLABS_API_KEY=... node scripts/crea-agente.mjs --dry-run` per provare senza inviare nulla, poi lo stesso comando senza `--dry-run`. La chiave si mette solo come variabile d'ambiente nel terminale e non va mai salvata in un file. Lo script crea gli 8 strumenti di [agent/tools.json](agent/tools.json) e l'agente con il prompt di [agent/prompt-sistema.md](agent/prompt-sistema.md), e stampa l'ID dell'agente.
3. **Imposta l'agente:** lo script crea la base; il resto si applica dal pannello ElevenLabs (o via API) con i valori della tabella qui sotto.
4. **Aggiungi le lingue:** l'interfaccia ne offre 89. L'agente deve avere come lingue aggiuntive i codici dell'elenco qui sotto (italiano è la lingua di base), con il primo messaggio vuoto.
5. **Collega il sito all'agente:** scrivi l'ID in `web/app.js` (costante `AGENT_ID`) oppure apri la pagina con `?agent=ID`. Finché non lo fai, il sito prova a usare l'agente originale, che accetta richieste solo dal suo dominio.
6. **Pubblica:** nella tua repository, Settings → Pages → Source: **GitHub Actions**. A ogni push su `main` il workflow [.github/workflows/pages.yml](.github/workflows/pages.yml) lancia i test e pubblica solo la cartella `web/` su `https://TUO-UTENTE.github.io/NOME-REPO/`.
7. **Limita l'accesso:** nelle impostazioni Security dell'agente ammetti solo il tuo dominio e `localhost`. Attenzione a `scripts/aggiorna-agente.mjs`: alla riga con `allowlist` c'è il dominio dell'autore originale; sostituiscilo con il tuo prima di lanciarlo, altrimenti blocchi il tuo stesso sito. Imposta anche un limite giornaliero basso di conversazioni e riduci la conservazione di trascrizioni e audio.
8. **Prova:** apri il sito, scegli una lingua e scrivi a Pino; poi prova la voce con le cuffie.

## Impostazioni dell'agente (quelle che usiamo noi)

| Impostazione | Valore |
|---|---|
| LLM | claude-sonnet-5-5, livello di ragionamento basso (reasoning effort: low), temperatura 0 |
| Sintesi vocale | modello eleven_v4_turbo, con una voce multilingua a scelta |
| Riconoscimento vocale | Scribe realtime (scribe_realtime), qualità alta |
| Turni | modello turn_v3, reattività normale, turno speculativo attivo, timeout di 7 secondi |
| Interruzioni | rilevamento delle voci di sottofondo attivo; suoni come «aaah», «ehm», «mm» non interrompono Pino |
| Primo messaggio | vuoto: lo scrive l'LLM quando l'app manda il messaggio nascosto [AVVIO] |
| Modifiche consentite dal browser | lingua, primo messaggio e modalità solo testo |
| Durata massima | 600 secondi |
| Domini ammessi | solo il tuo dominio e localhost, con l'intestazione Origin obbligatoria |

## Lingue aggiuntive dell'agente (88 codici)

en, ro, ar, uk, fil, bn, af, am, hy, as, ast, az, be, bs, bg, my, yue, ca, zh, hr, cs, da, nl, et, fi, fr, gl, ka, de, el, gu, ha, he, hi, hu, is, id, ga, ja, jv, kn, kk, ko, ky, lo, lv, lt, lg, lb, mk, ms, ml, mt, mi, mr, mn, ne, no, oc, or, ps, fa, pl, pt, pa, ru, sr, sn, sd, sk, sl, so, ckb, es, sw, sv, tg, ta, te, th, tr, ur, uz, vi, cy, wo, yo, zu

## Adattarlo a un'altra città o ad altre pratiche

Le pratiche stanno in `web/data/percorsi.json` e gli uffici in `web/data/uffici.json`: sono dati, non codice. Ogni voce ha una fonte, una data e uno stato di verifica (`verificato` e `controllo`). Solo una persona che ha aperto la fonte può impostare `"controllo": "umano"`. Dopo ogni modifica lancia `npm test`.

## Cose da sapere prima di usarlo

- **I dati** sono controllati in modo automatico sulle fonti ufficiali; quasi nessuna voce è stata confermata da una persona. Chi li riusa deve verificarli.
- **La voce** è stata provata soprattutto in filippino. Le altre lingue sono provate in testo.
- **Le traduzioni** dell'interfaccia: 7 scritte per la demo, 82 automatiche e non riviste da madrelingua.
- **Privacy:** il sito non salva dati, ma audio e testo passano da ElevenLabs e dal fornitore dell'LLM, che possono conservarli secondo le tue impostazioni. Dillo nell'informativa.
- **Segreti:** nessuna chiave deve finire nella repository. `npm test` controlla che non ci siano file `.env` né stringhe che sembrano chiavi.

I contributi sono benvenuti: apri una issue o una pull request.
