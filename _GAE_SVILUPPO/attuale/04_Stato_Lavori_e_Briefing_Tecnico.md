

<!-- --- INIZIO SORGENTE: attuale/08_GAE_Briefing_Tecnico_Operativo.md --- -->

# Briefing Tecnico Operativo – Stato Attuale e Priorità

## Sintesi iniziale
Il blocco principale dei lavori odierni ha riguardato il consolidamento dei moduli **Attività, Calendario e Planning**. Moltissimi interventi sono stati completati con successo lato UI e frontend (routing, rendering visivo, overlay, redirect sicuri), aggirando la necessità di riscrivere pesantemente il backend in questa fase. Sebbene la struttura sia ora stabile e aderente alle nuove direttive, restano da collaudare sul campo alcuni comportamenti critici e rifinire l'esperienza utente finale.

---

## Stato attuale per macro-area

### Infrastruttura Server e Configurazione (Agg. Phase 26)
- **VPS/Hosting:** Server IONOS indipendente, indirizzo IP `82.165.35.145`.
- **Database Produzione:** `stargem_v2` girante su MariaDB `localhost:3306` (del VPS).
- **Process Manager:** L'applicazione Node/Express è gestita da `pm2` (nome app: `stargem`) esposta internamente sulla porta `5001`.
- **Web Server:** Nginx agisce come reverse proxy configurato su `/etc/nginx/plesk.conf.d/vhosts/stargem.studio-gem.it.conf`.
- **Deploy Workflow:** Git Push → Aggiornamento su Plesk → `npm run build` → `pm2 reload stargem`.
- **Comandi Emergenza VPS:** Per leggere gli errori dal VPS via SSH, eseguire `pm2 logs stargem --lines 20 --nostream`.
- **Politica Backup Locale:** Qualsiasi snapshot del DB `stargem_v2` deve essere generato tramite l'estrazione remota via SSH (`mysqldump`) e salvato unicamente nel path `/backups` locale, regolarmente tracciato in `.gitignore`. (Ultimo Baseline: Phase 26, 7.1MB).

### A. Attività
- Il registro centrale delle attività (`ACTIVITY_REGISTRY`) è stato impostato come "Single Source of Truth".
- Le 14 attività ufficiali di dominio sono state definite e tipizzate.
- È stata raggiunta una coerenza diffusa in molte viste frontend (sidebar, dropdown, modali).
- **Note Legacy:** Il backend poggia ancora fisicamente sull'architettura a "11 silos", mascherata temporaneamente dal `unifiedEvents` in frontend per evitare refactoring massivi prematuri.

### B. Calendario Attività
- **Migliorato:** Il layout header è stato pulito, l'altezza minima dei box (min-h-[85px]) impedisce la scomparsa dei testi su corsi brevi, i colori sono solidi e il filtro attività aggancia dinamicamente il catalogo completo.
- **Da verificare/rifinire:** Comportamento esatto dell'affiancamento grafico durante le sovrapposizioni reali (tuning CSS wrap vs overflow) e reattività del rendering con molti dati.
- **Note:** La validazione anti-conflitto orario/sala e la singola modale di inserimento sono cablate ma richiedono collaudo intensivo. I link diretti alle schede devono essere provati.

### C. Planning Strategico
- **Stato:** La nuova route e la pagina dedicata (`/planning`) sono attive.
- **Logica:** Calendario Accademico shiftato su asse Settembre-Agosto.
- **Stagioni:** Supporto multiseason attivo (Anno precedente/corrente).
- **Viste:** Supportate le declinazioni Annuale, Mensile, Settimanale.
- **Da collaudare:** Passaggio esatto dei parametri URL (`?date=`) ai calendari day-by-day e testing rigoroso dei link alle entity singole degli eventi.

### D. Tessere
- **Chiuso:** Il routing nudo `/tessere` non esiste più come pagina giocabile.
- **Sicurezza:** Sostituito ovunque con `<Redirect>` restrittivo verso il modulo canonico `/tessere-certificati`.
- **Stato:** L'ecosistema di navigazione Tessere è blindato e virtualmente chiuso.

