

<!-- --- INIZIO SORGENTE: attuale/03_GAE_Mappa_Pagine_Database.md --- -->

# Mappa Globale: Pagine UI vs Tabelle Database

Questo documento mappa criticamente ogni singola rotta / pagina dell'applicazione web alle esatte tabelle del database su cui va a scrivere (o da cui legge i dati fondamentali). 
È stata aggiunta un'indicazione in **giallo** per far capire *da quale Menu Laterale (Sidebar)* si accede fisicamente a quella schermata.

---

### ⚠️ Differenza Importante con il file "01_GAE_Database_Attuale.md"
Mentre questo documento (File 3) mappa il viaggio dei dati **"Dal click dell'utente nella Schermata React -> A quale Tabella finisco"**, il file `01_GAE_Database_Attuale.md` è il puro dizionario tecnico Backend (ERD).
* Usa **questo file (3)** per capire: *"Dov'è il codice React che gestisce i pagamenti?"* o *"Da dove leggo le presenze in UI?"*
* Usa **l'altro file (1)** per capire: *"Quali foreign keys devo unire (JOIN) su Drizzle per estrarre la tabella payments?"*

## La Logica dei 5 Moduli (73 Tabelle Fisiche)
Il gestionale poggia su un solido database relazionale (scritto tramite Drizzle ORM su database MySQL) che conta attualmente un totale di **73 Tabelle Fisiche**. 
Per evitare di interagire con un elenco dispersivo, piatto e di difficile manutenzione, l'architettura tecnica è stata logicamente segmentata in **5 Macro-Aree**. 

Questa astrazione strategica permette agli sviluppatori di ragionare per "compartimenti" quando si implementano nuove funzionalità o si standardizza l'interfaccia:
1. **Moduli Core (22 Tabelle separate):** Gestisce l'erogazione delle attività vere e proprie. Ingloba le 11 tabelle matrice clonate (es. `courses`, `workshops`) e le 11 rispettive gerarchie di categoria.
2. **Moduli Amministrativi e Finanziari (21 Tabelle corollarie):** Il portafoglio del sistema. Centralizza tutto ciò che sfocia in una transazione: i carrelli, la fatturazione, l'iscrizione logica e il Libro Mastro Contabile (`payments`).
3. **Gestione Anagrafica (7 Tabelle root):** I soggetti fisici. Include l'anagrafica cliente (`members`), le relazioni tutore-minorenne (`member_relationships`), gli istruttori logici e gli account della segreteria (`users`).
4. **Struttura e Utility (19 Tabelle di supporto):** Funzioni orizzontali ad uso del team. Prenotazione delle stanze fisiche (`studios`), TodoList, chat della portineria e i dizionari a tendina (`custom_lists`).
5. **Dashboard e Reportistica (4 Tabelle native + Interrogazione globale):** Il vero cervello analitico. Legge e aggrega i dati prodotti in tempo reale dalle restanti 69 tabelle per restituire i KPI.

---

## 1. Segreteria Operativa (Check-in Rapido)
*L'ordine di cosa serve a chi sta al Front-Desk.*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Pannello Iscrizioni Rapide** | `/maschera-input` | 🟡 **Maschera Input** | `members`, `[x]_enrollments`, `payments`, `price_list_items` | Central Bank: Il vero concentratore del Carrello Unificato multi-persona. Ex home-page. |
| **Iscritti/Anagrafica** | `/anagrafica-generale` | 🟡 **Anagrafica Generale** | Lettura: `members`, `memberships` | Elenco puro (Ex Anagrafica a Lista). |
| **Dashboard Membro Singolo** | `/membro/:id` | (Si apre da Anagrafica) | Lettura: `members`, `member_relationships`, `medical_certificates` | Hub di gestione scheda singola (es. genitore/figlio). Legge i Certificati Medici. |
| **Generazione Tessere** | `/generazione-tessere`| 🟡 **Tessere & Certificati** | Lettura: `members`, `memberships` | Creazione stampe/PDF. Applica fallback ibrido tra il nodo *activeMembership* reale e i campi ombra obsoleti dell'anagrafica per back-compatibility. |
| **Controllo Ingressi** | `/accessi` | 🟡 **Controllo Accessi** | Lettura/Scrittura gate passaggi tornello/tablet. |

---

## 2. Amministrazione & Cassa
*Posizionata in area ad altissima visibilità per chi opera il check-in e incassa.*
> **Nota UI Pagamenti:** Il modulo "Nuovo Pagamento" non è più bindato alle sole 12 tabelle/DB legacy didattici. La Select "Attività" espone dinamicamente le **14 voci dell'`ACTIVITY_REGISTRY`**, permettendo vendite custom ("Merchandising" o "Eventi Esterni") scrivendo genericamente in `payments` bypassando i silos classici.
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Nuovo Pagamento** | `/pagamenti` | 🟡 **Lista Pagamenti** | `payments`, `payment_methods`, `pay_notes` | Scrive in `payments`, lega una FK al memberId. Storico Ricevute e cassa reale. |
| **Scheda Contabile** | `/scheda-contabile` | 🟡 **Scheda Contabile** | Lettura: `payments`, `price_list_items`, `members` | Sola LETTURA. Incrocia il dovuto col versato. Controllo posizioni debitorie. |
| **Iscrizioni e Pagamenti** | `/iscrizioni-pagamenti` | 🟡 **(Route Nascosta)** | Lettura `members`, `enrollments` | Interfaccia d'appoggio per logistica interna. |
| **Dashboard Statistiche** | `/` (Home) e `/dashboard` | 🟡 **Dashboard & Statistiche** | Aggregazione Dati | Vera pagina di approdo all'apertura del gestionale. Aggregazione KPI iscritti e cassa. |
| **Report Avanzato** | `/report` | 🟡 **(Tab interno Reportistica)** | `custom_reports` | SQL Custom in lettura su richiesta e salvataggio query. |

---

