---
date: 2026-05-15T13:45:00+02:00
---

# Report F1-025: Audit Incrociato Schema DB vs CSV Athena

> **Ultimo Aggiornamento:** 15 Maggio 2026, 13:45

## 1. Sintesi Statistiche CSV Athena (Lotto 1)
L'estrapolazione di 3986 record con 179 colonne è stata scansionata per densità di dati:
- **✅ Già Mappate:** 35 colonne (Anagrafiche, Contatti base, Tessere, ecc.)
- **🟢 Usate e Utili:** ~36 colonne (Consensi Privacy, Dati completi Tutori, Date di Iscrizione, Sede, Certificati Medici) con alto tasso di riempimento (>500 righe).
- **🟡 Usate ma poco rilevanti:** ~12 colonne (Tipo Visita, Compenso, Conto Coll.) con tassi tra 50 e 500 righe.
- **🔴 Vuote/Inutili:** ~96 colonne (Patenti, Autovettura, IBAN, Taglie Vestiti, Contatti 3, ecc.) con zero o pochissime righe popolate.

## 2. Tabella CSV: Colonne "Usate e Utili" (Non ancora mappate)
Queste colonne contengono informazioni storiche preziose e hanno un alto fill-rate.

| Colonna CSV Athena | Non-vuote / 3986 | Status | Proposta per F1-026 |
|---|---|---|---|
| `Data Iscrizione` / `Rinnovo` | 3310 / 1465 | 🟢 UTILE | Map su `first_enrollment_date` / `insertion_date` |
| `Sede Riferimento` | 3528 | 🟢 UTILE | Map su `sede_riferimento` (già in DB) |
| `Scadenza Visita` | 2893 | 🟢 UTILE | Map su `medicalCertificateExpiry` (DB: `certificato_medico_scadenza`?) |
| `Privacy` / `Cons. Privacy` | >3300 | 🟢 UTILE | Map su `privacy_accepted` / `consent_marketing` |
| `Cons. Immag.` / `Cons. Modulo` | >3800 | 🟢 UTILE | Map su `consent_image` / `consent_module` |
| `Mastro C.` / `Mastro Col.` | 3984 | 🟢 UTILE | Map su `mastro_c` / `mastro_col` (già in DB) |
| `Cod. Catast. Comune` | 3176 | 🟢 UTILE | Map su `codice_catastale` (già in DB) |
| `Indirizzo Tutore`, `CAP Tut.` ecc. | ~680 | 🟢 UTILE | Creare campi DB `tutor1_address`, `tutor1_city`, ecc. o usare JSON |
| `Nome Tutore 2`, `Cognome 2` ecc. | ~580 | 🟢 UTILE | Map su `tutor2_first_name`, `tutor2_last_name` (già in DB) |

## 3. Tabella DB `members`: Utilizzo Reale e Obsolete
Analizzando le 92 righe attuali del DB locale (che rappresenta lo schema live per la tabella `members`):

| Colonna DB | Utilizzo (Non-Null) | Status | Proposta |
|---|---|---|---|
| `mother_*` (birth_date, city...) | 0 / 92 | 🔴 OBSOLETA | Deprecare in favore dei neutrali `tutor1_*` |
| `father_*` (birth_date, city...) | 0 / 92 | 🔴 OBSOLETA | Deprecare in favore dei neutrali `tutor2_*` |
| `gift_metadata`, `tessere_metadata`, `certificato_medico_metadata` | 0 / 92 | 🔴 OBSOLETA | Deprecare (migrati a filesystem `attachments_url`) |
| `specialization`, `bio`, `hourly_rate` | 0 / 92 | 🔴 OBSOLETA | Deprecare (spostare in tabelle team/staff) |
| `residence_permit`, `permit_expiry` | 0 / 92 | 🔴 OBSOLETA | Deprecare |

## 4. Proposta Modifiche Schema (Per F1-026)

**A. Colonne CSV da ELEVARE a campi DB (o Mappare)**
Propongo di **non aggiungere nuovi campi** se possiamo mapparli su quelli esistenti (es. consensi, mastro, sedi). L'unica estensione raccomandata riguarda i dati anagrafici estesi dei **Tutori 1 e 2** (indirizzo, telefono, data nascita) che attualmente non hanno tutti i campi completi sul DB (es. manca `tutor1_address`).
I campi 🟡 (Usati ma poco rilevanti) come `Compenso` o `Ultima Visita` verranno dirottati massivamente nel campo JSON `extra_data` senza sporcare lo schema relazionale.

**B. Colonne DB da DEPRECARE (Drop Sicuro)**
- `mother_*` e `father_*` completi (12 campi legacy F1-002 flat).
- I campi JSON storici `_metadata` (sostituiti da `attachments_url` in F1-019).
- Campi staff-only rimasti su members: `specialization`, `bio`, `hourly_rate` (dovrebbero stare in `team_employees`).
_Strategia: rinomina in `_deprecated_<nome>` e drop previsto post-import._

**C. Mapping Aggiuntivo UI (import-data.tsx)**
Aggiungeremo al dizionario alias:
- `first_enrollment_date` → `["data iscrizione", "data richi. iscri."]`
- `medicalCertificateExpiry` → `["scadenza visita"]`
- `consent_image` → `["cons. immag."]`
- `consent_module` → `["cons. modulo"]`
- `consent_privacy` → `["privacy", "consenso privacy"]`
- `sede_riferimento` → `["sede riferimento"]`
- `codice_catastale` → `["cod. catast. comune", "cod. comune"]`
- `mastro_c` / `mastro_col` → `["mastro c.", "mastro col."]`

## 5. Stima Impatto
- **Campi aggiunti al DB:** ~6 (Estensione dati tutori).
- **Campi deprecati/rimossi dal DB:** ~20 (Pulizia legacy `mother/father` e `_metadata`).
- **Colonne CSV auto-mappate:** Passeranno dalle attuali **35** a circa **50-55** (tutte quelle con utilità > 0).
- **Colonne ignorate:** Resteranno ~124 colonne di "spazzatura" Athena silenziate nell'import.

## 6. Domande Operative per Gaetano
Prima di procedere con l'esecuzione in F1-026, ho bisogno di queste conferme:
1. **Tutori:** Posso procedere al drop dei campi `mother_*` e `father_*` e sostituirli aggiungendo i campi anagrafici completi per `tutor1_*` e `tutor2_*`?
2. **Date di Iscrizione:** Athena ha "Data Iscrizione" e "Data Rinnovo". Mappo la prima su `first_enrollment_date` e la seconda su `insertion_date` (o la ignoriamo in favore del sistema rinnovi di StarGem)?
3. **Campi Staff su Members:** Confermi il drop di `bio`, `specialization` e `hourly_rate` dalla tabella `members` visto che andranno nel modulo HR/Team?
4. **Scadenza Visita Medica:** Aggiungo l'alias per autocaricarla in `medicalCertificateExpiry` o vuoi fare un caricamento manuale post-import?
5. **Dati marginali (Extra Data):** Campi come `Tipo Visita` o `Compenso` li mettiamo nel calderone JSON `extra_data` senza creare colonne dedicate, corretto?

Attendo approvazione per eseguire l'implementazione in F1-026.
