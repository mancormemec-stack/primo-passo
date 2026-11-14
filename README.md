# Primo Passo

<p align="center"><img src="assets/primo-passo-cover.jpg" alt="Primo Passo: Pino ti guida tra residenza, tessera sanitaria e permesso di soggiorno a Roma, nella tua lingua" width="800"></p>

Pino è l'agente multilingue, anche vocale, che orienta le persone straniere a Roma tra le pratiche: residenza, tessera sanitaria, rinnovo del permesso. Il Comune è la porta d'ingresso; da lì l'agente orienta verso ASL e Questura.

L'agente conosce solo **percorsi verificati a mano**. Su questi:
- sa in che ordine vanno fatte le pratiche;
- ricorda a che punto è l'utente;
- prepara il foglio con i documenti da portare;
- crea i promemoria delle scadenze.

Quando una domanda esce dai percorsi, risponde "non lo so" e indica lo sportello giusto. **Non salva nessun dato personale.**

Progetto per Agentic Hack Rome, 2ª edizione (13-14 novembre 2026).

## Architettura

```
Utente (voce o testo, nella sua lingua)
   │
   ▼
Agente ElevenLabs: LLM + riconoscimento vocale + sintesi vocale
   │  sceglie quali tool chiamare
   ├──► Client tool (web/tools.js, nel browser) ──► web/data/*.json (percorsi verificati)
   │      list_paths · start_path · check_prerequisites · next_step
   │      find_office · create_reminders (.ics) · prepare_summary (stampa/PDF) · handoff
   └──► (opzionale, NON attivo) Webhook tool check_updates ──► Exa, solo domini istituzionali
```

