# Demo e video – Primo Passo

## Il personaggio della demo

**Maria**, filippina, lavora come collaboratrice domestica a Roma con un permesso per lavoro subordinato. Il permesso è scaduto da poco e ha la ricevuta del rinnovo. Si è appena trasferita a **Garbatella**, nel **Municipio VIII**. Parla in **filippino**: la lingua è supportata dalla voce di ElevenLabs, ma va provata stasera.

> ⚠️ Non usate una persona rumena o ucraina per la demo.
> - I cittadini rumeni sono cittadini dell'Unione europea e hanno regole diverse. L'agente deve mandarli allo sportello.
> - I cittadini ucraini sono spesso in protezione temporanea, quindi anche lì si cade fuori dai percorsi.

## Demo live (3 minuti cronometrati)

| Tempo | Chi | Cosa succede |
|---|---|---|
| 0:00–0:20 | Chi presenta | "A Roma vivono migliaia di persone straniere che devono passare da Anagrafe, ASL e Questura, e gli enti non si parlano. Julia, l'assistente del Comune, risponde sul Comune. Noi le accompagniamo tra gli enti, nella loro lingua, e quando non siamo sicuri lo diciamo." |
| 0:20–1:20 | "Maria" (a voce, in filippino) | "Ho appena rinnovato il permesso e ho solo la ricevuta. Abito a Garbatella. Posso avere il medico?" L'agente fa 1-2 domande, chiama `start_path` e `check_prerequisites`, e risponde che **non serve aspettare la residenza**: indica la ASL Roma 2 e i documenti. Il pannello del percorso si riempie e i 🔧 mostrano i tool chiamati. |
| 1:20–1:50 | "Maria" | "E la residenza?" L'agente spiega l'ordine e cosa portare. Poi aggiunge: "Quando ti arriva il permesso nuovo, hai 60 giorni per tornare all'Anagrafe." **Il telefono riceve il promemoria** (file .ics aperto sul telefono, in camera). |
| 1:50–2:20 | **Momento chiave** | "Mio cugino ha chiesto asilo, come fa la residenza?" L'agente risponde: "Su questo non posso darti un'informazione sicura" e indica sportelli gratuiti (Centro Astalli, Sant'Egidio). *Chi presenta:* "Questa è la funzione più importante: un errore qui costa una giornata di coda o una scadenza persa." |
| 2:20–2:45 | Chi presenta | Si apre il foglio stampabile in italiano e filippino. Poi si mostra `percorsi.json`, dove **ogni regola ha la fonte ufficiale e la data di verifica**. |
| 2:45–3:00 | Chi presenta | "Nessun account, nessun dato salvato, codice aperto. Roma Capitale può aggiungere un percorso al mese: le schede sono dati, non codice." |

**Piano B se la voce non funziona:** stessa scena in modalità testo (pulsante "Scrivi"). Preparate anche una registrazione del flusso a voce, pronta da far partire.

## Video (3 minuti, obbligatorio)

1. **0:00–0:25, il problema.** Immagini della coda davanti a un ufficio, girate da voi o con musica e testo sopra. Testo: "Residenza, ASL, permesso: tre enti, mille regole, nessuno che te le spiega nella tua lingua."
2. **0:25–1:45, la demo.** Registrazione dello schermo e del telefono. Riprendete il flusso della demo live, tagliato.
3. **1:45–2:20, come funziona.** Lo schema dell'architettura che trovate nel README. Messaggio: "l'LLM non inventa, legge schede verificate; Exa controlla se le fonti cambiano".
4. **2:20–2:45, fiducia.** Il "non lo so" e le fonti datate. Nessun dato salvato.
5. **2:45–3:00, chiusura.** "Primo Passo. Il Comune come porta d'ingresso, la tua lingua come guida."

## Domande probabili della giuria (e risposte)

- **"Che differenza c'è con Julia?"** Julia risponde con i contenuti del Comune e chiede SPID. Noi colleghiamo più enti (Anagrafe, ASL, Questura) in un ordine preciso, in più lingue, a voce e senza account. Potremmo essere un percorso dentro Julia.
- **"Che differenza c'è con il vincitore dell'anno scorso?"** Il genere è lo stesso, cioè accompagnare nelle pratiche. Cambiano utenti, lingue, enti coinvolti, la voce e il rifiuto esplicito quando non c'è certezza.
- **"E se l'LLM sbaglia?"** L'LLM non genera le regole: le legge dalle schede tramite i tool. Fuori dalle schede chiama `handoff`. Ogni elemento ha fonte e data. Mostrate la domanda sull'asilo.
- **"Chi tiene aggiornate le schede?"** Oggi noi. Domani un ufficio comunale o una rete di patronati, con un flusso di revisione. Exa avvisa quando una pagina ufficiale cambia.
- **"Privacy?"** Lo stato resta nel browser: niente account e niente database. Non chiediamo nome né documenti. Sappiamo che audio e testo passano dai fornitori di LLM e voce: è scritto nell'informativa, e in produzione si riduce la conservazione delle trascrizioni.
- **"AI Act?"** Dichiara di essere un'IA (art. 50). Non valuta mai se una persona ha diritto a qualcosa, quindi non è un sistema delle autorità per la migrazione (Allegato III).
- **"Perché è agentico?"** L'agente decide quali tool chiamare e in che ordine, gestisce le dipendenze tra percorsi (per esempio la carta d'identità è bloccata finché manca la residenza) e alla fine **agisce**: crea il promemoria e il foglio da portare.

## Checklist del mattino (prima delle 10:00)

- [ ] I due percorsi sono ricontrollati a vista: tutti i `"controllo"` passano da `"automatico"` a `"umano"`.
- [ ] La voce in filippino è provata 3 volte di fila senza errori.
- [ ] Il file .ics si apre davvero sul telefono che userete in demo.
- [ ] I popup sono abilitati sul browser della demo (servono per il foglio stampabile).
- [ ] Il deploy online funziona dal telefono, con rete mobile e non con il WiFi dell'Hub.
- [ ] La registrazione di riserva è pronta.
