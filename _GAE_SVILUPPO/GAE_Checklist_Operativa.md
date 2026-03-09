# 📝 Checklist Operativa CourseManager (Roadmap Fase 2)
*(Questo documento funge da promemoria vivente per il team di sviluppo. Spuntare i task o aggiungerne di nuovi mano a mano che l'architettura SaaS V2 prende forma).*

## 1. Refactoring UI Attuale (Miglioramenti Immediati)
Questi task servono a risolvere i "dolori" dell'applicazione odierna prima di tuffarsi pesantemente nella logica V2.

- [x] **Opzione A: Lazy Load Anagrafiche.** 
  Risolvere il blocco di rendering della lista `members.tsx` e `anagrafica-home.tsx` introducendo un caricamento parziale o vincolando la `GET` a un input di almeno 3 caratteri.
- [x] **Opzione B: Persistence Cache Maschera Input.**
  Inserire Zustand o LocalStorage per memorizzare in cache l'ID Utente selezionato nella maschera input, prevenendone la perdita durante i cambi di pagina.
- [x] **Sostituzione Colori "Hardcoded".**
  Riformattare tutti gli esadecimali rossi, arancioni e azzurri dell'attuale front-end con le variabili CSS documentate in `5_GAE_Linee_Guida_Grafiche_UI.md` (es. `bg-primary`, `bg-destructive`, `.gold-3d-button`).

## 2. Unificazione Componenti React (SaaS V2 Builder)
I due componenti universali che sostituiranno le decine di form sparsi.

- [x] **Creare `TimeSlotPicker.tsx`:** 
  Un unico componente per selezionare Orario Inizio, Fine, Sala e Insegnante, con validazione anti-conflitto. Sostituirà le maschere duplicate nelle pagine "Crea Corso", "Crea Workshop", "Calendario".
- [x] **Creare `PaymentModuleConnector.tsx`:** 
  L'unica autorizzata interfaccia di "Checkout". Deve pescare automaticamente il costo base dell'attività. Le forzature manuali sul prezzo richiederanno un **PIN Segreteria**.

## 3. Implementazione Schema Drizzle V2
Il "motore" sottostante. L'azzeramento dei silos per passare a Single Table Inheritance.

- [ ] Rivedere e spingere nel database il file `6_schema_v2_draft.ts`.
- [ ] Costruire le Factory API per inserire Corsi, Workshop e Affitti dentro all'unica tabella madre `activities`.
- [ ] Trasferimento guidato dei log di pagamento verso il nuovo ponte unico (Member + Enrollment).
- [ ] Predisporre endpoint per Staff App (`team_shifts` e `maintenance_tickets`).
- [ ] Predisporre endpoint per moduli CRM (`crm_leads`).

## 4. UI Interazione e Integrazioni Architetturali (Piano Interazione UI)
*(Task derivati da `4_GAE_Piano_Interazione_UI.md` e dal feedback cliente)*

- [ ] **Standardizzazione Nomenclatura:**
  Rinominare "Attività" in "Attività" ove necessario, riservando "Attività" solo alle materie fisiche (Danza, Fitness, ecc.).
- [x] **Unificazione Anagrafica (Tesserati vs Staff):**
  Integrare gli Insegnanti inseriti nello "Staff" all'interno della maschera input generale, affinché ricevano ricevute e compensi dallo stesso hub (usando Flag: Staff, Insegnante, ecc.).
- [x] **Checkout Blindato e Autorizzazioni:**
  Rendere l'importo base delle ricevute automatico e *non modificabile*. Richiedere **PIN Manager** per forzature di prezzo manuali in cassa.
- [ ] **Aziende ed Enti in Anagrafica:**
  Permettere esplicitamente l'inserimento di P.IVA/Enti per gestire affitti spazi o convenzioni aziendali.
- [ ] **Filtri Obbligatori Maschere Elenco:**
  Assicurarsi che tutte le tabelle (non solo Anagrafica, ma anche Ricevute, Staff, ecc.) abbiano filtri attivi o lazy-loading per evitare rendering massivi.
- [ ] **Scaffolding Multi-App (Views):**
  Predisporre le viste mobile-first distinte per:
  - **Staff App** (Agenda personale, Check-in presenze, prenotazione aule).
  - **Team App** (Shift management, messaggistica, maintenance tickets).
  - **User App** (Catalogo mobile-first, acquisti Stripe, disdette).
- [ ] **Dashboard CRM e Marketing:**
  Preparare la kanban board per i Lead e il layout per il Campaign Builder (Email/SMS).
