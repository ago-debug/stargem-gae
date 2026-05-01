Aggiornato al: 2026-04-28 13:00

# REPORT ANALISI CLEANUP DB (Preparazione Chat_25)
*Documento di sola lettura/analisi generato per guidare la futura sessione operativa di DB Cleanup.*

---

## FASE A — Tabelle "Spazzatura" (DROP Candidati Sicuri)
Le seguenti 9 tabelle sono state generate come backup manuali durante le operazioni di import/update massivi ad Aprile 2026. Non appartengono allo schema Drizzle ufficiale.

| Tabella Backup | Record Attuali | Verdetto |
|---|---|---|
| `enrollments_backup_op1235_2026_04_26_09_4` | 13.581 | ✅ DROP SICURO |
| `memberships_backup_op1235_2026_04_26_09_4` | 3.281 | ✅ DROP SICURO |
| `medical_certs_backup_op1235_2026_04_26_09_4` | 2.770 | ✅ DROP SICURO |
| `courses_backup_op1235_2026_04_26_09_4` | 586 | ✅ DROP SICURO |
| `courses_backup_op4_allenamento_2026_04_26_09_3` | 586 | ✅ DROP SICURO |
| `courses_pre_holidays_2026_04_25_16_3` | 586 | ✅ DROP SICURO |
| `courses_pre_internaltags_2026_04_25_17_4` | 586 | ✅ DROP SICURO |
| `courses_pre_sku_2026_04_25_15_4` | 586 | ✅ DROP SICURO |
| `courses_backup_op7_final_2026_04_26_09_4` | 242 | ✅ DROP SICURO |

**Verifica Grep / Drizzle:** Nessuna di queste tabelle è referenziata in `shared/schema.ts`, nei file di migrazione `.sql` o nel codebase.
**Azione Consigliata (Futura):**
```sql
DROP TABLE IF EXISTS enrollments_backup_op1235_2026_04_26_09_4, memberships_backup_op1235_2026_04_26_09_4, medical_certs_backup_op1235_2026_04_26_09_4, courses_backup_op1235_2026_04_26_09_4, courses_backup_op4_allenamento_2026_04_26_09_3, courses_pre_holidays_2026_04_25_16_3, courses_pre_internaltags_2026_04_25_17_4, courses_pre_sku_2026_04_25_15_4, courses_backup_op7_final_2026_04_26_09_4;
```

---

## FASE B — Tabelle "Vuote" a Schema (COUNT = 0)
Queste tabelle sono presenti nello schema ufficiale (`schema.ts`) ma attualmente contengono 0 record in produzione.

| Tabella | Modulo Logico | Referenze Backend/UI | Verdetto |
|---|---|---|---|
| `access_logs` | Security | Presente in API auth | ⚠️ DUBBIA (Log spenti?) |
| `activities` | Gemdario (Old) | Sostituita da STI in `courses` | ❌ DEPRECATA (da droppare) |
| `audit_logs` | System | Presente in `schema.ts` | ⚠️ DUBBIA |
| `carnet_sessions` / `carnet_wallets` | Contabilità | Pagine UI Kiosk/Wallet | 🔵 USATA IN FUTURO |
| `custom_reports` | Admin | Non attivamente usata | ⚠️ DUBBIA |
| `gem_conversations` / `gem_messages` | Gemory (Chat) | Non lanciato | 🔵 USATA IN FUTURO |
| `member_discounts` | Contabilità | Schema.ts | 🔵 USATA IN FUTURO |
| `member_relationships` | Anagrafica | Form anagrafico | ⚠️ DUBBIA (Dovrebbe aver dati!) |
| `notifications` | System | Componente Navbar | 🔵 USATA IN FUTURO |
| `payslips` | GemStaff | Modulo Buste Paga | 🔵 USATA IN FUTURO |
| `sessions` | Auth | Ex store sessioni? | ❌ DEPRECATA (Usiamo `express_sessions`) |
| `staff_presenze`, `staff_sostituzioni` | GemStaff | Route `staff_presenze` attive | 🔵 USATA IN FUTURO |
| `studio_bookings` | Booking | Route `/api/studios` | ⚠️ DUBBIA (Dovrebbe aver dati) |
| `team_documents`, `team_leave_requests`, `team_tasks` | GemTeam | Moduli HR | 🔵 USATA IN FUTURO |
| `universal_enrollments` | Gemdario (Old) | Tentativo unificazione fallito | ❌ DEPRECATA (da droppare) |

*Nota Frontend:* F2 ha verificato che le tabelle marcate come DEPRECATE (`activities`, `universal_enrollments`) non hanno fetch/queries attive in `client/src/pages/`.

---

## FASE C — Ottimizzazione Row Size Tabella `members`
La tabella `members` ha raggiunto 174 colonne, causando sporadici avvisi di *Row Size Limit* di MySQL (limite rigido a 65.535 bytes per riga, escludendo i campi TEXT/BLOB).

**Stato Attuale:**
- Colonne VARCHAR: 129
- Colonne TEXT/LONGTEXT: 12

**Candidate per migrazione da VARCHAR a TEXT:**
Cambiare colonne "lunghe" che non necessitano di indicizzazione in `TEXT` esclude il loro peso dal row size limit, liberando circa 4.000-6.000 bytes.

| Colonna | Tipo Attuale | Utilizzo (Grep) | Risparmio Stima |
|---|---|---|---|
| `social_facebook`, `social_instagram`, `social_tiktok`, `social_youtube`, `website`, `drive_folder_url` | VARCHAR(255/500) | Solo read/write passivo in Scheda Utente. Mai usate in WHERE. | ~1.500 bytes |
| `company_name`, `company_address`, `education_institute`, `education_title` | VARCHAR(200/255) | Mostrate in anagrafica aziendale, rare query. | ~1.000 bytes |
| `emergency_contact1_email`, `emergency_contact2_email`, `emergency_contact3_email` | VARCHAR(255) | Solo mostrate in emergenza. | ~765 bytes |
| `alias`, `from_where`, `profession` | VARCHAR(100/255) | Statistiche/Anagrafica generica. | ~500 bytes |

**Conclusione Conservativa:** Nessun campo viene rimosso. Al momento di aprire Chat_25, genereremo una migrazione Drizzle (`ALTER TABLE members MODIFY ... TEXT`) esclusivamente per questi campi secondari, risolvendo il rischio limite.
