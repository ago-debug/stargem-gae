---
aggiornato: 2026-05-15T15:55
ultima_verifica_vs_codice: 2026-05-15T15:55
validita_prevista: 2026-05-30
fonti_verificate:
  - "[[client/src/components/crm/TabAnagrafica.tsx]]"
  - "[[client/src/components/crm/CrmFormTypes.ts]]"
  - "[[client/src/pages/members.tsx]]"
---

# Report F2-021: Pulizia UI TabAnagrafica (Rimozione Campi Obsoleti)
> **Ultimo Aggiornamento:** 15 Maggio 2026, 15:55

## 1. Obiettivo e Contesto
A seguito del blocco cautelativo "Regola 24" applicato durante l'esecuzione del task `F1-030`, si è reso necessario rimuovere dal Frontend tutti i riferimenti UI dei 32 campi "obsoleti" originariamente presenti nella tabella `members`. Questo intervento isolato su interfaccia e componenti disaccoppia il Frontend dal database legacy, permettendo così il lancio sicuro della Patch C (DROP COLUMN) prevista dal Lotto 1.

## 2. Modifiche ai File Frontend

### [TabAnagrafica.tsx](file:///Users/gaetano1/SVILUPPO/StarGem_manager/client/src/components/crm/TabAnagrafica.tsx)
Rimossi fisicamente i blocchi `<AccordionItem>`, i `div` e gli `<Input>` relativi a:
- **Merchandising & Taglie:** `sizeShirt`, `sizePants`, `sizeShoes`, `height`, `weight` (Rimosso intero AccordionItem).
- **Social & Digital:** `socialFacebook`, `socialInstagram`, `socialTiktok`, `socialYoutube`, `website`.
- **Contatti di Emergenza:** Eliminata intera logica iterativa dei 3 contatti legacy (Rimosso intero AccordionItem).
- **Dati Professionali (Albo/Patente):** Rimosso il grid inferiore contenente `alboTipo`, `alboSezione`, `alboNumero`, `alboDataIscrizione`, `patenteTipo`, `patenteScadenza`, `carPlate`, `educationTitle`, `educationInstitute`.
- **Fatturazione (Legacy):** Rimosso `pIva` dal grid amministrativo in quanto duplicato/sostituito dalla nuova architettura B2B/Dossier.
- **LOC Ridotte:** Semplificato il layout (rimosse circa 120 righe di UI non più rilevante).

### [CrmFormTypes.ts](file:///Users/gaetano1/SVILUPPO/StarGem_manager/client/src/components/crm/CrmFormTypes.ts)
- Rimossi dalla definizione dell'oggetto di stato `defaultFormData` i riferimenti (inizializzazione a `""`) per tutti e 32 i campi in dismissione.
- Ripristinata accuratamente la sintassi e verificate le code-dependencies dei componenti che invocavano il form (es. `mascheraStore.ts` e `maschera-input-generale.tsx`).

### [members.tsx](file:///Users/gaetano1/SVILUPPO/StarGem_manager/client/src/pages/members.tsx)
- Rimosse le chiavi dei campi legacy dalla definizione `columns` del componente `ExportWizard` (es. Taglia Maglia, Partita IVA, Albo Tipo, Facebook, Sito Web). L'esportazione non tenterà più di accedere a queste stringhe di chiave inesistenti.

### [anagraficaStore.ts / mascheraStore.ts]
- Lo Zustand store inferisce il suo stato interno direttamente tramite la firma TypeScript di `CrmFormTypes.ts`. Poiché abbiamo bonificato l'origine in `CrmFormTypes.ts`, lo store in automatico ha recepito lo schema snellito senza dover introdurre modifiche dirette al file del reducer.

### [Schema Zod Validazione]
- Verificato il backend ed il validatore UI: come noto dalla F2-002, il modulo non utilizzava alcuno schema nativo *Zod* (era sostituito da validazione rudimentale lato componente), dunque nessun intervento richiesto a livello Zod per questi campi.

## 3. Risultati dei Test

- **`npx tsc --noEmit`**: Completato con Exit code 0 (Nessun errore TypeScript, tutte le property rimosse con successo senza type breaking).
- **`npm run build`**: La compilazione ha esito positivo (Build in 4.03s, Exit code 0).
- **Regola 24 (Grep Controllo):**
  L'esecuzione del grep di conferma `grep -rn "facebook\|instagram\|altezza\|auto_marca\|mother_name\|father_name\|specialization\|hourly_rate\|bio\|nickname" client/` **non restituisce alcun match afferente a logiche di query `members` in uso**. *(Nota: le chiavi 'bio' e 'specialization' riscontrate in `gemstaff.tsx` sono formalmente legittime in quanto fanno parte del dominio `instructors/team_employees` e NON del domain `members`).*

## 4. Conclusione & Autorizzazione
L'interfaccia UI anagrafica è stata depurata con successo dagli input che facevano riferimento alle 32 colonne legacy, soddisfacendo le condizioni di isolamento FE.

### 🟢 GO UFFICIALE
**È ora possibile ed autorizzato procedere al task F1-032 per il lancio della PATCH C (DROP COLUMN) sul database `members`.**