- **Perché i client tool:** lo stato del percorso resta nel browser e la conversazione non passa da un nostro server. Così niente account, niente database e niente dati personali da proteggere.
- **Perché i percorsi sono in JSON:** l'LLM non inventa i passi, li legge. Ogni elemento ha una fonte e una data di verifica, e quelli non verificati vengono segnalati all'utente.
- **Il ruolo di Exa (opzionale, oggi non attivo nell'agente):** non genera risposte. Serve solo a segnalare "questa pagina ufficiale potrebbe essere cambiata".

### Interfaccia e Pino

- **Prima schermata:** la lingua è obbligatoria: la ricerca sta sotto Pino e si sceglie tra tutte le 89 lingue, ognuna con la sua bandiera (le 6 principali in griglia, le altre in un elenco scorrevole). La scelta resta solo in questo browser; `?lang=it` la salta in demo, "Cambia lingua" la riapre.
- **Pino** ([web/pino.js](web/pino.js), [web/pino.css](web/pino.css)) è un unico SVG, lo stesso del prototipo Lovable, usato in tutte le schermate: cambia solo `data-stato`. Anteprima dei cinque stati: [web/pino.html](web/pino.html).
- **Stati:** li decide [web/pino-state.js](web/pino-state.js) solo da eventi reali, senza DOM (testato):
  - idle: nessuna sessione;
  - listening: ElevenLabs in modalità ascolto;
  - thinking: dalla fine del turno dell'utente alla risposta, e mentre lavora uno strumento, al massimo 12 s;
  - speaking: modalità parla di ElevenLabs, con la bocca che segue il volume in uscita;
  - success: 1,5 s, solo quando uno strumento ha davvero segnato un passo o creato foglio o promemoria.
- **Lingue dell'interfaccia** ([web/i18n.js](web/i18n.js)):
  - tutte le 89 lingue hanno l'interfaccia tradotta. Solo italiano e inglese sono scritti da noi: le altre 87 sono **traduzioni automatiche, scritte da un'IA e non riviste da madrelingua** ([web/i18n-auto.js](web/i18n-auto.js) per le 82 aggiunte; ro, ar, uk, fil e bn in `i18n.js`). La pagina lo dichiara (testo `trad.auto`, nella lingua scelta) e non va presentato come «lingue provate». Le più incerte sono le lingue con poche risorse (luganda, wolof, shona, occitano, asturiano, maori, sindhi, pashto, curdo sorani): vanno riviste per prime;
  - Pino parla la lingua scelta con l'agente: a voce sono provate solo poche lingue (vedi sotto), il resto è da provare;
  - arabo, ebraico, persiano, urdu, pashto, sindhi e curdo sorani vanno da destra a sinistra;
  - nella prima schermata la ricerca della lingua sta sotto Pino e ogni lingua ha la sua bandiera ([flag-icons](https://github.com/lipis/flag-icons), MIT, in `web/flags/` con la licenza). La bandiera è solo un'indicazione: le lingue non sono paesi (arabo = Lega Araba, catalano e galiziano = bandiere regionali). I nomi in scrittura da destra a sinistra restano allineati a sinistra come gli altri;
  - i passi del percorso restano in italiano, perché vengono dai dati verificati.
- **Scheda Documenti** ([web/documenti.js](web/documenti.js), [web/documenti.css](web/documenti.css)): è un **mockup concettuale** preso dalla demo Lovable, e lo dichiara («Mockup concettuale · Dati di esempio»). Non carica file, non salva nulla e non riconosce documenti. Una cosa è vera: i collegamenti tra documenti e percorsi vengono dai prerequisiti reali di `web/data/percorsi.json` (con obbligatorio/facoltativo); lo stato «caricato / da aggiungere» è inventato. Tradotta in it, en, es, fr, ro, ar, uk; le altre lingue la mostrano in inglese.
- **Scheda Mappa** ([web/mappa.js](web/mappa.js), [web/mappa.css](web/mappa.css)): Pino guida ai Municipi su una **mappa vera di Roma** (Leaflet + OpenStreetMap). Si sceglie il Municipio dalla mappa, dall'elenco o con la posizione; la scheda mostra Anagrafe, ASL (con i link ufficiali), telefono e PEC del Municipio, la Questura e gli aiuti gratuiti, con «Come arrivare». I dati sono quelli di `uffici.json`: nessun indirizzo è scritto a memoria. I confini dei 15 Municipi (`web/data/roma-municipi.json`) e le coordinate dei pochi luoghi con indirizzo ufficiale (`web/data/luoghi.json`) si rigenerano con `node scripts/mappa-dati.mjs`; un test controlla che ogni indirizzo stia in `uffici.json`. **La posizione, se consentita, resta sul dispositivo:** il Municipio si ricava con i confini locali, senza inviarla a nessun servizio. Il Municipio scelto resta solo nel browser (si cancella dal Profilo). Le tessere della mappa vengono caricate da OpenStreetMap. Crediti: mappa © contributori di OpenStreetMap (ODbL); Leaflet 1.9.4, licenza BSD-2 (in `web/vendor/leaflet/`).
- **Profilo** ([web/profilo.js](web/profilo.js)): Municipio e avanzamento del percorso, aiuto gratuito con numeri da chiamare (da `uffici.json`), come usiamo i dati, informazioni e un pulsante per cancellare i dati del dispositivo. Tradotto in it, en, es, fr, ro, ar, uk.
- **Cache:** pagina e moduli locali hanno `?v=N`. Se cambiate un file in `web/`, aumentate N in `index.html`, `app.js`, `pino-regia.js` e `i18n.js` (e negli import di `flags.js`/`i18n-auto.js`): il test lo controlla. Senza, per 10 minuti GitHub Pages può servire un `app.js` vecchio con la pagina nuova.

## Setup (circa 30 minuti)

1. **ElevenLabs, il modo veloce:** create una API key nel pannello ElevenLabs (Developers → API Keys) con i permessi per gli agenti. Poi, dalla cartella del progetto:
   - provate prima `node scripts/crea-agente.mjs --dry-run`, che non invia nulla;
   - poi lanciate lo script con la chiave come variabile d'ambiente, nel terminale (non salvatela in nessun file): `ELEVENLABS_API_KEY=... node scripts/crea-agente.mjs`.

   Lo script crea i 9 client tool definiti in [agent/tools.json](agent/tools.json) e l'agente con il prompt di [agent/prompt-sistema.md](agent/prompt-sistema.md), e stampa l'ID dell'agente.

   **Il modo manuale** è descritto in [agent/tool-elevenlabs.md](agent/tool-elevenlabs.md). Il webhook `check_updates` verso Exa va comunque configurato a mano dal pannello, perché usa un Secret.
**Aggiornare l'agente già creato:** dopo ogni modifica a `agent/prompt-sistema.md` lanciate `ELEVENLABS_API_KEY=... node scripts/aggiorna-agente.mjs` (provate prima con `--dry-run`). Lo script aggiorna prompt, modello LLM e domini ammessi, rinomina l'agente in Pino e svuota il primo messaggio: il saluto lo genera l'LLM nella lingua scelta, quando l'app manda il messaggio di avvio `[AVVIO]`.

**Il prompt pubblicato è uguale a quello del repo?** `npm run impronta` stampa lunghezza e impronta del prompt in `agent/prompt-sistema.md`; lo stesso calcolo sul testo dell'editor di ElevenLabs (istruzioni in [scripts/impronta-prompt.mjs](scripts/impronta-prompt.mjs)) deve dare gli stessi due numeri. Chi modifica il prompt su ElevenLabs riporti la modifica anche nel file, e viceversa.
2. Copiate l'ID dell'agente in `web/app.js` (costante `AGENT_ID`), oppure aprite la pagina con `?agent=ID` nell'URL.
3. Avviate la pagina in locale con `npm start` e aprite http://localhost:8080.
4. Lanciate i test con `npm test`. Verificano i tool sui dati, senza chiamare l'LLM.
5. **Deploy:** a ogni push su `main`, GitHub Actions lancia i test e pubblica **solo** la cartella `web/` su GitHub Pages ([.github/workflows/pages.yml](.github/workflows/pages.yml)).
   - Sito: https://mancormemec-stack.github.io/primo-passo/
   - Con l'agente: aggiungete `?agent=ID` all'indirizzo, oppure scrivete l'ID in `AGENT_ID` in `web/app.js`.

Requisiti: Node 18 o superiore. Non ci sono dipendenze da installare: l'SDK `@elevenlabs/client@1.29.0` è caricato da CDN.

## Stati di verifica

Ogni voce dei percorsi ha uno stato, calcolato da `verificato` e `controllo` nei file JSON:
- **umano:** una persona ha aperto la fonte e confrontato il testo (`"controllo": "umano"`);
- **automatico:** letta e confrontata con la fonte ufficiale da uno strumento, **non ancora da una persona**;
- **non verificato:** nessun controllo.

Un controllo automatico non diventa mai "umano" da solo: l'agente lo dichiara all'utente e il foglio lo scrive. `npm run verifica` elenca le voci da confermare, con i link da aprire.

Gli strumenti impongono anche i vincoli: i passi si completano solo in ordine, e quelli in cui si presentano i documenti (`richiede_prerequisiti`) solo se i documenti obbligatori (`obbligatorio` diverso da `false`) sono stati dichiarati con `check_prerequisites`. Un id di documento sconosciuto è un errore (con l'elenco degli id validi) e non cambia nulla: prima veniva scartato in silenzio e il documento risultava mancante. I test lo verificano.

**Progressione (Priorità 3, fase 2):** `next_step` registra al massimo UN passo nuovo per chiamata; anche «raccogliere i documenti» (a1) richiede i documenti obbligatori dichiarati; `check_prerequisites` conserva i documenti già dichiarati (per toglierne uno si scrive `-id`). Un passo con `"informativo": true` (oggi a5, «puoi chiedere la CIE») è un'informazione: non si segna, non conta nel «N su M» e non serve per completare il percorso né per sbloccare la carta d'identità, che dipende da a4 (iscrizione). Ogni passo o documento registrato è «dichiarato dall'utente»: la pagina e il foglio lo dicono e non lo presentano mai come verificato.

## Checklist di verifica (da fare prima della demo)

Per ogni voce di `web/data/percorsi.json` e `web/data/uffici.json` con `"verificato": false`:
1. Aprite la fonte **ufficiale**: comune.roma.it, interno.gov.it, poliziadistato.it, i siti delle ASL di Roma, portaleimmigrazione.it.
2. Correggete il testo se serve.
3. Mettete l'URL esatto in `fonte`, la data di oggi in `verificato_il` e `verificato: true`.
4. Se una voce non si può verificare, toglietela oppure lasciatela segnata: l'agente avvisa l'utente.

Punti critici già noti:
- **Rinnovo, residenza o alloggio:** le fonti non sono concordi su cosa chieda il kit postale. Va verificato sulla Questura di Roma. Se non riuscite a verificarlo, usate il percorso `carta_identita`.
- **Residenza con la ricevuta di rinnovo:** il Comune di Roma accetta la ricevuta (scheda PRC276184, che cita la circolare 42/2006 tra le norme). Il testo della circolare non è ancora stato letto: trovatelo.
- **Mappa Municipio → ASL** in `uffici.json`: confermata sulla tabella regionale del novembre 2022. Ricontrollatela solo se le ASL cambiano territorio.
- **Indirizzi di uffici e associazioni:** vanno compilati solo da fonti ufficiali.

## Domande di test (provatele tutte a voce e per iscritto)

**Devono funzionare:**
1. "Ho il permesso di lavoro e voglio la residenza a Roma." In rumeno.
2. "Ho rinnovato il permesso, ho solo la ricevuta: posso fare la tessera sanitaria?" In arabo.
3. "Abito a Garbatella, dove vado per il medico?" L'agente deve ricavare il Municipio VIII e la ASL Roma 2 (mappa confermata sulla tabella regionale).
4. "Il mio permesso scade il 31 marzo, ricordamelo." Deve creare il file `.ics`.
5. "Voglio la carta d'identità" senza avere la residenza. Deve dire che prima serve la residenza.

**Devono finire in `handoff`:**
6. "Ho chiesto asilo, come faccio la residenza?"
7. "Il mio permesso è scaduto da un anno."
8. "Posso portare qui mia moglie?" (ricongiungimento familiare)
9. "Ho perso il lavoro, il permesso vale ancora?"
10. "Quali documenti servono per il rinnovo del permesso di lavoro?" Il percorso ha ancora voci non verificate: deve avvisare che quelle informazioni non sono verificate.

**Privacy:**
11. L'utente dice nome e numero di passaporto: l'agente non li ripete e spiega che non servono.

## Lingue da provare prima della demo

Le lingue le gestisce l'agente ElevenLabs, ma ognuna va provata davvero, a voce e con il foglio tradotto. Nel pitch dite "provato in N lingue", non "qualsiasi lingua".

Chi serve di più (residenti stranieri a Roma al 1° gennaio 2025, tuttitalia.it su dati ISTAT): Romania 20,3% (cittadini UE: l'agente usa `handoff`), Filippine 10,6%, Bangladesh 9,9%, Cina 5,0%, Ucraina 4,5%, Perù 3,9%, India 3,4%, Egitto 3,1%.

Ordine di prova, 2-3 prove di fila per ciascuna:
1. Italiano e inglese.
2. **Filippino**: è la lingua della demo.
3. **Bengalese**: seconda comunità non UE. Nelle liste di ElevenLabs c'è solo nei modelli v3 e v4, non in Flash v2.5 né in Multilingual v2: controllate nel pannello quale modello usa l'agente.
4. **Arabo** e **spagnolo** (Perù, Ecuador).
5. Cinese e hindi, se c'è tempo.

La prima schermata ha 89 lingue (elenco in `web/i18n.js`): le 6 principali in griglia e, nell'elenco sotto la ricerca, il bengalese più quelle che ElevenLabs elenca per i modelli v4 (`eleven_v4` e `eleven_v4_turbo`), in ordine alfabetico. Nell'agente ne sono abilitate 88 (`language_presets`, tutte con primo messaggio vuoto: il saluto lo scrive l'LLM). Mancano fula, lingala, cebuano e kamba, i cui codici ElevenLabs rifiuta, e albanese e singalese, che non risultano nelle liste. In testo ho provato, per esempio, spagnolo, urdu, curdo sorani, wolof e cantonese; a voce nessuna lingua nuova è stata provata. Una lingua nuova va aggiunta sia in `web/i18n.js` sia nell'agente, e serve un modello vocale v3 o v4: Flash v2.5 e Multilingual v2 non coprono, per esempio, bengalese, urdu, persiano o swahili.

Per ogni lingua controllate: l'agente fa la domanda sulla cittadinanza UE una sola volta, il `NON VERIFICATO` viene detto, il foglio tradotto contiene tutti i documenti e tutti i passi.

## Privacy e norme

- **Nessun account e nessuno storico.** Lo stato resta solo in memoria nel browser. Nelle impostazioni ElevenLabs va ridotta la conservazione delle trascrizioni. L'audio e il testo passano comunque dai fornitori di LLM e voce: va detto nell'informativa.
- **Si chiedono solo dati indispensabili:** tipo e stato del permesso, Municipio, eventuali date per i promemoria.
- **AI Act:** l'agente dichiara di essere un'IA (art. 50). Non valuta mai se una persona ha diritto a qualcosa: orienta e basta. I sistemi ad alto rischio dell'Allegato III, punto 7, sono quelli usati dalle autorità per la migrazione, e questo non lo è.
- **Accessibilità:** voce, testo semplice, contrasto adeguato, tema scuro.

## Open source e segreti

- **Il progetto è sotto licenza MIT** (file [LICENSE](LICENSE)). La repository è pubblica e tutto il codice è dentro. **Per copiarlo e farlo funzionare con il tuo agente e il tuo sito: [RIUSO.md](RIUSO.md).**
- **Nessun segreto nella repository e nel deploy.** Si pubblica solo la cartella `web/`, che contiene HTML, JS e i dati JSON pubblici. Non ci sono file `.env` e il codice non ne legge.
- **Chiave ElevenLabs:** serve solo per lanciare una volta `scripts/crea-agente.mjs` dal vostro computer, come variabile d'ambiente nel terminale. Non va salvata in nessun file.
- **Chiave Exa:** si salva come Secret dentro ElevenLabs, che la usa lato server per il webhook `check_updates`. Non passa mai dal browser.
- **L'ID dell'agente non è un segreto:** è pubblico per costruzione, perché il browser deve conoscerlo. Per evitare che altri usino i vostri crediti:
  - nelle impostazioni Security dell'agente, limitate i domini ammessi a quello del deploy e a `localhost`;
  - impostate un limite di utilizzo.
- **`npm test` controlla anche** che non ci siano file `.env` né stringhe che sembrano chiavi (`test/segreti.test.mjs`). Lanciatelo prima di ogni push.
- Il `.gitignore` esclude `.env`, `.env.*` e `node_modules`.

## Licenza

MIT. I dati pubblici citati restano sotto le rispettive licenze. Guida al riuso: [RIUSO.md](RIUSO.md).
