# Analisi Strategica per l'Ottimizzazione del Database (CourseManager)

> [!IMPORTANT] 
> **Scopo di questo documento**
> Questo file rappresenta l'**Analisi Strategica e il Business Case (Fase 3)** per il refactoring del Database di CourseManager. Spiega *perché* stiamo passando dalla vecchia struttura a 11 silos alla nuova architettura SaaS (Single Table Inheritance), illustrando i vantaggi matematici del taglio delle tabelle e elencando rigorosamente tutte le eccezioni commerciali (prenotazioni, carnet, capienze, ecc.) che il nuovo motore dovrà gestire nativamente.

Alla luce delle indagini condotte sullo stato dell'arte del gestionale, emerge una forte asimmetria tra la complessità visiva per l'utente (ben mascherata) e l'attuale complessità logica del backend. 

Il database attuale è composto da **73 tabelle fisiche**, suddivise logicamente in **5 Macro-Aree**. Il "debito tecnico" primario risiede interamente nell'Area 1 ("Moduli Core: Attività e Corsi"), la quale adotta un approccio a *silos separati* (copia-incolla strutturale per 11 tipologie diverse di offerta didattica).

Questo documento illustra la mia proposta di intervento tecnico, numerico e procedurale per risolvere il problema alla radice senza causare disservizi.

---

## 1. Fotografia del Problema: L'Architettura a "11 Silos"
Attualmente, se la segreteria crea un nuovo "Corso", i dati finiscono nella tabella `courses`. Se crea un "Workshop", finiscono in `workshops`. Se crea un "Campus", finiscono in `campus_activities`. 
Questa totale **separazione fisica** di entità che condividono il **100% della stessa natura logica** (hanno tutte un orario, un istruttore, una sala e un prezzo) comporta tre gravi reazioni a catena:

