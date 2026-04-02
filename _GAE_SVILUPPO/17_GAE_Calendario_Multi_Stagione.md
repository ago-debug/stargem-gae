# Specifica Funzionale: Calendario Multi-Stagione, Duplicazione Corsi e Gestione Conflitti (Fase 27)

**[SPRINT CHIUSO CON SUCCESSO E CONSEGNATO]**: Fase 27 completata. Le logiche di Calendario/Multi-Stagione sono pienamente varate. L'endpoint di duplicazione controllata (no enrollments) lavora dinamicamente via UI (Checkbox batch). La **Programmazione Date Strategiche** (chiusure/ferie) è integrata, attingendo la logica dei template storici, risultando prioritaria e visibile sia nel Planning stagionale sia nel Calendario operativo.

**🚨 [AG-043 FEEDBACK TEST UTENTE - FIX PRIORITARI MARTEDÌ]**:  
A seguito del test utente post-sprint sono emersi i seguenti requirement bloccanti (Hotfix temporali):
- **Default Season 25-26**: L'applicativo al caricamento deve *sempre* avere la stagione "25-26" attiva, visibile e flaggata di default.
- **Auto-Switch Season**: La stagione successiva ("26-27") deve subentrare e popolarsi in tendina automaticamente (trigger a Febbraio di ogni anno per le stagioni venture).
- **Master Table Date Strategiche**: Durante la programmazione delle date, le righe di base o di esempio della griglia in UI *non* devono sparire al primo input dell'utente.
- **Overlap Card Rigoroso**: Le card di **tutte** le attività in calendario (non limitate ai corsi) non devono assolutamente subire overlap e sovrapposizione visiva, né restringersi in larghezza senza motivo spaziale verificato.

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
  - Verranno copiati ESCLUSIVAMENTE questi 5 metadati: **Genere (Nome Corso), Insegnante, Giorno, Orario, Studio**.
  - **NON** verranno copiati gli iscritti. Lo stack partirà da zero, limitando il bleed.
  - L'interfaccia UI esporrà una lista con **checkbox a multi-selezione funzionante**, controllata da un macro-pulsante **"Duplica selezionati"**, per eseguire in un solo colpo il porting massivo dei corsi verso l'anno sportivo imminente.

## 3. Layout Dinamico "Sliding" Settimanale
- **Obiettivo:** Creare un'infrastruttura visiva fluida e reattiva alla componente temporale continua.
- **Logica Architetturale:**
  - Sostituire la griglia rigida mensile/giornaliera pura con un carosello temporale (sliding).
  - Integrazione con l'algoritmo già sviluppato nell'Engine STI (che sfrutta `ResizeObserver` per l'altezza dinamica): le ore scorreranno fluidamente sull'asse orizzontale o verticale calcolate tramite `Temporal` o date-fns.

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