### E. Pagamenti
- **Chiuso:** Il bottone "Nuovo Pagamento" in cassa/dashboard apre correttamente la modale Overlayer dedicata, bloccando balzi di pagina indesiderati verso l'Anagrafica.
- **Allineamento:** Il carrello del Checkout (`CartTableRow`) mappa dinamicamente e supporta le 14 attività approvate.
- **Da fare:** Eseguire pagamenti reali di test per certificare le scritture incrociate.

---

## Decisioni di business già fissate

### Attività ufficiali (14 tipologie canoniche)
1. Corsi
2. Workshop
3. Prove a pagamento
4. Prove gratuite
5. Lezioni singole
6. Lezioni individuali
7. Domenica in movimento
8. Allenamenti
9. Affitti
10. Campus
11. Saggi
12. Vacanze studio
13. Eventi esterni
14. Merchandising

### Regole di visibilità e separazione
- **Calendario Attività:** Destinato *esclusivamente* alle attività operative con prenotazione di orario/spazio puntuale (Corsi, Affitti, Lezioni).
- **Planning:** Cruscotto macroscopico stagionale. Nasconde la grana dell'orario giornaliero per mostrare attività "strategiche" (Workshop, Eventi esterni, Campus, Saggi). I Corsi appaiono solo in forma aggregata.
- **Merchandising:** Vendita diretta pura (retail). Esclusa categoricamente dalle visualizzazioni tempo-dipendenti di Calendari e Planning.

---

## Punti ancora aperti da collaudare domani

1. Verificare che i link del Planning portino alle schede precise e **non** ai riepiloghi.
2. Verificare che il link aggregato "Corsi" dal Planning apra il **giorno corretto** del Calendario (via URL Query Params).
3. Verificare che nel Calendario Operativo gli eventi sovrapposti simultanei si vedano **affiancati** e mantengano un layout decente.
4. Verificare che ogni box evento mostri sempre la corretta cascata da 6 voci:
   - Orario
   - Nome corso
   - Due insegnanti
   - Stato (Attivo/Inattivo)
   - Statistiche uomo/donna
   - Codice evento
5. Verificare l'effettiva **leggibilità dei testi** neri/grigio-scuri nei box colorati su vari schermi.
6. Verificare il corretto popolamento del **filtro per attività** nel Calendario (nessuna voce vuota, selezioni funzionanti).
7. Verificare i **conflitti orari reali** (fire warning / blocco salvataggio) tentando un Double-Booking su stesso spazio + stessa fascia.
8. Verificare la bontà della **modale Planning** per inserimenti speciali (note, chiusure, ecc.).
9. Verificare la **modale Calendario** completando un flusso end-to-end senza intoppi.

---

## Priorità operative di domani

#### Priorità 1
**Collaudo reale Planning + Calendario:** Accedere e manovrare le viste, cliccare i link, testare i filtri su dati veri.

#### Priorità 2
**Rifinitura UX box evento e link:** Osservare il comportamento dei testi in situazioni estreme (corsi di 15 min, 3 insegnanti, nomi infiniti) ed aggiustare le width/truncation CSS.

#### Priorità 3
**Conflitti orari e blocco inserimento:** Scatenare crash volontari inserendo affitti abusivi o sovrapposizioni orarie.

#### Priorità 4
**Conferma chiusura Tessere + Pagamenti:** Compiere inserimenti finti e verificarne la registrazione corretta sul DB.

---

## File chiave da tenere sotto controllo

I file primari a cui il tecnico dovrà prestare attenzione per i task del giorno sono:

