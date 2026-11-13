# Primo Passo

Agente multilingue, anche vocale, che orienta le persone straniere a Roma tra le pratiche: residenza, tessera sanitaria, rinnovo del permesso. Il Comune è la porta d'ingresso; da lì l'agente orienta verso ASL e Questura.

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
   └──► Webhook tool check_updates ──► Exa, solo domini istituzionali
```

- **Perché i client tool:** lo stato del percorso resta nel browser e la conversazione non passa da un nostro server. Così niente account, niente database e niente dati personali da proteggere.
- **Perché i percorsi sono in JSON:** l'LLM non inventa i passi, li legge. Ogni elemento ha una fonte e una data di verifica, e quelli non verificati vengono segnalati all'utente.
- **Il ruolo di Exa:** non genera risposte. Serve solo a segnalare "questa pagina ufficiale potrebbe essere cambiata".

## Setup (circa 30 minuti)

1. **ElevenLabs, il modo veloce:** create una API key nel pannello ElevenLabs (Developers → API Keys) con i permessi per gli agenti. Poi, dalla cartella del progetto:
   - provate prima `node scripts/crea-agente.mjs --dry-run`, che non invia nulla;
   - poi lanciate lo script con la chiave come variabile d'ambiente, nel terminale (non salvatela in nessun file): `ELEVENLABS_API_KEY=... node scripts/crea-agente.mjs`.

   Lo script crea gli 8 client tool definiti in [agent/tools.json](agent/tools.json) e l'agente con il prompt di [agent/prompt-sistema.md](agent/prompt-sistema.md), e stampa l'ID dell'agente.

   **Il modo manuale** è descritto in [agent/tool-elevenlabs.md](agent/tool-elevenlabs.md). Il webhook `check_updates` verso Exa va comunque configurato a mano dal pannello, perché usa un Secret.
2. Copiate l'ID dell'agente in `web/app.js` (costante `AGENT_ID`), oppure aprite la pagina con `?agent=ID` nell'URL.
3. Avviate la pagina in locale con `npm start` e aprite http://localhost:8080.
4. Lanciate i test con `npm test`. Verificano i tool sui dati, senza chiamare l'LLM.
5. **Deploy:** a ogni push su `main`, GitHub Actions lancia i test e pubblica **solo** la cartella `web/` su GitHub Pages ([.github/workflows/pages.yml](.github/workflows/pages.yml)).
   - Sito: https://mancormemec-stack.github.io/primo-passo/
   - Con l'agente: aggiungete `?agent=ID` all'indirizzo, oppure scrivete l'ID in `AGENT_ID` in `web/app.js`.

Requisiti: Node 18 o superiore. Non ci sono dipendenze da installare: l'SDK `@elevenlabs/client@1.29.0` è caricato da CDN.

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

Per ogni lingua controllate: l'agente fa la domanda sulla cittadinanza UE una sola volta, il `NON VERIFICATO` viene detto, il foglio tradotto contiene tutti i documenti e tutti i passi.

## Privacy e norme

- **Nessun account e nessuno storico.** Lo stato resta solo in memoria nel browser. Nelle impostazioni ElevenLabs va ridotta la conservazione delle trascrizioni. L'audio e il testo passano comunque dai fornitori di LLM e voce: va detto nell'informativa.
- **Si chiedono solo dati indispensabili:** tipo e stato del permesso, Municipio, eventuali date per i promemoria.
- **AI Act:** l'agente dichiara di essere un'IA (art. 50). Non valuta mai se una persona ha diritto a qualcosa: orienta e basta. I sistemi ad alto rischio dell'Allegato III, punto 7, sono quelli usati dalle autorità per la migrazione, e questo non lo è.
- **Accessibilità:** voce, testo semplice, contrasto adeguato, tema scuro.

## Open source e segreti

- **Il progetto è sotto licenza MIT** (file [LICENSE](LICENSE)). La repository è pubblica e tutto il codice è dentro.
- **Nessun segreto nella repository e nel deploy.** Si pubblica solo la cartella `web/`, che contiene HTML, JS e i dati JSON pubblici. Non ci sono file `.env` e il codice non ne legge.
- **Chiave ElevenLabs:** serve solo per lanciare una volta `scripts/crea-agente.mjs` dal vostro computer, come variabile d'ambiente nel terminale. Non va salvata in nessun file.
- **Chiave Exa:** si salva come Secret dentro ElevenLabs, che la usa lato server per il webhook `check_updates`. Non passa mai dal browser.
- **L'ID dell'agente non è un segreto:** è pubblico per costruzione, perché il browser deve conoscerlo. Per evitare che altri usino i vostri crediti:
  - nelle impostazioni Security dell'agente, limitate i domini ammessi a quello del deploy e a `localhost`;
  - impostate un limite di utilizzo.
- **`npm test` controlla anche** che non ci siano file `.env` né stringhe che sembrano chiavi (`test/segreti.test.mjs`). Lanciatelo prima di ogni push.
- Il `.gitignore` esclude `.env`, `.env.*` e `node_modules`.

## Licenza

MIT. I dati pubblici citati restano sotto le rispettive licenze.
