# STATO LAVORI PER SEZIONE (Project CourseManager)
**Aggiornato al:** 25 Marzo 2026

Questo documento fotografa in modo pragmatico e verticale lo stato di ogni macro-area del progetto, fungendo da bussola per gli sviluppatori e la direzione tecnica sullo stato di collaudo e di priorità delle singole sezioni. 

---

## 1. Calendario Attività
**Stato Attuale:** 🟡 IN CORSO / [UI FREEZE]
**Sintesi:** Il calendario è stato connesso con successo al Bridge STI in ottica "Data-Aware" e sfoggia un *Recurrence Engine* settimanale che unrolla i corsi su date reali. 
* **Cosa è già stato fatto:** Passaggio completato da API legacy frammentate a un'unica vista API ibrida `activities-unified-preview`.
* **Cosa manca:** *Risoluzione dei Metadati UI.* Il passaggio al mapper API ha snellito i dati ma "perso" i join SQL per i Nomi Categoria, Istruttori e Colori dinamici. Le card del calendario lo hanno accusato visivamente.
* **Rischi / Attenzioni:** **[UI CONGELATA]**: Nessuna operazione di abbellimento estetico deve essere eseguita fino al popolamento delle anagrafiche mancanti dal Bridge (InstructorName, CategoryName).
* **Prossimo Step Consigliato:** Iniettare le chiavi mancanti sul bridge per riportare la massima espressione estetica originale alle card del calendario.

---

## 2. Anagrafica / Maschera Input
**Stato Attuale:** 🟢 CHIUSO (Area V1) / 🟡 AUDIT ESEGUITO (Per V2)
**Sintesi:** La "Maschera Input" è stabilmente concepita come l'unica e formale Dashboard utente. 
* **Cosa è già stato fatto:** Eseguito un profondo **Audit Tecnico** del file `maschera-input-generale.tsx` (4300 righe). Identificata la rotta di refactoring per spezzare in componenti asincroni Allegati, Contabilità, e UI "Prove/Lezioni". Sostituiti tutti i legacy fallback text con Combobox (`useCustomList`).
* **Cosa manca:** Attuazione dello spacchettamento React in V2. Smantellamento visivo dei tabs "Prove Gratuite/Lezioni Singole" a favore di un unico Enrollment picker.
* **Rischi / Attenzioni:** File colossale e letale se si altera l'ordine di chiamata dei vari hook `useQuery` o le rules. **Non toccato nel codice di runtime corrente**.
* **Prossimo Step Consigliato:** Nessuno strategico immediato. Prima consolidare il core backend per l'appoggio dei pagamenti.

---

## 3. Attività di marketing / CRM interno
**Stato Attuale:** 🔵 CONGELATO (In attesa Dati Reali)
**Sintesi:** Il motore CRM integrativo è stato eretto per la segmentazione VIP. Frontend e Backend comunicano impeccabilmente ma il set di dati storici del database per le validazioni non è idoneo a restituire valutazioni logiche.
* **Cosa è già stato fatto:** Rinominata sezione UI esplicitamente in "Attività di marketing". Popolato Modale di forzatura eccezionale integrando spiegazione fattori (Spesa, Freq, Att, Recency). Astratto il file core `crm-config.ts` per scalare a base 100 il punteggio automatico Silver, Gold, Platinum e Diamond. **La UI e i modali rispettano ora la distinzione tassativa: `livello` = livello tecnico del corso (Base, Intermedio), `livello_crm` = livello CRM interno di marketing (Silver, Gold). Ogni sovrapposizione testuale o logica è stata abolita.**
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
**Stato Attuale:** 🟢 13 su 13 CENSITE E OPERATIVE
**Sintesi:** Il nucleo operativo delle 13 Attività è stato interamente mappato e revisionato, offrendo livelli diversi di maturità architetturale.
* **Cosa è già stato fatto:** 
  - **Corsi, Workshop**: Gestiti nativamente dal `CourseUnifiedModal` con Iscritti/Presenze in tempo reale.
  - **Lezioni Individuali, Allenamenti, Campus, Domeniche, Saggi, Vacanze**: Fully-managed dal polimorfico `ActivityOperationalModal` / `activity-management-page.tsx`.
  - **Affitti**: Isolati tramite modulo blindato e Listino dedicato.
  - **Prove Gratuite, Prove a Pagamento, Lezioni Singole**: I 3 vecchi silos frammentati sono stati definitivamente smantellati come tabelle indipendenti. Sono ora processati dalla *Maschera Input / Modulo Iscrizioni* globale che scrive un record `enrollments` specializzato valorizzando `participationType` e `targetDate`. Niente dati orfani o form finti, 100% integrità backend.
  - **Eventi Esterni**: Rimosso dalla griglia operativa, relegato a Setup tecnico configurativo.
  - **Planning Strategico**: Modulo connesso a DB (`strategic_events`), validato End-to-End con CRUD reale e render visuale sul calendario annuale. Nessun bug bloccante emerso nel collaudo E2E eseguito su Planning e smoke test Attività.
* **Cosa manca:** Nessun modulo bloccato nell’area Attività, ma restano collaudi e rifiniture sui casi edge (es. scaling della UI, concurrency, validazioni secondarie). La base REST, UI React e MySQL è sincronizzata costantemente sull'obiettivo primario.
* **Rischi / Attenzioni:** Tassativo non ricreare mai tabelle isolate per le "prove" fisiche di un'attività. Appoggiarsi costantemente alla factory universale `enrollments` con il suo Type.
* **Prossimo Step Consigliato:** Promuovere il modulo ai test QA di integrazione estesi, spostando lo sviluppo puro sulla Maschera Input / Carrello Pagamenti.

---

## 7. Clarissa CRM esterno
**Stato Attuale:** 🔵 CONGELATO (Piano di Fase 2 Futuro)
**Sintesi:** L'applicativo SAAS esterno di Email Marketing/Pipelines per le agenzie. Piano strategico studiato ma rimandato come appendice al prodotto stabile.
* **Cosa è già stato fatto:** Scritto integralmente e blasonato come Fase Strategica 2 (`14_GAE_Strategic_Plan_Clarissa_CRM.md`). Dedotto Studio Gem come Master Unidirezionale per contatti, escludendo collisioni critiche su pagamenti e doppioni.
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
**Stato Attuale:** 🟡 TRANSIZIONE STI (Shadow Mode / Bridge)
**Sintesi:** La visione futura SOA/Single Table Inheritance sta progressivamente fagocitando le 11 tabelle frammentate. Il database è ancora fisicamente identico e protetto.
* **Cosa è già stato fatto:** 
  - **Fase 2 (Shadow Tables):** Create `activities_unified` ed `enrollments_unified`.
  - **Fase 3 (Read-Only Bridge):** Costruita la prima factory API (`unifiedBridge.ts`) che fonde e unifica in memoria i records derivanti dai Silos prima di darli in pasto al frontend. Nessun dual write inserito.
  - **Fase 4 (Calendar Switch):** Switchato la view interattiva frontale al layer Bridge senza alterare il form di aggiunta legacy.
* **Cosa manca:** Testing massivo e Iniezione Anagrafiche per far superare la Fase 5 e approdare felicemente al cut-over del Modale Pagamenti (Cassa Unificata).
* **Rischi / Attenzioni:** Il bridge read-only bypassa i join storici frontend-centrici. Attenzione alle label perse.
* **Prossimo Step Consigliato:** Refinire il Bridge Backend e programmare il Data-Pump asincrono per l'allineamento.
