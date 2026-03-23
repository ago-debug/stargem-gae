# STATO LAVORI PER SEZIONE (Project CourseManager)
**Aggiornato al:** 23 Marzo 2026

Questo documento fotografa in modo pragmatico e verticale lo stato di ogni macro-area del progetto, fungendo da bussola per gli sviluppatori e la direzione tecnica sullo stato di collaudo e di priorità delle singole sezioni. 

---

## 1. Calendario Attività
**Stato Attuale:** 🟡 IN CORSO / COLLAUDO
**Sintesi:** Il calendario base "hub" ha subìto pesanti refactoring per rimuovere le limitazioni UI, sistemare i link doppi, e aggregare dinamicamente le 14 macro-categorie in un'unica griglia con un modale centralizzato. Abbiamo rifinito l'estetica generale superando i collapse text.
* **Cosa è già stato fatto:** Eliminati radicalmente crash JS ("White Screen of Death") sui parsing ISO. Introdotto deep linking disaccoppiato (click su card vs click su matita edit). Aggiunti filtri a tendina verificati. Codici colore backend interpolati staticamente.
* **Cosa manca:** Testing massivo sul campo da parte della segreteria (Stress/Edge Cases). Validazione sui timezone reali client-side per orari atipici.
* **Rischi / Attenzioni:** Render engine delicato. Aggiungere hooks pesanti causerà micro-lag nello scorrimento mensile/settimanale.
* **Prossimo Step Consigliato:** Cedere il layer alla Segreteria e collaudare operativamente in live, correggendo feedback mirati; estendere i flussi CRUD Campus/Domeniche.

---

## 2. Anagrafica / Maschera Input
**Stato Attuale:** 🟢 CHIUSO
**Sintesi:** La "Maschera Input" è stabilmente concepita come l'unica e formale Dashboard utente (la scheda partecipante autentica a 360°), consolidando ogni operazione di back-office.
* **Cosa è già stato fatto:** Ricablati tutti i path per far atterrare l'utenza su `/maschera-input?memberId=X` partendo da griglie e elenchi (`members.tsx`). Tutte le appendici come iscritti, allegati, marketing e pagamenti giacciono ordinate in sezioni chiudibili/visibili full-width. **Completata la rimozione the fallback testuali (es: Livelli CRM e Canali di acquisizione), interamente sostituiti da `<Combobox>` alimentate nativamente dagli Elenchi server, dotate di funzione Quick-Add.**
* **Cosa manca:** Rifiniture minori future per documentazione fiscale PDF.
* **Rischi / Attenzioni:** Form React di dimensioni colossali che ingloba molte `mutations` concomitanti. Bisogna vigilare sui form state e sui re-render indesiderati al salvataggio.
* **Prossimo Step Consigliato:** Nessuno strategico. L'UX è aderente alle aspettative. Non toccare.

---

## 3. Attività di marketing / CRM interno
**Stato Attuale:** 🔵 CONGELATO (In attesa Dati Reali)
**Sintesi:** Il motore CRM integrativo è stato eretto per la segmentazione VIP. Frontend e Backend comunicano impeccabilmente ma il set di dati storici del database per le validazioni non è idoneo a restituire valutazioni logiche.
* **Cosa è già stato fatto:** Rinominata sezione UI esplicitamente in "Attività di marketing". Popolato Modale di forzatura eccezionale integrando spiegazione fattori (Spesa, Freq, Att, Recency). Astratto il file core `crm-config.ts` per scalare a base 100 il punteggio automatico Silver, Gold, Platinum e Diamond. **I livelli manuali risiedono ora nell'ecosistema Elenchi come System Custom List `livello_crm`.**
* **Cosa manca:** Validazione "Business" in Real Life. Senza storico solido pagamenti le automazioni assegneranno forzosamente e falsamente `Silver` quasi a tuta la sandbox.
* **Rischi / Attenzioni:** Evitare di assumere i rank automatici locali come validi: le regole imposte sono alte (es. Spesa 1500) impossibili da colpire senza dataset maturo.
* **Prossimo Step Consigliato:** Scaricare o macinare dal vero server live i `payments`. Affinare le tolleranze delle soglie di `crm-config.ts`. Scongelare.

---

## 4. Pagamenti / Cassa
**Stato Attuale:** 🔴 SENSIBILE / NON TOCCARE
**Sintesi:** Nucleo nevralgico transazionale. Custodisce le regole d'incasso. Componente che deve garantire la stabilità di bilancio su qualsiasi click imposto.
* **Cosa è già stato fatto:** Unificato il componente modale Cassa. Resi gli importi vincolati ai listini. Inserita la blindatura "PIN Manager" se forzati custom. Iniettata la tolleranza "Controllo Orfano": un incasso viene annullato/disabilitato se non ha una riga FK attività a cui appoggiarsi.
* **Cosa manca:** Sviluppo avanzato storni parziali. Ecosistema Note di Credito formalizzate.
* **Rischi / Attenzioni:** Corrompere il blocco Cassa ferma interamente la fattibilità commerciale ed infetta in cascata il modulo CRM/Score o Tessere. Qualsiasi alterazione in `PaymentModuleConnector` si ripercuote su oltre 14 route.
* **Prossimo Step Consigliato:** Non modificare il codice. Aprire ticket documentati isolati in caso di bug.

