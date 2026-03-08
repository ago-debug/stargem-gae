# Piano di Implementazione: Componenti UI Unificati (Micro-Form)

> [!IMPORTANT] 
> **Scopo di questo documento**
> Questo file rappresenta la **To-Do List operativa e attiva** per l'unificazione e la pulizia dell'Interfaccia Utente (Fase 2). Qui documenteremo tutti i difetti visivi, l'UX disomogenea e progetteremo i "Micro-Componenti Universali" (come il *TimeSlotPicker* o il *PaymentModule*) necessari per smettere di clonare codice in 12 pagine diverse. Aggiungi qui le anomalie grafiche riscontrate per progettarne una soluzione strutturale trasversale.

Questo documento traccia il piano operativo per risolvere il disallineamento visivo e logico presente nelle 12 pagine di erogazione attività di CourseManager (Fase 2 della strategia).

## Obiettivo
Smettere di riscrivere a mano la logica di input orario e la logica di selezione pagamenti/quote all'interno di ogni singola schermata React (`corsi.tsx`, `workshops.tsx`, ecc.). 
Costruiremo **due componenti React agnostici, blindati e universali**, da importare al posto dei vecchi cloni.

---

## 0. Elenco Definito dei Difetti Grafici e Funzionali (Stato Attuale)

Durante l'analisi della UI attuale (Marzo 2026), prima di procedere con la riprogrammazione, sono emerse le seguenti criticità strutturali e di UX che i nuovi componenti dovranno risolvere nativamente, seguendo il principio di **Ottimizzazione senza distruzione**:

### A. Frammentazione e Terminologia Confusa
*   **Gestione a Silos:** Esistono decine di pagine separate per inserire entità simili (Corsi, Workshop, Campus, ecc.), frammentando l'esperienza di inserimento.
*   **Nomenclatura Errata:** Il sistema usa la parola "Categorie" in modo atecnico. D'ora in poi, "Categoria" indicherà unicamente le materie fisiche (es. Danza, Arti Marziali, Fitness, Gioco Musica).

### B. Gestione Insegnanti a Compartimenti Stagni
*   **Disallineamento Anagrafiche:** Esiste una discrepanza gravissima tra la "Maschera Input" (dove si inseriscono i tesserati) e la sezione "Staff Insegnanti". L'insegnante "ABC" non risulta ricercabile nella Maschera Input per potergli fare una ricevuta.
*   **Soluzione UI Futura:** Unificazione visiva in un'unica griglia anagrafica centrale, con l'uso di "Flag/Badge Multipli" a selezione (Staff, Insegnante, Personal Trainer, Tesserato) per la stessa persona. Gestione di accessi/permessi differenziati in base al ruolo.
*   **Aziende ed Enti:** La nuova Anagrafica Centrale permetterà l'inserimento sia di persone fisiche che di Aziende/Fornitori, per gestire comodamente sconti e convenzioni o affitti spazi.

### C. Sistema Pagamenti e Checkout Blindato
*   **Flussi Multipli Carenti:** Ci sono troppi punti di accesso per pagare (Iscrizioni, Maschera Input, Calendario). Vanno unificati e rafforzati nei collegamenti.
*   **Bug ("Pagamento Non Concluso"):** Mancata concatenazione degli eventi in Cassa (es. schermate che mostrano saldi ma non finalizzano la ricevuta).
*   **Listini e Prezzi Bloccati (PIN Sicurezza):** Il prezzo base pescato dai listini/quote dovrà apparire in automatico. La forzatura/modifica manuale degli importi in Cassa (da parte della segreteria) sarà *bloccata*, e consentita unicamente previa autorizzazione (inserimento PIN/Codice Personale del manager).

