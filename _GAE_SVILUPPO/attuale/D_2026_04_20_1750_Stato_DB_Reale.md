Aggiornato al: 2026-04-20 17:50

# 📊 STATO DB REALE — Audit Aggiornato
Data e orario aggiornamento: 2026-04-20 17:50

## Tabelle attive con dati reali

| Tabella | Record | Note |
|---------|--------|------|
| `members` | **90** | Anagrafica attuale in produzione |
| `memberships` | **89** | Tessere emesse |
| `users` | **19** | Account staff attivi |
| `courses` | **409** | Attività STI |
| `activities` | **1.274** | Attività dettaglio |
| `activity_details` | **428** | Dettagli attività |
| `team_attendance_logs` | **2.078** | Log presenze GemTeam |
| `team_scheduled_shifts` | **17** | Turni programmati (Drastico calo - *probabile "WIPE settimana"* per via del deploy 035) |
| `team_shift_templates` | **1** | Template turni (*Calo per cancellazione massiva precedente/test*) |
| `strategic_events` | **10** | Pianificazione + Festa Lavoratori 2026 (*pulizia F1-002 effettuata*) |
| `team_monthly_reports` | **28** | Report mensili team |
| `team_employees` | **16** | Dipendenti GemTeam |
| `team_postazioni` | **25** | Postazioni configurate |
| `team_activity_types` | **36** | Tipi attività team |
| `user_activity_logs` | **2.084** | Log attività utenti |
| `express_sessions` | **118** | Sessioni auth attive |
| `user_session_segments` | **304** | Segmenti sessione presenza online |
| `cities` | **8.062** | Comuni italiani |
| `provinces` | **107** | Province |
| `promo_rules` | **50** | Codici promo |
| `price_matrix` | **22** | Matrice prezzi |
| `company_agreements` | **11** | Convenzioni aziendali |
| `custom_list_items` | **235** | Voci liste configurabili |
| `quotes` | **12** | Preventivi |
| `enroll_details` | **13** | Dettagli iscrizioni |
| `universal_enrollments` | **18** | Iscrizioni attive |
| `instructor_agreements` | **8** | Accordi insegnanti |
| `pricing_rules` | **7** | Regole prezzo |
| `user_roles` | **7** | Ruoli utente |
| `cost_centers` | **7** | Centri di costo |
| `cli_cats` | **6** | Categorie cliente |
| `pay_notes` | **28** | Note pagamenti |
| `todos` | **6** | Todo list |
| `team_notes` | **28** | Note team |
| `team_comments` | **15** | Commenti team |
| `accounting_periods` | **30** | Periodi contabili |
| `welfare_providers` | **4** | Provider welfare |
| `studios` | **13** | Sale fisiche |
| `seasons` | **2** | Stagioni |
| `booking_services` | **3** | Servizi booking |
| `rental_categories` | **9** | Categorie affitto |
| `wc_product_mapping` | **8** | Mapping WooCommerce |
| `team_checkin_events` | **3** | Check-in events |
| `journal_entries` | **1** | Prima nota |
| `deprecation_logs` | **1** | Log deprecazione |
| `member_forms_submissions` | **1** | Firme documenti |
| `pagodil_tiers` | **3** | Scaglioni Pagodil |
| `import_configs` | **2** | Config import |
| `webhook_logs` | **2** | Log webhook |

## Tabelle a ZERO record (vuote)
> [!NOTE]
> Queste tabelle sono presenti nello schema ma non contengono alcun dato attualmente.

- `payments` · `enrollments` · `attendances` · `payment_methods` · `medical_certificates`
- `access_logs` · `studio_bookings` · `carnet_wallets` · `carnet_sessions`
- `staff_presenze` · `staff_sostituzioni` · `payslips` · `staff_contracts_compliance`
- `staff_document_signatures` · `staff_disciplinary_log` · `member_relationships`
- `member_uploads` · `member_packages` · `member_duplicate_exclusions`
- `messages` · `countries` · `ws_cats` · `sun_cats` · `cmp_cats` · `rec_cats` · `vac_cats`
- `sub_types` · `global_enrollments` · `team_shifts` · `team_tasks` · `team_documents`
- `team_document_versions` · `team_week_assignments` · `team_maintenance_tickets`
- `team_handover_notes` · `team_employee_activity_log` · `team_document_alerts`
- `team_note_reactions` · `team_profile_change_requests` · `team_leave_requests`
- `crm_leads` · `crm_campaigns` · `maintenance_tickets` · `gem_conversations`
- `gem_messages` · `member_discounts` · `notifications` · `audit_logs` · `sessions`
- `tenants` · `activity_categories` · `merchandising_categories` · `system_configs`
- `custom_reports` · `knowledge`

## ⚠️ Criticità DB
> [!WARNING]
> Rilevanze e discrepanze di schema persistenti da analizzare.

1. **Iscrizioni duplicate** — tabella ufficiale = `universal_enrollments` (attualmente 18)
2. **Categorie frammentate** — 14 tabelle categorie ancora esistenti a database. Consolidamento logico ancora da ultimare.
3. **Mancanza dati contabili** — `payments` = 0. Il modulo cassa non è ancora completamente agganciato a regime in produzione.
4. ~~`team_shift_templates_BAK_F1_030`~~ — **RIMOSSA** ✅ Protocollo F1-032.

## 2026-04-20 17:15 - Pulizia Dati (GemTeam)
- Svuotati `team_attendance_logs` (da 2079 a 0 veri, + 2 test odierni) e `team_checkin_events` (mock eliminati, rimasti solo bot e admin).
- Troncato ed azzerato storicamente `team_monthly_reports` per far partire le statistiche pulite in produzione.
