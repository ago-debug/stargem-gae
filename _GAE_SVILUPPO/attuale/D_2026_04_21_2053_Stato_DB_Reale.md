Aggiornato al: 2026-04-21 20:53

# 📊 STATO DB REALE — Audit Aggiornato
Data e orario aggiornamento: 2026-04-21 20:53

## Tabelle attive con dati reali

| Tabella | Record | Note |
|---------|--------|------|
| `members` | **92** | Anagrafica attuale in produzione |
| `memberships` | **0** | Tessere (*Svuotata per nuova importazione in arrivo*) |
| `users` | **19** | Account staff attivi |
| `courses` | **296** | Attività Miste (Corsi, Workshop, Campus) - Puliti da fantasmi e test |
| `activities` | **0** | Attività dettaglio (*F1-006: Svuotata da sporcizia STI test*) |
| `activity_details` | **428** | Dettagli attività |
| `enrollments` | **0** | Iscrizioni Reali (*F1-007: Pronta per pagamenti*) |
| `universal_enrollments` | **0** | Iscrizioni Vecchie (*F1-007: Svuotata da sporcizia STI*) |
| `team_attendance_logs` | **2.078** | Log presenze GemTeam |
| `team_scheduled_shifts` | **17** | Turni programmati (Drastico calo - *probabile "WIPE settimana"* per via del deploy 035) |
| `team_shift_templates` | **1** | Template turni (*Calo per cancellazione massiva precedente/test*) |
| `strategic_events` | **74** | Pianificazione + Festa Lavoratori 2026 (*F1-005: rimossi 2 duplicati anomali*) - Epurati 120 eventi di test pregressi |
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
> Queste tabelle sono presenti nello schema ma non contengono alcun dato attualmente. Di seguito la loro mappatura per sezione logica.

