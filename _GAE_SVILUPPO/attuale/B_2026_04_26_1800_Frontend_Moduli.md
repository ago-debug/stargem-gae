Aggiornato al: 2026-04-26 12:30

# Master Document: Moduli Frontend, UI e Interfacce (Stato Attuale)

Questo documento traccia l'architettura dei moduli di interfaccia utente in React (Frontend), la loro corrispondenza logica ai componenti condivisi e l'interazione con le API di Backend. Sostituisce la frammentazione storica dei moduli visivi e definisce le linee guida per i Modali Operativi e le Griglie Dati.

---

## 1. Architettura Modali e Form (STI - Single Table Inheritance)

Il sistema frontend ha subito un radicale refactoring (Fase 20+) per supportare il backend STI. Le 9 form differenziate per attività sono state consolidate in componenti centralizzati riutilizzabili:

### Modale Operativo Condiviso (`ActivityManagementPage` / `CourseDialog`)
Tutte le attività (Corsi, Workshop, Campus) condividono un nucleo di campi standardizzati:
- **Campi Core:** Genere (proveniente da `custom_lists`), Categoria (`categories`), Stato (`activity_statuses`), Insegnante (`members`), Sala (`studios`), Date/Orari e Prezzo (`quotes`).
- **Comportamento UI:** Utilizza `CustomCombobox` pilotati da hook `useCustomListValues` per estrarre dinamicamente le property.

### Maschera Input Generale
Il centro nevralgico della raccolta dati iscritti in segreteria:
- Elabora dati Anagrafici Base, Tutori (se minori), Iscrizione Corsi, Certificati Medici e Tessere Associative.
- Integra un Parser nativo per il **Codice Fiscale Italiano**.
- Smista i payload complessi (attività plurime + pagamenti transazionali) garantendo l'emissione del carrello coerente senza produrre "pagamenti orfani".

### Modale Nuovo Pagamento (Checkout Centrale)
Disaccoppiato dal listato Corsi, gestisce la fatturazione in ingresso:
- Pilotato da `ACTIVITY_REGISTRY` per selezionare dinamicamente il dominio di appartenenza.
- Integra i campi `Metodo Checkout` (da DB `payment_methods`) la cui validità è indispensabile per sigillare l'operazione in `payments`.

### Booking e Affitti (`StudioBookings`)
Mantiene un Modale Separato focalizzato sulla prenotazione fisica di `studios` incrociata con un listino `booking_services`. Non si appoggia al modale Corsi didattico, preservando il concetto di 'Checkout Immediato' o 'Volante'.

---

## 2. Navigazione Temporale: Calendario e Planning

### Calendario Attività (Operativo Day-by-Day)
- Visualizzazione Tattica: Mostra Corsi, Workshop, Prove, Affitti e Allenamenti incrociati Side-by-Side per evitare sovrapposizioni visive sulle stesse sale.
- Architettura Dinamica: Le colonne orarie non sono fisse, ma si stretchano orizzontalmente usando `Temporal` API e i limiti d'orario configurati in `system_configs`.

### Planning Strategico (Vista Plurimensile)
- Visualizzazione Direzionale: Organizza blocchi Macro (Saggi, Eventi Esterni, Festività, Chiusure).
- Intercetta i periodi morti (es. Chiusura Estiva) avvisando in automatico il motore Corsi.

### Switch Stagionale e Regola 1° Agosto
- Dropdown Globale nell'Header per passare tra stagione "Corrente" e "Successiva".
- **Porting:** Presente funzione di duplicazione intelligente scheletri Corsi senza iscrizioni.
- **Auto-Switch:** Il 1° Agosto il backend promuove in automatico la stagione successiva, e la UI si aggiorna di riflesso senza interventi manuali (Zero-Downtime).

---

## 3. Gestione Elenchi, Tendine (Select) e Hardcoding

L'audit UI ha ripulito i Dropdown, dividendoli in 3 macro categorie:

1. **Gestiti via API Relazionale Reale (Standard DB):**
   - Sale (`/api/studios`), Insegnanti (`/api/instructors`), Categorie (`/api/categories`), Partecipanti (`/api/members`).
2. **Gestiti via Dizionario Personalizzabile (`custom_lists`):**
   - "Genere" Attività, Livello, Colori Card (renderizzati nativamente prendendo gli Hexcode da `custom_list_items.color`).
3. **Hardcoded (Lasciati Fissi per Sicurezza Logica):**
   - Tipologia Tessera (`Nuovo`, `Rinnovo`), Competenza (`Corrente`, `Successiva`), Giorni (`LUN..DOM`). Questo previene bug logici e corruzione dati nei calcoli contabili del backend.

---

## 4. Esperienza Utente (UX) e Dashboard Segreteria

- **Dashboard Reattiva:** Eliminati Widget passivi. Presente focus su Task in scadenza (es. Certificati Medici Scaduti), Incassi Giornalieri raggruppati per operatore, e notifiche team (`Gemory`).
- **Export Unificato:** Componente universale `ExportWizard.tsx` standardizzato in tutti e 10 i moduli tabellari per CSV/XLSX.
- **Importazione Dati:** Route `/importa` evoluta a Smart Routing (Dry-Run Preview, Color Coding su righe corrotte e validazione CF pre-invio).

---

## 5. Regole Auree Sviluppo Frontend

- **Color Consistency:** I colori delle card in Calendario obbediscono prima alla Macro-Attività (es. IND = Viola, ALL = Blu) e solo in seconda battuta al badge di Sotto-Categoria. Mai usare classi CSS Tailwind purgate dinamicamente; usare esadecimali statici o inline style sui badge.
- **Error Handling Maschere:** Disattivare gli errori "rossi" di form invalid al boot-up. La mappa di validazione (es. Zod) deve innescarsi solo allo sfioro del campo (onChange) o al tentativo di Submit.
- **D.R.Y. su Liste:** Qualsiasi tendina selettiva futura non va cablata in HTML statico. Deve interrogare `/api/custom-lists/{nome}` per garantire la traduzione immediata o la correzione errori via pannello admin SysAdmin.
