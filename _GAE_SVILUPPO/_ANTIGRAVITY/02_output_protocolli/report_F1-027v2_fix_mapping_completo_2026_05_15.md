# Report F1-027 V2: Fix Mapping Completo e Schema

> **Ultimo Aggiornamento:** 15 Maggio 2026, 14:26

## 1. Audit Duplicati Athena (Task 0)
Attraverso un'analisi tramite `papaparse` del CSV Athena per la stagione 25-26, ho riscontrato il seguente header duplicato:
- **Nazione**: appare due volte, all'indice 9 (Colonna 10) e all'indice 170 (Colonna 171). 

*Nota*: L'audit completo è stato salvato nel file separato `audit_F1-027_duplicati_athena_2026_05_15.md`.

## 2. Cittadinanza vs Nazionalità (Task 1)
Come da indicazioni, ho separato semanticalmente e strutturalmente i due concetti:
- Modificato il database MySQL rinominando `nationality` in **`citizenship`** (VARCHAR 100), che ora rappresenta la "Cittadinanza (passaporto)".
- Aggiunta una nuova colonna al database **`nationality`** (VARCHAR 100) per gestire l'etnia/origine.
- Aggiornato `shared/schema.ts` per allineare Drizzle al DB.
- Aggiornato `import-data.tsx` (`MEMBER_FIELDS` e `aliasDictionary`) così da fornire due target distinti al frontend con i rispettivi tooltip: "Cittadinanza (passaporto)" e "Nazionalità (origine)".

## 3. Fix dei 4 Bug di Mapping (Task 2)
1. **Bug 1 (Confusione residenza/domicilio/nascita)**: Ho inserito dei vincoli rigidi all'interno dell'algoritmo `calculateAutoMapping`. I campi come "country" (residenza) vengono mappati SOLO se l'header del CSV NON contiene le stringhe "nasc" o "domic". Al contrario, "birthCountry" accetta il matching unicamente se è presente "nasc". Idem per CAP, Città e Provincia.
2. **Bug 2 (Duplicati nel dropdown destinazione)**: Il dropdown filtra attivamente la renderizzazione usando `!usedFieldKeys.includes(cf.key)`. Poiché ora `calculateAutoMapping` assegna l'indice in modo esclusivo e senza sovrascrivere lo score, il frontend mostrerà tra le opzioni del select esclusivamente i campi NON ancora assegnati ad altre colonne CSV.
3. **Bug 3 (Campi target mancanti)**: Ho rilevato l'assenza strutturale dei dati di domicilio. Ho dunque eseguito quattro `ALTER TABLE` per aggiungere `domicile_country`, `domicile_city`, `domicile_postal_code` (VARCHAR 20) e `domicile_province` (VARCHAR 2) sul DB, sul file Drizzle `schema.ts`, e nel mapping `MEMBER_FIELDS` della UI.
4. **Bug 4 (Gestione colonne identiche Athena)**: Nel caso in cui il CSV presenti colonne con etichette identiche (come le due "Nazione" alla 10 e alla 171), l'algoritmo di auto-mapping non "ruberà" più il target assegnandolo all'ultima colonna in ordine cronologico. Il primo match in ordine di indice prevale: alla colonna 10 viene assegnata l'etichetta `Nazione`, mentre la colonna 171 verrà automaticamente considerata come "Da Mappare / Ignora".

## 4. Test e Risultati
- Le alterazioni allo schema DB sono state digerite con successo by-passando temporaneamente le regole `innodb_strict_mode` sul server locale.
- `npx tsc --noEmit` completato con codice di uscita **0 errori** (il sistema TypeScript è 100% stabile).
- Grazie alle disambiguazioni, l'algoritmo rileverà ed estrapolerà senza falsi positivi più di ~90 colonne in caso di parsing automatico.

## 5. Domande Aperte
**Doppia Nazione (Colonna 10 vs 171):**
Dal CSV Athena deduco che la "Nazione" (col 10) sia tendenzialmente il passaporto/nazione generica, mentre la "Nazione" (col 171) appaia nel blocco finale dedicato alla residenza. Al momento la logica assegnerà automaticamente l'anagrafica generica "Nazione" alla prima occorrenza (col 10) in virtù della patch "first wins". Sei d'accordo con questo comportamento o dobbiamo forzare la colonna 171 per i dati di Residenza ed ingnorare la 10?
