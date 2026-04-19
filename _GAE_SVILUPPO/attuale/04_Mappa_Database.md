# MAPPATURA COMPLETA DATABASE STARGEM V2
Data: 2026-04-19

> [!NOTE]
> Mappa generata automaticamente interfacciandosi con la base dati MariaDB, i file Drizzle (schema.ts), le route (server/routes.ts) e l'Abstract Syntax Tree di React del frontend.

## SEZIONE A — Tabella riepilogativa generale

| Nome Tabella | Record Attuali | Scopo funzionale | Modulo | API Collegata | UI Collegata | Criticità |
|---|---|---|---|---|---|---|
| users | 19 | Dati per users | Core | POST /api/gemstaff/crea-account/:memberId<br>GET /api/gemteam/dipendenti | commenti, gemstaff, gemteam-me, gemteam, utenti-permessi | Nessuna |
| user_session_segments | 137 | Dati per user session segments | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| messages | 0 | Dati per messages | Core |  | area-tesserati | Tabella vuota inattiva |
| countries | 0 | Dati per countries | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| provinces | 107 | Dati per provinces | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| cities | 8062 | Dati per cities | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| custom_lists | 17 | Dati per custom lists | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| custom_list_items | 235 | Dati per custom list items | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| categories | 5 | Dati per categories | Core |  | anagrafica-home, attivita, booking-service-categories, booking-services, calendar, campus-activities, campus-categories, categories, client-categories, courses, individual-lessons, knowledge-base, maschera-input-generale, member-dashboard, members, merchandising-categories, recitals, rentals-categories, sunday-activities, trainings, vacation-categories, vacation-studies, workshops | Record presenti ma isolati |
| ws_cats | 0 | Dati per ws cats | Core |  | attivita | Tabella vuota inattiva |
| sun_cats | 0 | Dati per sun cats | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| trn_cats | 5 | Dati per trn cats | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| ind_less_cats | 5 | Dati per ind less cats | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| cmp_cats | 0 | Dati per cmp cats | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| rec_cats | 0 | Dati per rec cats | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| vac_cats | 0 | Dati per vac cats | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| cli_cats | 6 | Dati per cli cats | Core |  | anagrafica-home, member-dashboard, members | Record presenti ma isolati |
| sub_types | 0 | Dati per sub types | Core |  | anagrafica-home, members | Tabella vuota inattiva |
| act_statuses | 12 | Dati per act statuses | Core |  | calendar, courses, workshops | Record presenti ma isolati |
| pay_notes | 28 | Dati per pay notes | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| enroll_details | 13 | Dati per enroll details | Core |  | maschera-input-generale | Record presenti ma isolati |
| participant_types | 7 | Dati per participant types | Core |  | members | Record presenti ma isolati |
| studios | 13 | Dati per studios | Core |  | anagrafica-home, attivita, calendar, courses, gestione-note, maschera-input-generale, studio-bookings, studios, utenti-permessi, workshops | Record presenti ma isolati |
| courses | 409 | Dati per courses | Core |  | access-control, accounting-sheet, anagrafica-home, attivita, calendar, campus-activities, courses, gemstaff, individual-lessons, iscritti_per_attivita, listini, maschera-input-generale, member-dashboard, members, payments, planning, reports, scheda-campus, scheda-corso, studio-bookings, trainings | Record presenti ma isolati |
| members | 90 | Dati per members | Core | GET /api/members/entity-cards<br>GET /api/members/export-csv | access-control, accounting-sheet, anagrafica-home, calendar, card-generator, dashboard, gempass, gemstaff-me, gemstaff, gemteam-me, gemteam, import-data, maschera-input-generale, member-dashboard, members, memberships, payments, reports, scheda-allenamento, scheda-campus, scheda-corso, scheda-domenica, scheda-lezione-individuale, scheda-saggio, scheda-vacanza-studio, scheda-workshop, studio-bookings | Nessuna |
| member_duplicate_exclusions | 0 | Dati per member duplicate exclusions | GemPass |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| staff_presenze | 0 | Dati per staff presenze | GemStaff | GET /api/gemstaff/me<br>GET /api/gemstaff/presenze/:month/:year | gemstaff-me, gemstaff | Nessuna |
| staff_sostituzioni | 0 | Dati per staff sostituzioni | GemStaff | GET /api/gemstaff/sostituzioni/:month/:year<br>POST /api/gemstaff/sostituzioni | gemstaff | Nessuna |
| payslips | 0 | Dati per payslips | Core | GET /api/gemstaff/me<br>GET /api/gemstaff/payslips/:memberId | gemstaff-me | Nessuna |
| enrollments | 0 | Dati per enrollments | Core |  | access-control, accounting-sheet, anagrafica-home, area-tesserati, audit-logs, calendar, courses, dashboard, import-data, iscritti_per_attivita, maschera-input-generale, member-dashboard, members, payments, reports, scheda-allenamento, scheda-campus, scheda-corso, scheda-domenica, scheda-lezione-individuale, scheda-saggio, scheda-vacanza-studio, scheda-workshop, workshops | Tabella vuota inattiva |
| member_packages | 0 | Dati per member packages | GemPass |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| memberships | 89 | Dati per memberships | Core | GET /api/public/membership-status/:code<br>POST /api/gempass/tessere | access-control, accounting-sheet, anagrafica-home, dashboard, gempass, gemstaff-me, gemstaff, import-data, maschera-input-generale, member-dashboard, members, memberships, payments | Nessuna |
| medical_certificates | 0 | Dati per medical certificates | Core |  | access-control, member-dashboard | Tabella vuota inattiva |
| access_logs | 0 | Dati per access logs | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| payment_methods | 0 | Dati per payment methods | Core |  | accounting-sheet, anagrafica-home, calendar, member-dashboard, payments, studio-bookings | Tabella vuota inattiva |
| payments | 0 | Dati per payments | Core |  | access-control, accounting-sheet, anagrafica-home, area-tesserati, audit-logs, dashboard, import-data, iscrizioni-pagamenti, maschera-input-generale, member-dashboard, members, payments, reports, scheda-allenamento, scheda-campus, scheda-corso, scheda-domenica, scheda-lezione-individuale, scheda-saggio, scheda-vacanza-studio, scheda-workshop | Tabella vuota inattiva |
| attendances | 0 | Dati per attendances | Core |  | anagrafica-home, calendar, courses, member-dashboard, members, reports, scheda-allenamento, scheda-campus, scheda-corso, scheda-domenica, scheda-lezione-individuale, scheda-saggio, scheda-vacanza-studio, scheda-workshop, workshops | Tabella vuota inattiva |
| custom_reports | 0 | Dati per custom reports | Core |  | reports | Tabella vuota inattiva |
| import_configs | 2 | Dati per import configs | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| knowledge | 0 | Dati per knowledge | Core |  | knowledge, maschera-input-generale, utenti-permessi | Tabella vuota inattiva |
| team_comments | 15 | Dati per team comments | GemTeam |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| team_notes | 28 | Dati per team notes | GemTeam |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| todos | 6 | Dati per todos | Core |  | todo-list | Record presenti ma isolati |
| merchandising_categories | 0 | Dati per merchandising categories | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| rental_categories | 9 | Dati per rental categories | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| booking_service_categories | 3 | Dati per booking service categories | Booking |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| booking_services | 3 | Dati per booking services | Booking |  | calendar, iscritti_per_attivita, maschera-input-generale, planning, studio-bookings | Record presenti ma isolati |
| studio_bookings | 0 | Dati per studio bookings | Core |  | accounting-sheet, calendar, payments | Tabella vuota inattiva |
| system_configs | 0 | Dati per system configs | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| user_activity_logs | 1782 | Dati per user activity logs | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| seasons | 2 | Dati per seasons | Core | GET /api/area-tesserati/profile | StrategicProgrammingTable, accounting-sheet, area-tesserati, calendar, courses, gempass, planning, quote-promo, reset-stagione, workshops | Nessuna |
| price_lists | 6 | Dati per price lists | Core |  | listini | Record presenti ma isolati |
| quotes | 12 | Dati per quotes | Core |  | calendar, courses, listini, quote-listini, workshops | Record presenti ma isolati |
| course_quotes_grid | 9 | Dati per course quotes grid | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| price_list_items | 14 | Dati per price list items | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| notifications | 0 | Dati per notifications | Core |  | commenti | Tabella vuota inattiva |
| audit_logs | 0 | Dati per audit logs | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| tenants | 0 | Dati per tenants | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| activity_categories | 0 | Dati per activity categories | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| activities | 1274 | Dati per activities | Core |  | StrategicProgrammingTable, attivita, auth-page, calendar, elenchi, iscritti_per_attivita, listini-home, listini, maschera-input-generale, planning, scheda-domenica, sunday-activities, utenti-permessi | Record presenti ma isolati |
| global_enrollments | 0 | Dati per global enrollments | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| team_shifts | 0 | Dati per team shifts | GemTeam |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| maintenance_tickets | 0 | Dati per maintenance tickets | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| crm_leads | 0 | Dati per crm leads | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| crm_campaigns | 0 | Dati per crm campaigns | Core |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| strategic_events | 28 | Dati per strategic events | Core | GET /api/gemteam/turni/eventi-giorno | StrategicProgrammingTable, calendar, gemteam, planning | Nessuna |
| promo_rules | 50 | Dati per promo rules | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| carnet_sessions | 0 | Dati per carnet sessions | Carnet |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| agreement_monthly_overrides | 3 | Dati per agreement monthly overrides | Core |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| staff_rates | 3 | Dati per staff rates | GemStaff |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| member_forms_submissions | 1 | Dati per member forms submissions | GemPass | POST /api/gempass/firme<br>GET /api/gempass/firme/:memberId | gempass | Nessuna |
| team_employees | 16 | Dati per team employees | GemTeam | GET /api/gemteam/dipendenti<br>PATCH /api/gemteam/dipendenti/reorder | gemteam-me, gemteam | Nessuna |
| team_shift_diary_entries | 5 | Dati per team shift diary entries | GemTeam | POST /api/gemteam/diario<br>GET /api/gemteam/diario/:employee_id/:data |  | Nessuna |
| team_document_alerts | 0 | Dati per team document alerts | GemTeam |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| team_notifications | 0 | Dati per team notifications | GemTeam | POST /api/gemteam/turni/scheduled<br>PATCH /api/gemteam/turni/scheduled/:id | gemteam | Nessuna |
| team_postazioni | 25 | Dati per team postazioni | GemTeam | GET /api/gemteam/postazioni<br>POST /api/gemteam/postazioni | gemteam | Nessuna |
| staff_contracts_compliance | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| user_roles | 7 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_tasks | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| staff_document_signatures | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| pricing_rules | 7 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_profile_change_requests | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| cost_centers | 7 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_leave_requests | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| activity_details | 428 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_monthly_reports | 28 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| pagodil_tiers | 3 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| gem_conversations | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| team_activity_types | 36 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| instructor_agreements | 8 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_shift_templates_BAK_F1_030 | 550 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| team_documents | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| gem_messages | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| wc_product_mapping | 8 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_scheduled_shifts | 225 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| team_shift_templates | 550 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| carnet_wallets | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| welfare_providers | 4 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| staff_disciplinary_log | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| member_uploads | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| journal_entries | 1 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_checkin_events | 1 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| company_agreements | 11 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_document_versions | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| webhook_logs | 2 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| accounting_periods | 30 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| member_relationships | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| team_week_assignments | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| price_matrix | 22 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| team_maintenance_tickets | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| team_attendance_logs | 2077 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Record presenti ma isolati |
| express_sessions | 150 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| sessions | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| team_note_reactions | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| universal_enrollments | 18 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| deprecation_logs | 1 | Tabella orfana o non mappata | Legacy/System |  |  | Record presenti ma isolati |
| member_discounts | 0 | Tabella orfana o non mappata | Legacy/System |  |  | Tabella vuota inattiva |
| team_employee_activity_log | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |
| team_handover_notes | 0 | Tabella orfana o non mappata | GemTeam Legacy |  |  | Nessuna route/UI collegata \| Tabella vuota inattiva |

