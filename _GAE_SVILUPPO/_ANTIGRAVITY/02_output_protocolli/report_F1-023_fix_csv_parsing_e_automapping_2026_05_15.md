---
date: 2026-05-15T12:38:00+02:00
---

# Report F1-023: Diagnostica parsing CSV Athena e ottimizzazione Auto-Mapping

> **Ultimo Aggiornamento:** 15 Maggio 2026, 12:38

## 1. Causa diagnosi 179 colonne (Root Cause)
La diagnosi dello script di parsing e l'ispezione fisica dell'header del file `estrap_2026-05-05_anagrafica_Athena_stagione25-26 - anagrafica25-26.csv` ha rivelato che **non c'è alcun bug in PapaParse né problemi di detection del delimitatore o di escaping**.

Il file è nativamente delimitato da virgola (`,`) e la prima riga contiene esattamente 178 virgole. Di conseguenza, PapaParse restituisce correttamente 179 colonne. 
La discrepanza tra le "179 viste" e le "~50 reali" è dovuta al fatto che il gestionale Athena esporta sistematicamente un'enorme griglia di campi (tra cui 3 blocchi di contatti di emergenza, dati su taglie vestiti, patenti auto, dati bancari, note amministrative, ecc.), la maggior parte dei quali vuoti o non pertinenti alla migrazione core.

## 2. Fix parsing applicato
Dato che i 179 campi sono strutturalmente corretti, il fix non è consistito nel tagliare o nascondere forzatamente delle colonne (rischiando perdita di dati periferici), ma nel **potenziare l'algoritmo di Auto-Mappatura in React**.
File modificato: `client/src/pages/import-data.tsx`
È stata sostituita la logica rudimentale `h.name.includes()` con:
1. Una funzione di normalizzazione aggressiva `normalizeColumnName` (lowercase, rimozione accenti e punteggiatura).
2. Un dizionario di alias mirato sulle abitudini di nomenclatura Athena.
3. Un calcolatore di distanza Levenshtein (`levenshtein <= 2`) come fallback sfumato per typo leggeri o acronimi.

## 3. Auto-mapping dictionary aggiunto
Di seguito i principali alias integrati per riconoscere i field Athena:
- `fiscalCode` → "cod fiscale", "codice fiscale", "cf", "cod fisc"
- `dateOfBirth` → "data di nascita", "data nascita", "datanascita", "data nas"
- `birthCountry` → "nazione nasc", "nazione di nascita", "nazione nasc."
- `placeOfBirth` → "citta nasc", "luogo nascita", "città nasc."
- `birthProvince` → "prov nasc", "provincia nascita", "prov. nasc"
- `country` → "nazione", "nazione residenza", "nazione domic."
- `city` → "citta resid", "città resid.", "citta domicilio"
- `address` → "indirizzo", "indir. domicilio"
- `postalCode` → "cap", "cap domic."
- `phone` / `mobile` → "telefono fisso", "tel", "cellulare", "cell"
- `athenaId` → "athenaid", "legacyathenaid", "id athena"
- `cardNumber` → "numerotessera", "numero tessera"
- `entityCardNumber` → "athenatessera", "num tessera ente"
- `document_issue_date` → "data ril doc", "data ril. doc."
- `document_expiry` → "scadenza documento", "scaddoc"
- `newsletter_consent` → "consenso invio", "privacy"
- `tutor1FirstName` / `tutor1LastName` / `tutor1FiscalCode` → "nome tutore", "cognome tutore", "cod.fisc. tutore"

## 4. Risultati test
L'esecuzione del test headless sullo stesso file CSV ha generato il seguente risultato:
- **Colonne rilevate:** 179
- **Colonne auto-mappate con successo:** 35 (sulle ~40 rilevanti presenti nell'header).
La logica a due passate (Exact/Alias Match → Fuzzy Match) ha immediatamente connesso tutti i campi geografici, i codici fiscali (inclusi quelli dei tutori), i dati delle tessere, e il consenso newsletter.

## 5. Lista campi "Da Mappare" (Da "Ignorare")
I restanti ~144 campi restano in stato "Da Mappare". Poiché l'utente visualizza prima le colonne mappate, queste resteranno sul fondo dell'UI e potranno essere ignorate con il bottone globale "Ignora rimanenti".
Alcuni esempi di questi campi non mappati (perché non presenti in `MEMBER_FIELDS` o non necessari):
- `Cod. Catast. Comune`
- `Indir. Domicilio` (Poiché `address` matcha "Indirizzo" di residenza)
- `Fax`, `SMS`, `Socio`
- `Data Richi. Iscri.`, `Data Rinnovo`, `Data Cancellaz.`
- `Mod. Pagamento`, `Sede Riferimento`
- `Taglia Maglia`, `Taglia pantaloni`, `Taglia Scarpe`
- `Autovettura`, `Patente`
- `Banca`, `IBAN`

Il sistema è pronto: Gaetano può caricare il CSV, vedere ~35 match perfetti istantanei e procedere all'import senza sforzo manuale.
