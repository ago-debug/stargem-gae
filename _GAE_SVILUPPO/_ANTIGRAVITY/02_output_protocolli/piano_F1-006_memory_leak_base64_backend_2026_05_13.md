---
aggiornato: 2026-05-13T18:29
ultima_verifica_vs_codice: 2026-05-13T18:29
validita_prevista: 14 giorni
link_audit: "[[audit_F1-004_flusso_iscrizioni_backend_2026_05_12.md]]"
link_frontend: "[[piano_F2-004_memory_leak_base64_frontend_2026_05_13]]"
---

# 🛑 PIANO F1-006: Refactor Memory Leak Base64 (BACKEND)

**TL;DR:** Il backend attualmente collassa perché ingerisce, salva e ritrasmette in chiaro decine di MB di stringhe Base64 (PDF medici e foto avatar) attraverso JSON in chiaro (`attachmentMetadata` e `photoUrl`). Questo impatta pesantemente le performance di *tutti* gli endpoint CRUD sui members (in primis `GET /api/members` e la GemTeam). Il piano di refactoring prevede l'estrazione fisica su file-system/S3 con upload `multipart/form-data`, salvando nel DB solo i path/UUID (peso < 1KB per utente).

### 🚦 DECISIONI DI PRODOTTO PER GAETANO (Azione Richiesta)

1. **Storage: Filesystem VPS vs Storage Esterno?**
   - *Scelta A:* Cartella statica `/uploads` locale nel server (più veloce da fare, meno costi, ma rende il server "stateful" e appesantisce i backup).
   - *Scelta B:* S3 bucket (AWS/Cloudflare R2/IONOS S3) o Cloudinary (Più scalabile, serverless-friendly, altamente raccomandato per i PDF medici).
2. **Migration dati esistenti: Bulk vs Lazy?**
   - *Bulk (Raccomandata):* Script one-shot notturno che estrae tutto il Base64 esistente nel DB, scrive i file ed esegue un mass-update delle colonne a NULL sostituendole coi percorsi.
   - *Lazy:* Lasciare il Base64 vecchio com'è, gestendo il mapping a runtime, finché l'utente non lo ri-salva (scelta molto "sporca", sconsigliata).
3. **Sicurezza Accesso File (GET `/uploads/*`):**
   - Vogliamo servire i certificati medici nudi e crudi dal proxy web (es. Nginx statics) oppure passarli tramite un endpoint NodeJS (es. `GET /api/files/:uuid`) che controlla prima `req.isAuthenticated()`? I certificati contengono dati sanitari (GDPR). La via protetta tramite Auth NodeJS è strettamente raccomandata.

---

## 1. Censimento Endpoint Coinvolti (Base64 Handling)

| Endpoint | Ruolo e Impatto |
| :--- | :--- |
| `GET /api/members` | **Critico.** Ritorna tutto l'elenco utenti. Attualmente include il JSON nativo `attachmentMetadata` e le pesanti `photoUrl`. Provoca OOM (Out of Memory) Node.js su grossi tenant. |
| `POST /api/maschera-generale/save` | **Ingresso principale.** Accetta il JSON colossale inviato dal frontend e lo inietta in DB tramite le primitive `storage.createMember` e `storage.updateMember`. |
| `PATCH /api/members/:id` | **Aggiornamento.** Consente l'aggiornamento spot dell'avatar, ricevendo una DataURL da centinaia di KB. |
| `GET /api/gemteam/dipendenti` | **Critico.** L'endpoint aggrega le presenze ma effettua una subquery/join su `members`, portandosi dietro le pesanti `photoUrl` caricate. |

*(Nota: L'endpoint `POST /api/medical-certificates` salva solo i metadati e non il file crudo).*

## 2. Censimento DB e Colonne Infette

- **Tabella `members`**:
  - `photoUrl` (tipo `text` MySQL): Usato per salvare il Base64 dell'avatar dell'allievo.
  - `attachmentMetadata` (tipo `json`): JSON nativo che purtroppo viene popolato da un array contenente i buffer codificati Base64 dei certificati/privacy generati dal componente `TabAllegati.tsx` (come visto in F2-004).

*Esito interrogazione locale:* Nel DB dev/tunnel sono state rilevate foto per un totale di `~0.54 MB` (su 92 record fittizi). Non sono stimabili i danni in Produzione senza lanciare lo script sull'ambiente target, ma l'OOM suggerisce giga di rallentamenti nel tempo.

## 3. Architettura Target Proposta (Allineata a F2-004)

- **Ingresso:** Un nuovo orchestratore `POST /api/uploads/media` basato su `multer` o `formidable` che processa payload `multipart/form-data`.
- **Rinominazione File:** Ogni file riceve un UUID (es. `550e8400-e29b-41d4-a716-446655440000.pdf`) scollegato dal nome originale.
- **Ritorno:** L'API Upload restituisce al frontend `{ url: "/api/files/cert/uuid.pdf" }`.
- **Salvataggio DB:** Frontend chiama `POST /api/maschera-generale/save` inviando `{ attachmentMetadata: { url: "/api/files..." }}`.
- **Consultazione:** Endpoint `GET /api/files/:type/:uuid` che esegue `isAuthenticated()` e manda lo stream via `res.sendFile()`.

## 4. Stima Tempi e Sotto-Step Backend (TOT: ~5.5 h)

| Step | Descrizione | Effort |
| :--- | :--- | :--- |
| **Step 1** | Implementazione `POST /api/uploads/*` con parser Multer. | 1.0 h |
| **Step 2** | Implementazione `GET /api/files/*` con GDPR Auth checks. | 1.0 h |
| **Step 3** | Refactoring logiche `maschera-generale` per tagliare fuori i blob e prevenire insert Base64 via check Zod Validator. | 1.0 h |
| **Step 4** | Refactoring Query Drizzle (es. `GET /api/members` e GemTeam) per mappare/selezionare le URL corrette. | 1.0 h |
| **Step 5** | Script Cron notturno (Node) per il cleanup dei file orfani (caricati ma mai agganciati all'utente finale). | 0.5 h |
| **Step 6** | Script Bulk Migration: Decodifica record legacy e creazione file statici a retroattività. | 1.0 h |

## 5. Impatto Frontend Richiesto

La Fase 2 frontend (come da piano `piano_F2-004`) subirà un cambio drastico:
- `TabAllegati.tsx` dovrà sostituire l'API di `FileReader.readAsDataURL` inviando invece richieste fetch `FormData`.
- I componenti UI (Avatar in alto a dx, Tessere, Scheda Anagrafica) che renderizzano `<img src={...}>` si aspetteranno un link standard e non più una stringa gigante, risultando in un rendering del DOM infinitamente più rapido (Browser Cache automatica).
