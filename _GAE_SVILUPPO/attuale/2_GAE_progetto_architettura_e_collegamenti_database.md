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

Questo documento spiega le **logiche portanti** ("intoccabili") del database e i **margini di flessibilità** (dove è possibile e sicuro intervenire), allo scopo di guidare gli sviluppatori futuri su come estendere il software senza corrompere o frammentare l'ecosistema esistente.
Il database è interamente definito nel file `/shared/schema.ts` (Drizzle ORM + MySQL).

---

## 0. STRATEGIA OPERATIVA E CHANGE CONTROL (Stop & Go)
In virtù dell'approccio di Sviluppo Modulare Veloce e della potenziale alta distruttività di refactoring non calcolati in un gestionale SaaS con 73 tabelle, vige una **Regola Permanente di Change Control** applicabile a qualsivoglia sviluppatore o Agente AI.

Prima di procedere con modifiche che impatteranno o refattorizzeranno l'architettura viva, file sorgenti, JSX components critici o il database, **È OBBLIGATORIO FERMARSI E PRODURRE QUESTO REPORT ANALITICO ALL'UTENTE:**
1. **Modifica proposta** (il piano d'azione).
2. **Perché serve** (il razionale pratico).
3. **File coinvolti** (sorgenti in lettura e scrittura).
4. **Impatti previsti** (cosa cambierà all'utente segreteria).
5. **Rischi / regressioni possibili** (i side-effect su vecchi record o rotte limitrofe).
6. **Cosa NON verrà toccato** (il perimetro d'azione da salvaguardare).

> **🛑 REGOLA INFRANGIBILE (Stop & Go):**
> È fatto assoluto divieto procedere alla modifica reale del codice una volta presentato il report in implementation_plan. Lo sviluppatore o l'AI deve mettersi **in attesa passiva di approvazione esplicita** da parte del CTO/Project Manager. Niente salti in avanti per "efficienza presunta". 

---

## A. Manifesto Architetturale e Visione Prodotto
Ogni sviluppatore che contribuisce a CourseManager deve aderire a questi principi:
1. **Nessun "Cappotto su Misura":** Il gestionale risolve oggi i problemi di StarGem, ma **non** deve essere limitato dalle regole di un singolo centro. L'architettura deve rimanere modulare, scalabile, estendibile, multi-sede e multi-tenant (SaaS).
2. **Evoluzione Controllata (Nessun Rewrite Totale):** L’obiettivo primario è portare il gestionale in produzione in tempi brevi, tutelando il lavoro svolto. Sono vietate le riscritture totali da zero o l'over-engineering prematuro. La priorità è: stabilizzare i flussi core, chiudere le falle architetturali gravi (es. Pagamenti Orfani) e accettare esplicitamente il resto come debito tecnico documentato per future iterazioni.
3. **Sviluppo Parallelo:** Il DB e le interfacce devono poter essere toccate da più team simultaneamente. Questa cartella `_GAE_SVILUPPO` è la costituzione che garantisce la non-collisione (es. usando il Pattern Factory / Drizzle Router unificati).
4. **Coerenza Evolutiva (Pragmatismo):** Nei nuovi task la prima domanda è: *"Cosa serve davvero per lavorare presto?"*. Le decisioni devono risolvere il blocco odierno, unificare i data-source sparsi (es. Tessere vs members), lasciando però intatti e inalterati i settori funzionanti non essenziali. Progetta per il futuro, ma implementa solo ciò che serve ora.
5. **Modello Persone Fluido:** Non esistono tabelle isolate per "Collaboratori", "Studenti" o "Affittuari". In CourseManager un `member` o uno `user` può essere simultaneamente Tesserato, Insegnante, Staff, Esterno, tramite etichette di ruolo dinamiche.

## B. Contesto Operativo Reale (Stato Dati)
*   **Gestione Non in Produzione Estesa:** Il gestionale sta venendo costruito ad-hoc su database vivi. I dati anagrafici attualmente immessi sono **record ibridi** importati a scopo di stress-test. Possono risultare storpiati o orfani.
*   **Integrazione Attesa:** La bonifica formale del DB di produzione avverrà prelevando gli storici reali da fonti decentralizzate (fogli G-Sheet, export PDF, Athena Portal, TeamSystem).
*   **Ecosistema Allargato:** Nei quarter futuri il CMS `studio-gem.it` (WooCommerce/WordPress) verrà integrato al db, rendendo i listini comunicanti.

---

## 1. Il Nucleo "Intoccabile" (o "Rischioso")
L'architettura ha alcune colonne portanti che strutturano l'intero gestionale. Se modificate pesantemente in modo improprio, si va a rompere il funzionamento di incassi, ricevute ed elenchi in tutto il software (Frontend e Backend).

### A. La divisione in 12 Moduli "A Silos" (Didattica + Affitti)

> [!NOTE]
> **Disallineamento Architettura DB vs UI Pagamenti (Aggiornamento)**
> Sebbene l'architettura database conti empiricamente 12 moduli tabellari fisici per iscrizioni/prenotazioni, l'**UI Frontend (Modale Pagamenti ed elenchi hub)** è guidata dall'`ACTIVITY_REGISTRY` che espone **14 Entità Logiche** distinte (separando nettamente "Allenamenti" da "Affitti", e includendo placeholder puramente contabili senza tabella di enrollment come "Merchandising"). Il sistema di pagamento gestisce fluidamente le voci extra tramite fallback su transazioni generiche (`type: "other"`) slegate dai silos didattici.

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
12. **Eventi Esterni / Prenotazioni** (`booking_services`, `studio_bookings`) - *Spesso contato come il 12° "Silo" ad uso non didattico, ma con proprio flusso pagamenti. Nota (Marzo 2026): A livello di categorie, "Affitti" (Rentals) e "Merchandising" sono stati estratti in tabelle indipendenti (`rental_categories` e `merchandising_categories`) smantellando il sovraccarico legacy su Eventi Esterni.*

💡 **REGOLA D'ORO:** L'idea di unificare ora tutte e 12 le tabelle in una sola sarebbe un disastro informatico (refactoring totale impensabile). Qualsiasi nuova funzionalità logica (es. "aggiungere limitazioni sull'età") **deve essere propagata e considerata su tutte le tabelle simultaneamente** per non creare squilibri nell'interfaccia. 
Inoltre, quando si fa un inserimento da Front-End (es. tramite la *Maschera Input* o la nuova Modale Unificata del *Calendario*), questa funge da smistatore (Mimetismo STI) che disaccoppia il payload e reindirizza trasparentemente il salvataggio ai legacy endpoint corretti a seconda di quale attività l'operatore seleziona dalla tendina, preservando l'integrità dei silos.

### B. Il sistema Centrale dei Pagamenti (`payments`)
La tabella `payments` è l'**Hub di interscambio** ("Junction Table") del comparto economico.
* Tutta l'amministrazione, bilanci, calcoli rata e solleciti vertono inesorabilmente qui.
* Quando un pagamento viene registrato, contiene un *Foreign Key* (id esterno) che lo ancora fisicamente alla sua origine.
* Poiché esistono 12 tipologie di prenotazione/iscrizione, la tabella dei pagamenti contiene 12 colonne relazionali diverse (es. `enrollment_id` per i corsi, `ws_enroll_id` per i workshop, `booking_id` per le sale mediche, ecc.).
* Modificare come i pagamenti si allacciano a sconti/iscrizioni è l'operazione più a rischio bug per l'intera parte contabile.

### C. Il Nodo "Tessere" (`memberships`) e il Checkout
La tessera associativa in CourseManager **non** è una banale etichetta testuale, né un "Prodotto E-Commerce", ma un oggetto transazionale primario.
* **Priorità Assoluta:** La tessera sblocca il carrello. Niente pagamento quota, niente erogazione dell'attività. Le due cose sono asservite l'una all'altra.
* **Vincolo Assoluto:** La `membership` deve nascere solo ed esclusivamente all'interno di un flusso coerente con un Pagamento effettivo (registrato in `payments` con la foreign key `membership_id` debitamente popolata e agganciata). Non possono esistere tessere slegate dal flusso economico.
* **Problema Attuale (Marzo 2026) [RISOLTO!]:** Attualmente la `Maschera Input` creava tessere "orfane" dal carrello. Il salvataggio del modulo iniettava l'incasso nel Libro Mastro (`payments`), fallendo nell'agganciare tale record all'ID della nuova tessera. Il bug è stato **risolto in via definitiva** istruendo il framework transazionale a eseguire un "Incrocio ID" forte. Il Frontend ora emette `tempId: membership_fee` abbinato a un `referenceKey` fiscale. Il Backend (`routes.ts`) recupera al volo il `membershipId` nativo e salda i record assieme in parentesi atomica. Se si cancella il pagamento, la tessera ora decade propriamente a pending. Questo Matcher Multi-Persona risolve specialmente i checkout parentali (es. genitore che paga 2 tessere distinte per i 2 figli nello stesso carrello).
* **Dipendenze:** La validità del tesseramento sblocca o meno l'erogazione delle restanti attività.

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
*   **Soluzione Backend:** Nel blocco `POST /api/payments` del server, aggiungere una validazione ferrea (tramite `zod` o if-statement manuale). Il sistema deve **rifiutare fisicamente** la ricezione di un pagamento se tutte le 12 `foreign_key` (es. `enrollment_id`, `membership_id`, `ws_enroll_id`...) sono vuote. L'unica eccezione validata è un caricamento "borsellino elettronico" generico.
*   **Soluzione Frontend:** Disabilitare il bottone "Salva Pagamento" in `maschera-input-generale.tsx` finché il payload non contiene l'ID esatto del corso/servizio selezionato. Meno codice opaco, più sicurezza contabile. La maschera produce il match anche su carrelli multi-utente inviando il `referenceKey`.

---

## 6-bis. Calendario Operativo ↔ Regia Planning (Mapping 2026)
Nell'operatività reale front-desk, il tempo non viene visualizzato in unico calderone, ma segue uno schema gerarchico a 3 layer da preservare senza refactoring distruttivi:
1. **Modulo Sorgente Attività (SQL):** I dati reali nascono sempre dalle tabelle silenziose (`courses`, `campuses` ecc.). Nessun dato nasce dal Calendario UI.
2. **Calendario Attività (Route `/calendario-attivita`):** È la **Vista Tattica a Slot (Day-by-Day)**. Serve puramente al front-desk per l'operatività immediata: vedere chi è prenotato e dove nel dettaglio orario. 
3. **Planning (Route `/planning`):** È la **Vista Strategica e di Regia**. Serve alla Direzione per governare il macro-scheduling. Ragiona per mesi.

### Classificazione delle 14 Attività Ufficiali
Come concordato, queste sono le regole di rendering per evitare forzature a frontend:

| # | Attività | Calendario (Orario/Daily)? | Planning (Stagionale)? | Natura |
|---|---|:---:|:---:|---|
| 1 | **Corsi** | ✅ SI | ✅ SI (Aggregati) | Strutturale fissa |
| 2 | **Workshop** | ✅ SI | ✅ SI | Evento mirato orario |
| 3 | **Prove a pagamento** | ✅ SI | ❌ NO | Occasionale/Tattico |
| 4 | **Prove gratuite** | ✅ SI | ❌ NO | Occasionale/Tattico |
| 5 | **Lezioni singole** | ✅ SI | ❌ NO | Prenotazione oraria |
| 6 | **Lezioni individuali** | ✅ SI | ❌ NO | Slot personalizzato |
| 7 | **Domenica in movimento**| ✅ SI | ✅ SI | Flash Event orario |
| 8 | **Allenamenti** | ✅ SI | ❌ NO | Slot affitto libero orario |
| 9 | **Affitti** | ✅ SI | ❌ NO | Spazio orario / Booking |
| 10| **Campus** | ✅ SI | ✅ SI | Strutturale Plurigiornaliero |
| 11| **Saggi** | ❌ NO | ✅ SI | Evento Macro |
| 12| **Vacanze studio** | ❌ NO | ✅ SI | Esterno Plurigiornaliero |
| 13| **Eventi esterni** | ❌ NO | ✅ SI | Evento / Trasferta |
| 14| **Merchandising** | ❌ NO | ❌ NO | **Solo hub vendita.** |

*Diagnosi Attuale:* Il Calendario carica già molto bene Corsi, Workshop e Affitti grazie ad `unifiedEvents`. Il resto è ancora affidato parzialmente a listini e backend legacy separati.
*Prossimo step prudente:* Completare l'import in `calendar.tsx` (`unifiedEvents`) per agganciare Lezioni Singole/Individuali e Allenamenti al grid tattico. Evitare refactoring DB, mappare e normalizzare solo lato JSX.

**Debito Tecnico Tollerato (Prenotazione Spazi ed Esterni):**
*In nome dell'"Evoluzione Controllata", le schermate "Prenotazione Sale" (es. `studio_bookings`) e roba esterna (es. `booking_services`), pur essendo logicamente assimilabili alle attività core, **RESTANO COME SONO** e in voci di menu a sé stanti. Non si deve tentare un rewrite totale per fonderle forzatamente nel Calendario Attività SQL. La loro lettura unificata avverrà per interpolazione Software in React (es. `CalendarEvent[]`), prestando attenzione a non usare classi CSS compilate dinamicamente (altrimenti Tailwind PurgeCSS le sopprime) ma mappando i colori per via statica o inline hex.*

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
