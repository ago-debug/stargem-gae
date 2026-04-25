Aggiornato al: 2026-04-25 12:05

# 📊 STATO DB REALE — 25/04/2026 12:05
## Import completato — riepilogo

### Tabelle e record
| Tabella | Record |
| --- | --- |
| `enrollments` | 13.584 |
| `cities` | 8.062 |
| `members` | 4.489 |
| `payments` | 3.775 |
| `memberships` | 3.281 |
| `medical_certificates` | 2.770 |
| `user_activity_logs` | 2.084 |
| `courses` | 586 |

### Dettaglio per tabella

#### `members`
- **Colonne principali**: `id` (int), `first_name`, `last_name`, `fiscal_code`, `date_of_birth`, `crm_profile_level`, `data_quality_flag` (varchar/date)
- **Fonte import**: `athena_anagrafica` (P1/P2)
- **Visibile in UI**: Sì (Anagrafica completa)
- **Note**: Importati storici, data quality flag attivi per bonifica.

#### `memberships`
- **Colonne principali**: `id`, `member_id` (int), `membership_number`, `barcode` (varchar), `issue_date`, `expiry_date` (date), `status`, `fee` (varchar/decimal)
- **Fonte import**: `athena_tessere` (P1)
- **Visibile in UI**: Sì (Tab Tessere e modulo GemPass)
- **Note**: Collegamento `member_id` essenziale. `barcode` generato durante l'import.

#### `enrollments`
- **Colonne principali**: `id`, `member_id`, `course_id` (int), `enrollment_date` (timestamp), `status`, `participation_type` (varchar)
- **Fonte import**: `athena_iscrizioni` e foglio workshop (P3/P4)
- **Visibile in UI**: Parziale (visibile in Elenco Iscritti per Attività)
- **Note**: Rigenera e collega i `courses` mancanti on-the-fly.

#### `payments`
- **Colonne principali**: `id`, `member_id`, `enrollment_id` (int), `amount`, `total_quota`, `deposit` (decimal), `type`, `status`, `payment_method`, `source`, `operator_name` (varchar), `paid_date`, `transfer_confirmation_date` (date)
- **Fonte import**: `gsheets_master` (P5) e foglio workshop (P4)
- **Visibile in UI**: Parziale (visibili solo importi e date in Scheda Contabile, mancano metadati)
- **Note**: Mappatura complessa (sz1-sz4 e gbrh). `source` usato per canale "vendita". `operator_name` usato per "chi_scrive".

#### `medical_certificates`
- **Colonne principali**: `id`, `member_id` (int), `issue_date`, `expiry_date` (date), `status` (varchar)
- **Fonte import**: `athena_anagrafica` (P2)
- **Visibile in UI**: Sì (Anagrafica -> tab Scadenze Mediche)
- **Note**: Importati solo certificati validi.

#### `courses`
- **Colonne principali**: `id`, `category_id`, `studio_id` (int), `name`, `sku`, `day_of_week`, `start_time`, `end_time` (varchar)
- **Fonte import**: Iscrizioni e Workshop (P3/P4)
- **Visibile in UI**: Sì (Gestione Corsi / Planning)
- **Note**: Tabella alimentata "dal basso" a partire dalle iscrizioni pregresse.

### Flag qualità members
- `NULL`: 2361
- `tessera_mancante_da_assegnare`: 1322
- `omonimo_da_verificare`: 407
- `mancano_dati_obbligatori`: 198
- `nome_match`: 179
- `incompleto`: 20
- `creato_da_iscrizioni`: 2

### Metodi pagamento
- `bonifico_poste`: 1299
- `bonifico_bpm`: 1220
- `cash`: 616
- `contanti`: 518 *(provenienti da import P4 workshop)*
- `NULL`: 55 *(voucher gbrh)*
- `welcomekit`: 35
- `online`: 32

### Campi nascosti UI da sbloccare
- **Anagrafica**: Sbloccare in dashboard admin la visibilità di `data_quality_flag` per favorire il lavoro di bonifica.
- **Tessere / GemPass**: Rendere visibili `issue_date`, `barcode`, `fee` e `previous_membership_number`.
- **Iscritti**: Aggiungere colonne `status` (attivo/sospeso/cancellato) e `participation_type` nella tabella iscritti.
- **Scheda Contabile**: Aggiungere le colonne `operator_name`, `source` (canale di vendita), `transfer_confirmation_date`, `receipts_count`, `deposit` e `total_quota` al Data Table contabile.


## EXPORT WIZARD — implementato 25/04/2026
Componente: ExportWizard.tsx
Formati: CSV + Excel (XLSX streaming)
PDF: in sviluppo futuro
Sezioni con export:
  members · payments · accounting-sheet
  courses · workshops · studio-bookings
  reports · gemteam · maschera-input
  anagrafica-home
Route backend: POST /api/export
  (streaming ExcelJS per XLSX)
Import unificato: /importa
  con dry-run + logica aggiornamento
  + report CSV post-import
