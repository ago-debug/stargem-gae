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
- **Comandi Emergenza:** Per leggere gli errori dal VPS via SSH, eseguire `pm2 logs stargem --lines 20 --nostream`.

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
