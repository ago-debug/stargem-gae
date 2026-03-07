# Analisi di Compatibilità: Database SaaS vs. Interfaccia Grafica Attuale

> [!TIP] 
> **Scopo di questo documento**
> Questo file è il **Ponte Architetturale Frontend-Backend (Fase 3)**. Spiega tecnicamente come risolvere il problema più grande del Refactoring: *come fa la UI attuale a disegnare ancora 12 interfacce visive bellissime e diverse, se nel Database esisterà una sola tabella universale cieca?* Illustra la strategia "Forms-as-Data" (JSON Driven UI) e come le Categorie istruiranno il rendering dei componenti in React.

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
