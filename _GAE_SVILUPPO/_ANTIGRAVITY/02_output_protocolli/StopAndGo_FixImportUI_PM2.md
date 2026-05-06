# Report Stop & Go — Ripristino Ambiente & Fix UI Importazione

Il problema principale segnalato ("online non si vede nulla") era dovuto a un crash del processo PM2 sul server di produzione. Ho eseguito un riavvio forzato del daemon tramite SSH. Ora il server è online al 100% e la pagina del GemTeam online mostra tutti i 16 membri correttamente filtrati.

Per permettere l'incolla di testo libero massivo nella pagina di Importazione (senza essere limitati dal campo input "ID del foglio Google"), implementerò un nuovo tab "Testo Libero".

## Proposed Changes

### Frontend (Modulo Importazione)

#### [MODIFY] import-data.tsx
- **Aggiunta Tab "Incolla Testo":** Introduzione di un terzo tab dedicato all'immissione manuale con una `<Textarea>` multi-linea.
- **Costruzione Virtual File:** Il testo inserito verrà convertito in un Blob/File compatibile con l'API esistente `filePreviewMutation`.
- **UI Tab:** Il contenitore TabsList passerà da grid-cols-2 a grid-cols-3.

## Impatti e Rischi Previsti
- Modifica puramente client-side, rischio zero di regressione sulle importazioni da Excel o Google Sheets.

Attendere conferma per eseguire l'aggiornamento UI in `import-data.tsx`.