---

## 5. Tessere
**Stato Attuale:** 🔴 SENSIBILE / NON TOCCARE
**Sintesi:** Gestione burocratico/Assicurativa e Accessi della location. Altissimo peso per la compliance sportiva e l'hardware (barcode readers).
* **Cosa è già stato fatto:** Astratta factory di calcolo stagione (1 Set - 31 Ago). Standardizzate flag logiche "Nuovo/Rinnovo" stringate a backend ed interrotti gli input text manuali. Trasferita logica nel carrello Maschera Input per unicità JSON d'incasso.
* **Cosa manca:** Bridge hardware API con il lettore ottico locale. Stessa per estensioni FISC / affiliazioni governative distinte da Tessere Interne (Lounge).
* **Rischi / Attenzioni:** Disallineare emissione tessere vs pagamento o corrompere il parser barcode impedisce i varchi di sicurezza.
* **Prossimo Step Consigliato:** Area da non toccare. Collaudare emissione prima dell'inizio delle nuove affiliazioni ASD estive/autunnali.

---

## 6. Attività / modali / silos
**Stato Attuale:** 🟡 IN CORSO
**Sintesi:** Area legata intimamente al Refactor delle dropdown (Comuni/Province risolti, Categorie implementate). Consiste nel disaccoppiare logiche incrociate o nomi vecchi.
* **Cosa è già stato fatto:** Standardizzate Nomi/Etichette a UI abolendo il legacy "Corsivo". Definito che "Genere" risiede in combobox autocomplete. Categorie Custom Lists unificate. Divorse Affitti Studos da Eventi Esterni Booking in endpoints paralleli e puliti.
* **Cosa manca:** Task in Tabella Master (Blocco 5) prettamente rivolti agli step di normalizzazione campi Livello (Base, Medio, Avanzato). 
* **Rischi / Attenzioni:** L'ostentazione al refactor massiccio di Silos V1 per ricavare la Single Table Inheritance (STI) è severamente Bandita.
* **Prossimo Step Consigliato:** Finalizzare Binding del sub-modale restanti dalla mappatura audit e colpire solo difetti chiari di naming per coerenza listini.

---

## 7. Clarissa CRM esterno
**Stato Attuale:** 🔵 CONGELATO (Piano di Fase 2 Futuro)
**Sintesi:** L'applicativo SAAS esterno di Email Marketing/Pipelines per le agenzie. Piano strategico studiato ma rimandato come appendice al prodotto stabile.
* **Cosa è già stato fatto:** Scritto integralmente e blasonato come Fase Strategica 2 (`11_GAE_Strategic_Plan_Clarissa_CRM.md`). Dedotto Studio Gem come Master Unidirezionale per contatti, escludendo collisioni critiche su pagamenti e doppioni.
* **Cosa manca:** Intero blocco del codice REST ed eventuale adapter middleware / webhook reception in Node JS o trigger DB.
* **Rischi / Attenzioni:** Anticipare questo task causa sicura distrazione vitale dalle interfacce core urgenti o dai bug cassa di CourseManager primario.
* **Prossimo Step Consigliato:** Disattivato. Non è una priorità.

---

## 8. Documentazione GAE
**Stato Attuale:** 🟡 IN CORSO (Perennemente vivo)
**Sintesi:** Repositorio ufficiale delle regole aziendali, task eseguiti e linee guida architetturali. Navigatore e salvagente dell'orchestrazione AI / Sviluppatori.
* **Cosa è già stato fatto:** Approvato processo Stop & Go. Impostate mappe mentali (Route, Database, Tassonomie e Architettura) solidissime per orientarsi tra la legna. Aggiornamento manuale quotidiano su check-ins.
* **Cosa manca:** Seguirne costantemente, religiosamente i dettami negli Step successivi. 
* **Rischi / Attenzioni:** Rompere il patto Documentale significherebbe corrompere l'affidamento delle prossime sessioni di sviluppo scatenando entropia code-base.
* **Prossimo Step Consigliato:** Persistere nell'obbligo report pre e post modifica del software.

---

## 9. Architettura generale / stato progetto
**Stato Attuale:** 🔵 CONGELATO (Al layer esistente V1)
**Sintesi:** La visione futura SOA/Single Table Inheritance e unificazione globale DB V2 (`activities`, `global_enrollments`).
* **Cosa è già stato fatto:** Mockups relazionali redatti. V2 migrations proiettate su carta e modellate. Riadattamento di interfacce intermedie come Hub Calendario e Maschera Input per imitarne da vicino l'integrazione frontend V2, camuffando la persistenza V1 isolata backend.
* **Cosa manca:** Fermati. Il Refactor distruttivo su 14 Silos distrugge l'orizzonte di Rilascio Prodotto (Time-To-Market short).
* **Rischi / Attenzioni:** Creare entità chimera che tentano di scrivere via `fetch()` su API miste provocando buchi in database tra il core obsoleto ed il non finito.
* **Prossimo Step Consigliato:** Supporto continuo ai vecchi silos con focus maniacale sulla UX dei cruscotti operatore e validazione della contabilità.
