# Progetto, Architettura e Collegamenti Database
> [!IMPORTANT] 
> **Scopo di questo documento**
> Questo file è le **Sacre Norme Tecniche del Sistema**. Spiega le logiche architetturali portanti del database, definendo i confini tra il *Nucleo Intoccabile* (dove non fare refactoring improvvisati pena la rottura degli algoritmi di calcolo rate e ricevute) e il *Terreno Sicuro* (dove è facile e privo di rischi aggiungere colonne e nuove entità). Da leggere e seguire religiosamente prima di qualsiasi implementazione che tocchi schema e rotte API.

*Documento di riferimento tecnico per futuri interventi strutturali su CourseManager*
![Badge](https://img.shields.io/badge/Status-Active-brightgreen) ![Architecture](https://img.shields.io/badge/Architecture-Drizzle_ORM-blue)

### 🔗 Documenti Correlati (Da Leggere)
Per avere una visione completa dello stato del software e della sua evoluzione, consulta obbligatoriamente anche questi due documenti complementari:
1. **[Registro Ultimi Aggiornamenti](../../GAE_ULTIMI_AGGIORNAMENTI.md)** -> Contiene lo storico dettagliato (Changelog) di tutte le modifiche, fix e nuove feature sviluppate di recente.
2. **[Piano Architettura Futura (Single Table Inheritance)](../futuro/2_database_map_future.md)** -> Contiene l'analisi avanzata (Entity-Relationship Diagram e Vocabolario) su come trasformare l'attuale struttura a "12 silos" in un unico motore dinamico in caso di refactoring totale.

---

Questo documento spiega le **logiche portanti** ("intoccabili") del database e i **margini di flessibilità** (dove è possibile e sicuro intervenire), allo scopo di guidare gli sviluppatori futuri su come estendere il software senza corrompere o frammentare l'ecosistema esistente.
Il database è interamente definito nel file `/shared/schema.ts` (Drizzle ORM + MySQL).

---

## 1. Il Nucleo "Intoccabile" (o "Rischioso")
L'architettura ha alcune colonne portanti che strutturano l'intero gestionale. Se modificate pesantemente in modo improprio, si va a rompere il funzionamento di incassi, ricevute ed elenchi in tutto il software (Frontend e Backend).

### A. La divisione in 12 Moduli "A Silos" (Didattica + Affitti)
Il progetto non ha un'unica macro orizzontale tabella `activities` in cui un campo definisce se è un "Corso" o un "Workshop". Inizialmente o nel corso del tempo, per assecondare business logic molto separate, il sistema è nato con **tabelle separate** per ogni tipologia erogata.

Le 12 tipologie (tutte con struttura fisica identica per la parte didattica, ma tabelle DB separate) sono:
1.  **Corsi** (`courses`, `enrollments`)
2.  **Workshop** (`workshops`, `ws_enrollments`)
3.  **Prove Pagate** (`paid_trials`, `pt_enrollments`)
4.  **Prove Gratuite** (`free_trials`, `ft_enrollments`)
5.  **Lezioni Singole** (`single_lessons`, `sl_enrollments`)
6.  **Attività Domenicali** (`sunday_activities`, `sa_enrollments`)
7.  **Allenamenti** (`trainings`, `tr_enrollments`)
8.  **Lezioni Individuali** (`individual_lessons`, `il_enrollments`)
9.  **Campus** (`campus_activities`, `ca_enrollments`)
10. **Saggi / Spettacoli** (`recitals`, `rec_enrollments`)
11. **Vacanze Studio** (`vacation_studies`, `vs_enrollments`)
12. **Servizi Extra / Prenotazioni** (`booking_services`, `studio_bookings`) - *Spesso contato come il 12° "Silo" ad uso non propriamente didattico, ma con proprio flusso pagamenti.*

💡 **REGOLA D'ORO:** L'idea di unificare ora tutte e 12 le tabelle in una sola sarebbe un disastro informatico (refactoring totale impensabile). Qualsiasi nuova funzionalità logica (es. "aggiungere limitazioni sull'età") **deve essere propagata e considerata su tutte le tabelle simultaneamente** per non creare squilibri nell'interfaccia. 
Inoltre, quando si fa un inserimento da Front-End (es. tramite la *Maschera Input* o la nuova Modale Unificata del *Calendario*), questa funge da smistatore (Mimetismo STI) che disaccoppia il payload e reindirizza trasparentemente il salvataggio ai legacy endpoint corretti a seconda di quale attività l'operatore seleziona dalla tendina, preservando l'integrità dei silos.

### B. Il sistema Centrale dei Pagamenti (`payments`)
La tabella `payments` è l'**Hub di interscambio** ("Junction Table") del comparto economico.
* Tutta l'amministrazione, bilanci, calcoli rata e solleciti vertono inesorabilmente qui.
* Quando un pagamento viene registrato, contiene un *Foreign Key* (id esterno) che lo ancora fisicamente alla sua origine.
* Poiché esistono 12 tipologie di prenotazione/iscrizione, la tabella dei pagamenti contiene 12 colonne relazionali diverse (es. `enrollment_id` per i corsi, `ws_enroll_id` per i workshop, `booking_id` per le sale mediche, ecc.).
* Modificare come i pagamenti si allacciano a sconti/iscrizioni è l'operazione più a rischio bug per l'intera parte contabile.

---

## 2. Il "Terreno di Gioco" (Dove è Sicuro Intervenire)
Fortunatamente il database, per come è strutturato, è molto permissivo se si interviene in "maniera orizzontale" allacciando nuove cose invece di distruggere le vecchie.

### A. Modificare / Espandere le Anagrafiche (`members`)
L'anagrafica dei tesserati (tabella `members`) è completamente "piatta". Questo significa che i dati familiari, fiscali, e di contatto risiedono quasi per intero sotto il record della singola persona (ad esempio `motherFirstName` vive in `members` sotto condizione `isMinor=true` senza quasi richiedere join con altre tabelle genitori).
* ✅ **SICURO:** È semplicissimo aggiungere nuovi campi come "Livello Abilità", "Polo/Sede di provenienza", "Professione", "Taglia Maglietta", allargando i moduli di salvataggio nella pagina di iscrizione o le interfacce utente senza il rischio di mandare in crash altro.

### B. Gestione Interventi Frontali (UI) e "Maschera a Cascata"
La Maschera Input Generale (il form `maschera-input-generale.tsx`) è concepita come un form multi-step o un blocco unico dinamico. È molto resiliente.
* ✅ **SICURO:** Si possono nascondere, mostrare dinamicamente o concatenare nuovi campi da far compilare all'operatore in segreteria. Il Front-End in React non è fragile, accetta facilmente campi addizionali.

### C. Estendere i Dettagli Corsi (Metadati)
* ✅ **SICURO:** Possiamo aggiungere dati descrittivi supplementari nativi ai corsi/eventi (es. "Lista equipaggiamento", "Livello di Difficoltà") inserendo semplicemente il campo nella rispettiva tabella `courses`, `workshops`, ecc. Questo non va a nuocere per niente a pagamenti e iscrizioni, basta implementare la visibilità della colonna nel modulo prescelto.

### D. Reportistica, Dashboards e Statistiche (Read-Only)
* ✅ **SICURO:** Qualsiasi lettura, interpretazione o statistica calcolata sui dati (PDF di fine mese, export Excel degli iscritti, grafici delle frequenze, automazioni) prenderà dati già normalizzati e inseriti senza mai interferire con il funzionamento core del database. Generare viste e cruscotti è sempre un'operazione non invasiva.

### E. Automazioni Secondarie e Note di Sistema
Tabelle come `todos`, `team_notes`, `team_comments` (oggi strutturato a "Thread" tipo chat utente per utente) sono architettiuri leggere che non interagiscono con pagamenti e iscrizioni. 
* ✅ **SICURO:** Lavorare per aggiungere badge, remind, alert (es. "Ricorda rinnovo tessera"), promemoria o checklist al team è una zona quasi totalmente libera da rischi per la base del sistema.

---

## 3. Flusso di Lavoro Consigliato (Best Practice)
Quando decidi che vuoi inserire una nuova feature importante dentro l'ecosistema, il flusso decisionale dovrebbe essere:

1. Chiediti: *"Questo dato impatterà in qualche modo su QUANTO l'utente paga la retta finale?"* 
   * Se NO, procedi libero e a spron battuto. 
   * Se SÌ, fai prima un check approfondito nel Backend (`server/routes.ts` - `api/payments`) per capire come inserirlo nel calcolo delle rate in fase di submit.
2. Intervieni sulla singola riga della tabella in `/shared/schema.ts`.
3. Assicurati che se la modifica riguarda "un'attività", venga implementata per lo meno sulle tabelle gemelle di punta (Corsi, Workshop).
4. Sfrutta il "Zod Validation" per proteggere l'input da dati incorretti dal frontend.

---

## 4. Estensibilità: Come aggiungere una 13ª Attività
Nonostante i silos separati richiedano più lavoro di copia-incolla, aggiungere un nuovo modulo (es. "Eventi Esterni") è un pattern procedurale standard. Ecco i file esatti da toccare:

1. **Database (`shared/schema.ts`)**:
   * Creare le 3 tabelle gemelle (es. `external_events_cats`, `external_events`, `ee_enrollments`).
   * Aggiungere la foreign key in `payments` (es. `ee_enroll_id`).
   * Aggiungere le relazioni `relations(member, ...)` in fondo al file.
2. **Backend API (`server/routes.ts`)**:
   * Clonare le CRUD operations di un modulo esistente (es. i corsi o i workshop). Creare gli endpoint `GET`, `POST`, `PUT`, `DELETE`.
   * Aggiungere la gestione del nuovo `ee_enroll_id` nella generica rotta dei pagamenti `/api/payments`.
3. **Frontend Interfaccia (`client/src/pages/`)**:
   * Duplicare la pagina frontend (es. `pages/corsi.tsx` diventerà `pages/eventi-esterni.tsx`).
   * Aggiungere la voce nel menu laterale in `components/layout/Sidebar.tsx`.
   * Integrare la compilazione nella `maschera-input-generale.tsx` aggiungendo un nuovo Tab o Opzione.

## 5. Rischio Dispersione Dati e Integrità
Il rischio principale di questa struttura a "12 rami" è la frammentazione se l'utente sbaglia o se si elimina un record "madre". Ecco come è gestito attualmente e cosa monitorare:

* **Eliminazione a Cascata (`onDelete: "cascade"`)**: Quasi tutte le tabelle dipendenti (es. le iscrizioni) hanno la cancellazione a cascata. Se elimini un Membro, spariscono le sue iscrizioni. Se elimini un Corso, spariscono le iscrizioni a quel corso. *Attenzione: i pagamenti però non sempre spariscono a cascata per fini contabili.*
* **Punto di rottura (La "Maschera Generale")**: Se si crea una logica complessa in `maschera-input-generale.tsx`, bisogna fare molta attenzione a smistare correttamente i dati verso il Backend. Se un pagamento viene salvato senza l'`enrollment_id` corretto della specifica attività, si crea un pagamento "orfano" (si prendono i soldi, ma il sistema non sa per quale attività esatta).
* **Soluzione**: Quando si cercano errori contabili, la prima cosa da fare è interrogare la tabella `payments` e verificare che almeno uno dei 12 `foreign_key` (es. `enrollment_id`, `booking_id`, ecc.) sia valorizzato. Se sono tutti `null`, il pagamento si è perso nel limbo.

---

## 6. Proposte Architetturali per il Miglioramento (Roadmap)

In base all'analisi della struttura a 12 moduli (11 attività + Servizi Extra/Prenotazioni), ecco due accorgimenti tecnici raccomandati per stabilizzare e scalare il sistema futuro:

### A. Unificare il Routing Backend (Pattern Factory/Adapter)
*   **Problema:** Avere 12 set di rotte API separati con logiche CRUD quasi identiche porta a duplicazione di codice ed elevato rischio di bug quando si modifica una logica trasversale.
*   **Soluzione:** Implementare un pattern "Factory" in `server/routes.ts`. Una funzione `createActivityHandler(activityType)` che riceve il nome della tabella dinamicamente e genera in automatico tutti gli endpoint `GET`, `POST`, `PUT`, `DELETE`.
*   **Vantaggio:** Aggiungere un 13° modulo richiederà pochissime righe di codice invece di centinaia. La manutenzione diventerà centralizzata.

### B. Prevenire i "Pagamenti Orfani" (Strict Validation)
*   **Problema:** Se la Maschera Input ha un'anomalia, si rischia di inviare un pagamento valido ma senza allegare l'ID dell'attività corrispondente. I soldi risultano in cassa, ma non si sa a cosa sono riferiti.
*   **Soluzione Backend:** Nel blocco `POST /api/payments` del server, aggiungere una validazione ferrea (tramite `zod` o if-statement manuale). Il sistema deve **rifiutare fisicamente** la ricezione di un pagamento se tutte le 12 `foreign_key` (es. `enrollment_id`, `booking_id`, `ws_enroll_id`...) sono vuote.
*   **Soluzione Frontend:** Disabilitare il bottone "Salva Pagamento" in `maschera-input-generale.tsx` finché il payload non contiene l'ID esatto del corso/servizio selezionato. Meno codice opaco, più sicurezza contabile.

---

## 7. Appendice: Note sul Refactoring "Factory" (Branching e Tempistiche)

Nel caso si decida in futuro di applicare l'unificazione del routing (Punto 6.A), ecco il piano operativo per mitigare i rischi e lavorare in sicurezza:

*   **Pattern Git Branching:** Il refactoring **non** deve avvenire sul ramo `main`. Verrà creato un ramo sperimentale (es. `refactor-api-factory`). Su questo ramo verranno cancellati i 12 file di routing e creata la funzione unica. Il resto del team potrà continuare a lavorare sul ramo `main` senza interruzioni.
*   **Impatti e Rischi Sperimentali:** Il rischio principale è disallineare il Frontend (es. una pagina chiama `/api/courses` ma il factory si aspetta un altro nome tabella) o perdere logiche "custom" presenti solo su un'attività specifica. Usando un branch separato, questi bug verranno risolti senza toccare la produzione.
*   **Tempistiche stimate (Backend + Test):** Circa 1-2 giornate lavorative (8-12 ore). Create la funzione base (1-2h), migrare i 12 moduli (2-3h), adattare il frontend lato chiamate API (1h) e testare pesantemente ogni tipologia di iscrizione (2h+).
*   **Merge Conflict:** Al momento di unire (Merge) il branch sperimentale con il `main`, eventuali aggiunte fatte dai colleghi nei vecchi file di routing (ormai cancellati nel branch) appariranno come conflitti e andranno integrate manualmente nella nuova logica Factory prima di chiudere.

---

## 8. Il Sogno Proibito: Unificazione Fisica (Single Table Inheritance)

Nel momento in cui si volesse riscrivere l'appliance da zero per garantire massima scalabilità (senza dover riprogrammare nulla quando si inventano nuovi tipi formativi), il modello teorico ottimale prevederebbe l'abbandono delle 11 tabelle separate in favore di una **Rigida Gerarchia a 3 Livelli** (Documentata estesamente in `database_map_future.md`).

Questo modello azzera il debito tecnico e previene alla radice i "Pagamenti Orfani", avendo un'unica colonna FK in amministrazione.

### L'Alberatura Universale a 3 Livelli (Vocabolario Ufficiale)
Per evitare fraintendimenti di dominio, la struttura deve seguire questi nomi esatti (Mental Model per Database e Interfaccia Utente):

1.  **Macro-Attività (`activities` o `services`)**
    Il grande "contenitore" fiscale e aggregativo.
    *   *Esempi:* CORSI, WORKSHOP, CAMPUS, AFFITTI SALE (Booking), ecc.
2.  **Categorie (`categories`)**
    Gli stili, i rami principali o le sotto-discipline appartenenti alla Macro-Attività.
    *   *Esempi:* Aerial, Danza, Ballo, Fitness, Gioco e Musica, ecc.
3.  **Dettaglio Attività / Singolo Corso (`activity_details`)**
    L'istanza fisica in cui si suda e si insegna (con il suo livello, istruttore e orario).
    *   *Esempi (corso di):* Pilates, Capoeira, Heels, Video Dance, Salsa, ecc.
    *   *Livello:* Open, Avanzati, Gestanti. Attenzione: **i livelli NON sono categorie**, ma sono esclusivamente degli **attributi** del singolo Corso/Dettaglio.

4.  **Iscritti (`enrollments`)**
    Le persone si legano **esclusivamente** al Livello 3 (Dettaglio). Se pagano il Dettaglio, il sistema sa già implicitamente a quale Categoria e a quale Macro-Attività appartiene l'incasso.
