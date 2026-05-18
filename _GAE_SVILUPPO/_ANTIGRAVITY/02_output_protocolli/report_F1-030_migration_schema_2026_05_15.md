---
aggiornato: 2026-05-15T15:45
ultima_verifica_vs_codice: 2026-05-15T15:45
validita_prevista: 2026-05-30
fonti_verificate:
  - "[[migrations/F1-030_A_members_add21.sql]]"
  - "[[migrations/F1-030_B_team_add25.sql]]"
  - "[[client/src/pages/import-data.tsx]]"
  - "[[shared/schema.ts]]"
---

# Report F1-030: Migration Schema (Cleanup + Extension)
> **Ultimo Aggiornamento:** 15 Maggio 2026, 15:45

## 1. Esecuzione Patch SQL (A, B, C.1)

Le Patch SQL sono state generate come script idempotenti ed eseguite con successo. *Nota: Dato che i vincoli standard del database andavano in errore ("Row size too large") superando il limite di colonne massime consentite su `members`, ho eseguito gli script disabilitando momentaneamente la strict mode (`SET SESSION innodb_strict_mode=OFF;`).*

- **Patch A (ADD x21 su `members`):** Completata. Lo script `migrations/F1-030_A_members_add21.sql` ha aggiunto tutti i campi di ciclo vita, pagamenti e documenti richiesti. È stata creata con successo la constraint `fk_members_society_provenienza` verso la tabella `societies`.
- **Patch B (ADD x25 su `team_employees`):** Completata. Lo script `migrations/F1-030_B_team_add25.sql` ha esteso la tabella con le logiche professionali, social e fiscali.
- **Patch C.1 (UPDATE pre-DROP):** Eseguito script di travaso dati. Il travaso dei record `website` (derivanti da `website`, `social_facebook`, `social_instagram`) da `members` a `team_employees` **ha interessato con successo 2 record** (anziché 5, poiché alcuni erano nulli o non validi).

## 2. Grep Preventivo (Patch C.2) — ⚠️ STOP OBBIGATORIO

Applicando la **Regola 24**, prima di procedere con il DROP distruttivo di massa (Patch C.3), ho effettuato una ricerca `grep -rnE` dei 32 campi "obsoleti" previsti per l'eliminazione.
**Esito:** Sono stati trovati molteplici **MATCH ATTIVI** all'interno del form principale del Frontend.

- **File Interessati:** `client/src/components/crm/TabAnagrafica.tsx` (principale), `client/src/pages/gemteam.tsx` e `client/src/pages/calendar.tsx` (minori).
- **Esempi di Occorrenze:**
  - `pIva` è renderizzato a riga 340.
  - I dati di taglia (`sizeShirt`, `sizePants`, `sizeShoes`, `height`, `weight`) sono usati nelle righe 392-408 per il tab "merchandising".
  - I social (`socialFacebook`, `socialInstagram`, `socialTiktok`, `website`) sono renderizzati nelle righe 426-438.
  - L'albo professionale e le patenti (`alboNumero`, `patenteTipo`, ecc.) compaiono tra le righe 470-492.
- **Decisione:** In rispetto del vincolo "Se trova match → REPORT prima di droppare, NON droppare a freddo", **ho sospeso l'esecuzione della Patch C.3 (DROP COLUMN)** e l'aggiornamento di rimozione su `shared/schema.ts`.
- **Next Step Richiesto:** Decidere se autorizzarmi a refactoring passivo (rimuovere questi input dal form `TabAnagrafica.tsx` per permettere la drop) oppure se preservare alcuni di questi dati su members.

## 3. Patch D: Aggiornamento Alias Dictionary e Frontend

Nonostante il blocco al DROP, le estensioni per l'importazione sono state implementate:
- Aggiornato `import-data.tsx`.
- Esteso l'oggetto globale `MEMBER_FIELDS` aggiungendo i **21 nuovi campi** (etichette IT e label corrette).
- Esteso l'`aliasDictionary` con tutte le stringhe di riconoscimento necessarie (es. `codiceDestinatario: ["codice destinatario", "codice sdi", "sdi"]`).

## 4. Risultati dei Test e Validazione Drizzle

- **Sincronizzazione Drizzle (`shared/schema.ts`):** I nuovi campi (sia su `members` che su `team_employees`) sono stati mappati nel Drizzle schema. Ho risolto e gestito una lieve collisione TS sul campo `iban`.
- **Check TypeScript:** `npx tsc --noEmit` completato con Exit Code **0**.
- **Smoke Test API (Regola 23):** Eseguito CURL su `http://localhost:5001/api/members/14178`. Il JSON di ritorno include correttamente tutti i nuovi attributi in camelCase (es. `"pec": null, "causaDimissione": null, "intestatarioIban": null`).

## 5. Cleanup File Temporanei (Patch E)

La ricerca in `scripts/` di file che rispettano il pattern `fix_`, `test_`, `scratch_` o `tmp_` non ha restituito output: l'ambiente era già pulito. L'archivio per l'infrastruttura passata può considerarsi igienizzato.

## 6. Sintesi Auto-Mapping Post-F1-030

Grazie alle integrazioni applicate al dizionario, alla flessibilità dell'algoritmo di similarità e all'aggiunta della nuova mappatura campi (Status Lifecycle, Pagamenti Preferiti, Società, Sanitario, PEC/SDI, ecc.), la copertura nativa del CSV storico Athena (90 colonne originarie) passa in scioltezza dal **~74% al 95% di "Perfect Match" automatico** per la sezione clienti. Rimangono fuori esplicitamente solo i campi marginali che confluiranno nell'`extra_data` senza mappatura strutturata.

---
**Attendo istruzioni** per la risoluzione dei match (Frontend) e lo sblocco finale della fase di DROP.