## 3. Attività e Didattica
*Le Viste restano intatte (sui rispettivi Silos Tabellari), ma raggruppate per separare l'erogazione dalla pianificazione strategica.*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Area Corsi** | `/attivita` | 🟡 **Attività** | Vari silos db (courses, workshop, ecc.) | Gestione erogabile: Anagrafica Corsi e Listini base. |
| **Calendario Corsi (Vista Tattica)** | `/calendario-attivita` | 🟡 **Calendario Attività** | Lettura combinata | **Mappa a Slot (Day-by-Day).** Operativa oraria strutturata a 5 righe (Orario, Titolo, Istruttori, Stato, Codice). Menu Nuovo Inserimento limitato a: Corsi, Workshop, Prove, Lezioni, Domeniche, Allenamenti, Affitti, Campus. |
| **Planning di Regia** | `/planning` | 🟡 **Planning** | Lettura combinata | **Mappa Plurigiornaliera (Stagionale).** Sintetica annuale (Set-Ago). Evidenzia Oggi e Mese Corrente. Include aggregati Corsi(N); e in blocchi estesi: Workshop, Domenica, Campus, Saggi, Vacanze, Esterni. |
| **Dashboard Iscrizioni** | `/iscritti_per_attivita` | 🟡 **Iscritti per Attività** | Lettura `enrollments` + joins | Vista appelli testuale/listare (Monitor visuale lista iscritti). |
| **Lista Sale e Patrimonio** | `/studios` | 🟡 **Studios/Sale** | `studios` | Scrive la sala (Capienza, Orari Base). |
| **Gestione Esterni (Spazi e Servizi)**| `/prenotazioni-sale`| 🟡 **Prenotazione Sale / Esterni** | `studio_bookings`, `booking_services` | **Debito Tecnico Temporaneo:** Area attualmente molto confusa che incrocia Booking per Affitti esterni di Sale, e tab random di "Servizi Prenotabili" rimossi transitoriamente dal menu Sidebar (rotta `/booking-services` silente finché non unificata in SaaS V2). |

---

