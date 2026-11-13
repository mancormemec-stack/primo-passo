# Tool da configurare nell'agente ElevenLabs

Nel pannello dell'agente: **Tools → Add tool**.

- I tool di tipo **Client** girano nel browser (file `web/tools.js`). Così lo stato del percorso resta sul dispositivo dell'utente e non serve un backend.
- Spuntate **"Wait for response"** su tutti i tool client, altrimenti l'agente non riceve il risultato.
- Il nome del tool deve essere identico a quello indicato qui.
- Tutti i parametri sono di tipo `string`. Le liste si passano come testo separato da virgole.

| Nome | Descrizione da incollare | Parametri |
|---|---|---|
| `list_paths` | Elenca i percorsi che conosci, con quando si applicano e quando no. Chiamalo all'inizio di ogni conversazione. | nessuno |
| `start_path` | Avvia un percorso e restituisce prerequisiti, passi e dipendenze da altri percorsi. | `path_id` (obbligatorio): id da list_paths |
| `check_prerequisites` | Confronta i documenti che l'utente ha con quelli richiesti e dice cosa manca. | `path_id` (obbligatorio); `posseduti`: id dei prerequisiti posseduti, separati da virgola |
| `next_step` | Restituisce il prossimo passo da fare, rispettando ordine e dipendenze. | `path_id` (obbligatorio); `completati`: id dei passi già fatti, separati da virgola |
| `find_office` | Trova l'ufficio competente per il percorso nel Municipio dell'utente. | `path_id` (obbligatorio); `municipio` (obbligatorio): numero romano, da I a XV |
| `create_reminders` | Crea un file calendario con la scadenza, che l'utente scarica sul telefono. | `path_id` (obbligatorio); `scadenza_id` (obbligatorio); `data_evento` (obbligatorio): data AAAA-MM-GG dell'evento di riferimento |
| `prepare_summary` | Prepara un foglio stampabile con documenti e passi, in italiano e nella lingua dell'utente. | `path_id` (obbligatorio); `lingua`: nome della lingua; `traduzione`: breve traduzione dei passi nella lingua dell'utente |
| `handoff` | Da usare quando la domanda è fuori dai percorsi o non sei sicuro. Restituisce dove chiedere aiuto gratuito. | `motivo` (obbligatorio); `municipio` |

## Tool server `check_updates` (Exa)

Si configura come tool **Webhook**, che ElevenLabs chiama direttamente: nel frontend non serve nessuna chiave.

- **Metodo e URL:** `POST https://api.exa.ai/search`
- **Header:**
  - `x-api-key`: salvate la chiave Exa come **Secret** in ElevenLabs. Non incollatela mai nel codice o nella repository.
  - `Content-Type: application/json`
- **Body:** un parametro `query` (string, deciso dall'LLM) e questi valori costanti:
  - `numResults`: 5
  - `includeDomains`: `["comune.roma.it", "interno.gov.it", "poliziadistato.it", "portaleimmigrazione.it", "aslroma1.it", "aslroma2.it", "aslroma3.it", "salute.gov.it"]`
- **Descrizione:** "Cerca solo su siti istituzionali se una regola è cambiata di recente. Usare solo su richiesta dell'utente."

Da verificare stasera:
- se l'editor dei webhook accetta valori costanti per array come `includeDomains`. Se non li accetta, aggiungete i domini alla query con `site:`;
- che i domini siano scritti esattamente così.

Nota per il premio Exa: tenete il vostro Exa team ID a portata di mano.

## Impostazioni dell'agente

- **Language:** italiano come lingua predefinita, più le lingue aggiuntive che avete testato. Stasera testate bengalese, rumeno, arabo, ucraino e filippino.
- **Security → Overrides:** abilitate gli override di **language** e **first message**. La pagina di test passa la lingua scelta dall'utente.
- **Privacy:** se il piano lo consente, disattivate o riducete la conservazione delle registrazioni e delle trascrizioni. Va detto anche nell'informativa.
- **Autenticazione:** lasciate l'agente pubblico per la demo. In produzione usate un signed URL.
- **LLM:** scegliete il modello nel pannello. Verificate nel pannello come vengono addebitati i costi dell'LLM sul piano Creator.
