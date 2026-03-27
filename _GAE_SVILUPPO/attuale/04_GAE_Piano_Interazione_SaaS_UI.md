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
*   **Caricamento Dati Massivo (Filtri Obbligatori):** La lista anagrafiche base renderizza simultaneamente quasi 10.000 righe. Sarà obbligatorio inserire criteri di visibilità iniziali o filtri attivi (es. "Cerca...", o elenco in Lazy Load) per snellire il sistema.
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
