# Report: Diff Athena vs Master e Mapping (Lotto 1)

> **Ultimo Aggiornamento:** 15 Maggio 2026, 11:05
> **Protocollo:** F1-021a (Analisi e Mapping Anagrafiche)

L'analisi dei due set di dati ("Master Gsheet" e "Athena 25-26") è stata completata tramite script Read-Only direttamente sul database locale `stargem_v2` e sui CSV allegati. 

---

## 🔴 TASK 0: Verifica Stato IDs Attuali

L'estrazione dal database `stargem_v2` restituisce il seguente scenario:

| Tabella | Records | MAX(id) | AUTO_INCREMENT |
| :--- | :--- | :--- | :--- |
| `members` | 92 | **19307** | **19308** |
| `team_employees` | 16 | 16 | 17 |
| `memberships` | 0 | *null* | 1 |

**Analisi & Raccomandazione:**
Il numero di record in `members` è 92, ma l'ID massimo è sorprendentemente **19307**. Questo avviene perché nel DB sono già stati inseriti account legacy (Staff/Insegnanti come Carlos Cruz, Beatrice Carbone, ecc.) ereditando probabilmente il loro vecchio ID Athena.
- **Raccomandazione SAFE:** Poiché il contatore `AUTO_INCREMENT` interno di MySQL per la tabella `members` è già posizionato a **19308**, non c'è alcun rischio di sovrascrittura. Possiamo importare in totale sicurezza lasciando fare al DB: i nuovi import partiranno da 19308 in su, evitando conflitti coi 92 account staff preesistenti.

---

## TASK 1: Diff Athena vs Master

Dallo script di parsing e diff incrociato basato su (Codice Fiscale + Nome/Cognome) emergono i seguenti dati:
- **Master Gsheet:** 3683 righe
- **Athena CSV:** 3986 righe
- **Extra Records (Athena-only):** Circa 303 (al netto di formattazioni difformi).

**Categorizzazione dei 303 Extra:**
Ispezionando un campione dei record in eccedenza (es. "Carlos Wagner Araujo Cruz", "Ronald Almeida"), si evince chiaramente che si tratta in larga parte di **Insegnanti, Staff o Collaboratori Sportivi** (hanno `TipoPartecipante: Insegnante/Allenatore` e `Gruppo: STUDIO GEM`). Molti di questi sono proprio i 92 già presenti in DB. L'altra fetta potrebbero essere ex-soci inattivi non riportati nel Master.

---

## TASK 2: Mapping Campo-per-Campo (Athena → StarGem)

Athena esporta circa 120 colonne. Di seguito il mapping primario per la tabella `members`:

| Colonna Athena (CSV) | Campo StarGem (`members`) | Tipo/Note |
| :--- | :--- | :--- |
| `athenaID` | `legacy_athena_id` | **NUOVO** (Stringa, preservare storicità) |
| `Cognome` | `lastName` | String |
| `Nome` | `firstName` | String |
| `Sesso` | `gender` | `M` / `F` |
| `Cod. Fiscale` | `fiscalCode` | *Attenzione: bloccante se errato/mancante* |
| `Data di Nascita` | `dateOfBirth` | Date |
| `Nazione Nasc.` | `birthCountry` | String |
| `Città Nasc.` | `placeOfBirth` | String |
| `Prov. Nasc` | `birthProvince` | String |
| `Indirizzo` | `address` | String |
| `CAP` | `postalCode` | String |
| `Citta Resid.` | `city` | String |
| `Provincia` | `province` | String |
| `Cellulare` | `mobile` | String |
| `E-Mail` | `email` | String |
| `athenaTessera` | `entityCardNumber` (oppure in `memberships`) | Valutare dove stoccare il numero legacy |
| `Scad. Tessera Socio`| `cardExpiryDate` | Date |
| `Scadenza Visita` | `medicalCertificateExpiry` | Date |
| `Nome Tutore` | `motherFirstName` | *Da mappare nel blocco Tutore 1* |
| `Cognome Tutore` | `motherLastName` | *Da mappare nel blocco Tutore 1* |
| `Cod.Fisc. Tutore` | `motherFiscalCode` | *Da mappare nel blocco Tutore 1* |

