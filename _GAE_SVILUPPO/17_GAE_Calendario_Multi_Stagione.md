# Specifica Funzionale: Calendario Multi-Stagione, Duplicazione Corsi e Gestione Conflitti (Fase 27)

**[SPRINT CHIUSO CON SUCCESSO E CONSEGNATO]**: Fase 27 completata. Le logiche di Calendario/Multi-Stagione sono pienamente varate. L'endpoint di duplicazione controllata (no enrollments) lavora dinamicamente via UI (Checkbox batch). La **Programmazione Date Strategiche** (chiusure/ferie) è integrata, attingendo la logica dei template storici, risultando prioritaria e visibile sia nel Planning stagionale sia nel Calendario operativo.

**✅ [RISOLTI E COMPLETATI: AG-043 -> AG-049 FEEDBACK E ALLINEAMENTO VISIVO MESE APRILE]**:  
Tutti i requirements di layout UI post-sprint sono stati bonificati:
- **Labeling Default Season (Fatto)**: Fissata la dicitura in UI "25-26" di default.
- **Auto-Switch Label "26-27" (Fatto)**: Switch testuale attivo.
- **UI Card Height & Dinamismo Righe (Fatto)**: Rimosso blocco in `planning.tsx` (max-h-80px) ed eliso l'attributo `truncate`. I nomi testo esplodono elasticamente su multi-riga. Stretch naturale della UI settimanale e mensile.
- **Zero-Overlap Assoluto (Fatto)**: Confermata logica Side-by-Side senza impilamento infido.
- **Indicatore "OGGI" Dinamico (Fatto)**: Scroll highlight e focus coerente.
- **Navigazione Combinata (Scroll/Select) (Fatto)**: Calendarietto mensile sincronizzato al picker settimanale.
- **Pedanteria Tabella Master (Fatto)**: Aggiunta la barra Footer fissa interattiva ("Adulti", "Bambini") nel calcolo GSheet-like delle esclusioni ("PROVA", "NO CORSI"). Forzatura a 365 days / 52 settimane confermata.

~~**[BUG CRITICO RILEVATO]**: Quando si chiude il modale di inserimento o modifica, le schede spariscono visivamente dal calendario e serve un refresh manuale della pagina per ripristinare il rendering.~~  
**[AG-027 CHIUSURA BUG]**: Bug "Sparizione Schede Modale" risolto con successo in UI e state. Il reset forzato della resourceType a `"all"` unito all'esecuzione di `queryClient.invalidateQueries` all'interno dell'`onClose` del modale assicura un re-fetch totale e la persistenza completa della griglia.

## 1. Calendario Multi-Stagione
- **Obiettivo:** Estendere la visualizzazione del calendario per supportare contemporaneamente più stagioni.
- **Logica Architetturale Base (Le Due Stagioni):**
  - Il sistema deve **sempre** ragionare in ottica duale: "Stagione Attuale" (Es. 25-26) e "Stagione Futura" (Es. 26-27).
  - Ogni corso o evento deve essere fortemente vincolato all'anno sportivo o a un range di date circoscritto.
  - Il frontend dovrà includere uno switch globale rapido "Stagione Corrente / Prossima Stagione" nell'header per commutare contestualmente tutti gli endpoint.
  - Non mescolare visivamente le iscrizioni impedendo un data-bleed tra anni consecutivi.

## 2. Duplicazione Intelligente dei Corsi (Season-to-Season)
- **Obiettivo:** Permettere alla segreteria di fare un "porting" massivo o selettivo dei corsi dalla stagione attiva di default (es. 25-26, **visibile e flaggata nel calendario**) alla stagione successiva (es. 26-27).
- **Logica Temporale Tipica:**
  - La duplicazione avviene fisiologicamente **a metà dell'anno sportivo** (Es. a Febbraio 2027, la segreteria clona l'impalcatura per preparare la stagione 27-28 in prevendita).