## SEZIONE B — Analisi tabelle a zero record

> [!WARNING]
> Molte tabelle a record zero sono figlie di moduli in via di completamento o retaggi legacy. 

- **messages**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **countries**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **ws_cats**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **sun_cats**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **cmp_cats**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **rec_cats**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **vac_cats**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **sub_types**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **member_duplicate_exclusions**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **staff_presenze**: Funzionalità implementata ma dati non ancora inseriti (Fase futura/Staging). Nessuna
- **staff_sostituzioni**: Funzionalità implementata ma dati non ancora inseriti (Fase futura/Staging). Nessuna
- **payslips**: Funzionalità implementata ma dati non ancora inseriti (Fase futura/Staging). Nessuna
- **enrollments**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **member_packages**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **medical_certificates**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **access_logs**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **payment_methods**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **payments**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **attendances**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **custom_reports**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **knowledge**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **merchandising_categories**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **studio_bookings**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **system_configs**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **notifications**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **audit_logs**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **tenants**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **activity_categories**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **global_enrollments**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_shifts**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **maintenance_tickets**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **crm_leads**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **crm_campaigns**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **carnet_sessions**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_document_alerts**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_notifications**: Funzionalità implementata ma dati non ancora inseriti (Fase futura/Staging). Nessuna
- **staff_contracts_compliance**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **team_tasks**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **staff_document_signatures**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **team_profile_change_requests**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_leave_requests**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **gem_conversations**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **team_documents**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **gem_messages**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **carnet_wallets**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **staff_disciplinary_log**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **member_uploads**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **team_document_versions**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **member_relationships**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **team_week_assignments**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_maintenance_tickets**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **sessions**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **team_note_reactions**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **member_discounts**: Tabella orfana o funzionalità non attiva/mai completata. Tabella vuota inattiva
- **team_employee_activity_log**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_handover_notes**: Tabella orfana o funzionalità non attiva/mai completata. Nessuna route/UI collegata \| Tabella vuota inattiva

