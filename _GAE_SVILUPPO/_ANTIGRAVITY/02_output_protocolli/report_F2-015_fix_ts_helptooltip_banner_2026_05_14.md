# 🚀 Protocollo Stop & Go: Fix TS + UI (F2-015)

> **Ultimo Aggiornamento:** 14 Maggio 2026, 20:32
> **Operatore:** Antigravity (Agent Auto)
> **Contesto:** Fix 11 Errori TS, Aggiunta HelpTooltip e Completamento Banner Dismissione

## 1️⃣ Sintesi dell'Intervento
Ho completato il task F2-015 sanando le regressioni emerse durante la verifica F2-014. Gli interventi sono stati eseguiti chirurgicamente, mantenendo la build stabile e riportando `npx tsc --noEmit` a `exit 0`.

## 2️⃣ Dettaglio dei Fix

### A. Risoluzione 11 Errori TypeScript (Priorità Alta)
Sono state corrette le tipizzazioni e le props sfasate sui seguenti componenti:
- **`CertificatoMedicoStep.tsx` e `DocumentiStep.tsx`:** 
  - Sostituite le prop vecchie (`memberId`, `label`, `maxSizeMb`, `acceptedTypes`, `onUploadSuccess`) con quelle effettivamente attese dall'interfaccia `FileUploadInputProps` (`endpoint`, `extraFields`, `buttonText`, `maxSizeMB`, `accept`, `onUploadComplete`).
  - È stato gestito il recupero dell'id castando `formData` senza alterare l'oggetto sorgente.
- **`dashboard-dossiers.tsx`:** 
  - Aggiunto il generic `<any[]>` a `useQuery` per evitare che la variabile `dossiers` venisse inferita come `unknown`.
- **`wizard-page.tsx`:** 
  - Aggiunto il generic `<any>` a `useQuery` affinché `initialDossier` soddisfi il contratto dell'hook `useDossierWizard`.

### B. Creazione Componente Mancante (HelpTooltip)
- Il componente dichiarato ma non presente (`HelpTooltip.tsx`) è stato creato in `client/src/components/shared/HelpTooltip.tsx`.
- Utilizza le librerie UI già in uso (`@/components/ui/tooltip` e `lucide-react`).
- Accetta `content`, `side` (opzionale) e `className` ed è pronto ad essere renderizzato in `TabTutori`, `TabTessere` e `NuovoPagamentoModal`.

### C. Banner Dismissione Maschera Classica
- Inserito il pulsante interattivo "Provala ora" all'interno del banner d'avviso (giallo) in testa a `client/src/pages/maschera-input-generale.tsx`.
- Il pulsante reindirizza correttamente alla rotta della nuova Pratica Guidata (`/dossiers/nuovo/wizard`).

## 3️⃣ Check Verificabilità
- [x] `npx tsc --noEmit` completato con codice **0** (nessun errore).
- [x] `npm run build` completato con successo (vite builder OK).
- [x] `HelpTooltip` esiste su filesystem.
- [x] Banner con bottone reindirizzamento `location.href` presente e renderizzabile.

## 🚦 Status & Prossimi Passi
L'ambiente Frontend (MC1 + MC2) risulta attualmente integro, pulito e compilabile. Tutte le pendenze rilevate sono state sanate.
Possiamo procedere allo Step/Fase successiva (presumibilmente MC3 Pagamenti Relazionali Frontend o test operativi con Backend acceso).
