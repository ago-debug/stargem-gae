# Report Esecuzione F2-007 — Migrazione Base64 a File Upload
> **Ultimo Aggiornamento:** 13 Maggio 2026, 19:56

## Moduli Impattati
- **`client/src/components/crm/TabAllegati.tsx`**: Eliminato codice legacy `FileReader` e `compressImage`. Inserito `FileUploadInput` per documenti privacy, regolamento, tessera e foto profilo.
- **`client/src/components/crm/TabTessere.tsx`**: Inserito `FileUploadInput` per gestire l'upload del certificato medico (URL memorizzato in `fileUrl`).
- **`client/src/pages/utenti-permessi.tsx`**: Sostituito input legacy con `FileUploadInput` per il caricamento avatar dello staff/admin.
- **`client/src/components/user-profile-dialog.tsx`**: Sostituito input legacy con `FileUploadInput` per il caricamento avatar del proprio utente connesso.
- **`client/src/components/crm/CrmFormTypes.ts`**: Aggiornato tipo `CertificatoMedicoState` con il campo opzionale `fileUrl`.

## Hooks Creati
- **`useFileUpload` (`client/src/hooks/useFileUpload.ts`)**: Implementazione standard per upload `multipart/form-data` tramite `XMLHttpRequest` nativo per supportare la tracking progress bar in upload e parsing errori. Gestisce size fallback e stati `isUploading`.

## Componenti UI Creati
- **`FileUploadInput` (`client/src/components/shared/FileUploadInput.tsx`)**: Wrapper UI standard per upload. Gestisce la fase di upload con loader radiale/spinner, messaggi di errore e anteprima URL su nuova tab. Implementato pattern drag & drop ready o click tradizionale.

## Checklist Completata
- [x] Sostituzione FileReader per Certificati Medici
- [x] Sostituzione FileReader per Documenti (Privacy, Regolamento)
- [x] Sostituzione FileReader per Foto Profilo CRM
- [x] Sostituzione FileReader per Avatar GemTeam
- [x] Compilazione TypeScript senza errori in tutto il frontend per questi moduli (`npx tsc --noEmit` completato con codice 0)
- [x] Verifica `mascheraStore` (store ripulito dalla serializzazione diretta Base64, salva URL referenziati dal server).

## Next Step Consigliati
1. **Verifica Operativa**: Condurre una simulazione e2e dal browser testando l'upload di un certificato medico reale (PDF/JPG) e verificando il caricamento dell'anteprima.
2. **Bonifica DB Base64 Legacy (Backend)**: Verificare che sul database non siano rimaste stringhe Base64 codificate nei JSON legacy di cert. medici/documenti, eseguendo una query di trasformazione che estrae i base64 per ricrearli e ri-linkarli se necessario (o semplicemente scartarli se molto vecchi).

---
— FILE VERIFICATI
`client/src/store/*`, `client/src/components/crm/*`
— FILE MODIFICATI
`TabAllegati.tsx`, `TabTessere.tsx`, `utenti-permessi.tsx`, `user-profile-dialog.tsx`, `useFileUpload.ts`, `FileUploadInput.tsx`, `CrmFormTypes.ts`
— MOTIVO AGGIORNAMENTO
Eliminazione memory leaks causati da memorizzazione di payload base64 di immagini e file nello stato applicativo; adozione FileSystem remoto.
— FILE NON TOCCATI
`client/src/pages/gemteam.tsx` (gestione unificata via utenti-permessi), `TabTessere.tsx` logica campi.
