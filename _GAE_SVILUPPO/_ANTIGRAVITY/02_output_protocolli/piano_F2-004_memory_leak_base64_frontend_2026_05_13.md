---
aggiornato: 2026-05-13T18:00
ultima_verifica_vs_codice: 2026-05-13T18:00
validita_prevista: 14 giorni
prompt_di_riferimento: F2-004
fonti_verificate: [codebase client/]
---

# Piano Operativo F2-004 — Risoluzione Memory Leak Base64 (Frontend)

**TL;DR**
Il gestionale soffre di un grave rischio memory leak. In `[[TabAllegati.tsx]]`, `[[utenti-permessi.tsx]]` e `[[user-profile-dialog.tsx]]`, i file PDF e le immagini vengono letti integralmente nel browser tramite `FileReader` o `canvas.toDataURL` per essere salvati come enormi stringhe Base64 nello State locale di React (es. in `CrmFormContext`). Caricando 5 PDF da 2MB l'uno, lo State si gonfia di ~14MB di testo, rischiando freeze della UI e fallimento delle chiamate POST per payload troppo grandi. L'obiettivo è migrare tutto su un architettura a `FormData` multipart con pre-upload asincrono verso il backend (cross-asse con F1-006).

---

## 1) CENSIMENTO COMPONENTI CHE FANNO BASE64

1. **`client/src/components/crm/TabAllegati.tsx`**
   - Usa `FileReader` e `canvas.toDataURL('image/jpeg', 0.6)` per comprimere immagini.
   - I file (anche PDF) vengono salvati in `previewUrl` come `data:image/*` o `data:application/pdf;base64,...`.
2. **`client/src/pages/utenti-permessi.tsx`**
   - Usa `FileReader` (`event.target?.result`) per avatar utenti e salva la stringa Base64 in `newUserImageBase64` e `editUserImageBase64`.
3. **`client/src/components/user-profile-dialog.tsx`**
   - Stesso pattern per l'avatar personale (`setPreviewImage(base64)` e mutation diretta).
4. **`client/src/pages/members.tsx`**
   - Limitazione rudimentale a 1MB per Base64 (`if (file.size > 1024 * 1024)`).

*(Nota: Gli utilizzi di `QRCode.toDataURL` in `TabStampaTessere.tsx` e `membership-card.tsx` sono ignorabili in quanto le stringhe generate per QR/Barcode sono minuscole e sicure).*

## 2) STATE CHE TENGONO BASE64 IN MEMORIA

- **`CrmFormContext.tsx`**: L'oggetto `allegati` contiene chiavi per *domandaTesseramento*, *regolamento*, *privacy*, *certificatoMedico*. Ognuno ha un campo `previewUrl` contenente il Base64 puro. 
- **Stima impatto**: 4 documenti x 2MB (media foto cellulare o scansione PDF) = 8MB convertiti in Base64 pesano circa **11 MB di memoria RAM** puramente testuale nel `Context`. In fase di POST, il payload JSON raggiunge dimensioni non idonee per API standard, bloccando thread e rete.

## 3) ARCHITETTURA TARGET PROPOSTA

L'obiettivo è eliminare del tutto il salvataggio dei file nei Context o Store globali, adottando un approccio **Dropzone Asincrono**:
1. **Hook Custom `useFileUpload`**: Un hook dedicato che gestisce `FormData` via `axios` o `fetch` con header `Content-Type: multipart/form-data`.
2. **Pre-Upload**: Non appena l'utente seleziona un file, questo viene caricato sul server in una cartella `/temp` o definitiva. 
3. **Restituzione URL Relativo**: Il server risponde con `{"url": "/uploads/documents/user_123_privacy.pdf"}`.
4. **Salvataggio nello State**: Nello state di React (e nel payload finale del form) si salverà **solo la stringa dell'URL**, non il file Base64.
5. **Anteprime Efficienti**: `<img src={backendUrl + documentUrl} />` (eventualmente protetto via JWT proxy).

## 4) UX MIGLIORAMENTI DA IMPLEMENTARE

- **Drag & Drop Zone**: Area grigia in cui trascinare i PDF invece del classico bottoncino "Sfoglia".
- **Progress Bar Visiva**: Durante il pre-upload asincrono, mostrare una barra percentuale.
- **Anteprima Reale**: Le miniature delle immagini si appoggeranno all'URL remoto (il browser gestirà la memoria caching in automatico).
- **Stato "Caricato ma non salvato"**: Badge visivo per chiarire che l'allegato è in cloud ma l'anagrafica non è ancora confermata.

## 5) IMPATTO BACKEND (Intersezione con F1-006)

Il frontend non può funzionare senza che il server sia pronto ad accogliere i file (F1-006). Serviranno:
- **`POST /api/uploads/document`**: Endpoint per ricevere il Multipart (`multer` o simili).
- **`POST /api/uploads/medical-certificate`**: Specifico per certificati, per estrarre eventuali metadati OCR in futuro o posizionarli in bucket separato.
- **`GET /api/uploads/*`**: Rotte statiche protette per renderizzare PDF e immagini solo a staff autorizzato.
- **Aggiornamento Schemi DB**: Eliminare colonne `LONGTEXT` se usate per Base64, a favore di `VARCHAR(255)` per le path.

## 6) STIMA TEMPI E SOTTO-STEP (Solo Frontend)

- **Step 1:** Sviluppo custom hook `useFileUpload` con `axios` progress event (1h).
- **Step 2:** Refactoring pesante di `[[TabAllegati.tsx]]` rimuovendo `compressImage`, `FileReader` e lo stato in `CrmFormContext` per i Base64 (3h).
- **Step 3:** Refactoring di `TabTessere.tsx` e unificazione logica Certificato Medico (2h).
- **Step 4:** Refactoring avatar utente in `[[utenti-permessi.tsx]]`, `[[user-profile-dialog.tsx]]` (1.5h).
- **Step 5:** Test E2E integrazione frontend/backend (upload, display, delete file orfani) (2h).

**Totale stimato Frontend:** ~9.5 ore.

---

### DECISIONI DI PRODOTTO PER GAETANO (Aperte)

1. **Progress Bar:** Vogliamo una progress bar circolare minimale o un modale "Upload in corso..." che blocca l'UI finché il file non è arrivato al server? *(Consigliata: barretta minimale in-place vicino al file).*
2. **Preview Interattive PDF:** Vogliamo mantenere la modale che apre il PDF in un iFrame quando ci si clicca sopra, o basta un pulsante "Scarica/Apri in nuova tab"? *(Consigliata: Apri in nuova tab, per non appesantire il DOM).*
3. **Gestione File "Orfani":** Se un operatore carica 3 documenti e poi clicca "Annulla" o chiude il browser senza salvare l'anagrafica, i file restano nel server. Possiamo schedulare una pulizia notturna backend (via cron) dei file caricati e non associati a nessuno nel DB, senza gestire "delete" interattivi in UI se non salvati? *(Consigliato: Sì, approccio soft-clean backend).*
