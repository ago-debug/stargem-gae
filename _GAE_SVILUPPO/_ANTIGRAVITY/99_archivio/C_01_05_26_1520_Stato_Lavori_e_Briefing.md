Aggiornato al: 2026-04-30 19:14

# STATO LAVORI E BRIEFING TECNICO OPERATIVO

> **Ultimo Aggiornamento:** 01 Maggio 2026, 15:20

Questo documento fotografa lo stato di collaudo e di priorità delle singole sezioni al termine della pulizia chirurgica del Database di fine Aprile (Fase di Consolidamento).

---

## 1. Calendario Attività
**Stato Attuale:** 🟡 IN CORSO / [UI FREEZE]
**Sintesi:** Connesso al Bridge STI in ottica "Data-Aware" e Recurrence Engine settimanale completo.
**Manca:** Risoluzione Metadati UI (InstructorName, CategoryName) da reinserire nel bridge API per visualizzazione ottimale delle card. Da collaudare comportamenti estremi e sovrapposizioni.

## 2. Maschera Input / Anagrafica
**Stato Attuale:** 🟢 CHIUSO (Area V1) / 🟡 AUDIT ESEGUITO (Per V2)
**Sintesi:** Sostituiti fallback text con Combobox (`useCustomList`). In V2 dovrà essere implementato lo spacchettamento React in componenti asincroni (Allegati, Contabilità, ecc). Attualmente non toccato in runtime.

## 3. Pagamenti / Cassa
**Stato Attuale:** 🔴 SENSIBILE / NON TOCCARE
**Sintesi:** Componente che garantisce la stabilità di bilancio. Unificata la modale Cassa. Qualsiasi alterazione in `PaymentModuleConnector` si ripercuote su oltre 14 route. Non modificare salvo ticket isolati.

## 4. Tessere
**Stato Attuale:** 🔴 SENSIBILE / NON TOCCARE
**Sintesi:** Astratta factory di calcolo stagione. Sostituito ovunque con `<Redirect>` verso modulo canonico. Tassativo collaudare l'emissione e il barcode prima dell'inizio affiliazioni ASD estive.

## 5. Attività Operative e Modali (STI)
**Stato Attuale:** 🟢 13 su 13 CENSITE E OPERATIVE
**Sintesi:** Corsi, Workshop, Prove, Lezioni gestite dai modali operativi/STI. Nessuna tabella silos separata. Il "Double-booking" e la duplicazione corsi sono controllati via UI guidata (senza vincoli stringenti nel DB per flessibilità admin).

## 6. Planning Strategico
**Stato Attuale:** 🟢 OPERATIVO
**Sintesi:** Calendario multiseason shiftato a Settembre-Agosto. Opacità visiva intelligente. Mostra Workshop/Eventi/Saggi mentre i corsi sono solo aggregati.
**Aperti:** Collaudo minuzioso dei link e dei filtri URL Query Params verso le schede di dettaglio.

## 7. Modulo HR (GemTeam & GemStaff)
**Stato Attuale:** 🟢 OPERATIVO
**Sintesi:** Shift Grid Full-Width completa, presenze/check-in attivati, Dashboard funzionante.

## 8. Sicurezza e Ruoli
**Stato Attuale:** 🟢 COMPLETATO E ATTIVO
**Sintesi:** Security by Design implementata con matrice dei 5 ruoli che oscura in tempo reale 30 sezioni UI differenti.

## 9. Area Tesserati B2C
**Stato Attuale:** 🟡 IN CORSO
**Sintesi:** Infrastruttura protetta completata (API `profile`, `documenti`, storage multer via JWT). Manca lo sviluppo React della frontend apposita (Area Tesserati) B2C.

## 10. Import Dati e Routing
**Stato Attuale:** 🟢 OPERATIVO
**Sintesi:** È stato implementato lo "Smart Routing" per QUOTATESSERA e visite mediche con validatore Algoritmo Codice Fiscale e blocco `season_id`. Previene la corruzione della tabella iscritti al root level. Manca la connessione di tali errori UI nel banner dry-run.

## 11. Modulo Chat_08_Corsi (Aggiornamento 29-30/04/2026)
**Stato Attuale:** 🟢 23 Protocolli F2 Chiusi
**Sintesi:** Chiusura massiva dei protocolli frontend per la gestione operativa e visiva delle attività.
- **F2-022**: Toggle espandi/comprimi smart unificato + dropdown stagioni calendario.
- **F2-024**: Implementazione contatori e fix schede canoniche.
- **F2-025**: Posizionamento contatore + allineamento scheda-allenamento.
- **F2-026**: 3 schede ad hoc (Domeniche, LI, Campus) con campi specifici al dominio.
- **F2-027**: Fix pagine bianche causate dalla mappatura dataflat.
- **F2-028**: Pattern anti-crash su contenitori generici (`2526ALLENAMENTO`).

### Ultimi completamenti (18:00)
- Centralizzazione UI Liste: La pagina `/elenchi` è ora il punto di verità assoluto diviso in 5 Aree Funzionali.
- Sync Etichette: Le diciture tra maschera di modifica e pannello gestione liste sono allineate per evitare confusione.
- Rimossi script throwaway e file temporanei di sessione.

### Chat_08_Corsi (29-30/04/2026)
- **Protocolli Chiusi:** 18 protocolli backend (F1) chiusi con successo.
- **Sintesi Operazioni:**
  - **F1-013-LIGHT:** Bonifica dati storici DB (DT → visita_medica).
  - **F1-015:** Sistemazione magic strings DB-coerenti e riallineamento endpoints (incluso fix filtro stagione e rimozione vecchie rotte).
  - **F1-017:** 3 fix mirati su query per calcolo numeri.
  - **F1-019:** Creazione e deploy nuovo endpoint cruscotto panoramica (`/api/dashboard/attivita-panoramica`).
  - **F1-021:** Audit strutturale e mapping campi per le 3 schede (Domenica, Lezione Individuale, Campus).
