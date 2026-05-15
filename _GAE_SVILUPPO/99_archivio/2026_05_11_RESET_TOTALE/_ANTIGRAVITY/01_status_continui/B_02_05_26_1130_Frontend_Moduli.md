Aggiornato al: 2026-04-28 11:50

# Master Document: Moduli Frontend, UI e Interfacce (Stato Attuale)

> **Ultimo Aggiornamento:** 02 Maggio 2026, 11:30

Questo documento traccia l'architettura dei moduli di interfaccia utente in React (Frontend), la loro corrispondenza logica ai componenti condivisi e l'interazione con le API di Backend. Sostituisce la frammentazione storica dei moduli visivi e definisce le linee guida per i Modali Operativi e le Griglie Dati.

---

## 1. Architettura Modali e Form (STI - Single Table Inheritance)

Il sistema frontend ha subito un radicale refactoring (Fase 20+) per supportare il backend STI. Le 9 form differenziate per attività sono state consolidate in componenti centralizzati riutilizzabili:

### Modale Operativo Condiviso (`ActivityManagementPage` / `CourseDialog`)
Tutte le attività (Corsi, Workshop, Campus) condividono un nucleo di campi standardizzati:
- **Campi Core:** Genere (proveniente da `custom_lists`), Categoria (`categories`), Stato (`activity_statuses`), Insegnante (`members`), Sala (`studios`), Date/Orari e Prezzo (`quotes`).
- **Comportamento UI:** Utilizza `CustomCombobox` pilotati da hook `useCustomListValues` per estrarre dinamicamente le property.

### Modulo Corsi/Iscritti (Aggiornato)
- **/iscritti_per_attivita**: 6 tab accordion canoniche per la gestione degli iscritti.
- **/attivita**: Panoramica unificata con tile alti popolati da `/api/activities-summary`.
- **/attivita/<tipo>**: 6 pagine wrapper (`sunday-activities`, `individual-lessons`, `trainings`, `campus-activities`, `courses`, `workshops`).
- **5 schede dettaglio canoniche**: (`scheda-corso`, `scheda-allenamento`, `scheda-domenica`, `scheda-lezione-individuale`, `scheda-campus`). Tutte allineate al pattern `scheda-corso.tsx`.
- **Componenti riutilizzabili**:
  - `ActivityManagementPage` (con prop flessibile `idParamName`)
  - `ActivityAccordionCard`
  - `getSeasonLabel` da `lib/utils.ts` (dropdown stagioni canonico unificato)
- **Pattern anti-crash**: Early return sui contenitori generici (`2526ALLENAMENTO`, `2526GENERICO*`) che non hanno relazioni dati per evitare crash "schermata bianca".

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

## 5. Assistente AI (Teo Copilot) e Strumenti Globali

L'introduzione del motore AI ha arricchito l'UX globale della piattaforma (Fase 2 Integrazione):
- **Teo Copilot (`TeoCopilot.tsx`)**: Refactoring completato usando `useChat` da `@ai-sdk/react`. L'assistente è un drawer/floating widget globale per assistere in compiti complessi o query documentali.
- **Command Palette (`CommandPalette.tsx`)**: Integrato tramite `cmdk`, richiamabile globalmente con `CMD+K`. Permette navigazione rapida e fornisce l'ossatura per la futura ricerca semantica intelligente ("Chiedi a Teo...").
- **Magic Promo Button (`MagicPromoButton.tsx`)**: Pulsante azionabile all'interno della `scheda-domenica.tsx`. Genera testi promozionali ottimizzati usando l'API `/api/ai/generate-promo`, con funzione "Copia per WhatsApp" immediata.

---

## 6. Regole Auree Sviluppo Frontend

- **Color Consistency:** I colori delle card in Calendario obbediscono prima alla Macro-Attività (es. IND = Viola, ALL = Blu) e solo in seconda battuta al badge di Sotto-Categoria. Mai usare classi CSS Tailwind purgate dinamicamente; usare esadecimali statici o inline style sui badge.
- **Error Handling Maschere:** Disattivare gli errori "rossi" di form invalid al boot-up. La mappa di validazione (es. Zod) deve innescarsi solo allo sfioro del campo (onChange) o al tentativo di Submit.
- **D.R.Y. su Liste:** Qualsiasi tendina selettiva futura non va cablata in HTML statico. Deve interrogare `/api/custom-lists/{nome}` per garantire la traduzione immediata o la correzione errori via pannello admin SysAdmin.

## Hack CSS e Pattern UI da memorizzare (Aggiunto 27/04/2026)
### 1. Scroll interno per componente `<Table>` (shadcn/ui) con Sticky Header
Quando si inserisce una tabella e si vuole che la pagina rimanga ferma (layout Dashboard) mentre solo la tabella scorre, è necessario bypassare il `div` auto-generato dal componente `Table` di shadcn.
Per farlo, racchiudere il `<Table>` in un container flessibile e utilizzare questo override CSS:
```tsx
<div className="flex-1 min-h-0 relative [&>div]:absolute [&>div]:inset-0 [&>div]:overflow-y-auto">
   <Table>
     <TableHeader className="sticky top-0 z-10 bg-white">
```
In questo modo:
1. Il blocco superiore (titoli, filtri) non scorre.
2. La tabella ottiene lo scorrimento indipendente.
3. Il `TableHeader` rimane agganciato (`sticky`) in cima al `div` interno scorrevole.
Da usare ogni volta che sistemiamo "le altre attività" per ottenere il vero effetto finestra fissa.
