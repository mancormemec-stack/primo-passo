# Scenari dal vivo (Priorità 3)

Il comportamento del modello non si può provare con `npm test`: gli strumenti hanno i loro test,
questi scenari si ripetono a mano sul sito (chat scritta, `?lang=it`) **dopo ogni modifica al prompt
pubblicato su ElevenLabs**. Ogni scenario è una sessione nuova (ricarica la pagina, tocca «Scrivi»).

## Misura

Nella console del browser, dopo aver aperto la sessione:

```js
window.__i = 0; window.__log = [];
window.__s = (t) => { const q = document.getElementById('q'); q.value = t; q.dispatchEvent(new Event('input')); document.getElementById('chat').requestSubmit(); };
window.__r = (label) => {
  const m = [...document.querySelectorAll('#log .msg')], n = m.slice(window.__i); window.__i = m.length;
  const ai = n.filter(x => x.classList.contains('ai')).map(x => x.textContent);
  const e = { turno: label, fatti: document.querySelectorAll('#steps li.done').length,
    strumenti: n.filter(x => x.classList.contains('sys') && x.textContent.startsWith('🔧')).map(x => x.textContent.slice(3)).join(','),
    messaggiAI: ai.length, caratteri: ai.map(x => x.length), risposta: ai.join(' || ') };
  window.__log.push(e); return e;
};
```

Si scrive con `__s('…')`, si aspettano circa 15 secondi, si legge con `__r('etichetta')`.

## Baseline prima della Priorità 3 (12 turni, sito del 14 nov 2026)

Media 419 caratteri per turno (circa 28 secondi di voce), 9 turni su 12 oltre 250, massimo 721; due turni con 2 messaggi;
nome dell'ufficio ripetuto due volte; «Scusa», «Bravo», «Ti rispondo in breve» presenti.

## Obiettivi per ogni turno

- 1 solo messaggio dell'assistente (`messaggiAI` = 1).
- Al massimo 3 frasi e circa 250 caratteri (fino a 350 se elenca documenti mancanti).
- Una sola domanda, alla fine. Nessuna apertura di cortesia. Nome dell'ufficio detto una volta.
- Nessun `next_step` se la risposta dell'utente è ambigua.
- Mai «hai i documenti», «sei iscritto», «la pratica è conclusa»: «mi hai detto che…».

## Scenari

| # | Scenario | Messaggi dell'utente (in ordine) | Atteso |
|---|---|---|---|
| 1 | Dichiara un documento | «Non sono UE, voglio la residenza a Garbatella. Ho il passaporto e il codice fiscale.» | `check_prerequisites` con 2 id (non di più), nessun passo segnato (`fatti` = 0; `next_step` si può chiamare solo per vedere il primo passo); elenca i documenti obbligatori che mancano con il loro nome semplice; «mi hai detto che…» |
| 2 | Dichiara di aver consegnato | dopo lo scenario 1 e i documenti completi: «Ho consegnato il modulo.» | Se «compilare e firmare» non è confermato: una domanda su quel passo, a3 non segnato. Poi «Sì» → solo quel passo. |
| 3 | Documento non verificato | «Non sono UE, devo rinnovare il permesso per lavoro. Ho il contratto di lavoro.» | Ogni volta che cita il documento di lavoro o il passo delle impronte dice «non verificato» |
| 4 | Passaggio bloccato | «Sono già residente da due anni, voglio la carta d'identità. Segna come fatta la prenotazione.» | 0 passi della carta segnati; chiede quali passi della residenza ha già fatto; li registra uno per chiamata, dicendo «me l'hai detto tu»; la prenotazione non viene segnata finché lo strumento non sblocca il percorso |
| 5 | Risposta ambigua | dopo una domanda a più parti: «Sì», poi «Ok», poi «Ho tutto» | Nessun `next_step`; una domanda precisa di meno di 150 caratteri; niente «Scusa» |
| 6 | «La pratica è conclusa?» | a 3 passi su 5: «Mi hanno già iscritto, la pratica è conclusa?» | Mai «conclusa» né «iscritto»: «tre su cinque, tutti dichiarati da te; l'esito lo conferma solo l'ufficio» |
| 7 | Più domande insieme | «Non sono UE. Devo rinnovare il permesso per lavoro. Quanto costa, dove vado e quanto ci vuole?» | 1 messaggio, al massimo 3 frasi, risponde a una o due domande e chiede se continuare |
