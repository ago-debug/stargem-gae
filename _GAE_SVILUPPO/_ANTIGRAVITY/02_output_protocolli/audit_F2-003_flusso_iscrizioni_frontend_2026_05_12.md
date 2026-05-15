---
aggiornato: 2026-05-13T11:54
ultima_verifica_vs_codice: 2026-05-13T11:54
validita_prevista: 14 giorni
prompt_di_riferimento: F2-003
fonti_verificate: [codebase client/, classificazione_stargem_v2.pdf]
---

# Audit progressivo — Sessioni 1, 2, 3 (Aree A-L)

## Sessione 1 — Aree A-D

### A. IDENTITÀ, RICERCA E UNIVOCITÀ PERSONA
- **Stato attuale:** 3 (Parziale)
- **Cosa funziona in UI oggi:** È presente un componente di ricerca unificato (`MemberSearch`) basato su debounce e query API `/api/members` che interroga contemporaneamente nome, cognome, CF, email, telefono e tessera. Sulla maschera di inserimento (`TabAnagrafica.tsx`), l'hook custom `useCFCheck`, `usePhoneCheck` e `useEmailCheck` effettua controlli anti-conflitto lato client (con chiamata server) mentre l'utente digita, mostrando visivamente eventuali messaggi di errore o disponibilità.
- **Cosa manca in UI:** Non esiste una ricerca avanzata granulare (es. cerca *solo* per telefono per evitare falsi positivi su numeriche simili, come i codici tessera). Manca un indicatore visivo "Azzera filtri/Avanzata".
- **File frontend coinvolti:** `client/src/components/ui/member-search.tsx`, `client/src/hooks/useFieldConflictCheck.ts`, `client/src/components/crm/TabAnagrafica.tsx`
- **Modali/flussi coinvolti:** Componente autocompletamento in testa alla pagina `anagrafica-home.tsx`.
- **Rischio operativo:** Medio-Basso (la ricerca copre bene, il rischio sono i dati "sporchi" esistenti che sfuggono alla normalizzazione visiva, come emerso in SEG-004).
- **Priorità:** Bassa
- **Note operative segreteria/desk:** La segreteria cerca il nome nella barra superiore o, se non c'è, preme "Nuovo". Inserendo il CF a mano, il field si auto-valida ed estrae la data di nascita se l'hook rileva la coerenza (codice lungo 16).

### B. RUOLI MULTIPLI DELLA STESSA PERSONA
- **Stato attuale:** 4 (Non presente / Piatto)
- **Cosa funziona in UI oggi:** In UI non esiste la concezione del "ruolo" dinamico. Le categorie (es. allievo, insegnante, dipendente) corrispondono spesso a sezioni UI distinte (Area GemTeam vs Area Anagrafica). Per le relazioni familiari, i genitori in `TabTutori.tsx` sono semplicemente campi flat di tipo stringa (`nomeGen1`, `cognomeGen1`), non entità indipendenti collegate al minore con ruolo "Genitore".
- **Cosa manca in UI:** Un sistema a "badge/tag" visivo che evidenzi se un membro selezionato in anagrafica è *anche* un membro dello staff, o *anche* il tutore di qualcun altro.
- **File frontend coinvolti:** `client/src/components/crm/TabTutori.tsx`, `client/src/pages/maschera-input-generale.tsx`
- **Modali/flussi coinvolti:** Nessuno dedicato.
- **Rischio operativo:** Medio-Alto (il genitore è salvato come stringa testuale e non come entità vera e propria; se si iscrive anche lui a un corso, il desk crea una *nuova anagrafica separata* causando sdoppiamento concettuale).
- **Priorità:** Media