| Tabella | Sezione di Riferimento | Note / Funzione |
|---------|------------------------|-----------------|
| **Pagamenti & Cassa** | | |
| `payments` | Gestione Cassa | Transazioni e pagamenti (Attualmente a 0 in attesa di importazione e aggancio finale) |
| `payment_methods` | Gestione Cassa | Metodi di pagamento configurati nel sistema |
| `carnet_wallets` | Quote & Promo | Portafogli carnet prepagati |
| `carnet_sessions` | Quote & Promo | Dettaglio singole sessioni scalate dai carnet |
| **Didattica & Iscrizioni** | | |
| `enrollments` | Motore Attività STI | Iscrizioni unificate (Tabella madre pronta per importazione dati) |
| `global_enrollments` | Motore Attività STI | Vista / Storico iscrizioni globali |
| `attendances` | Motore Attività STI | Registro presenze allievi |
| `studio_bookings` | Motore Attività STI | Prenotazioni sale fisiche |
| **Anagrafica & Tesserati** | | |
| `medical_certificates` | Anagrafica / GemPass | Scadenziario certificati medici |
| `member_relationships` | Anagrafica | Parentele e tutele legali (es. genitori-minori) |
| `member_uploads` | GemPortal (B2C) | File caricati autonomamente dai clienti |
| `member_packages` | Anagrafica | Pacchetti promozionali assegnati |
| `member_duplicate_exclusions`| Sistema | Regole anti-merge per doppioni omonimi |
| `member_discounts` | Quote & Promo | Sconti o agevolazioni nominali per l'utente |
| `access_logs` | Controllo Accessi | Log fisici di ingresso tesserati al centro |
| **GemStaff (Gestione Insegnanti)** | | |
| `staff_presenze` | GemStaff | Rilevazione presenze e ore docenti |
| `staff_sostituzioni` | GemStaff | Gestione cambi turno e supplenti |
| `payslips` | GemStaff / Amministrazione | Cedolini e compensi erogati |
| `staff_contracts_compliance` | GemStaff | Conformità contrattuale e documentale HR |
| `staff_document_signatures` | GemStaff | Firme digitali su contratti HR |
| `staff_disciplinary_log` | GemStaff | Registro note disciplinari |
| **GemTeam (Gestione Staff Interno)** | | |
| `team_shifts` | GemTeam | Turni lavorativi programmati |
| `team_tasks` | GemTeam | Mansioni assegnate al turno |
| `team_documents` | GemTeam | Documentazione interna e procedure |
| `team_document_versions` | GemTeam | Versionamento documenti interni |
| `team_week_assignments` | GemTeam | Assegnazioni settimanali macro |
| `team_maintenance_tickets` | GemTeam | Segnalazioni guasti struttura |
| `team_handover_notes` | GemTeam | Consegne di fine turno tra operatori |
| `team_employee_activity_log` | GemTeam | Log operazioni granulari dei dipendenti |
| `team_document_alerts` | GemTeam | Notifiche su documenti aggiornati |
| `team_note_reactions` | GemTeam | Reazioni (es. like/letto) alle note operative |
| `team_profile_change_requests`| GemTeam | Richieste cambio dati personali staff |
| `team_leave_requests` | GemTeam | Gestione ferie e permessi |
| **GemPortal & CRM (Comunicazione)** | | |
| `crm_leads` | CRM (Futuro) | Contatti prospect non ancora iscritti |
| `crm_campaigns` | CRM (Futuro) | Campagne marketing |
| `messages` | Comunicazione | Messaggistica testuale standard |
| `gem_conversations` | GemPortal | Chat AI/Assistenza clienti |
| `gem_messages` | GemPortal | Righe messaggi della chat |
| `notifications` | Sistema | Notifiche push o in-app |
| **Categorie Frammentate (Legacy silos)**| | |
| ~~`ws_cats`, `sun_cats`, `cmp_cats`, `rec_cats`, `vac_cats`, `sub_types`~~ | Attività Legacy | **DROPPATE** in fase di Consolidamento (Migrate a custom_list_items) |
| ~~`activity_categories`~~ | Attività Legacy | **DROPPATE** |
| ~~`merchandising_categories`~~ | Store | **DROPPATE** (Migrate a custom_list_items) |
| ~~`cli_cats`~~ | Anagrafica | **DROPPATE** (Migrate a custom_list_items) |
| ~~`rental_categories`~~ | Affitti | **DROPPATE** (Migrate a custom_list_items) |
| ~~`booking_service_categories`~~ | Booking | **DROPPATE** (Migrate a custom_list_items) |
| ~~`categories`, `trn_cats`, `ind_less_cats`~~ | Corsi | **DROPPATE** (Migrate a custom_list_items) |
| **Sistema & Infrastruttura** | | |
| `countries` | Localizzazione | Database nazioni |
| `maintenance_tickets` | Sistema | Ticket tecnici generici |
| `audit_logs` | Sicurezza | Log di sistema per azioni critiche |
| `sessions` | Auth | Tabelle sessioni server alternative |
| `tenants` | Multi-tenant SaaS | Supporto per aziende terze (Architettura Futura) |
| `system_configs` | Impostazioni | Chiavi di configurazione dinamiche |
| `custom_reports` | Reporting | Template report salvati |
| `knowledge` | Base di Conoscenza | Voci della documentazione interna visibile a UI |

## ⚠️ Criticità DB
> [!WARNING]
> Rilevanze e discrepanze di schema persistenti da analizzare.

1. ~~**Iscrizioni duplicate**~~ — **RISOLTO** ✅ `universal_enrollments` è stata definitivamente svuotata e azzerata (0 record).
2. ~~**Categorie frammentate**~~ — **RISOLTO** ✅ Tutte le 14 tabelle categorie legacy sono state definitivamente migrate su `custom_list_items` e **DROPPATE** dal DB fisico e dallo schema.
3. **Mancanza dati contabili** — `payments` = 0. Il modulo cassa non è ancora completamente agganciato a regime in produzione.
4. ~~`team_shift_templates_BAK_F1_030`~~ — **RIMOSSA** ✅ Protocollo F1-032.

## 2026-04-20 17:15 - Pulizia Dati (GemTeam)
- Svuotati `team_attendance_logs` (da 2079 a 0 veri, + 2 test odierni) e `team_checkin_events` (mock eliminati, rimasti solo bot e admin).
- Troncato ed azzerato storicamente `team_monthly_reports` per far partire le statistiche pulite in produzione.