1. **Ridondanza delle Tabelle (Sprawl):** Per erogare 11 tipologie di attività, il sistema ha generato a cascata 11 tabelle per l'evento, 11 tabelle per le categorie e 11 tabelle per tenere traccia delle iscrizioni. Parliamo di **circa 34 tabelle su 73** (quasi metà del database) che fanno letteralmente la stessa identica cosa ma con nomi diversi.
2. **Caos Contabile (Il collo di bottiglia "Payments"):** La tabella sovrana `payments`, dovendo emettere ricevute, è costretta a ospitare 12 chiavi esterne (Foreign Keys) differenti (es. `enrollment_id`, `ws_enroll_id`, `pt_enroll_id`) per sapere "a quale silo" è agganciato un dato incasso. Questo rende le query lente e la diagnostica complessa.
3. **Rigidità delle Interfacce UI:** Avendo 11 rami backend separati, in React sono nate decine di pagine frontend clonate e disallineate tra loro (es. componenti dissimili per l'inserimento degli orari o visualizzazione partecipanti).

---

## 2. La Soluzione Proposta: "Single Table Inheritance" (Dynamic Engine)

La mia proposta per ottimizzare il gestionale punta a un trapianto architetturale verso il modello **Single Table Inheritance** (STI). Crolleremo gli 11 *silos* in un unico "Motore Dinamico", eliminando la duplicazione e centralizzando i flussi.

### Dove Interverrei e Quante Tabelle Toccherei
L'intervento andrebbe a intaccare **principalmente le ~34 tabelle del Modulo 1 (Core)**, lasciando quasi del tutto intoccati i Moduli 3 (Anagrafiche) e 4 (Struttura).

Ecco come cambierebbe il conteggio e la suddivisione:

*   **11 Tabelle Categorie -> Diventano 1 Tabella (`categories`)**
    Tutte le materie (es. Hip Hop, Calisthenics, English Camp) convergeranno qui. Un campo `activity_type` (Enum: 'course', 'workshop', 'campus') le differenzierà logicamente, non fisicamente.
*   **11 Tabelle Evento -> Diventano 1 Tabella (`activity_details`)**
    Le vecchie `courses`, `workshops`, ecc. collassano nell'unica tabella "Offerta". Avrà i medesimi campi per tutti: `startTime`, `endTime`, `instructorId`, ecc.
*   **11 Tabelle Iscritti -> Diventano 1 Tabella (`enrollments`)**
    Tutte le partecipazioni degli allievi confluiranno qui. Spariranno `ws_enrollments`, `sa_enrollments`, ecc.
*   **Gestione `payments` (Semplificazione)**
    I pagamenti non avranno più 12 chiavi di collegamento orfane. Il pagamento punterà unicamente a `enrollments_id` (che a sua volta saprà a quale macro-attività riferirsi).

### Il Risultato Numerico
Dalle attuali **73 Tabelle**, scenderemmo drasticamente a circa **45 o 50 Tabelle totali**. Significa **eliminare definitivamente ~30 tabelle clonate**, smaltendo migliaia di righe di codice ORM inutile su Node.js. 

---

## 3. RoadMap di Intervento: Come Mimetizzarsi senza Fare Danni

Trasformare il cuore del database a sistema "in volo" è l'operazione più rischiosa in ingegneria del software. 
Ecco la mia proposta di intervento, articolata per evitare qualsiasi blocco del lavoro della segreteria:

### Fase 1: Sviluppo Silente (Shadow Mode)
1. Creo un **Branch Isolato** su Git (nessuna modifica avverrà in produzione).
2. Costruisco le **3 nuove Super-Tabelle** (`categories_v2`, `activity_details`, `enrollments_v2`) dentro Drizzle ORM senza toccare o cancellare le vecchie 34 tabelle.
3. Inietto uno "Script Ombra" (Data Pump) che cicla sui vecchi corsi e workshop e li "ricopia" costantemente nelle nuove 3 tabelle unificate per assicurarmi che il mapping dei vecchi dati funzioni perfettamente.

### Fase 2: Unificazione delle Interfacce (UI Refactoring)
*   Sfruttando il branch isolato, distruggo le decine di varianti delle schermate di iscrizione e dei planning in React.
*   Costituisco **un unico "Micro-Form" universale** per i pagamenti e gli inserimenti orario.
*   Lo collego esclusivamente alle nuove Super-Tabelle unificate.

### Fase 3: Il Cut-Over (Il Trapianto)
*   Quando avremo testato (sempre nel branch sperimentale) che il Gestionale riesce a iscrivere, incassare e stampare report usando SOLO il motore unificato a 3 tabelle, organizzeremo il "Cut-Over".
*   In un momento di fermo del centro (es. domenica notte o prima mattina), si lancia l'aggiornamento finale: si pusha il branch, si cancellano fisicamente (Drop) le vecchie ~30 tabelle a silos obsolete e si passa alla produzione col nuovo motore ad alte prestazioni.

---

## 4. Requisiti di Business (Le Regole d'Oro per la nuova Architettura)

A seguito dell'intervista diretta con l'amministrazione (Marzo 2026), sono emerse le **eccezioni fisiche e contabili** che il nuovo motore univoco (`activity_details` ed `enrollments`) dovrà saper gestire nativamente. 

### 🚀 Obiettivo Finale: Architettura SaaS (Software as a Service)
Il sistema è in fase di re-ingegnerizzazione non solo per ottimizzare le prestazioni locali, ma con l'obiettivo commerciale di diventare un prodotto scalabile e rivendibile ad altre scuole/centri (Multi-tenant).
Le 4 Macro Tabelle (`activities`, `activity_categories`, `activity_details`, `enrollments`) e il comparto contabile dovranno essere progettati in modo da non avere *nessuna logica hardcoded* (es. vietato scrivere nel codice *"se è Danza fai X"*), demandando alla UI la creazione libera di regole e settaggi profilati per il futuro cliente finale.

### A. Corsi Annuali e Capienze
*   **Ciclo Annuale:** Abbonamento fisso (Settembre-Giugno). Disdetta assente, consentita pura sospensione.
*   **Capienza Rigorosa:** Le tabelle necessitano di un cap limit (`max_capacity`).
*   **Lista d'Attesa (Waiting List):** Se una disciplina è satura, non si blocca l'inserimento ma il record in `enrollments` andrà formalmente in stato `waiting_list`.

### B. Lezioni Private e Carnet a Scalare
*   **On-Demand:** Per l'1-to-1, l'activity si crea *on the fly* sulla chiamata.
*   **Gestione Carnet:** Occorrono abbonamenti di tipo "A scalo" (es. Carnet 10 ingressi). La futura tabella per le quote e iscrizioni deve saper immagazzinare gli *ingressi residui* (Punch Card logic).

### C. Affitti Sale e Listini Multipli
*   **Booking Grid:** Il front-end avrà bisogno di un calendario a slot incastrabili (1h, 50m, 2h).
*   **Pricing Dinamico:** Il calcolatore prenderà in input due varianti determinanti per l'affitto: *Durata* e *User Role* (es. Sconto se Tesserato o Staff).

### D. Grandi Eventi e Payload Dinamici
*   **Acconto (Deposit) / Saldo:** Pagamento *una tantum* ma con possibilità tecnica di separare un Acconto immediato da un Saldo dovuto entro poche settimane (nessuna rateizzazione esterna).
*   **Dati Volatili (JSON Payload):** Nelle Vacanze Studio servono box extra volatili (Taglia maglietta, Trasporto, Patologie dietetiche). Invece di far generare ad-hoc nuove colonne MySQL per magliette o bus, integreremo un campo potente `extra_info` descritto in architettura come JSON.

### F. Tesseramenti (Memberships) e Sicurezza
*   **Validità Configurabile:** Il sistema SaaS deve supportare scadenze fisse (es. 1° Sett. - 31 Ago. a 25€) o date rolling. 
*   **Obbligatorietà Flessibile:** Il tesseramento è mandatorio (anche per Staff e invio dati a Enti sportivi terzi), ma il motore deve prevedere dei bypass logici in prevendita (es. consentire l'acquisto di una prima prova senza tessera e obbligarla allo step successivo).

### G. Shop e Servizi Extra (Vendite Passive)
*   **Voci Fuori-Orario:** Il sistema deve permettere la vendita di entità "piatte" e slegate temporalmente (es. Affitto Armadietto, Lucchetto, Merchandising).
*   **Gestione Giacenze (Stock):** Per gli oggetti fisici sarà implementato un modulo di *Inventario* elementare (Carico/Scarico) che inibisca l'acquisto al termine della disponibilità, pronto a recepire logiche attualmente rodate dall'amministrazione su fogli GSheet esterni.

### H. Eventi Singoli, Ticketing e Provvigioni
*   **Saggi e Ticketing Singolo:** Nessun pagamento a "famiglie", ogni iscritto o ospite esterno acquista il proprio quantitativo di slot/biglietti (sia online che in segreteria).
*   **Split Payments (Provvigioni Insegnanti):** Un requisito infrastrutturale di *massima importanza*. La tabella che aggancia gli Insegnanti all'Evento Didattico deve poter scartare la classica tariffa oraria per ospitare contratti "A Percentuale %" basati sul numero reale di allievi iscritti incassati. Il db governerà un flag temporaneo di "Visibilità" per consentire al docente di sbirciare l'andamento iscrizioni in autonomia.

### J. Integrazione Fiscale (Tax API)
*   **Documentazione Elettronica:** La tabella transazioni (`payments`) dovrà disporre di colonne hook pronte (es. `receipt_status`, `rt_transaction_id`) per dialogare via API con Registratori Telematici o gestionali di contabilità esterni, superando le "ricevute pro-forma" interne.

### K. Interfacciamento Hardware (IoT Access Control)
*   **Lettura Autonoma:** La tabella delle presenze (`attendances`) andrà cablata per accettare ping elettronici. Tramite un `barcode_uuid` in anagrafica, telecamere Face ID, lettori QR/Barcode al banco registreranno automaticamente l'ingresso scalando "carnet" dal wallet o registrando la pura presenza.

### L. Gestione Crediti (Wallet Recurrency)
*   **Addebito SEPA/Stripe:** Le iscrizioni (`enrollments`) dovranno supportare lo status *Recurrent*. L'architettura deve prevedere la rateizzazione garantita dell'intera stagione (impedendo logiche di un-subscribe immediate furbette).

### M. Scalabilità Multi-Tenant e Multi-Sede (Enterprise)
*   **La Colonna `location_id`:** Ognuna delle quattro Super-Tabelle avrà obbligatoriamente un field per discernere la Sede (Milano, Monza, ecc.).
*   **Impermeabilità Parziale:** Il DB deve gestire iscritti multi-sede, ma sopratutto Insegnanti condivisi tra più edifici aziendali.
*   **Integrazione Extramoenia:** Il Planner Insegnanti deve consentire l'inserimento di "Slot Occupati Generici" per calcolare la disponibilità dell'insegnante anche quando *lavora per la concorrenza* o in associazioni non affiliate, schermando conflitti orari nel nostro planning.

### N. Modulo Risorse Umane (HR & Payroll)
*   **Timbratura Insegnanti:** Verrà strutturata la tabella `instructor_attendances` per certificare *quando* e *quanto* un maestro ha fisicamente presenziato a lezione.
*   **Reportistica Paghe:** Lo scontro tra le "Ore Svolte x Tariffa Oraria" (oppure x % Provvigione) fornirà alla dirigenza un prospetto cedolini matematicamente esatto a fine mese.

### O. Software Gestionale HR & Maintenance (Nuovo Modulo)
*   **Separazione Logica Ruoli:** Oltre al mero controllo accessi, l'RBAC (Role-Based Access Control) su database dovrà discernere nettamente tra "Staff" (Insegnanti Didattici) e "Team" (Amministrativi, Ispettori, Receptionist), fornendo viste distinte.
*   **Shift Management (Turni):** Creazione della tabella `team_shifts` associata ad aule/reception per cadenzare gli orari di lavoro del personale dipendente tramite l'App o Portale a loro dedicato.
*   **Manutenzione Strutturale:** Istanziazione della tabella `maintenance_tickets` connessa alle Aule/Studi. Permetterà all'App del personale ispettivo di aprire segnalazioni tecniche (es. guasti) con stati d'avanzamento, isolando il workflow dalla messaggistica generale o dai Todo standard.
*   **Comunicazioni Broadcast:** Potenziamento delle attuali tabelle `messages`, `todos` e `team_comments` per trasformare l'interfaccia dell'App Dipendenti nel vero *cuore comunicativo* a circuito chiuso.

---
*(La fase di pre-analisi e mappatura dei logici aziendali è conclusa. In base a queste specifiche inizierà il Coding Drizzle ORM).*