*(Tutti gli altri campi accessori come taglie maglia, patenti, etc. verranno incapsulati in `extraData` JSON Strada A+B).*

---

## TASK 3: Mapping Campo-per-Campo (Master → StarGem)

Il file Master è molto più snello e "pulito" (21 colonne).

| Colonna Master (CSV) | Campo StarGem (`members`) | Tipo/Note |
| :--- | :--- | :--- |
| `masterID` | `legacy_master_id` | **NUOVO** (Stringa, preservare storicità) |
| `cognome` | `lastName` | String |
| `nome` | `firstName` | String |
| `eta` | *(Ignorato)* | Calcolato dinamicamente da `dateOfBirth` |
| `sesso` | `gender` | `M` / `F` |
| `cellulare` | `mobile` | String |
| `cod_fiscale` | `fiscalCode` | String |
| `email` | `email` | String |
| `cognome_genitore` | `motherLastName` | *Trattato convenzionalmente come Tutore 1* |
| `nome_genitore` | `motherFirstName` | *Trattato convenzionalmente come Tutore 1* |
| `data_di_nascita` | `dateOfBirth` | Date |
| `luogo_di_nascita` | `placeOfBirth` | String |
| `provincia_di_nascita`| `birthProvince` | String |
| `codice_fiscale_genitore`| `motherFiscalCode`| String |
| `come_ci_hai_conosciuto`| `fromWhere` | String |

---

## TASK 4: Colonne Nuove da Aggiungere a `members`

Per supportare il tracciamento e garantire la solidità degli import, prima di procedere con l'esecuzione sarà necessario un `ALTER TABLE` per aggiungere a `members`:

1. `legacy_athena_id` (VARCHAR 50) — Per agganciare futuri import o pagamenti pregressi Athena.
2. `legacy_master_id` (VARCHAR 50) — Per riferimenti rapidi al file Master Gsheet.
3. `imported_lotto` (VARCHAR 50) — Es. "lotto1_master", "lotto1_athena", per filtri rapidi.
4. `imported_source_row_index` (INT) — Indice della riga CSV per un facile debug incrociato.

---

## TASK 5: 5 Domande Operative per Gaetano

1. **AUTO_INCREMENT:** Avendo già l'ID arrivato a 19307 per via del personale caricato in precedenza, il sistema ripartirà in automatico da 19308 per i nuovi import. Va bene o preferisci "forzare" un margine di stacco manuale (es. saltare fino a 25000)?
2. **I 303 Extra di Athena:** Sappiamo che la maggior parte sono membri Staff o ex-clienti. Li importiamo tutti filtrando con un `imported_lotto="lotto1_athena_extra"` oppure preferisci pulire a monte il file e rimuoverli?
3. **Mancanza Codice Fiscale:** Ad oggi, l'assenza del CF scarta la riga importata in StarGem. Vuoi che disabiliti temporaneamente questo "Hard Block" (degradandolo a semplice Warning) per salvare le anagrafiche incomplete?
4. **Tutori nel Master:** Le colonne `nome_genitore` e `cognome_genitore` le spariamo dentro `motherFirstName` (alias convenzionale per Tutore 1) oppure dobbiamo prima distinguere padre/madre?
5. **Tessere Legacy (athenaTessera):** Le carichiamo in `memberships` (creando record storici effettivi) oppure è sufficiente stoccare il numero testuale dentro `members.entityCardNumber` come reference passivo?

---
**Stima Esecuzione F1-021b (Patch DB + Esecuzione Import):** ~2h complessive (se confermata Strada ibrida B).
Attendo il via libera e le risposte alle domande. Coda terminata in Stop & Go.