## SEZIONE C — Mappa Route → Tabella → Frontend

### Modulo: Booking
- Nessun tracciamento API/UI attivo identificato per questo modulo.

### Modulo: Carnet
- Nessun tracciamento API/UI attivo identificato per questo modulo.

### Modulo: Core
- **users**: UI [commenti, gemstaff, gemteam-me, gemteam, utenti-permessi] → API [POST /api/gemstaff/crea-account/:memberId, GET /api/gemteam/dipendenti] → DB
- **members**: UI [access-control, accounting-sheet, anagrafica-home, calendar, card-generator, dashboard, gempass, gemstaff-me, gemstaff, gemteam-me, gemteam, import-data, maschera-input-generale, member-dashboard, members, memberships, payments, reports, scheda-allenamento, scheda-campus, scheda-corso, scheda-domenica, scheda-lezione-individuale, scheda-saggio, scheda-vacanza-studio, scheda-workshop, studio-bookings] → API [GET /api/members/entity-cards, GET /api/members/export-csv, GET /api/members/export-csv-light, GET /api/public/membership-status/:code, POST /api/gempass/tessere, PATCH /api/gempass/tessere/:id/rinnova, GET /api/gempass/firme-all, GET /api/gempass/membro/:memberId/tessera, POST /api/gemstaff/crea-account/:memberId, GET /api/gemstaff/me, GET /api/gemstaff/insegnanti, GET /api/gemstaff/insegnanti/:id, PATCH /api/gemstaff/insegnanti/:id, GET /api/gemstaff/pt, GET /api/gemstaff/presenze/:month/:year, GET /api/gemstaff/sostituzioni/:month/:year, GET /api/gemteam/dipendenti, GET /api/gemteam/presenze/:anno/:mese, GET /api/gemteam/permessi, POST /api/import, GET /api/gemteam/turni/scheduled] → DB
- **payslips**: UI [gemstaff-me] → API [GET /api/gemstaff/me, GET /api/gemstaff/payslips/:memberId, GET /api/gemstaff/payslips/:memberId/:month/:year] → DB
- **memberships**: UI [access-control, accounting-sheet, anagrafica-home, dashboard, gempass, gemstaff-me, gemstaff, import-data, maschera-input-generale, member-dashboard, members, memberships, payments] → API [GET /api/public/membership-status/:code, POST /api/gempass/tessere, PATCH /api/gempass/tessere/:id/rinnova, GET /api/gempass/membro/:memberId/tessera, GET /api/gemstaff/me, GET /api/gemstaff/insegnanti/:id] → DB
- **seasons**: UI [StrategicProgrammingTable, accounting-sheet, area-tesserati, calendar, courses, gempass, planning, quote-promo, reset-stagione, workshops] → API [GET /api/area-tesserati/profile] → DB
- **strategic_events**: UI [StrategicProgrammingTable, calendar, gemteam, planning] → API [GET /api/gemteam/turni/eventi-giorno] → DB