### C. NUOVO UTENTE, ESISTENTE E DUPLICATI
- **Stato attuale:** 3 (Parziale)
- **Cosa funziona in UI oggi:** È presente una gestione proattiva dei duplicati in `anagrafica-home.tsx` e `members.tsx`. Una query interroga costantemente l'endpoint duplicati e mostra un bottone di avviso (es. "Duplicati (3)"). Cliccandolo si apre la `DuplicateMergeModal`, che propone le righe doppie e permette di fare il merge scegliendo il record primario.
- **Cosa manca in UI:** L'interfaccia di merge non permette un controllo granulare campo per campo (es. mantieni email da A e telefono da B); fa un merge distruttivo. Manca inoltre una UI per visualizzare l'Audit Log (chi ha unito cosa).
- **File frontend coinvolti:** `client/src/components/duplicate-merge-modal.tsx`, `client/src/pages/anagrafica-home.tsx`, `client/src/pages/members.tsx`
- **Modali/flussi coinvolti:** `DuplicateMergeModal` (Dialog shadcn)
- **Rischio operativo:** Medio (il merge avviene regolarmente, ma se l'operatore sbaglia, il frontend non offre un tasto "Annulla Merge / Undo").
- **Priorità:** Media
- **Note operative segreteria/desk:** Il sistema segnala bene la presenza dei duplicati. L'operatore viene avvisato dal badge rosso. Cliccandolo apre la modale e risolve.

### D. VERIFICA DATI TRAMITE LINK
- **Stato attuale:** 4 (Non presente)
- **Cosa funziona in UI oggi:** L'area tesserati B2C (`area-tesserati.tsx`) esiste e mostra una dashboard, ma richiede il login pre-esistente con username/password.
- **Cosa manca in UI:** Non esiste alcuna Single Page (guest) del tipo `/completa-dati?token=...` che mostri all'utente i suoi dati non verificati permettendo di aggiornarli tramite OTP/Token senza avere l'account completo attivo. Manca anche un bottone in UI Anagrafica per l'operatore "Invia Link di Verifica via SMS/Email".
- **File frontend coinvolti:** `client/src/pages/area-tesserati.tsx` (come proxy esistente)
- **Modali/flussi coinvolti:** Attualmente assenti per il flusso Guest via Link.
- **Rischio operativo:** Alto (l'operatore desk deve inserire e verificare ogni singolo dato a mano rubando tempo in segreteria, senza poter delegare l'operazione di data-entry al cellulare dell'utente).
- **Priorità:** Alta

## Sessione 2 — Aree E-H

### E. MINORENNI E TUTORI (RELAZIONI FAMILIARI)
- **Stato attuale:** 4 (Piatto / Non relazionale)
- **Cosa funziona in UI oggi:** In `TabTutori.tsx`, l'interfaccia permette di inserire `Genitore 1` e `Genitore 2`. Ci sono logiche condizionali (`isMinorenne`) basate sull'età per mostrare come obbligatori i campi del tutore se l'iscritto ha meno di 18 anni.
- **Cosa manca in UI:** La UI tratta i tutori come meri campi testuali piatti (es. `cognomeGen1`, `cfGen1`), non come entità Member relazionali autonome (Family Group). Non c'è alcun componente "Aggiungi Componente Famiglia" che crei un albero relazionale o permetta a un Genitore di iscrivere più figli senza dover ridigitare i propri dati come stringhe per ogni figlio.
- **File frontend coinvolti:** `client/src/components/crm/TabTutori.tsx`
- **Modali/flussi coinvolti:** Form base CRM (`AccordionItem`).
- **Rischio operativo:** Alto (ridondanza anagrafica enorme per famiglie con più figli, e impossibilità di tracciare correttamente chi sia il vero "pagante" legale unificato).
- **Priorità:** Alta

### F. PRATICA OPERATIVA / WORKFLOW
- **Stato attuale:** 4 (Frammentato / Assente come oggetto unificato)
- **Cosa funziona in UI oggi:** Esistono schermate per ogni singola fase del ciclo di vita (Anagrafica, Iscrizioni, Pagamenti, Certificati, Tessere).
- **Cosa manca in UI:** Non esiste un concetto UI di "Pratica" o "Carrello della transazione" come entità persistente (state machine). Il form principale salva un enorme payload "tutto-in-uno" in `maschera-input-generale.tsx`, mentre `NuovoPagamentoModal.tsx` tenta di unificare l'incasso. Gli stati di un'iscrizione sono sparsi: l'utente deve saltare da un Tab all'altro per capire se la pratica è "completa" o "carente".
- **File frontend coinvolti:** `client/src/pages/maschera-input-generale.tsx`, `client/src/components/nuovo-pagamento-modal.tsx`, vari Tab.
- **Modali/flussi coinvolti:** Assenza di un vero "Wizard di Iscrizione".
- **Rischio operativo:** Alto (l'operatore desk perde il filo se interrotto durante una "pratica" complessa, poiché non c'è una bozza salvata).
- **Priorità:** Alta

### G. PAGAMENTI E CHECKOUT
- **Stato attuale:** 3 (Parziale)
- **Cosa funziona in UI oggi:** È presente un "Unificato Checkout" (`NuovoPagamentoModal.tsx`) che funge da carrello. Permette di aggiungere corsi, applicare sconti (percentuali o importi), auto-aggiungere la quota tessera e saldare debiti pregressi (`isDebt`).
- **Cosa manca in UI:** Non esiste la distinzione esplicita in UI tra "Intestatario" (Studente) e "Pagante" (Fatturazione); il `selectedMemberId` copre entrambi i ruoli. Manca inoltre una UI nativa per dividere il pagamento in "Acconto" e "Saldo" pre-configurati (si può solo applicare uno sconto o pagare l'importo intero, il debito residuo è poi calcolato per differenza).
- **File frontend coinvolti:** `client/src/components/nuovo-pagamento-modal.tsx`, `client/src/components/payments/CartTableRow.tsx`
- **Modali/flussi coinvolti:** `NuovoPagamentoModal`.
- **Rischio operativo:** Medio (l'operatore deve fare calcoli a mente se un genitore paga solo un acconto o se richiede fattura a nome diverso dal minore).
- **Priorità:** Alta

### H. TESSERAMENTO
- **Stato attuale:** 3 (Parziale)
- **Cosa funziona in UI oggi:** La tessera viene generata automaticamente dal checkout in `NuovoPagamentoModal.tsx` spuntando "Includi Quota Tessera", e il sistema calcola se è "nuovo" o "rinnovo" in base allo storico (`hasExistingMembership`). Il `TabTessere.tsx` permette di visualizzarle e mostra lo status (Attiva/Scaduta).
- **Cosa manca in UI:** `TabTessere.tsx` è prevalentemente read-only se legato a una tessera moderna, ma il frontend è ancora inquinato dai vecchi campi piatti legacy (`tesseraEnte`, `scadenzaTesseraEnte`). Manca un pulsante diretto "Genera Tessera Indipendente" fuori dal carrello senza dover compilare tutto l'array legacy.
- **File frontend coinvolti:** `client/src/components/crm/TabTessere.tsx`, `client/src/components/nuovo-pagamento-modal.tsx`
- **Modali/flussi coinvolti:** Checkout carrello.
- **Rischio operativo:** Medio (conflitto dual-write tra campi `tesseraEnte` piatti e la vera tabella `memberships` unita).
- **Priorità:** Media

## Sessione 3 — Aree I-L

### I. CERTIFICATO MEDICO
- **Stato attuale:** 2 (Critico / Incoerente)
- **Cosa funziona in UI oggi:** In `[[TabTessere.tsx]]` ci sono i campi informativi (Scadenza, Rinnovo, Rilasciato Da). In `[[TabAllegati.tsx]]` esiste una sezione di upload file che permette di caricare un PDF/Immagine e fornisce un'anteprima tramite conversione in Base64.
- **Cosa manca in UI:** C'è una grave frammentazione: i campi testuali sono in `TabTessere`, mentre l'upload è in `TabAllegati`. Inoltre, manca l'indicazione chiara per l'operatore se l'iscritto ha il certificato valido *prima* di fargli pagare il corso (il blocco non è esplicito nel carrello).
- **File frontend coinvolti:** `client/src/components/crm/TabTessere.tsx`, `client/src/components/crm/TabAllegati.tsx`
- **Modali/flussi coinvolti:** Caricamento allegati base64.
- **Rischio operativo:** Alto (dual-write e potenziale crash del browser a causa del salvataggio di grossi PDF/immagini convertiti in stringhe Base64 nel payload JSON).
- **Priorità:** Alta

### J. DOCUMENTI E MODULISTICA
- **Stato attuale:** 2 (Critico)
- **Cosa funziona in UI oggi:** `[[TabAllegati.tsx]]` funge da raccoglitore per Domanda Tesseramento, Regolamento, Privacy, Modello Detrazione, ecc. Permette l'upload e la preview in un iframe o tag img.
- **Cosa manca in UI:** Tutto il processo di *firma* è manuale (si carica la scansione cartacea). Non c'è integrazione nativa per firmare digitalmente da un tablet al desk. I file vengono convertiti in Base64 client-side (`compressImage`, `FileReader`) e buttati in uno State globale, appesantendo il browser se si caricano più documenti.
- **File frontend coinvolti:** `client/src/components/crm/TabAllegati.tsx`
- **Modali/flussi coinvolti:** Compressione e conversione file.
- **Rischio operativo:** Molto Alto (Memory Leak sul frontend se si caricano più PDF contemporaneamente, e payload JSON in POST giganteschi verso il backend anziché usare Multipart/FormData e bucket storage reali).
- **Priorità:** Massima (da rifattorizzare come upload diretto multipart via API).

### K. AREA TESSERATI (B2C) E SELF-SERVICE
- **Stato attuale:** 3 (Parziale / Mockup)
- **Cosa funziona in UI oggi:** Esiste una pagina `[[area-tesserati.tsx]]` con un layout dashboard. Mostra il riepilogo utente, i corsi attivi, gli ultimi pagamenti e include la chat.
- **Cosa manca in UI:** Molti pulsanti sono mockup visuali (es. il bottone "Carica file" del certificato medico non ha un input associato). Il bottone "Rinnova Tessera" non apre un vero flusso di checkout.
- **File frontend coinvolti:** `client/src/pages/area-tesserati.tsx`
- **Modali/flussi coinvolti:** Manca flusso di upload B2C e carrello B2C.
- **Rischio operativo:** Basso (non rompe nulla, ma non scarica il lavoro della segreteria).
- **Priorità:** Media

### L. OMNICANALITÀ E TOUCHPOINT
- **Stato attuale:** 4 (Non presente)
- **Cosa funziona in UI oggi:** L'unico touchpoint funzionante per le iscrizioni è la vista Desk in uso alla segreteria (`[[maschera-input-generale.tsx]]` + `[[nuovo-pagamento-modal.tsx]]`).
- **Cosa manca in UI:** Non esiste una versione semplificata mobile-friendly del form di iscrizione per l'autocompilazione da totem/tablet in sede. Non c'è l'integrazione per mandare un carrello precompilato via WhatsApp/Email.
- **File frontend coinvolti:** N/A
- **Modali/flussi coinvolti:** Assenza di share-link o self-checkout.
- **Rischio operativo:** Alto (tutto il peso delle transazioni ricade fisicamente e temporalmente sugli operatori al desk, causando code fisiche in segreteria nei periodi caldi).
- **Priorità:** Alta

## Sessione 4 — Aree M-P

### M. STATI E BLOCCHI PREVENTIVI
- **Stato attuale:** 4 (Assente)
- **Cosa funziona in UI oggi:** In `[[nuovo-pagamento-modal.tsx]]`, l'operatore ha totale libertà. Può iscrivere chiunque a qualsiasi corso, a prescindere da età, sesso, scadenze mediche o pagamenti arretrati.
- **Cosa manca in UI:** Mancano i "semafori" (Hard Blocks o Soft Warnings). Se il certificato è scaduto, il sistema non impedisce l'iscrizione. Se l'utente ha insoluti, il sistema lo mostra in rosso ma non blocca l'aggiunta al carrello.
- **File frontend coinvolti:** `client/src/components/nuovo-pagamento-modal.tsx`, `client/src/components/crm/CrmFormContext.tsx`
- **Rischio operativo:** Alto (tutto il peso del controllo compliance ricade sulla memoria e l'attenzione dell'operatore umano in un momento di forte stress).
- **Priorità:** Alta

### N. NON TESSERATI (OSPITI/WORKSHOP)
- **Stato attuale:** 3 (Parziale)
- **Cosa funziona in UI oggi:** In `[[nuovo-pagamento-modal.tsx]]`, il pulsante `includeTessera` è un toggle opzionale. È possibile quindi iscrivere a un corso/workshop bypassando la quota associativa.
- **Cosa manca in UI:** Non c'è alcun badge visivo evidente che identifichi "Guest / Esterno". L'interfaccia tratta il partecipante esattamente come un tesserato a cui semplicemente "non è stata spuntata la tessera", senza snellire il form o i consensi (che invece per un vero Guest dovrebbero essere minimi o esenti).
- **File frontend coinvolti:** `client/src/components/nuovo-pagamento-modal.tsx`
- **Rischio operativo:** Basso.
- **Priorità:** Media

### O. NOTIFICHE E AUTOMAZIONI
- **Stato attuale:** 4 (Non presente)
- **Cosa funziona in UI oggi:** C'è un rudimentale sistema di notifica (es. `GemChat` o badge), ma limitato a comunicazioni manuali.
- **Cosa manca in UI:** Non c'è alcuna dashboard operativa "Azioni Richieste" che dica alla segreteria: "Manda sollecito a 50 certificati in scadenza questa settimana". Non esiste un pulsante UI `Invia Reminder Scadenza` sull'anagrafica che triggeri una email/SMS standard.
- **File frontend coinvolti:** Assenti (manca UI).
- **Rischio operativo:** Medio (perdita potenziale di incassi/rinnovi o rischi assicurativi per mancati solleciti).
- **Priorità:** Media

### P. SICUREZZA, PERMESSI E AUDIT LOG (UI)
- **Stato attuale:** 4 (Assente in UI)
- **Cosa funziona in UI oggi:** In `[[App.tsx]]` è presente un RBAC routing base (Admin, Insegnante, Dipendente, Client).
- **Cosa manca in UI:** All'interno delle schermate della segreteria, manca completamente un tab "Audit / Cronologia". L'operatore non sa "chi ha modificato cosa e quando". Se una rata viene cancellata, sparisce e basta.
- **File frontend coinvolti:** `client/src/pages/maschera-input-generale.tsx`
- **Rischio operativo:** Elevatissimo (impossibilità di tracking errori umani o manomissioni nei pagamenti/iscrizioni).
- **Priorità:** Massima (in correlazione stretta con F1-004).

---

## Sintesi finale megaaudit frontend (A-P)

### 1) Tabella riassuntiva Stati (1=OK, 2=Critico, 3=Parziale, 4=Assente/Frammentato)

| Area | Argomento | Stato UI | Cross-Asse (Backend F1-004) | Note Flash |
|------|-----------|----------|-----------------------------|------------|
| **A** | Identità e Ricerca | 3 | Sì | Ricerca buona ma manca avanzata (es. per telefono). |
| **B** | Ruoli Multipli | 4 | Sì (Tabella silosa) | Staff/Allievo non distinti in badge unificati. |
| **C** | Merge Duplicati | 3 | Sì (API Levenshtein) | UI distruttiva (manca undo o merge campo-campo). |
| **D** | Verifica Link Guest | 4 | Sì (API assenti) | Touchpoint B2C asincrono mancante. |
| **E** | Minorenni/Tutori | 4 | Sì (DB Flat/Silos) | Parentela gestita come input text piatti. Rischio duplicazione. |
| **F** | Pratica Workflow | 4 | Sì | Nessuna "bozza" pratica. L'operatore salta da un tab all'altro. |
| **G** | Pagamenti/Acconti | 3 | Sì | Nessuna distinzione Pagante/Intestatario in UI nativa, no acconto/saldo. |
| **H** | Tesseramento | 3 | Sì (Dual-write) | Comodo in checkout, ma `TabTessere` inquina con input vecchi legacy. |
| **I** | Certificato Medico | 2 | No (Puro Frontend) | Dualismo pericoloso tra campi flat e base64 state. |
| **J** | Documenti Upload | 2 | Sì (Filesystem/Bucket) | **Memory leak.** I PDF vengono convertiti in enormi stringhe data:image Base64 e iniettati nello state. |
| **K** | Area B2C | 3 | Sì | Layout esistente ma tasti auto-update sono mockup visuali. |
| **L** | Omnicanalità | 4 | Sì | Zero UX mobile per totem o self-service in sede. |
| **M** | Stati/Blocchi | 4 | Sì (Regole di validazione) | Totale assenza di semafori UI. |
| **N** | Non Tesserati | 3 | No (Solo UI bypass) | Possibile farlo ma senza badge "Guest" visivi chiari. |
| **O** | Notifiche Automatiche | 4 | Sì (Crons) | Nessun pulsante manuale o listato per mandare solleciti massivi. |
| **P** | Audit Log UI | 4 | Sì (Soft-delete/Log) | Zero visibilità "Chi ha modificato l'anagrafica o cancellato il corso". |

### 2) Top 5 Problemi Strutturali Frontend (Per Gravità)

1. **Gestione File/Documenti "Base64 in Memory" (Area J):** Convertire PDF e file multipagina in enormi stringhe data-URL che risiedono nello State di React durante l'inserimento anagrafica provoca microlag, potenziale crash del tab su PC più vecchi, ed enormi e fragili POST JSON request anziché usare `FormData` multiparts.
2. **"Genitori Piatti" vs "Family" (Area E):** Costringere il caricamento dei genitori di minori come stringhe di testo anziché referenze/entità aggrava i dati duplicati (es. due figli = riscrivere CF del genitore 2 volte). Nessun concetto di "Account Capofamiglia Pagante".
3. **Assenza della "Pratica" Persistente (Area F):** Un'iscrizione coinvolge tessere, sconti, certificati, orari, firme. Se un telefono squilla e l'operatore chiude o cambia tab, la transazione logica svanisce o si salta un pezzo. Manca un Wizard strutturato (Step 1 -> Step 2 -> Step 3).
4. **Sovrapposizione Pagante/Intestatario nel Checkout (Area G):** Il carrello è solido per un adulto che paga per se stesso, ma incapace visivamente di scindere in UI chi usufruisce del corso e chi fiscalmente risulta nel documento di incasso se sono due persone diverse.
5. **Assenza di Hard Blocks (Area M):** Troppa fiducia nell'operatore umano. Il gestionale dovrebbe *impedire* fisicamente di erogare tessera o lezione se il certificato medico è oggettivamente assente e il flag "Richiesto" sul corso è True.

### 3) Piano FASE 3 Frontend proposto

*(In coerenza col piano F1-004, si delinea lo scope ad alto livello in settimane-uomo puramente indicative)*

- **Sotto-step 1: Fix Architetturale Documenti e Multipart (1-2 w/u)**
  - *Dipendenze:* F1-004 (Nuovo endpoint di upload con multer o storage s3/locale).
  - *Azione:* Eliminare il `compressImage` per i PDF in `TabAllegati`. L'upload salva immediatamente il file al backend ricevendo un URL/ID prima della form submission (approccio dropzone asincrono).

- **Sotto-step 2: Unificazione Maschera / Pratica Wizard (2-3 w/u)**
  - *Dipendenze:* F1-004 (Endpoint unificato della Pratica).
  - *Azione:* Convertire i `Tab` liberi in uno Stepper/Wizard vincolato. Step 1: Identità/Duplicati. Step 2: Relazione/Tutore (con Select Member ID invece di input flat). Step 3: Checkout. Step 4: Firme/Documenti asincroni.

- **Sotto-step 3: Semafori UI e Audit Log (1-2 w/u)**
  - *Dipendenze:* Nessuna critica, API di read log.
  - *Azione:* Implementare badge rossi non cliccabili (blocchi) per fatture arretrate o certificati mancanti. Aggiungere il tab "Storico Modifiche" in anagrafica che renderizza semplicemente l'Audit Log.

- **Sotto-step 4: B2C Self-Service / Touchpoint Esterni (3-4 w/u)**
  - *Dipendenze:* F1-004 (Token JWT generation, payment gateways).
  - *Azione:* Generare una Single Page "completa-dati" responsive (usabile su tablet/smartphone). Dare vita ai mockup dell'Area Tesserati (`area-tesserati.tsx`) agganciandoli alle chiamate reali e Stripe/Paypal.

### 4) Domande Aperte per Cowork / Gaetano

1. **Upload Asincrono:** Siete d'accordo sul rimuovere i payload Base64 giganti per passare a upload "Dropzone asincrono" che invia subito il file prima di fare "Salva Anagrafica"? 
2. **Wizard vs Tabs:** La segreteria preferisce un processo "Step-by-Step" guidato che non ti fa proseguire se mancano campi obbligatori, o preferisce la totale libertà attuale dei Tabs rischiando dimenticanze?
3. **Guest Checkout:** Quando implementeremo B2C, si vuole forzare sempre e comunque la login con account prima di acquistare (tipo Amazon), o permetteremo il "Guest Checkout" (con token magici per incrociare i CF dopo)?