### D. Calendario Limitato e Non Universale
*   **Da "Calendario Corsi" a "Calendario Attività":** Il flusso UI dovrà permettere prima la selezione di una delle 13 attività, poi dei dettagli.
*   **Slot Orari Disallineati:** Nelle pagine di creazione dei corsi, il dropdown permette salti rigidi (es. 7:00, 7:30). Di contro, il Calendario ha una gestione diversa. L'inserimento orari deve essere uniformato per supportare durate flessibili (50 min, 1h30m, ecc.) coerentemente ovunque, consentendo l'inserimento di tutte le entità (Corsi, Workshop, Affitti) direttamente dal Super-Planning.

### E. Rigidità nella Tipologia di Erogazione
*   **Separazione Logica:** "Allenamenti" va separato da "Affitti". I servizi di Personal Training/Affitto necessitano di focus nominale sul cliente e sui pacchetti (es. "Pacchetto 10 ingressi Cugge").
*   **Prove (Gratuite/Pagamento):** Non devono esistere 12 tabelle/pagine. L'attività "Prova" diventerà un semplice *Flag* (Gratis / A Pagamento) in fase di configurazione checkout dell'allievo, mostrata come voce separata nei pagamenti visivi.

### F. Sovraccarico Anagrafica, Filtri e Persistenza Stato
*   **Caricamento Dati Massivo (Filtri Obbligatori):** La lista anagrafiche base renderizza simultaneamente quasi 10.000 righe. Sarà obbligatorio inserire criteri di visibilità iniziali o filtri attivi (es. "Cerca...", o elenco in Lazy Load) per snellire il sistema.
*   **Bug di Persistenza (Maschera Input):** Quando si seleziona un partecipante e si naviga verso altre sezioni (Panoramica ecc.), al ritorno la maschera "dimentica" e non mostra più i pagamenti/attività aperti. È necessario implementare un memory cache (es. Zustand) per l'utente esaminato.
*   **Dati Sensibili Incompleti:** La UI attuale degli istruttori richiede solo Telefono e Mail. Sarà vitale avere la compilazione dei dati anagrafici completi per le questioni fiscali.

---

## 1. Il Componente "TimeSlotPicker.tsx"

Attualmente il salvataggio degli orari è disomogeneo visivamente, ma nel database (schema.ts) tutte le 11 tabelle aspettano tre campi identici:
- `dayOfWeek` (String, es. "Lunedì")
- `startTime` (String, es. "18:00")
- `endTime` (String, es. "19:00" - Opzionale)

### Architettura del Componente 
Creeremo `client/src/components/time-slot-picker.tsx`.
Il componente riceverà e restituirà i dati tramite props standardizzate, agendo in modalità "Controlled Component".

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

Attualmente ogni pagina ha il suo modo di far generare le quote. Dobbiamo creare un blocco grafico unico che faccia da ponte tra l'entità che si sta visualizzando (es. una lezione di Prova) e il carrello pagamenti universale.

### Architettura del Componente
Creeremo `client/src/components/payment-module-connector.tsx`.
Questo componente non manderà direttamente i soldi a `payments`, ma impacchetterà i dati corretti per il sistema di Cassa Centrale (che si aspetta una quota, un utente e un ID di riferimento).

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

1. **Creazione Silente:** Sviluppo iniziale dei due componenti nella libreria locale `src/components/`, senza importarli in nessuna pagina attiva.
2. **Sostituzione Pilota (A/B Test):** Sostituiremo il form orari e pagamenti unicamente in **1 silo a basso traffico** (Esempio: "Attività Domenicali" o "Prove a Pagamento").
3. **Validazione:** Testiamo che il salvataggio sul DB funzioni perfettamente usando i nuovi Micro-Form e che il dato sia identico al vecchio metodo.
4. **Sostituzione Massiva:** Una volta approvato il Pilota, applicheremo un Find&Replace architetturale, iniettando i due Micro-Form nelle restanti 10 pagine (Corsi, Workshop, Campus, ecc.), cancellando per sempre le migliaia di righe Frontend duplicate.

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