### Modulo: GemPass
- **member_forms_submissions**: UI [gempass] → API [POST /api/gempass/firme, GET /api/gempass/firme/:memberId, GET /api/gempass/firme-all, GET /api/area-tesserati/documenti] → DB

### Modulo: GemStaff
- **staff_presenze**: UI [gemstaff-me, gemstaff] → API [GET /api/gemstaff/me, GET /api/gemstaff/presenze/:month/:year, GET /api/gemstaff/presenze/:memberId/:month/:year, POST /api/gemstaff/presenze, POST /api/gemstaff/presenze/conferma] → DB
- **staff_sostituzioni**: UI [gemstaff] → API [GET /api/gemstaff/sostituzioni/:month/:year, POST /api/gemstaff/sostituzioni, PATCH /api/gemstaff/sostituzioni/:id/visto] → DB

### Modulo: GemTeam
- **team_employees**: UI [gemteam-me, gemteam] → API [GET /api/gemteam/dipendenti, PATCH /api/gemteam/dipendenti/reorder, PATCH /api/gemteam/dipendenti/:id, GET /api/gemteam/presenze/:anno/:mese, POST /api/gemteam/checkin, GET /api/gemteam/permessi, POST /api/gemteam/permessi, POST /api/gemteam/report/genera/:anno/:mese, GET /api/gemteam/report/:anno/:mese, GET /api/gemteam/turni/scheduled] → DB
- **team_shift_diary_entries**: UI [Script/Postman] → API [POST /api/gemteam/diario, GET /api/gemteam/diario/:employee_id/:data, PATCH /api/gemteam/diario/:id/ok, DELETE /api/gemteam/diario/:id] → DB
- **team_notifications**: UI [gemteam] → API [POST /api/gemteam/turni/scheduled, PATCH /api/gemteam/turni/scheduled/:id, DELETE /api/gemteam/turni/scheduled/:id, PATCH /api/gemteam/notifiche/:id/letta] → DB
- **team_postazioni**: UI [gemteam] → API [GET /api/gemteam/postazioni, POST /api/gemteam/postazioni] → DB

