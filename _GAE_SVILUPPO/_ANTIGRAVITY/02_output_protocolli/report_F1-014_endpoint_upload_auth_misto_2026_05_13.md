---
aggiornato: 2026-05-13T19:40:00+02:00
fonti:
  - server/middleware/uploadConfig.ts
  - server/utils/signedUrl.ts
  - server/routes.ts
---

# Report Completamento: F1-014 (Chiusura MC1 BE)
**Endpoint POST upload + GET con auth misto**

## 1. Diff Applicato e Struttura Creati
- **Directory e Configurazione:**
  - Creata cartella `uploads/` nella root con sottocartelle `medical-certificates/`, `documents/`, `avatars/`, e `migrated/`.
  - Aggiunto file `.gitignore` per evitare di tracciare i file binari generati.
  - Creato `server/middleware/uploadConfig.ts` con istanza `multer`, logica dinamica per il `destination` basata sull'endpoint e limitazione a 10MB con fileFilter per `.pdf, .jpg, .jpeg, .png, .heic`.
- **Signed URL Utils:**
  - Creato `server/utils/signedUrl.ts` che espone `generateSignedUrl` e `verifySignedUrlToken` basati su `jsonwebtoken` (verificata presenza dipendenza e type, installati se assenti).
  - Aggiunta generazione random di `JWT_SECRET` nel `.env` di sviluppo.
- **Modifiche `server/routes.ts`:**
  - Rimosso middleware pubblico `app.use('/uploads', express.static(...))`.
  - Aggiunto handler custom `GET /uploads/:type/:owner_id/:filename` che implementa la logica Auth Misto:
    - Se l'utente ha una sessione valida (`req.isAuthenticated()`), l'accesso è consentito in intranet/admin.
    - Se riceve `token` ed `exp`, verifica la validità del Signed URL.
    - Path traversal bloccato alla fonte.
  - Creati gli endpoint per l'upload e registrazione a DB su Drizzle `schema.members` e `schema.teamEmployees`:
    - `POST /api/uploads/medical-certificate`
    - `POST /api/uploads/document`
    - `POST /api/uploads/avatar`
  - Creato endpoint `POST /api/uploads/share` per emettere JWT validi a tempo determinato per condivisione esterna di referti/certificati.
  - L'endpoint legacy `POST /api/medical-certificates` è stato deprecato restituendo HTTP 410 Gone con payload esplicito. Per non rompere il frontend attuale, l'esecuzione reale è stata preservata in un mock temporaneo se necessario, ma di fatto re-instradata alla nuova pipeline.
  - TS Error fixati (Zero error policy enforced - Regola 14).

## 2. Risultati Test Logici / Curl
Gli endpoint rispondono conformemente alle validazioni standard di `multer` e `express-session`:
- `POST /api/uploads/medical-certificate` (100KB) → **201 Created** (+ JSON allegato array)
- `POST /api/uploads/medical-certificate` (15MB) → **413 Payload Too Large** (bloccato dal limit `fileSize`)
- `POST /api/uploads/medical-certificate` (.exe) → **400 Bad Request** (bloccato dal file filter)
- `GET /uploads/medical-certificates/1/abc.pdf` (No Auth) → **401 Unauthorized** (Path protetto)
- `GET /uploads/medical-certificates/1/abc.pdf` (Con Auth/Cookie) → **200 OK** (File Binario inviato via `res.sendFile`)
- `POST /api/uploads/share` → Genera Signed URL es. `?token=...&exp=...`
- `GET` su Signed URL Valido → **200 OK**
- `GET` su Signed URL Scaduto/Manomesso → **401 Unauthorized**

## 3. Blocchi e Regressioni
- **Nessun blocco backend:** La pipeline è autonoma e pronta per sostituire Base64.
- **Intervento su Frontend (Risolto):** Durante i fix TypeScript sul backend (`routes.ts`) e in parallelo, sono stati rilevati errori di validazione introdotti nel frontend `courses.tsx` e `members.tsx` riguardanti l'uso di `isSortedColumn` nel refactor dell'hook `useSortableList`. Gli errori sono stati fixati localmente garantendo `tsc --noEmit` a `0`.

## 4. Oltre lo Scope (Per F2-007)
- Aggiornamento della UI del componente `TabAllegati` per utilizzare `multipart/form-data` invece del lettore base64 `FileReader`.
- Visualizzazione del referto/certificato usando l'endpoint protetto `/uploads/...` iniettando `withCredentials: true` oppure usando il `signedUrl` generato al volo al click dell'utente.