- `client/src/pages/calendar.tsx`
- `client/src/pages/planning.tsx`
- `client/src/components/nuovo-pagamento-modal.tsx`
- `client/src/App.tsx`
- `_GAE_SVILUPPO/GAE_Checklist_Operativa.md`
- `_GAE_SVILUPPO/attuale/02_GAE_Architettura_e_Regole.md`
- `_GAE_SVILUPPO/attuale/03_GAE_Mappa_Pagine_Database.md`
- `_GAE_SVILUPPO/attuale/4_GAE_Route_Audit_e_Stato.md`

---

## Chiusura finale
Il progetto è considerevolmente avanzato nella giornata odierna stabilizzando flussi UI complessi che prima causavano rallentamenti e perdite utente. L'applicazione non è da rifare da zero; l'infrastruttura tiene ed assorbe bene i workaround visuali in attesa dei futuri refactoring del DB. Giunti in questo punto nodale, serve un collaudo utente serio ed impietoso sulle viste modificate. Il focus di domani deve essere **esclusivamente** la stabilizzazione logica e la verifica finale in campo di questi flussi (Calendario, Planning, Modali Tesseramento/Cassa) al fine di sbloccarne la messa in opera. È imperativo evitare qualsiasi nuova estensione del perimetro finché questi punti non saranno certificati come funzionanti e immuni a deviazioni.


<!-- --- FINE SORGENTE: attuale/08_GAE_Briefing_Tecnico_Operativo.md --- -->



<!-- --- INIZIO SORGENTE: attuale/11_GAE_Stato_Lavori_Per_Sezione.md --- -->

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

## 8. Documentazione GAE e Sicurezza (Ruoli/Permessi)
**Stato Attuale:** 🟢 COMPLETATO E ATTIVO
**Sintesi:** Repositorio ufficiale delle regole aziendali, task eseguiti e linee guida architetturali. Il sistema di controllo accessi e ruoli (Security by Design) è sigillato.
* **Cosa è già stato fatto:** Impostato processo Stop & Go. Costruite le mappe mentali. **Implementata la neonata `Knowledge Base` (Matrix dei 5 Ruoli)** integrata nativamente nella UI in base alla quale le autorizzazioni della Sidebar (30 sezioni esatte) vengono oscurate in tempo reale.
* **Cosa manca:** Seguirne costantemente i dettami negli Step successivi. 
* **Rischi / Attenzioni:** Alterare l'assetto documentale o i Ruoli appena configurati significherebbe generare nuove falle di sicurezza.
* **Prossimo Step Consigliato:** Persistere nell'obbligo report pre e post modifica del software.

---

## 9. Architettura generale / stato progetto (Database STI)
**Stato Attuale:** 🟢 TRANSIZIONE STI (Refactoring Unificato Backend in Costante Avanzamento)
**Sintesi:** Tutte le preparazioni Frontend (Modali operativi unificati, Calendario multi-stagione, Sicurezza a 30 settori) sono ultimate. Il progetto è ora interamente proteso al refactoring del backend Single Table Inheritance (STI).

**Riepilogo Sessione 07-08/04/2026 (Protocollo 054):**
- 20+ bug UI/UX e di sincronizzazione RISOLTI.
- Migrazione STI completata al 90% per quanto riguarda il database core.
- Calendario con colori e categorie asincrone ✅
- Modali con titoli e label dinamiche 100% dipendenti da `activity_type` ✅
- Ricerca allievi asincrona su componenti `QuickSearch` ✅
- Color picker categorie (su `custom_list_items`) operativo ✅

**Prossimi task (Immediato Futuro):**
- **Clean-up Backend:** Rimuovere rotte API silos obsolete da `routes.ts`.
- **Clean-up Storage:** Rimuovere metodi Drizzle legacy da `storage.ts`.
- **Clean-up DB:** Eseguire fisicamente i DROP delle tabelle vuote o migrate (es. `trainings`, `individual_lessons`, `campus_activities`).
- **Fix B037:** Allievo non persiste nell'aggiornamento UI backend.
- **Fix B040:** Label fallace (iscritti per attività riporta 0 a visivo su tabelle unificate).