### Modulo: GemTeam Legacy
- Nessun tracciamento API/UI attivo identificato per questo modulo.

### Modulo: Legacy/System
- Nessun tracciamento API/UI attivo identificato per questo modulo.

## SEZIONE D — Criticità e anomalie rilevate

> [!CAUTION]
> Questa sezione isola le componenti fuori standard identificati dall'ast di TypeScript. Tali tabelle hanno record attivi ma non sono legate a interfacce o servizi noti, oppure sono tabelle completamente vuote slegate.

- **user_session_segments**: Nessuna route/UI collegata \| Record presenti ma isolati
- **countries**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **provinces**: Nessuna route/UI collegata \| Record presenti ma isolati
- **cities**: Nessuna route/UI collegata \| Record presenti ma isolati
- **custom_lists**: Nessuna route/UI collegata \| Record presenti ma isolati
- **custom_list_items**: Nessuna route/UI collegata \| Record presenti ma isolati
- **categories**: Record presenti ma isolati
- **sun_cats**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **trn_cats**: Nessuna route/UI collegata \| Record presenti ma isolati
- **ind_less_cats**: Nessuna route/UI collegata \| Record presenti ma isolati
- **cmp_cats**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **rec_cats**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **vac_cats**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **cli_cats**: Record presenti ma isolati
- **act_statuses**: Record presenti ma isolati
- **pay_notes**: Nessuna route/UI collegata \| Record presenti ma isolati
- **enroll_details**: Record presenti ma isolati
- **participant_types**: Record presenti ma isolati
- **studios**: Record presenti ma isolati
- **courses**: Record presenti ma isolati
- **member_duplicate_exclusions**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **member_packages**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **access_logs**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **import_configs**: Nessuna route/UI collegata \| Record presenti ma isolati
- **team_comments**: Nessuna route/UI collegata \| Record presenti ma isolati
- **team_notes**: Nessuna route/UI collegata \| Record presenti ma isolati
- **todos**: Record presenti ma isolati
- **merchandising_categories**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **rental_categories**: Nessuna route/UI collegata \| Record presenti ma isolati
- **booking_service_categories**: Nessuna route/UI collegata \| Record presenti ma isolati
- **booking_services**: Record presenti ma isolati
- **system_configs**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **user_activity_logs**: Nessuna route/UI collegata \| Record presenti ma isolati
- **price_lists**: Record presenti ma isolati
- **quotes**: Record presenti ma isolati
- **course_quotes_grid**: Nessuna route/UI collegata \| Record presenti ma isolati
- **price_list_items**: Nessuna route/UI collegata \| Record presenti ma isolati
- **audit_logs**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **tenants**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **activity_categories**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **activities**: Record presenti ma isolati
- **global_enrollments**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_shifts**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **maintenance_tickets**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **crm_leads**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **crm_campaigns**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **promo_rules**: Nessuna route/UI collegata \| Record presenti ma isolati
- **carnet_sessions**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **agreement_monthly_overrides**: Nessuna route/UI collegata \| Record presenti ma isolati
- **staff_rates**: Nessuna route/UI collegata \| Record presenti ma isolati
- **team_document_alerts**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **user_roles**: Record presenti ma isolati
- **team_tasks**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **pricing_rules**: Record presenti ma isolati
- **team_profile_change_requests**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **cost_centers**: Record presenti ma isolati
- **team_leave_requests**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **activity_details**: Record presenti ma isolati
- **team_monthly_reports**: Nessuna route/UI collegata \| Record presenti ma isolati
- **pagodil_tiers**: Record presenti ma isolati
- **team_activity_types**: Nessuna route/UI collegata \| Record presenti ma isolati
- **instructor_agreements**: Record presenti ma isolati
- **team_shift_templates_BAK_F1_030**: Nessuna route/UI collegata \| Record presenti ma isolati
- **team_documents**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **wc_product_mapping**: Record presenti ma isolati
- **team_scheduled_shifts**: Nessuna route/UI collegata \| Record presenti ma isolati
- **team_shift_templates**: Nessuna route/UI collegata \| Record presenti ma isolati
- **welfare_providers**: Record presenti ma isolati
- **journal_entries**: Record presenti ma isolati
- **team_checkin_events**: Nessuna route/UI collegata \| Record presenti ma isolati
- **company_agreements**: Record presenti ma isolati
- **team_document_versions**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **webhook_logs**: Record presenti ma isolati
- **accounting_periods**: Record presenti ma isolati
- **team_week_assignments**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **price_matrix**: Record presenti ma isolati
- **team_maintenance_tickets**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_attendance_logs**: Nessuna route/UI collegata \| Record presenti ma isolati
- **express_sessions**: Record presenti ma isolati
- **team_note_reactions**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **universal_enrollments**: Record presenti ma isolati
- **deprecation_logs**: Record presenti ma isolati
- **team_employee_activity_log**: Nessuna route/UI collegata \| Tabella vuota inattiva
- **team_handover_notes**: Nessuna route/UI collegata \| Tabella vuota inattiva