- **Logica Architetturale e Limitazioni Copia:**
  - Endpoint dedicato: `POST /api/activities/duplicate-season`.
  - La duplicazione creerà **nuovi record** nel DB ma con una policy di copia molto stringente.
  - Verranno copiati ESCLUSIVAMENTE questi 5 metadati: **Genere (Nome Corso), Insegnante, Giorno, Orario, Studio**. *Attenzione operativa (AG-053):* È imperativo che l'engine garantisca la trascrizione **corretta** degli Orari e ricalcoli senza divergenze i campi **Data Inizio / Data Fine**, agganciandoli temporalmente all'alveo della Nuova Stagione creata.
  - **NON** verranno copiati gli iscritti. Lo stack partirà da zero, limitando il bleed.
  - L'interfaccia UI esporrà una lista con **checkbox a multi-selezione funzionante**, controllata da un macro-pulsante **"Duplica selezionati"**, per eseguire in un solo colpo il porting massivo dei corsi verso l'anno sportivo imminente.

## 3. Layout Dinamico "Sliding" Settimanale ed Elasticità Oraria
- **Obiettivo:** Creare un'infrastruttura visiva fluida e reattiva alla componente temporale continua.
- **Logica Architetturale:**
  - Sostituire la griglia rigida mensile/giornaliera pura con un carosello temporale (sliding).
  - Integrazione con l'algoritmo già sviluppato nell'Engine STI (che sfrutta `ResizeObserver` per l'altezza dinamica): le ore scorreranno fluidamente sull'asse orizzontale o verticale calcolate tramite `Temporal` o date-fns.
  - **Dinamismo Orario Globale:** L'array di fasce orarie visualizzate dal calendario non è più costituito da 17 slot hardcoded, ma scala ritagliandosi elasticamente sui limiti fisici (Apertura e Chiusura) stabiliti nel database in `system_configs` dal Pannello di Amministrazione. Le dimensioni e spaziature in pixel (`PX_PER_MIN`) si auto-adeguano, assicurando che l'UX reagisca di conseguenza.

## 4. Supporto Visivo ai Conflitti: Sale e Affitti
- **Obiettivo:** Avvisare immediatamente la segreteria in caso di collisione di risorse fisiche (stessa sala, stessa ora).
- **Logica Architetturale:**
  - Aggiornamento degli algoritmi `calendar.tsx` (Fase 18 - "Side-by-Side"): qualora l'engine rilevi un overlap esatto sulla **stessa Sala** o con un evento proveniente dallo stack **Affitti** (`rentals`), la griglia applicherà un flag `conflict: true`.
  - Livello UI: Renderizzare la scheda del corso con un bordo tratteggiato rosso fosforescente o un'icona "Warning" chiara (Badge Destructive). Il tooltip specificherà: *"Conflitto rilevato in Sala X con Affitto/Corso Y"*.
  - Impedimento al salvataggio (Hard Constraint) solo se configurato come stringente, o semplice alert visivo per permettere overbooking volontario.

## 5. Programmazione Date Strategiche e "Master Table"
- **Obiettivo:** Gestire e pianificare preventivamente tutte le date strategiche della stagione sportiva (chiusure, ferie, ponti, eventi speciali, promozioni) replicando digitalmente il format di pianificazione legacy della dirigenza.
- **Logica Architetturale e Foglio Dedicato (Master Table):**
  - **Sviluppo Area Dedicata:** Deve essere sviluppato uno spazio/tabella isolata all'interno del gestionale (o tab adiacente).
  - **Requisiti di Layout Copia-conforme:** Questa tabella ad inserimento rapido deve replicare fedelmente la matrice architettonica mostrata nei 3 file PDF/Excel storici ("programmazione date" situati nella cartella "file personali"). Tratti salienti obbligatori:
    - Indicizzazioni sull'asse verticale (Settimane Numerate).
    - Colonne da Lunedì a Domenica con tracciamento date esatte.
    - Metriche calcolate o inseribili: Totali lezioni adulti e bambini.
    - Color coding massivo per blocchi di attività o chiusure.
    - Spazio esteso per note settimanali.
  - **Programmazione Veloce:** Da questa tabella, la segreteria tecnica deve poter calendarizzare strategicamente le eccezioni con estrema veloctià e precisione.
  - **Automazione Sistemica:** L'operatore programma le date nella Master Table. Il set generato andrà ad intersecarsi su tutta la suite del gestionale provocando questi trigger autogenerati:
    1. Sul **Planning** stagionale: visualizzazione e disabilitazione di ampi periodi.
    2. Sul **Calendario** settimanale: evidenziazione (es. colonne grigie o rosse d'alert).
    3. Sul **Modale Eventi**: la form rileverà le chiusure impedendo (o wrappando) inserimenti fallaci.

## 6. Business Logic: Ciclo Vitale Multi-Stagione (Regola del 1° Agosto)
- **Obiettivo:** Gestire la transizione ciclica automatica degli anni sportivi senza intervento manuale o disallineamenti db.
- **Logica Architetturale (The Lifetime Rule):**
  1. **Creazione Pre-Stagione (Trigger di Febbraio):** A partire da febbraio di ogni anno, il sistema genera in automatico la `Stagione Successiva` (es. a Febbraio 2026 crea e imposta nel DB la "26-27" come inattiva/programmata ma selezionabile). Questo permette in anticipo la pianificazione strategica (ferie, chiusure, pianificazione corsi).
  2. **Promozione (Scatto del 1° Agosto):** Alla scoccare del 1° agosto di ogni anno solare, la `Stagione Successiva` deve prendere il sopravvento. Diventa ufficialmente la `Stagione Attuale` tramite l'aggiornamento automatico del flag booleano nel DB (`active = true` per la nuova, `false` per la precedente).
  3. **Rigenerazione Continua (1° Agosto):** Contestualmente alla promozione della stagione, il sistema alloca la _nuova_ `Stagione Successiva` per l'anno seguente, permettendo al framework di ruotare perennemente (Lifecycle Loop).

## 7. Storicità Immutabile dei Corsi (Non-Deletion Policy)
- **Obiettivo:** Preservare la memoria storica. I corsi passati non devono MAI essere svuotati o massivamente eliminati dal database alla chiusura della stagione.
- **Logica Architetturale:** 
  - La piattaforma archivia ogni entità corso indissolubilmente legata al proprio `seasonId`.
  - La sovrascrittura o soppressione massiva a fine anno è **severamente vietata** via codice.
  - La funzione di "Duplicazione Stagione" effettua esclusivamente una _clonazione_ dei metadati verso la nuova stagione, associandoli al nuovo `seasonId` e azzerando le partecipazioni (iscritti). L'originale resta intoccabile.
  - Sarà concessa solo l'eliminazione singola manuale di una scheda corso (se inserita per errore), ma il defaticamento annuale avviene lasciando sedimentare i dati come archivio storico in sola consultazione.

## 8. Navigazione Temporale Sincronizzata (Scorrimento Infinito)
- **Obiettivo:** Garantire un'esperienza utente fluida che replichi il comportamento del Planning all'interno del Calendario Operativo.
- **Logica Architetturale:**
  - Il sistema monitora in tempo reale la `viewDate` (data attualmente visualizzata) quando l'utente utilizza le frecce di scorrimento settimanale (`<` e `>`).
  - Non appena la vista temporale sconfina oltre le date di inizio/fine della stagione selezionata nel Dropdown, il calendario esegue un _auto-switch_ della risorsa `seasonId`, agganciando la stagione coerente a quella data.
  - L'UI aggiornerà dinamicamente il nome nel selettore assegnando etichette specifiche come `(Stagione Precedente)` o `(Stagione Successiva)` a ridosso dell'anno, pre-caricando i relativi dati storicizzati del backend.

---

## 9. Dashboard Segreteria Operativa – Nuova Struttura
- **Obiettivo:** Elevare la pragmatica operativa della landing page predefinita interfacciata alla segreteria (Dashboard), estirpando widget passivi in favore di tool reattivi e di contabilità personale.
- **Specifiche Architetturali:**
  1. **Modulo "Entrate Mese":** Inserire highlight contabile per il tracciamento degli incassi, potenziato con la suddivisione esplicita per singolo operatore/membro della segreteria. Un report in tempo reale del venduto personale.
  2. **Sezione "Scadenze Operative":** Disintegrazione totale dell'attuale componente "Attività Recente". Il vuoto lasciato sarà ricolmato da un nuovo pannello di allerta scadenze e compiti operativi in esaurimento, permettendo al team di agire sulle criticità quotidiane.
  3. **Gerarchia Strutturale:** Il design dovrà dare priorità spaziale e visiva a questi due nuovi blocchi, schiacciando in secondo piano eventuali KPI secondari. L'operatore all'accesso (boot) deve poter analizzare istantaneamente le revenue ed evadere le scadenze rossastre.
  4. **Costrutto Cromatico/Stile:** Massimizzare l'uso degli Alert Badge (es. Rosso lucido per ritardi fatali o scadenze odierne, Giallo per task in pending). Il blocco incassi prediligerà invece spaziature clean e neutrali senza saturare l'UI.

---

## 10. Modale Nuovo Pagamento – Filtro Attività/Corso
- **Obiettivo:** Sanitizzare il flusso di inserimento nel Checkout (sezione "Dettaglio Quote e Servizi") impedendo la contaminazione visiva e logica tra categorie disciplinari incompatibili.
- **Specifiche di Modifica Modale:**
  1. **Filtro per Attività (Parent-Targeting):** Il blocco d'acquisizione opererà tramite gerarchia stretta. La prima select (Attività madre - es: Danza) piloterà nativamente le opzioni del select secondario.
  2. **Logica di Dipendenza (Child-Lock):** Il field "Genere/Corso" deve rimanere disabilitato (disabled) finché l'operatore non innesca un'Attività madre valida. Solo dopo tale evento il selettore si abiliterà mostrando *solamente* le discipline afferenti all'id-padre.
  3. **Pulizia Etichette (Sanitizzazione UI):** La UI della tendina "genere/corso" assicurerà la rimozione totale di artefatti visivi, label tecniche rotte o chiavi di sistema non tradotte o non pertinenti ai plain-text.
  4. **Validazione Integrale:** Il vincolo impedisce il submit di quote per associazioni miste fittizie (es. Attività "Sala Musicale" con Genere "Hip-Hop Junior"). Il middleware o la UI React bloccherà l'azione salvaguardando il ledger.

---

## 11. Stabilizzazione Calendario e Bugfix Emergenziali (Pre Go-Live)
Al fine di sbloccare l'operatività di base, sono stati consolidati e protetti in quest'area i seguenti interventi di bonifica UI:

- **11.1 Armonizzazione Filtri Calendario:** Ripristinare il cablaggio funzionale dei filtri a monte calendario. Categorico l'allineamento dei toggle/checkbox (nello specifico, filtro primario "Corsi" e categoria selettiva "Fitness") affinché manipolino reattivamente la griglia dati proiettando il result set conforme.
- **11.2 Edit Form Studi Logici:** Disattivare l'eventuale costrutto statico che blindava le locazioni denominate `Studi 23-24-25`. Tali sale dovranno rendersi inequivocabilmente *modificabili* dall'operatore.
- **11.3 Sanitizzazione Maschera Input:** Il trigger di init che lancia irrazionalmente "errori di default rossi" alla mera apertura del modale deve essere intercettato e neutralizzato. La validation map (Zod o React Hook Form) scatterà esclusivamente a validazione sfidata (onSubmit o onChange post-interazione) e mai al boot visivo neutro.
