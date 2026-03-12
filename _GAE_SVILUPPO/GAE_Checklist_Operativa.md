# 📝 Checklist Operativa CourseManager (Roadmap Fase 2)
*(Questo documento funge da promemoria vivente per il team di sviluppo. Spuntare i task o aggiungerne di nuovi mano a mano che l'architettura SaaS V2 prende forma).*

## 1. Refactoring UI Attuale (Miglioramenti Immediati)
Questi task servono a risolvere i "dolori" dell'applicazione odierna prima di tuffarsi pesantemente nella logica V2.

- [x] **Opzione A: Lazy Load Anagrafiche.** 
  Risolvere il blocco di rendering della lista `members.tsx` e `anagrafica-home.tsx` introducendo un caricamento parziale o vincolando la `GET` a un input di almeno 3 caratteri.
- [x] **Opzione B: Persistence Cache Maschera Input.**
  Inserire Zustand o LocalStorage per memorizzare in cache l'ID Utente selezionato nella maschera input, prevenendone la perdita durante i cambi di pagina.
- [x] **Standardizzazione Componenti Tabellari:**
  Implementare `<SortableTableHead>` e `useSortableTable` in tutto l'applicativo per avere ordinamenti di colonna uniformi.
- [x] **Segnalazione visiva "Manca Dato":**
  Implementare inline badges e asterischi rossi per i campi obbligatori all'interno della maschera input per istruire l'inserimento dati rigoroso.
- [x] **Sostituzione Colori "Hardcoded".**
  Riformattare tutti gli esadecimali rossi, arancioni e azzurri dell'attuale front-end con le variabili CSS documentate in `5_GAE_Linee_Guida_Grafiche_UI.md` (es. `bg-primary`, `bg-destructive`, `.gold-3d-button`).

## 2. Unificazione Componenti React (SaaS V2 Builder)
I due componenti universali che sostituiranno le decine di form sparsi.

- [x] **Creare `TimeSlotPicker.tsx`:** 
  Un unico componente per selezionare Orario Inizio, Fine, Sala e Insegnante, con validazione anti-conflitto. Sostituirà le maschere duplicate nelle pagine "Crea Corso", "Crea Workshop", "Calendario".
- [x] **Creare `PaymentModuleConnector.tsx`:** 
  L'unica autorizzata interfaccia di "Checkout". Deve pescare automaticamente il costo base dell'attività. Le forzature manuali sul prezzo richiederanno un **PIN Segreteria**.

## 3. Implementazione Schema Drizzle V2 (Motore Dati ed API) - *SOSPENSIONE TEMPORANEA*
> [!WARNING]
> Lo sviluppo della architettura Single Table Inheritance (STI) e l'unificazione in `activities` e `global_enrollments` sono momentaneamente bloccati e rimandati a data da destinarsi (su richiesta 12 Marzo 2026).
> QUALSIASI MODIFICA O NUOVA FEATURE DEVE ESSERE SVILUPPATA SULLA VECCHIA ARCHITETTURA A 11 SILOS. Non prendere iniziative per l'unificazione senza preavviso.

- [x] **Modellazione Iniziale Database:** Tabelle `tenants`, `activity_categories`, `activities`, `global_enrollments` inserite in `schema.ts`.
- [x] **Moduli HR e CRM:** Inserite tabelle `team_shifts`, `maintenance_tickets`, `crm_leads`, `crm_campaigns`.
- [x] **Refactoring Relazioni:** Ristrutturata la tabella `payments` per supportare in cascata i nuovi `globalEnrollmentId` lasciando le vecchie FK operative per retrocompatibilità.
- [x] **Aggiornamento ORM e API di base:** Modificati i file `server/routes.ts` e `server/storage.ts` includendo i nomi reali e correggendo ogni mismatch TypeScript o type-error compilativo.
- [x] **Generazione File Migrazione:** Eseguito `npm run db:generate` producendo la migrazione `0005_rare_talkback.sql`.
- [ ] **Eseguizione Push Database [BLOCCATO]**
- [ ] **Creazione Script "Data Pump" [BLOCCATO]**
- [ ] **Migrazione Pagamenti (Ponte Attività) [BLOCCATO]**
- [ ] **Verifica Integrità Dati [BLOCCATO]**
- [ ] **Costruzione API Factory unificate [BLOCCATO]**
- [ ] **Eliminazione Codice Vecchio [BLOCCATO]**
- [ ] **Aggiornamento Frontend React Query [BLOCCATO]**
- [ ] **Endpoint Nuovi Moduli:** Predisporre i backend per lo Staff App, Team App e moduli CRM.

## 4. UI Interazione e Integrazioni Architetturali (Piano Interazione UI)
*(Task derivati da `4_GAE_Piano_Interazione_UI.md` e dal feedback cliente)*

- [ ] **Aziende ed Enti in Anagrafica:**
  Permettere esplicitamente l'inserimento di P.IVA/Enti per gestire affitti spazi o convenzioni aziendali (B2B).
- [ ] **Filtri Obbligatori Maschere Elenco:**
  Assicurarsi che tutte le tabelle (non solo Anagrafica, ma anche Ricevute, Staff, ecc.) abbiano filtri attivi o lazy-loading per evitare rendering massivi e rallentamenti.
- [ ] **Standardizzazione Nomenclatura:**
  Rinominare "Attività" in "Attività" ove necessario, riservando "Attività" solo alle materie fisiche (Danza, Fitness, ecc.).
- [x] **Unificazione Anagrafica (Tesserati vs Staff):**
  Integrare gli Insegnanti inseriti nello "Staff" all'interno della maschera input generale, affinché ricevano ricevute e compensi dallo stesso hub.
- [x] **Checkout Blindato e Autorizzazioni:**
  Rendere l'importo base delle ricevute automatico e *non modificabile*. Richiedere **PIN Manager** per forzature manuali in cassa.
- [ ] **Scaffolding Multi-App (Views):**
  Predisporre le viste mobile-first distinte per:
  - **Staff App** (Agenda personale, Check-in presenze, prenotazione aule).
  - **Team App** (Shift management, messaggistica, maintenance tickets).
  - **User App** (Catalogo mobile-first, acquisti Stripe, disdette).
- [ ] **Dashboard CRM e Marketing:**
  Preparare la kanban board per i Lead e il layout per l'email campaign builder.