> [!IMPORTANT]
> **Analisi Foreign Keys Opache (rotte/orfane):**
> Le seguenti tabelle contano relazioni inesistenti sul DB oppure a chiavi Drizzle che non vengono esposte o eliminate.
> - Tabella `carnet_sessions` ha una FK a schema.`carnetWallets` che non mappa o è opaca.
> - Tabella `agreement_monthly_overrides` ha una FK a schema.`instructorAgreements` che non mappa o è opaca.
> - Tabella `team_employees` ha una FK a schema.`teamShiftTemplates` che non mappa o è opaca.
> - Tabella `team_shift_diary_entries` ha una FK a schema.`teamScheduledShifts` che non mappa o è opaca.
> - Tabella `team_shift_diary_entries` ha una FK a schema.`teamActivityTypes` che non mappa o è opaca.
> - Tabella `team_shift_diary_entries` ha una FK a schema.`teamDocuments` che non mappa o è opaca.
> - Tabella `team_document_alerts` ha una FK a schema.`teamDocuments` che non mappa o è opaca.
> - Tabella `team_document_alerts` ha una FK a schema.`gemConversations` che non mappa o è opaca.

## SEZIONE E — Relazioni tra moduli

Individua quali costrutti superano i boundaries del proprio silo.

- [GemPass] `member_duplicate_exclusions` → [Core] `members`
- [GemStaff] `staff_presenze` → [Core] `members`
- [GemStaff] `staff_presenze` → [Core] `courses`
- [GemStaff] `staff_sostituzioni` → [Core] `members`
- [GemStaff] `staff_sostituzioni` → [Core] `courses`
- [Core] `studio_bookings` → [Booking] `booking_services`
- [GemTeam] `team_shifts` → [Core] `tenants`
- [GemTeam] `team_shifts` → [Core] `users`
- [GemTeam] `team_shifts` → [Core] `studios`
- [Carnet] `carnet_sessions` → [Core] `members`
- [Carnet] `carnet_sessions` → [Core] `seasons`
- [Carnet] `carnet_sessions` → [Core] `studios`
- [GemPass] `member_forms_submissions` → [Core] `members`
- [GemPass] `member_forms_submissions` → [Core] `seasons`
- [GemTeam] `team_employees` → [Core] `members`
- [GemTeam] `team_employees` → [Core] `users`
- [GemTeam] `team_shift_diary_entries` → [Core] `users`
- [GemTeam] `team_shift_diary_entries` → [Core] `members`
- [GemTeam] `team_document_alerts` → [Core] `users`
- [GemTeam] `team_document_alerts` → [Core] `members`
- [GemTeam] `team_document_alerts` → [Core] `seasons`
