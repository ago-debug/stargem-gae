# I_Fase3_Mappatura_Iscrizioni

> **Ultimo Aggiornamento:** 03 Maggio 2026, 16:05

Questo documento certifica la conclusione dei lavori della **Fase 3: Mappatura Corsi, Iscrizioni e Ricevute (Pagamenti)**.

## SINTESI DELLE OPERAZIONI EFFETTUATE

### 1. Mappatura Corsi (Pulizia Database)
- **Azione:** Bonifica dei record storici errati all'interno della tabella `courses`.
- **Dettaglio:** Identificati ed eliminati 25 record "fantasma" che non possedevano coordinare temporali (giorno/ora) e inquinavano le UI.
- **Prevenzione:** Inserita una clausola di guardia (filter) nel `CourseDuplicationWizard` per impedire il trascinamento di dati legacy malformati nelle stagioni future.

### 2. Iscrizioni e Pacchetti "Open"
- **Azione:** Disaccoppiamento delle Iscrizioni dal Pagamento per i carnet/abbonamenti.
- **Dettaglio:** I Pacchetti (Danza, Fitness, ecc.) sono stati traslati a livello logico in Prodotti Commerciali (Tabella `promoRules` e liste `Quote`). L'iscrizione fisica al corso per l'allievo viene mappata a costo 0€, in quanto coperta dal possesso del pacchetto commerciale.
- **Knowledge Base:** Documentato il protocollo e la logica aziendale all'interno di `/knowledge-base` per l'accesso immediato da parte del Team.

### 3. Ricevute e Pagamenti (Integrazione PDF)
- **Azione:** Sblocco ed espansione della funzionalita `TabRicevute` nel CRM.
- **Dettaglio:** Creata architettura lato client (jsPDF + autoTable) per generare localmente i PDF con scarico nativo.
- **Classificazione:** Implementata una logica a 3 vie con prefisso stagionale:
  - Ricevute Istituzionali: `2526-Rxxxxxx`
  - Ricevute Semplici (Corsi/Servizi): `2526-Sxxxxxx`
  - Fatture: `2526-Fxxxxxx`
- **Output:** Intestazione ufficiale e progressivi inseriti direttamente nel modulo, agganciati alla anagrafica real-time.

**STATO DELLA FASE 3:** 🟢 COMPLETATA E COMPILATA
I dati riflettono l'architettura definitiva per la stagione 25/26.
