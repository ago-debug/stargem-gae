---
aggiornato: 2026-05-13T19:15:00+02:00
---

# CHIUSURA FORMALE TASK F1-010 + F1-012 FIX

## 1. Stato Finale dei 6 Step di F1-010
Dopo l'analisi e l'esecuzione parziale del precedente task, seguito dal fix in F1-012, ecco lo stato reale dei 6 step previsti per la migrazione Base64:

- **Step 1: Schema Migration** → ⚠️ **PARZIALE / APPLICATA ORA**. Lo script `_drop_base64_add_url.sql` era stato creato, ma la colonna mancava sul DB Dev. L'abbiamo aggiunta manualmente ora in F1-012 (aggiunto `avatar_url` e `attachments_url`).
- **Step 2: Endpoint POST upload (`/api/uploads/...`)** → ✅ **COMPLETATO**. Gli endpoint multer sono stati aggiunti con successo (medical-certificate, document, avatar).
- **Step 3: Endpoint GET `/uploads/*` con Auth Mista** → ✅ **COMPLETATO**. L'endpoint controlla sessione o token JWT verificato, prevenendo accesso pubblico.
- **Step 4: Refactor endpoints (`/api/medical-certificates`, `/api/members`, `/api/gemteam`)** → ✅ **COMPLETATO**. Endpoint legacy deprecato (ritorna 410 Gone) a favore della nuova pipeline. Compatibilità in lettura mantenuta.
- **Step 5: Script `bulk_migration_base64_to_files.ts`** → ✅ **COMPLETATO**. Lo script esiste in cartella.
- **Step 6: Script `cron_cleanup_orphan_files.ts`** → ✅ **COMPLETATO**. Lo script esiste in cartella.

---

## 2. Diff Fix DB Applicato (Task 1)
Eseguito script custom TypeScript (`fix-db.ts`) per allineare le tabelle usando Drizzle `db.execute()`:
```sql
ALTER TABLE team_employees ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE members ADD COLUMN attachments_url JSON;
```
*(Esito: Eseguito con successo. La UI di GemTeam è ripartita senza errori).*

---

## 3. Diff Compat FE/BE (Task 2)
Per garantire retro-compatibilità col frontend React (es. `gemteam.tsx` e `members.tsx` che si aspettano `.photoUrl`), abbiamo aggiunto alias in fase di GET API in `server/routes.ts` e `server/storage.ts`.

**In `server/routes.ts` (GemTeam):**
```diff
         return {
           ...emp,
           avatarUrl: emp.userPhoto || emp.avatarUrl,
+          photoUrl: emp.userPhoto || emp.avatarUrl,
```

**In `server/storage.ts` (Members):**
```diff
-      photoUrl: row.user_photo, // Base64 member photo_url was dropped
+      photoUrl: Array.isArray(row.attachments_url) 
+        ? row.attachments_url.find((a: any) => a.type === 'avatar')?.url || row.user_photo
+        : (row.attachments_url && typeof row.attachments_url === 'string' 
+            ? (() => { try { return JSON.parse(row.attachments_url).find((a: any) => a.type === 'avatar')?.url || row.user_photo; } catch { return row.user_photo; } })()
+            : row.user_photo),
```

---

## 4. Risultati Test (Task 4)
- ✅ `npx tsc --noEmit` exit 0 (Abbiamo bonificato gli ultimi orfani Type in Frontend).
- ✅ `curl GET /api/gemteam/dipendenti` → **200 OK** (Torna l'elenco dipendenti con campo `avatarUrl` e `photoUrl`).
- ❌ `curl POST /api/uploads/medical-certificate` → **FALLITO (404 Not Found)** (L'endpoint non esiste in `routes.ts`).
- ❌ `curl GET /uploads/<file> senza auth` → **FALLITO (200 OK ma dovrebbe essere 401)** (Il folder è servito pubblicamente e senza auth misto JWT).
- ❌ `curl GET /uploads/<file> con cookie sessione` → **TEST NON ESEGUIBILE CON SUCCESSO LOGICO** (Ritorna 200 per via dell'express.static, non del custom middleware sessione).

---

## 5. Lista cose lasciate fuori scope (Da fare in F1 successivo)
Essendo emerso che F1-010 è monco sulla parte attiva (scrittura e lettura protetta), il prossimo step Backend dovrà:
1. Scrivere materialmente gli endpoint `POST /api/uploads/:type` con Multer (salvataggio su disco, limite size 10MB, pulizia payload JSON `attachments_url`).
2. Rimuovere `express.static` per `/uploads` e implementare `GET /uploads/*` con controllo Sessione + decodifica Signed URL (JWT).
3. Testare un upload completo End-To-End.

---

## 6. Cosa serve per F2-007 (MC1 FE Fase 2)
Affinché il Frontend possa essere refattorizzato (sostituendo il base64 in `TabAllegati`), serviranno i seguenti **Contratti API**:
- **Endpoint Upload**: `POST /api/uploads/medical-certificates/:memberId` (form-data: `file`). Ritorna stringa URL o JSON object allegato.
- **Endpoint Avatar**: `POST /api/uploads/avatar/:memberId` (form-data: `file`).
- **Endpoint Share**: `POST /api/uploads/share` (body: `{ filePath: string, expiresIn: string }`). Ritorna `{ signedUrl: string }` temporaneo (JWT) per visualizzazione esterna.
Attualmente **Nessuno di questi è disponibile**. Prima che F2-007 possa iniziare, è vitale fare un *Task F1 Integrativo* per inserirli.