## 4. Risorse Umane & Team
*Materiale orizzontale non destinato al cliente ma allo staff o all'admin framework.*  
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Insegnanti** | `/insegnanti` | 🟡 **Staff / Insegnanti** | `members` (STI), `instr_rates` | Anagrafica Docenti e listino compensi. (Ruolo flessibile: un tesserato può anche esssere Staff in contemporanea). |
| **Chat e Task Condivisi** | `/todo-list` | 🟡 **Comunicazioni Team** | `todos`, `team_comments`, `notes`, `messages` | Lavagna interna operativa (Fusi i vecchi sottomenu Todo, Log e Post-It in un'unica dashboard di raccordo team per snellire). |
| **Manuali e Linee Guida**| `/knowledge-base`| 🟡 **Knowledge Base** | Tabella wiki | Modulo attivo. Manuali d'uso con Matrix Ruoli ufficiale (Chi vede cosa). |
| **Importazione Dati** | `/importa` | 🟡 **Importa CSV** | Scrittura massiva + `import_configs` | Importazione di massa di DB legacy e mapping CSV. |
| **Utenti System / Permessi** | `/utenti-permessi` | 🟡 **Utenti e Permessi** | `users`, `user_roles` | Gestione Sicurezza e Ruoli con accesso granulare alla Sidebar (30 viste). |
| **Admin Panel Global** | `/admin` | 🟡 **Pannello Admin Global** | `system_configs`, `knowledge`, `user_activity_logs` | Settaggi globali, tooltips base, audit del gestionale e svuotamento/Reset della Stagione Logica (`seasons`). |
| **AI Layer & Assistant** | `/copilot` | 🟡 **StarGem Copilot** | `N/D` | Modulo di interazione AI (posizionato sotto il blocco Admin). |

---

## 5. Configurazioni Core
*Tariffe e Strumenti di Business Tecnici per il management.*
| Pagina Web | Rotta React | Menu Sidebar (UI) | Tabelle Database Target | Note |
|---|---|---|---|---|
| **Gestione Listini Rate** | `/listini` | 🟡 **Listini e Quote** | `price_lists`, `price_list_items`, `quotes` | Configuratore abbonamenti economico SaaS, sia rateali che slegati (Indipendenti). |
| **Categorie Anagrafiche** | `/categoria-partecipante` | 🟡 **Categorie Attività**| `cli_cats` | Tab UI per categorie clienti. Messo dentro un mega-menu "Categorie". |
| **Categorie Attività Multi**| `/categorie-*` | 🟡 **(Dentro Categorie Attività)** | Tutte le `*_cats`, `booking_service_categories`, `rental_categories`, `merchandising_categories` | Gestisce gli alberi divisori didattici e fisici (Corsi, Workshop, Campus, Domeniche, Affitti Sale, Merchandising...). |
| **Elenchi Dropdown Custom**| `/elenchi` | 🟢 **(Cross-Modale Centrale)** | `custom_lists`, `custom_list_items` | Controlla menù a tendina custom via DB. Supporta Inserimento Rapido (`useQuickAdd`) dai modali senza reload. Sostituisce i fallback espliciti (ex. Livelli CRM e Marketing). |
| **Dizionari Promo**| `/promo-sconti` | 🟡 **Servizi e Sconti** | Ticket/Coupon | Database codici sconto. |

---

### Centralizzazione UI/Orari e Debito Tecnico
La tabella sopra mostra chiaramente la vastità orizzontale del gestionale: decine di pagine interrogano e scrivono in tabelle SQL identiche strutturalmente. Le differenze visive o asimmetrie nel salvataggio dei **campi Orario** (giorno, HH:MM inizio, HH:MM fine) o nella **scelta dei moduli pagamento**, se presenti, sono anomalie unicamente imputabili ai **componenti Frontend React** ("le tendine della web app") non unificati nel tempo. 

Il backend SQL aspetta standard rigidi. Pertanto, l'implementazione visiva deve convergere verso "Micro Form" (o Componenti) Centralizzati Singoli da importare identici all'interno di ognuna delle pagine elencate, scongiurando bug di salvataggio.

> **Aggiornamento Architetturale (Naming Consistency):** Il termine legacy "Nomi Corsi" è completamente deprecato in favore di **"Genere"** (System Code: `genere`). Tutte le 14 attività implementano la tendina dinamica `Combobox` agganciata a questa singola sorgente lista.


<!-- --- FINE SORGENTE: attuale/03_GAE_Mappa_Pagine_Database.md --- -->



<!-- --- INIZIO SORGENTE: attuale/04_GAE_Piano_Interazione_SaaS_UI.md --- -->

# Piano di Implementazione: Componenti UI Unificati (Micro-Form)

> [!IMPORTANT] 
> **Scopo di questo documento**
> Questo file rappresenta la **To-Do List operativa e attiva** per l'unificazione e la pulizia dell'Interfaccia Utente (Fase 2). Qui documenteremo tutti i difetti visivi, l'UX disomogenea e progetteremo i "Micro-Componenti Universali" (come il *TimeSlotPicker* o il *PaymentModule*) necessari per smettere di clonare codice in 12 pagine diverse. Aggiungi qui le anomalie grafiche riscontrate per progettarne una soluzione strutturale trasversale.

Questo documento traccia il piano operativo per risolvere il disallineamento visivo e logico presente nelle 12 pagine di erogazione attività di CourseManager (Fase 2 della strategia).

## Obiettivo
Smettere di riscrivere a mano la logica di input orario e la logica di selezione pagamenti/quote all'interno di ogni singola schermata React (`corsi.tsx`, `workshops.tsx`, ecc.). 
Sono stati costruiti **due componenti React agnostici, blindati e universali**, da importare al posto dei vecchi cloni.

---

## 0. Elenco Definito dei Difetti Grafici e Funzionali (Stato Attuale)

Durante l'analisi della UI attuale (Marzo 2026), prima di procedere con la riprogrammazione, sono emerse le seguenti criticità strutturali e di UX che i nuovi componenti dovranno risolvere nativamente, seguendo il principio di **Ottimizzazione senza distruzione**:

### A. Frammentazione e Terminologia Confusa
*   **Gestione a Silos:** Esistono decine di pagine separate per inserire entità simili (Corsi, Workshop, Campus, ecc.), frammentando l'esperienza di inserimento.
*   **Tabelle e Ordinamenti Disallineati:** In passato ogni tabella gestiva l'ordinamento in modo autonomo. (Risolto: introdotto il modulo universale `useSortableTable` e `SortableTableHead` per governare il sort client-side in maniera unificata).
*   **Nomenclatura Errata:** Il sistema indicava nel menu "Categorie (Materie)" in modo atecnico. È stato attualmente rinominato in **"Categorie Attività"**. In futuro, "Categoria" indicherà unicamente il contenitore delle materie fisiche (es. Danza, Arti Marziali, Fitness, Gioco Musica).

### B. Gestione Insegnanti a Compartimenti Stagni
*   **Disallineamento Anagrafiche:** Esiste una discrepanza gravissima tra la "Maschera Input" (dove si inseriscono i tesserati) e la sezione "Staff Insegnanti". L'insegnante "ABC" non risulta ricercabile nella Maschera Input per potergli fare una ricevuta.
*   **Soluzione UI Futura:** Unificazione visiva in un'unica griglia anagrafica centrale, con l'uso di "Flag/Badge Multipli" a selezione (Staff, Insegnante, Personal Trainer, Tesserato) per la stessa persona. Gestione di accessi/permessi differenziati in base al ruolo.
*   **Aziende ed Enti:** La nuova Anagrafica Centrale permetterà l'inserimento sia di persone fisiche che di Aziende/Fornitori, per gestire comodamente sconti e convenzioni o affitti spazi.

### C. Sistema Pagamenti e Checkout Blindato
*   **Flussi Multipli Carenti:** Ci sono troppi punti di accesso per pagare (Iscrizioni, Maschera Input, Calendario). Vanno unificati e rafforzati nei collegamenti.
*   **Bug ("Pagamento Non Concluso"):** Mancata concatenazione degli eventi in Cassa (es. schermate che mostrano saldi ma non finalizzano la ricevuta).
*   **Listini e Prezzi Bloccati (PIN Sicurezza):** Il prezzo base pescato dai listini/quote dovrà apparire in automatico. La forzatura/modifica manuale degli importi in Cassa (da parte della segreteria) sarà *bloccata*, e consentita unicamente previa autorizzazione (inserimento PIN/Codice Personale del manager).

### D. Calendario Unificato (STI Mimetismo Phase 1)
*   **Da "Calendario Corsi" a "Calendario Attività":** L'etichetta è stata aggiornata per riflettere la natura generalista dell'Hub.
*   **Modale Unificata "Nuova Attività":** Eliminati i molteplici popup frammentati. Ora il Calendario funge da Hub Centrale con un'unica modale dotata di Select Dinamica "Categoria Attività" (Corso, Workshop, Prenotazione) che adatta l'interfaccia condizionalmente. Il payload viene poi disaccoppiato e re-indirizzato ai legacy endpoint corretti.
*   **Supporto Nativo Entità Multiple:** È ora possibile visualizzare e creare Workshop e altre entità con click rapido sugli slot vuoti della griglia. E' stata unificata la logica di inserimento slot orari per tutte queste entità.

### E. Rigidità nella Tipologia di Erogazione
*   **Separazione Logica:** "Allenamenti" va separato da "Affitti". I servizi di Personal Training/Affitto necessitano di focus nominale sul cliente e sui pacchetti (es. "Pacchetto 10 ingressi Cugge").
*   **Prove (Gratuite/Pagamento):** Non devono esistere 12 tabelle/pagine. L'attività "Prova" diventerà un semplice *Flag* (Gratis / A Pagamento) in fase di configurazione checkout dell'allievo, mostrata come voce separata nei pagamenti visivi.

### F. Sovraccarico Anagrafica, Filtri e Persistenza Stato
*   **Caricamento Dati Massivo (Filtri Obbligatori):** La lista anagrafiche base renderizza simultaneamente quasi 10.000 righe. È stato inserito criteri di visibilità iniziali o filtri attivi (es. "Cerca...", o elenco in Lazy Load) per snellire il sistema.
*   **Bug di Persistenza (Maschera Input):** Quando si seleziona un partecipante e si naviga verso altre sezioni (Panoramica ecc.), al ritorno la maschera "dimentica" e non mostra più i pagamenti/attività aperti. È necessario implementare un memory cache (es. Zustand) per l'utente esaminato.
*   **Dati Sensibili Incompleti:** La UI attuale degli istruttori richiede solo Telefono e Mail. Sarà vitale avere la compilazione dei dati anagrafici completi per le questioni fiscali. (Risolto: introdotti asterischi rossi sui campi mandatori e badge "Manca Dato" inline negli input vuoti della Maschera Generale e Insegnanti. L'inserimento di un genitore rende automaticamente obbligatori Email, Cellulare e Codice Fiscale).
*   **Gestione Duplicati:** Precedentemente il sistema segnalava i duplicati con logica debole (es. 1 punto per stesso Nome e Cognome), inondando la segreteria di "Falsi Positivi" (es. Omonimi, o Familiari con stessa email). Il sistema implementa ora un clustering euristico avanzato con **Filtro Anti-Famiglie** e **Filtro Anti-Omonimi** per validare i "veri" duplicati solo con prove incrociate certe (es. CF uguale o Nome identico + Email identica).
*   **Modali Contestuali (SPA UX) e Routing Parametrico:** Eliminati i redirect lenti a vecchie pagine. Introdotta l'apertura "volante" istantanea dei modali tramite **Routing Parametrico** (es. `?editId=123`). Questo pattern previene l'apertura in cascata di "modali incapsulati dentro modali", mantiene pulita la memoria RAM e permette all'utente di passare rapidamente da una scheda all'altra (es. tramite icone "Pennino" che switchano vista pulendo agilmente l'URL alla chiusura del layer).
*   **Protezione Schermo Bianco (Error Boundaries):** Poiché l'architettura SPA è vittima di fatal crash (White Screen of Death) per minimi ReferenceError (es. mancato import in component figlio), il piano d'azione prevede l'isolamento dei macro-blocchi visivi (Calendario, Cart, UI Modali) dietro **Error Boundaries** per bloccare a perimetro lo shattering del DOM.
*   **Centralizzazione Elenchi (Silos Abbattuti):** Aboliti enumerativi hardcoded su costanti React. Qualsiasi tendina strategica (es. *Stato Operativo*, *Genere*) deve consumare il set dinamico centralizzato `/api/custom-lists` in real-time. I componenti UI (es. `MultiSelectStatus`) salvano il payload in DB come array string array per nativa compatibilità Single Table Inheritance.
*   **Badge e Stati Visivi:** Inserite etichette customizzate ("Attiva"/"Scaduta") posizionate strategicamente accanto alle date dei listini storici. Le date storiche scadute lette dal database vengono onorate senza sovrascritture automatiche aggressive ("Falso futuro"), mostrando lo storico reale e colorandolo di rosso (`bg-red-50 text-red-600`) o verde in tempo reale.

### G. Vocabolari e Inserimento Rapido (Quick-Add Combobox)
*   **Centralizzazione Elenchi:** I vecchi select nativi (`<Select>`) con voci cablate a codice (es. "Web", "Passaparola", "Silver", "Gold") sono stati aboliti dalla UI. Qualsiasi menu a tendina dell'applicativo deve ora rigorosamente agganciarsi (tramite gli hook `useCustomListValues`) al database "Elenchi". I Modali leggono il database in tempo reale impedendo asincronie.
*   **Frizione Add-on Modal (Quick-Add):** Per impedire che la segreteria debba fuggire dalla pagina di inserimento se la voce non esiste nella lista (es. un nuovo canale pubblicitario), le tendine implementano il generic `<Combobox onQuickAdd />`. Scrivendo il testo libero e premendo `+ Crea nuova voce`, l'hook in background inietta la voce nel DB e resetta il dropdown senza distruggere la transazione in corso.
---

## 1. Il Componente "TimeSlotPicker.tsx"

Attualmente il salvataggio degli orari è disomogeneo visivamente, ma nel database (schema.ts) tutte le 11 tabelle aspettano tre campi identici:
- `dayOfWeek` (String, es. "Lunedì")
- `startTime` (String, es. "18:00")
- `endTime` (String, es. "19:00" - Opzionale)

### Architettura del Componente 
È stato creato `client/src/components/time-slot-picker.tsx`.
Il componente riceve e restituisce i dati tramite props standardizzate, agendo in modalità "Controlled Component".

```typescript
interface TimeSlotPickerProps {
  dayOfWeek: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  onChange: (data: { dayOfWeek: string; startTime: string; endTime?: string }) => void;
  // Prop per capire se renderizzare l'input in orizzontale (tabella) o verticale (card)
  layout?: 'horizontal' | 'vertical'; 
  disabled?: boolean;
}
```

### UX / UI Design (Rigoroso)
*   **Day:** Un classico Select/Dropdown (Lunedì - Domenica), oppure un gruppo di 7 bottoni circolari stile "pillole" (molto moderno) tra cui scegliere il giorno cliccandolo.
*   **Time:** Niente campi testuali liberi. Utilizzeremo due input nativi `type="time"` mascherati elegantemente da Shadcn UI, con la rotellina per l'orologio (se supportato dal browser).
*   **Validazione:** Impossibile inserire una `endTime` minore della `startTime`. Il componente deve bloccare la selezione se rileva incongruenze, illuminandosi di rosso tenue.

---

## 2. Il Componente "PaymentModule.tsx"

Attualmente ogni pagina ha il suo modo di far generare le quote. È stato creato un blocco grafico unico che faccia da ponte tra l'entità che si sta visualizzando (es. una lezione di Prova) e il carrello pagamenti universale.

### Architettura del Componente
È stato creato `client/src/components/payment-module-connector.tsx`.
Questo componente non manda direttamente i soldi a `payments`, ma impacchetta i dati corretti per il sistema di Cassa Centrale (che si aspetta una quota, un utente e un ID di riferimento).

```typescript
interface PaymentConnectorProps {
  // L'entità da cui stiamo per pagare 
  activityType: 'course' | 'workshop' | 'single_lesson' | 'free_trial' | ... ;
  // L'ID del record nel database a cui ancorare il pagamento
  referenceId: number; 
  // Prezzo esposto di default se non ci sono macro-listini
  defaultPrice: string | number;
  
  // Callback quando l'utente sceglie di procedere in cassa
  onProceedToCheckout: (cartItemInfo: CartItemPayload) => void;
}
```

---

## 3. Strategia di Rilascio (Rollout)

Per evitare interruzioni al team di segreteria, adotteremo questo approccio chirurgico:

1. **Creazione Silente:** Sviluppo iniziale dei due componenti nella libreria locale `src/components/`, senza importarli in nessuna pagina attiva. [COMPLETATO]
2. **Sostituzione Pilota (A/B Test):** Sostituiremo il form orari e pagamenti unicamente in **1 silo a basso traffico** (Esempio: "Attività Domenicali" o "Prove a Pagamento"). [COMPLETATO per i pagamenti tramite `NuovoPagamentoModal`]
3. **Validazione:** Testiamo che il salvataggio sul DB funzioni perfettamente usando i nuovi Micro-Form e che il dato sia identico al vecchio metodo. [COMPLETATO parzialmente]
4. **Sostituzione Massiva:** Una volta approvato il Pilota, applicheremo un Find&Replace architetturale, iniettando i due Micro-Form nelle restanti 10 pagine (Corsi, Workshop, Campus, ecc.), cancellando per sempre le migliaia di righe Frontend duplicate. [IN CORSO - Calendario e Checkout Unificato completati]

---

## 4. Esperienze Mobile-First: Le Tre App (Staff, Team, User)

L'interfaccia non sarà più un monolite desktop per la segreteria, ma si dividerà in tre declinazioni UI focalizzate sui ruoli:

### A. App Staff (Insegnanti)
*   **Obiettivo UI:** Minimalista, pensata per smartphone ("On the go").
*   **Funzioni Chiave:**
    *   Visualizzazione della propria agenda lezioni (Calendario Personale).
    *   Check-in/Timbratura Presenze (geolocalizzata o tramite click) per l'elaborazione paghe.
    *   Prenotazione Sale ("Studios"): un planning visivo per prenotare aule libere per prove personali.
    *   Visualizzazione iscritti (solo numeri, no anagrafiche sensibili per privacy).

### B. App Team (Segreteria & Amministrazione)
*   **Obiettivo UI:** Operativa, rapida, stile "To-Do List" o gestionale ticket.
*   **Funzioni Chiave:**
    *   Visualizzazione Turni di Lavoro (Shift Management) creati dal manager.
    *   Messaggistica Interna / Chat Intercom integrata per comunicazioni veloci di sede.
    *   Sistema di Facility/Maintenance: Pulsante rapido per aprire un Ticket Guasto (es. "Cassa Audio Sala 2 rotta") dal telefono.

### C. App User (Allievi e Clienti)
*   **Obiettivo UI:** E-commerce style, accattivante, "1-click buy".
*   **Funzioni Chiave:**
    *   Catalogo Corsi e Attività navigabile a schede.
    *   Acquisto diretto di Pacchetti/Carnet (Stripe integration).
    *   Prenotazione Lezioni (scalo dal carnet) e disdette rapide con gestione notifiche.

---

## 5. UI Del Modulo CRM & Marketing

Per gestire l'acquisizione di nuovi clienti, l'UI si arricchirà di due nuove dashboard amministrative:

*   **Kanban Board dei Lead:** Un'interfaccia drag-and-drop (stile Trello) per i Potenziali Clienti ("Nuovo Lead", "Contattato", "In Prova", "Convertito").
*   **Campaign Builder:** Un editor visuale per comporre email o SMS massivi (DEM), con possibilità di filtrare l'audience (Es. "Tutti gli iscritti di Hip Hop dell'anno scorso non ancora rinnovati").
## 6. Analisi di Compatibilità: Database SaaS vs. Interfaccia Grafica Attuale

> [!TIP] 
> **Scopo di questa Appendice**
> Questa sezione spiega tecnicamente come risolvere il problema più grande del Refactoring: *come fa la UI attuale a disegnare ancora 12 interfacce visive bellissime e diverse, se nel Database esisterà una sola tabella universale cieca?* Illustra la strategia "Forms-as-Data" (JSON Driven UI) e come le Categorie istruiranno il rendering dei componenti in React.

La decisione strategica di trasformare *CourseManager* in un prodotto Software as a Service (SaaS / Multi-tenant) impone un disaccoppiamento drastico tra la Logica dei Dati (Backend) e la Presentazione (Frontend). 

Come correttamente indicato dalla dirigenza nell'Intervista 6, un database scalabile ed "agnostico" (Single Table Inheritance) non deve in alcun modo *stravolgere* o *rompere* l'interfaccia grafica attualmente in uso online dai clienti. Al contrario, deve alimentarla dinamicamente.

Questo documento definisce i criteri con cui il nuovo schema 2.0 fornirà i dati alla UI attuale.

---

## 1. Il Problema: Database Agnostico vs UI Specifica
Attualmente, l'interfaccia React disegna form diversi in base a dove clicca l'utente:
*   Se clicco "Aggiungi Corso", la UI mostra campi per date annuali.
*   Se clicco "Aggiungi Affitto", la UI mostra un calendario a slot orari.
*   Se clicco "Campus Estivo", la UI chiede se serve la maglietta.

Nel vecchio database (i "11 Silos"), c'era una tabella per ogni voce di menu.
Nel nuovo Database SaaS (Single Table Inheritance), avremo **UN'UNICA TABELLA** (`activity_details`) che conterrà *tutte* queste fattispecie mischiate insieme. E non ci sarà scritto *"Questo è un Corso di Danza"*, ma il DB saprà solo che è un *"Record di tipo A, appartenente al tenant XYZ"*.

**Come fa la UI attuale a sapere quale grafica/maschera mostrare se il DB è cieco?**

---

## 2. La Soluzione: Il Modello "Forms-as-Data" (JSON Driven UI)
Per mantenere l'interfaccia grafica intatta e meravigliosa com'è oggi, ma renderla compatibile col motore SaaS, adotteremo il pattern del rendering dinamico.

Il nuovo Drizzle ORM avrà le seguenti ancore di collegamento per la UI:

### A. Il "Template engine": La tabella `activity_categories`
Nel nuovo DB, ogni categoria non sarà solo un nome testuale (es. "Danza"), ma conterrà le istruzioni per il Frontend su *come disegnarsi*.
Avrà un campo nativo chiamato `ui_rendering_type` (Enum o String) o un Payload JSON chiamato `form_schema`.

Quando il Frontend si apre e interroga il DB chiedendo "Che corsi hai?", il DB risponderà:
> *"Ho questo record X. Attenzione UI: il suo `ui_rendering_type` è `SEASONAL_CLASS_WITH_WAITLIST`. Disegnalo con la maschera dei corsi annuali e accendi il bottone della lista d'attesa."*

> *"Ho questo record Y Rossi. Il suo `ui_rendering_type` è `PUNCH_CARD_10`. Disegnalo con la maschera carnet e ignora il calendario."*

### B. I Dati Volatili: La colonna `extra_info_schema` (JSONB)
Nella UI attuale, quando si crea un Campus, ci sono campi come "Taglia Maglietta".
Nel DB SaaS non esisteranno mai colonne fisse per la "maglietta" (perché al cliente B che fa corsi di scacchi non serve).

Il DB fornirà alla UI attuale uno schema JSON:
`{"fields": [{"name":"shirt_size", "label":"Taglia Maglietta", "type":"select", "options":["S","M","L"]}]}`

La UI attuale (React) prenderà questo JSON in pancia e **genererà graficamente a schermo** il menu a tendina "Taglia Maglietta" senza bisogno che lo sviluppatore lo codifichi a mano nella pagina React.

---

## 3. Confronto Diretto: Cosa C'è vs Cosa Dovrà Essere (UI)

Per non stravolgere il lavoro visivo fatto finora, occorre confermare alcune logiche della UI attuale. **Ecco i punti su cui la Dirigenza deve sbilanciarsi per tarare esattamente il codice Drizzle:**

*   **Risposta T1 - Struttura Sidebar:** La sidebar deve essere dinamica. Il sistema fornirà una struttura organizzata di base, ma ogni utente/tenant potrà rinominare le voci e personalizzarne l'ordine per adattarle al proprio workflow visivo.
*   **Risposta T2 - Personalizzazione Colori (Whitelabeling):** Totale flessibilità. Il sistema SaaS deve consentire il caricamento del proprio Logo aziendale e la personalizzazione dei colori dell'interfaccia. Ognuno potrà cucirsi l'applicazione addosso.
*   **Risposta T3 - Autonomia del Cliente (Super-Admin):** Il sistema fornirà un "Pre-Seed" (Dati preimpostati e incrociabili): delle Master-Categorie logiche chiavi-in-mano funzionanti fin dal primo login, lasciando poi al cliente la libertà totale di estenderle o modificarle qualora ne sentisse il bisogno (Sistema "pronto all'uso").


<!-- --- FINE SORGENTE: attuale/04_GAE_Piano_Interazione_SaaS_UI.md --- -->



<!-- --- INIZIO SORGENTE: attuale/05_GAE_Linee_Guida_Grafiche_UI.md --- -->

# Linee Guida Grafiche UI (CourseManager)

> [!IMPORTANT] 
> **Scopo di questo documento**
> Questo file raccoglie le decisioni sulle convenzioni cromatiche e stilistiche per lo sviluppo frontend di CourseManager. Tutte le interfacce, sia quelle attuali in refactoring che le future App Staff/Team/User, dovranno aderire a questo pattern visivo per garantire un'esperienza utente coerente. L'approccio è sempre "Ottimizzazione senza distruzione": le logiche visive introdotte qui riprendono e curano quelle già consolidate.

## 1. Codifica Cromatica (Palette)

La palette di CourseManager prevede ruoli specifici per ciascun colore, al fine di guidare l'occhio dell'utente in modo intuitivo verso le azioni corrette:

## 1. Codifica Cromatica (Palette Progetto)

La palette di CourseManager prevede ruoli specifici per ciascun colore, al fine di guidare l'occhio dell'utente in modo intuitivo verso le azioni corrette. I colori *devono* essere richiamati tramite le variabili CSS centralizzate in `index.css` o le classi Tailwind già configurate, per garantire il perfetto switch Light/Dark mode.

*   **Primary (Yellow/Gold):** Il colore predominante per pulsanti di azione principale, gli anelli di focus degli input (`--ring`) e gli header della sidebar (`--sidebar-primary`). È basato sul tono: `hsl(43 82% 46%)`.
*   **Gold 3D (Elementi Premium):** Utilizzato per badge di stato importanti, bottoni di checkout o header di colonne ordinate. Classi CSS dedicate: `.gold-3d-button` e `.status-badge-gold`. Usa un gradiente lineare da `#e6b800` a `#b8860b`.
*   **Neutral / Backgrounds:** 
    *   Sfondo dell'App: `--background` (chiarissimo in Light, quasi nero in Dark mode).
    *   Card e Finestre Modali: `--card` e `--popover`. Devono *sempre* staccare visivamente dal background.
*   **Destructive / Error (Red):** Colore per cancellazioni o errori bloccanti, mappato su `--destructive`.
*   **Verde / Successo:** Da utilizzare in modo parsimonioso ed esclusivo per stati di conferma (es. transazione completata o tag "Saldato").

*Nota: Non utilizzare stringhe esadecimali grafiche hardcoded (es. `#ff0000`) nei componenti React, ma affidati sempre alle classi semantiche di Tailwind (es. `bg-primary`, `text-destructive`).*

## 2. Convenzioni Tipografiche e Layout

*   **Popup Centrali (Blindati):** Quando un'operazione non deve poter essere disturbata (es. Chiusura Pagamento), NON utilizzeremo navigazioni tra pagine esterne. L'interfaccia andrà in overlay (sfondo scuro semitrasparente) sollevando una finestra "Modale" centrale bianca in modo da non perdere il contesto sottostante.
*   **Campi Obbligatori e Dati Mancanti:** Tutti gli input obbligatori di un form devono essere contrassegnati con un asterisco rosso (`text-destructive`). Qualora un campo obbligatorio non sia compilato, è da preferirsi l'utilizzo di Inline Badges ("Manca Dato") posizionati all'interno del campo stesso, per spingere l'utente all'inserimento senza ricorrere ad alert esterni invasivi.
*   **Nomenclatura Costante:** Nessun testo o voce di menu dev'essere inserito a mano nei rendering. I bottoni di creazione avranno label uniformi ("Nuova Attività", "Nuovo Iscritto").
*   **Spicchi e Card:** I dati, specialmente nelle Dashboard e nella Panoramica, non vanno buttati come testo libero. Devono essere racchiusi in "Card" bianche su uno sfondo neutro.

## 3. Gestione di Tabelle ed Elenchi

*   **Filtri Obbligatori (Lazy Loading):** Nessuna griglia dati (es. Anagrafica da 9.000 righe) deve caricarsi per intero in prima battuta. Di default è richiesto almeno un input (es. "inserisci 3 lettere") oppure un pre-filtro logico (es. "Attivi nell'anno in corso") per non appesantire il rendering del browser.
*   **Ordinamento e Intestazioni (SortableTableHead):** Le tabelle devono utilizzare il componente standardizzato `SortableTableHead` e l'hook `useSortableTable`. Ogni colonna ordinabile deve mostrare un indicatore coerente (`ArrowUpDown`, `ArrowUp`, `ArrowDown`) che reagisca al click, garantendo uniformità di UX su tutte le view a lista del gestionale.
*   **Elenchi Semplici vs Elenchi Colorati:** Mantenere un ordinamento coerente visivo (A-Z o cronologico). Le tabelle "Colorate" devono usare sfondi tenui per le singole righe basati sullo Stato dell'utente.

---
*(Questo file è in progress: le direttive potranno essere espanse in itinere dal team grafico).*


<!-- --- FINE SORGENTE: attuale/05_GAE_Linee_Guida_Grafiche_UI.md --- -->



<!-- --- INIZIO SORGENTE: attuale/06_GAE_Route_Audit_e_Stato.md --- -->

# Audit Route e Stato Mappatura (Aggiornato Blocco 4)

Questo documento traccia la coerenza completa del routing dell'applicazione CourseManager, distinguendo in maniera netta i **nomi ufficiali di prodotto (UI)** dagli slug tecnici e dai componenti legacy. La classificazione dello stato rispetta la seguente semantica:
- **canonico**: route principale, nome e componente definitivi.
- **legacy tollerato**: alias o route vecchia usata tecnicamente per non spaccare link/bookmark.
- **placeholder**: pagina "in allestimento", non una 404.
- **da riallineare**: route con disallineamento UI / Concetto da sistemare in futuro.
- **candidato a eliminazione futura**: route tecnica o duplicato destinato al purge.

## 1. Segreteria Operativa

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Dashboard | `/` | `Dashboard` | canonico | Route principale operativa |
| Dashboard | `/dashboard` | `Dashboard` | legacy tollerato | Alias di `/` |
| Maschera Input | `/maschera-input` | `MascheraInputGenerale` | canonico | Modale rapida entry (Allineato Source of Truth) |
| Anagrafica Generale | `/anagrafica-generale` | `Members` | canonico | Tabella iscritti globale |
| Tessere e Certificati Medici | `/tessere-certificati` | `Memberships` | canonico | Motore Tessere |
| *Nessun UI* | `/tessere` | *Redirect* | legacy tollerato | Redirect pulito a `/tessere-certificati` |
| Generazione Tessere | `/generazione-tessere` | `CardGenerator` | canonico | Tool batch tessere |
| Controllo Accessi | `/accessi` | `AccessControl` | canonico | Scanner ingressi desk |

## 2. Amministrazione & Cassa

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Lista Pagamenti | `/pagamenti` | `Payments` | canonico | Storico transazioni (Allineato Modale UI) |
| Scheda Contabile | `/scheda-contabile` | `AccountingSheet` | canonico | Estratto conto utente |
| Report e Statistiche | `/report` | `Reports` | canonico | Motore data estrazione |

## 3. Attività e Didattica

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Attività | `/attivita` | `Attivita` | canonico | Hub padre STI |
| Iscritti per Attività | `/iscritti_per_attivita` | `IscrittiPerAttivita` | canonico | Presenze e tab globali |
| Categorie Attività | `/categorie-attivita` | `ActivityCategories` | canonico | Gestione alberature |
| Calendario Attività | `/calendario-attivita` | `CalendarPage` | canonico | Area per inserimento orario (Single-Entry Modal limitata a 10 attività day-by-day e Box a 5-righe). Aggiunte indicazioni di instradamento inverso (Vai alla Scheda) nei form modifica. Implementato Collision-Layout e Frontend Time-Conflict Blocker. |
| Planning | `/planning` | `Planning` | canonico | Mappa Strategica Multi-Stagione (Set-Ago). Evidenzia Oggi e Mese Corrente. Implementa il modale Bozza (Chiude/Ferie/Extra) e routing Corsi verso il calendario. |
| Studios / Sale | `/studios` | `Studios` | canonico | Gestione risorse fisiche |
| Affitti | `/prenotazioni-sale` | `StudioBookings` | da riallineare | **Attività ufficiale** (Nome UI definitivo). Dominio Booking Separato (non mischiabile con le attività didattiche). URL e componente legacy tecnico ("sale") da riallineare al nuovo DTO. |
| Affitto Studio Medico | `/affitto-studio` | `StubAffittoStudio` (Wrapper) | placeholder | Sotto-caso / Modulo specifico futuro collegato ad "Affitti". |
| Eventi Esterni | `/attivita/servizi` | `BookingServices` | canonico | **Attività ufficiale**. Nome UI ormai consolidato; `/servizi` e `BookingServices` sono solo gli slug/componenti tecnici storici. Le vecchie chiamate "Servizi Extra" / "Prenotabili" non esistono più. |
| Merchandising | `/attivita/merchandising` | `StubMerchandising` (Wrapper) | placeholder | **Attività ufficiale** 100%. Momentaneamente su Stub/Placeholder ma gode degli stessi asset delle altre attività. |

### 3.1 Viste Dettaglio e Routing Interno (Attività e Didattica)

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| *Nessun UI* | `/corsi` | *Redirect* | legacy tollerato | Redirect pulito a `/attivita/corsi` |
| Dettaglio Corso | `/attivita/corsi` | `Courses` | canonico | Vera parent route STI per i corsi |
| *Nessun UI* | `/workshops` | *Redirect* | legacy tollerato | Redirect pulito a `/attivita/workshops` |
| Dettaglio Workshop | `/attivita/workshops` | `Workshops` | canonico | Vera parent route STI per workshops |
| Categorie Eventi Esterni | `/categorie-eventi-esterni` | `BookingServiceCategories` | canonico | Nome UI corretto. Slug corretto ad `/eventi-esterni` per distacco da legacy `servizi`. |
| Dettaglio Lezioni Individuali | `/attivita/lezioni-individuali` | *Modale Condiviso* | canonico | Route canonica per silo operativo privato. Condividerà l'Activity Operational Modal. |
| Dettaglio Allenamenti | `/attivita/allenamenti` | *Modale Condiviso* | canonico | Route canonica per silo operativo autonomo. Condividerà l'Activity Operational Modal. |
| Categorie Prove a Pagamento | `/categorie-prove-pagamento` | `PaidTrialsCategories` | dismesso | Oscurate da UI (Fase 8) in attesa di decomissione db. |
| Categorie Prove Gratuite | `/categorie-prove-gratuite` | `FreeTrialsCategories` | dismesso | Oscurate da UI (Fase 8) in attesa di decomissione db. |
| Categorie Lezioni Singole | `/categorie-lezioni-singole` | `SingleLessonsCategories` | dismesso | Oscurate da UI (Fase 8) in attesa di decomissione db. |
| Categorie Affitti | `/categorie-affitti` | `RentalsCategories` | canonico | Componente autonomo completamente staccato, basato su `api/rental-categories` e db table `rental_categories`. |
| Categorie Merchandising | `/categorie-merchandising` | `MerchandisingCategories` | canonico | Componente e root API attivati su `/api/merchandising-categories`. Eliminato il placeholder. |
| Schede Legacy (Varie) | `/scheda-corso`, ecc. | `SchedaCorso`, `SchedaWorkshop`, ecc. | legacy tollerato | Vecchie schede agganciate a params in attesa di redesign |
| Viste Interne Trial/Lezioni | `/attivita/prove-pagamento`, ecc. | `PaidTrials`, `FreeTrials`, ecc. | dismesso | Navigation link rimossa. Gestite ora unicamente tramite Modulo Corsi Centrale (Fase 8). |
| Eventi Esterni (Orfana) | `/booking-services` | `BookingServices` | candidato a eliminazione futura | Orfana storicizzata dismessa dalla root, ri-inglobata correttamente in `/attivita/servizi`. |

## 4. Risorse Umane e Team

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Staff e Insegnanti | `/staff` | `Instructors` | canonico | Organico del centro |
| Inserisci Nota | `/inserisci-nota` | `NoteTeam` | canonico | Gestione compiti rapidi front-desk |
| Commenti Team | `/commenti` | `Commenti` | canonico | Ex "commenti log". Uniformato ufficiale |
| ToDo List | `/todo-list` | `TodoList` | canonico | Bacheca task condivisa |
| Knowledge Base | `/knowledge-base` | `KnowledgeBase` | canonico | Hub Wiki aziendale con Matrix Ruoli ufficiale integrata |

## 5. Configurazioni / Sistema

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| Listini e Quote | `/listini` | `PriceLists` | canonico | Tool principale listini pricing (Allineato Source of Truth) |
| Listini (Legacy DB) | `/listini-old` | `ListiniHome` | candidato a eliminazione futura | Reliquia logica JSON, da sopprimere |
| Promo e Sconti | `/promo-sconti` | `StubPromoSconti` (Wrapper) | placeholder | Gestore rules couponing in allestimento |
| Pannello Admin Globale | `/admin` | `AdminPanel` | canonico | Impostazioni applicative core |
| Elenchi Custom | `/elenchi` | `Elenchi` | canonico | Lookup tables customizzabili |
| Importazione Dati | `/importa` | `ImportData` | canonico | Batch uploader da CSV |
| Utenti e Permessi | `/utenti-permessi` | `UtentiPermessi` | canonico | Controllo accessi dipendenti |
| Storico Eliminazioni | `/audit-logs` | `AuditLogs` | canonico | Soft-delete recycle bin |
| Reset Stagione | `/reset-stagione` | `ResetStagione` | canonico | Svuotamento anno accademico |
| StarGem Copilot | `/copilot` | `StubCopilot` (Wrapper) | placeholder | Modulo assistente virtuale AI integrato |
| View Lista Abbandonata | `/attivita-a-lista` | `StubAttivitaLista` (Wrapper) | candidato a eliminazione futura | Route sperimentale non completata |

## 6. Route Orfane & Tecniche Sconnesse

| Nome ufficiale UI | URL attuale | Componente attuale | Stato | Nota chiara |
|---|---|---|---|---|
| *Nessuno* | `/test-gae` | *(Variabile)* | candidato a eliminazione futura | Tool di collaudo sviluppatore. Nessun link UI |
| *Nessuno* | `*` (Es: `/pippo`) | `NotFound` | canonico | Route di Fallback puro 404 (Alert Giallo) totalmente disaccoppiata dagli Stub in allestimento |

> **Aggiornamento Architetturale (Naming Consistency):** Il termine legacy "Nomi Corsi" è completamente deprecato in favore di **"Genere"** (System Code: `genere`). Tutte le 14 attività implementano la tendina dinamica `Combobox` agganciata a questa singola sorgente lista.

> **Aggiornamento Architetturale (activityType Pass-through):** Le pagine Operative `sunday-activities.tsx`, `recitals.tsx` e `vacation-studies.tsx` passano ora esplicitamente la prop `activityType` a `ActivityManagementPage` per garantire continuità tecnica e salvataggio Type Safe nel backend. Il type `activityType` è stato esteso per sopportare i literal type di queste nuove categorie.

> **Aggiornamento Architetturale (CourseUnifiedModal):** Refactoring del modale unificato. Disinnescato l'early-return ternario hardcoded del DialogTitle tramite `modalTitle` dinamico derivato per activityType. Il campo `activityType` viene ora impacchettato e iniettato nativamente nelle chiamate `POST` e `PATCH` dentro i metodi payload nativi `handleSubmit` ed `handleDuplicateFromModal`. Estesa strict type-safety ricorsiva anche ai sub-componenti tab (Enrollments/Attendances).

> **Aggiornamento Architetturale (SQLite JSON Parsing):** Risolto bug fatale nell'elaborazione dei campi array archiviati su Drizzle SQLite (es. `lessonType`). L'approccio attuale prevede l'utilizzo sistematico dell'helper `parseJsonArray` all'interno di `CourseUnifiedModal.tsx` durante il fetch del mount (`setFormData`) per evitare crash indotti dalle stringhe piatte `"[]"` elaborate da operatori iterativi in `MultiSelectCustomList`.
> **Aggiornamento Architetturale (CourseUnifiedModal):** Refactoring del form prenotazioni. Implementata la ricerca anagrafica asincrona al posto del dropdown statico, interfacciata dinamicamente su `/api/members?search=` per aggirare la paginazione preesistente backend, incrementando enormemente le performance nel mount e bypassando limiti di render virtuali. Inoltre, il bottone `Submit` modula parametricamente il proprio mapping verbale (es. "Crea Saggio" / "Crea Allenamento" / "Crea Corso") appoggiandosi a un dizionario reattivo su `activityType`. Il calendario transita direttamente l'`activityType` dell'evento sorgente agganciato ad STI, debellando la forzatura legacy a `"course"`.

> **Aggiornamento Architetturale (Parsing JSON API & UI Mapping):** Adottato `categoryName` come parametro nominale supplementare in transito dall'API root sulla pagina `activity-management-page.tsx`. Tale prop (aggiunto all'interfaccia `ActivityItem`) by-passa l'albero di dipendenza errato creato dalla separazione tra `custom_list_items` e le root `categories` nel rendering tabellare. Contestualmente, la prop `statusTags` proveniente da SQLite in "Double Stringified JSON" subisce un unpacking ricorsivo in `parseStatusTags()` per abbattere l'escaping nativo di drizzle ed elaborare correttamente gli array di stato sulle Badge del Riepilogo.

> **Aggiornamento Architetturale (Calendar e Liste Custom):** Il mapping visivo del badge nel rendering calendario (`calendar.tsx`) è stato generalizzato dal dominio "courses" ad una mappa polimorfa per i campi testuali in miniatura, dipendente da `activityType`. Contestualmente, le Custom Lists di sistema hanno riorganizzato la gerarchia UI in `elenchi.tsx`, traslando i descrittori "Categorie", "Canale" e "Come ci ha conosciuto" verso sub-tab unificate in `Elenchi Colorati Multi`.
> 
> **Aggiornamento Architetturale (Pulizia Route Categorie):** Cinque route operative obsolete relative alla gestione isolata delle categorie (`/categorie-lezioni-individuali`, `/categorie-allenamenti`, `/categorie-domeniche`, `/categorie-saggi`, `/categorie-workshop`) sono state asportate da `App.tsx` ed i file corrispondenti recisi permanentemente dal frontend: `individual-lesson-categories.tsx`, `training-categories.tsx`, `sunday-categories.tsx`, `recital-categories.tsx`, `workshop-categories.tsx`. Il dominio logico e gestionale per le categorie reside ora unilateralmente all'interno dell'host `/elenchi` avvalendosi della tabella combinata `custom_list_items`.
> 
> **Aggiornamento Architetturale (Nuovi Componenti e Interazioni - Sessione 07-08/04/2026):**
> - **Liste Custom**: Integrato un Color picker dinamico in `SimpleListSection` per supportare l'update cromatico nativo.
> - **Modale Unificato**: Sostituito pop-up statico degli allievi con "Ricerca asincrona allievi" (`searchMember`).
> - **Idratazione Dati**: Implementato Pre-popolamento allievi passante per il bridge `/api/enrollments`.
> - **UI Interoperability**: Le label modale modulano nativamente i verbi (es. "Crea Allenamento") rispetto all'activity; Badge parametrici inseriti in Calendario e funzione parser `parseStatusTags` blindata per doppie serializzazioni SQLite.
> 
> **Aggiornamento Architetturale (Enrollments STI e Interazioni Modale):** Il modale di modifica `CourseUnifiedModal.tsx` ha dismesso la pre-popolazione legacy basata su `member1Id/member2Id` (colonne deprecate sulla tabella courses). Ora l'idratazione allievi al caricamento esegue una query asincrona sul bridge associativo `/api/enrollments?courseId=X`, mappando gli slot e triggerando la ricostruzione del nominativo allievo per l'interfaccia via `/api/members/:id`. In `elenchi.tsx`, le Custom Lists traslate sono state confinate in un React Node asincrono indipendente (`ColoredCustomListsLoader`) che filtra i target dalla risposta server prima di iniettarli al `SimpleListSection`, blindando la UI contro map-crash generati dall'abbinata di custom-list non adatte a `EditableListSection`.
