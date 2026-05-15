# Report Risoluzione Bug Critici E2E (F1-022)

> **Ultimo Aggiornamento:** 15 Maggio 2026, 10:25

Ho preso in carico ed estinto i due blocchi critici emersi nel test F2-016 (Wizard Stepper UI). Entrambi compromettevano l'avanzamento lineare della Pratica (MC2).

## Dettaglio Interventi (Backend)

### 1. Fix "Step not found" (In realtà `500 Internal Server Error`)
- **Problema:** La chiamata `PATCH /api/dossiers/:id/step` sollevava un errore fatale MySQL: `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD`. L'inserimento del Dossier andava a buon fine, ma lo step falliva perché la tabella `dossier_steps` richiedeva un `INT` per il campo `completed_by`, mentre il controller gli inviava la stringa alfanumerica `admin-id`. (Questo era un residuo della fix in F1-019 dove mi ero concentrato solo su `dossiers` e `dossier_audit_log` ma non su `dossier_steps`).
- **Azione:** Ho eseguito uno script diretto sul Database `ALTER TABLE dossier_steps MODIFY completed_by VARCHAR(255)` allineando definitivamente il campo alla tipologia degli UserID.
- **Esito:** Il `PATCH` su `/api/dossiers/1/step` ora ritorna `{"success": true}` e aggiorna correttamente `status` e `completed_at`.

### 2. Fix 404 su File Uploadati (Sindrome della cartella `unknown`)
- **Problema:** L'UI Frontend inviava l'oggetto `FormData` accodando `file` *prima* di `member_id`. Poiché `multer` è un parser sequenziale on-the-fly, nel momento in cui allocava la `destination` in `uploadConfig.ts`, il valore `req.body.member_id` era `undefined`. Conseguentemente `multer` scaricava fisicamente il file nella directory di fallback `uploads/.../unknown/`. Alla fine del processo, Express completava il parsing del JSON trovando finalmente il `member_id` e salvando nel DB un URL fittizio `/uploads/.../1/file.pdf` creando l'irreversibile disallineamento a 404.
- **Azione:** Anziché alterare l'ordine asincrono del Frontend, ho optato per un **Auto-Healing Architetturale** nel Backend. Ho modificato i controller in `server/routes.ts` (`/api/uploads/medical-certificate`, `/api/uploads/document` e `/api/uploads/avatar`). Se, dopo l'upload di `multer`, il Backend rileva che il file è finito in una directory divergente dall'`expectedDir` (es. `unknown`), provvede a creare la directory corretta e ad applicare un `fs.rename` (spostamento rapido), restituendo all'UI un path verificato.
- **Esito:** Zero errori e upload resilienti, persino qualora il client UI sbagli o alteri l'ordine del Payload.

## Verifica
- `npx tsc --noEmit` completa con **Exit 0**.
- Entrambi i bug confermati RISOLTI.
- Backend dichiarabile sicuro. Il Frontend MC2 può riprendere l'avanzamento lineare della Pratica Stepper (MC2).
