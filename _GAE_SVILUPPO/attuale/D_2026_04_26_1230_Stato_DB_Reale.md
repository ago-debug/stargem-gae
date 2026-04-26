Aggiornato al: 2026-04-26 12:30

# 📊 STATO DB REALE — 26/04/2026 12:30
## Import e Bonifica completata — riepilogo

### Tabelle e record (Dati aggiornati Post-Bonifica Aprile)
| Tabella | Record |
| --- | --- |
| `enrollments` | ~13.560 (epurati 24 orfani) |
| `cities` | 8.062 |
| `members` | 4.489 |
| `payments` | 3.775 |
| `memberships` | ~3.305 (+24 recuperati da storici) |
| `medical_certificates` | ~2.867 (+97 recuperati DTYURI) |
| `user_activity_logs` | 2.084 |
| `courses` | 586 |

*(Note: Le cifre esatte dei record minori fluttuano con l'utilizzo giornaliero, i valori indicano la baseline post-pulizia).*

### Dettaglio per tabella

#### `members`
- **Colonne principali**: `id` (int), `first_name`, `last_name`, `fiscal_code`, `date_of_birth`, `crm_profile_level`, `data_quality_flag` (varchar/date)
- **Visibile in UI**: Sì (Anagrafica completa)

#### `memberships`
- **Colonne principali**: `id`, `member_id` (int), `membership_number`, `barcode` (varchar), `issue_date`, `expiry_date` (date), `status`, `fee` (varchar/decimal)
- **Visibile in UI**: Sì (Tab Tessere e modulo GemPass)

#### `enrollments`
- **Colonne principali**: `id`, `member_id`, `course_id` (int), `enrollment_date` (timestamp), `status`, `participation_type` (varchar), `season_id` (int)
- **Visibile in UI**: Parziale (visibile in Elenco Iscritti per Attività)
- **Note**: Applicato vincolo `season_id` obbligatorio.

#### `payments`
- **Colonne principali**: `id`, `member_id`, `enrollment_id` (int), `amount`, `total_quota`, `deposit` (decimal), `type`, `status`, `payment_method`, `source`, `operator_name` (varchar), `paid_date`, `transfer_confirmation_date` (date)
- **Visibile in UI**: Parziale (visibili solo importi e date in Scheda Contabile, mancano metadati)

#### `medical_certificates`
- **Colonne principali**: `id`, `member_id` (int), `issue_date`, `expiry_date` (date), `status` (varchar)
- **Visibile in UI**: Sì (Anagrafica -> tab Scadenze Mediche)

#### `courses`
- **Colonne principali**: `id`, `category_id`, `studio_id` (int), `name`, `sku`, `day_of_week`, `start_time`, `end_time` (varchar), `activity_type` (varchar)
- **Visibile in UI**: Sì (Gestione Corsi / Planning)
- **Note**: Puliti e normalizzati 285 SKU attività in type corretti (`workshop`, `allenamenti`, ecc).

### Campi nascosti UI da sbloccare
- **Anagrafica**: Sbloccare in dashboard admin la visibilità di `data_quality_flag` per favorire il lavoro di bonifica.
- **Tessere / GemPass**: Rendere visibili `issue_date`, `barcode`, `fee` e `previous_membership_number`.
- **Iscritti**: Aggiungere colonne `status` (attivo/sospeso/cancellato) e `participation_type` nella tabella iscritti.
- **Scheda Contabile**: Aggiungere le colonne `operator_name`, `source` (canale di vendita), `transfer_confirmation_date`, `receipts_count`, `deposit` e `total_quota` al Data Table contabile.

## EXPORT WIZARD & SMART IMPORT
- **ExportWizard.tsx**: CSV + Excel (XLSX streaming) attivo su members, payments, accounting-sheet, courses, workshops, studio-bookings, reports, gemteam, maschera-input, anagrafica-home.
- **Smart Import**: `/api/import/mapped` intercetta e devia quote e visite mediche automaticamente. Usa un `cf-validator.ts` con algoritmo completo.
