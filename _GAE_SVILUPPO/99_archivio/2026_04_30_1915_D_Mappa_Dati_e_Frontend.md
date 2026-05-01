Aggiornato al: 2026-04-28 11:50

# 📊 MAPPA DATI E FRONTEND — MASTER FILE

Questo file unificato sostituisce i precedenti D, D2 e D3. Contiene:
1. Lo **Stato Reale del DB** (Record esatti e Checklist)
2. La **Mappa Completa delle Colonne** (Dizionario Dati)
3. La **Mappa Frontend ↔ Database** (Stato delle integrazioni UI)

---

## 1. STATO DB REALE (Volumi e Checklist)

*Conteggi estratti in tempo reale dal database MySQL di produzione (IONOS) il 28/04/2026.*

### 1.1 Volumi per Gruppo Logico

#### Anagrafica & CRM
| Tabella | Record Attuali |
|---|---|
| `cities` | **7904** |
| `members` | **4918** |
| `provinces` | **107** |
| `member_relationships` | **0** |

#### Attività & Corsi
| Tabella | Record Attuali |
|---|---|
| `courses` | **602** |
| `strategic_events` | **74** |
| `studios` | **13** |
| `seasons` | **3** |
| `studio_bookings` | **0** |

#### Iscrizioni & Tessere
| Tabella | Record Attuali |
|---|---|
| `enrollments` | **12.234** |
| `memberships` | **3305** |
| `medical_certificates` | **2867** |
| `member_forms_submissions` | **1** |

#### Contabilità & Cassa
| Tabella | Record Attuali |
|---|---|
| `payments` | **12.062** |
| `promo_rules` | **50** |
| `quotes` | **12** |
| `cost_centers` | **7** |
| `carnet_wallets` | **0** |

#### HR & Staff
| Tabella | Record Attuali |
|---|---|
| `team_scheduled_shifts` | **84** |
| `team_activity_types` | **36** |
| `users` | **19** |
| `team_employees` | **16** |
| `payslips` | **0** |
| `staff_presenze` | **0** |

#### Sistema & Log
| Tabella | Record Attuali |
|---|---|
| `user_activity_logs` | **2589** |
| `user_session_segments` | **1524** |
| `custom_list_items` | **297** |
| `express_sessions` | **81** |
| `custom_lists` | **35** |
| `team_notes` | **28** |
| `team_comments` | **16** |
| `todos` | **6** |
| `system_configs` | **1** |

### 1.2 Checklist Migliorie (DB & Dati)

**✅ Completate:**
- [x] Bonifica Anagrafica e Tessere (recuperati record storici persi).
- [x] Migrazione a Single Table Inheritance (STI) per `courses`.
- [x] Standardizzazione campi JSON (es. `internalTags`, `statusTags`) e risoluzione bug UI (`.map is not a function`).
- [x] Standardizzazione filtri UI (es. filtro Gender per U/M/D/F/DONNA/UOMO risolto in frontend).

**⏳ Da Fare:**
- [ ] Implementare logica di archiviazione per le sessioni utente (`user_session_segments`) che crescono rapidamente.
- [ ] Normalizzare `participation_type` nelle iscrizioni.
- [ ] Aggiungere metadati operativi ai `payments` in UI (`operator_name`, `source`).

---

## 2. MAPPA COMPLETA DB E COLONNE (Dizionario Dati)

Elenco esatto e completo delle tabelle attive in produzione e dei loro campi strutturali.

### 🗄️ Gruppo: Anagrafica & CRM

#### Tabella: `cities` (Record: 7904)
```text
- id (int(11))
- name (varchar(100))
- province_id (int(11))
- postal_code (varchar(10))
- istat_code (varchar(10))
```

#### Tabella: `members` (Record: 4918)
```text
- id (int(11))
- first_name (varchar(255))
- last_name (varchar(255))
- fiscal_code (varchar(16))
- date_of_birth (date)
- place_of_birth (varchar(255))
- birth_province (varchar(2))
- birth_nation (varchar(100))
- gender (varchar(1))
- email (varchar(255))
- secondary_email (varchar(255))
- phone (varchar(50))
- mobile (varchar(50))
- category_id (int(11))
- subscription_type_id (int(11))
- card_number (varchar(100))
- card_issue_date (date)
- card_expiry_date (date)
- entity_card_type (varchar(50))
- entity_card_number (varchar(100))
- entity_card_issue_date (date)
- entity_card_expiry_date (date)
- has_medical_certificate (tinyint(1))
- medical_certificate_expiry (date)
- is_minor (tinyint(1))
- mother_first_name (varchar(255))
- mother_last_name (varchar(255))
- mother_fiscal_code (varchar(16))
- mother_email (varchar(255))
- mother_phone (varchar(50))
- mother_mobile (varchar(50))
- father_first_name (varchar(255))
- father_last_name (varchar(255))
- father_fiscal_code (varchar(16))
- father_email (varchar(255))
- father_phone (varchar(50))
- father_mobile (varchar(50))
- street_address (varchar(255))
- city (varchar(100))
- province (varchar(2))
- postal_code (varchar(10))
- country (varchar(100))
- address (text)
- notes (text)
- admin_notes (text)
- health_notes (text)
- food_alerts (varchar(255))
- tags (varchar(500))
- residence_permit (varchar(100))
- residence_permit_expiry (date)
- active (tinyint(1))
- enrollment_status (enum('attivo','non_attivo'))
- created_at (timestamp)
- updated_at (timestamp)
- photo_url (longtext)
- mother_birth_date (date)
- mother_birth_place (varchar(255))
- mother_birth_province (varchar(2))
- mother_street_address (varchar(255))
- mother_city (varchar(100))
- mother_province (varchar(2))
- mother_postal_code (varchar(10))
- father_birth_date (date)
- father_birth_place (varchar(255))
- father_birth_province (varchar(2))
- father_street_address (varchar(255))
- father_city (varchar(100))
- father_province (varchar(2))
- father_postal_code (varchar(10))
- season (varchar(50))
- internal_id (varchar(50))
- insertion_date (date)
- participant_type (varchar(50))
- from_where (varchar(255))
- profession (varchar(100))
- document_type (varchar(50))
- document_expiry (date)
- team_segreteria (varchar(255))
- detraction_requested (tinyint(1))
- detraction_year (varchar(4))
- credits_requested (tinyint(1))
- credits_year (varchar(20))
- tesserino_tecnico_number (varchar(100))
- tesserino_tecnico_date (date)
- created_by (varchar(255))
- updated_by (varchar(255))
- privacy_accepted (tinyint(1))
- privacy_date (date)
- regulations_accepted (tinyint(1))
- membership_application_signed (tinyint(1))
- specialization (text)
- bio (text)
- hourly_rate (decimal(10,2))
- attachment_metadata (longtext)
- gift_metadata (longtext)
- tessere_metadata (longtext)
- certificato_medico_metadata (longtext)
- crm_profile_level (varchar(20))
- crm_profile_score (int(11))
- crm_profile_override (tinyint(1))
- crm_profile_reason (varchar(255))
- staff_status (enum('attivo','inattivo','archivio'))
- lezioni_private_autorizzate (tinyint(1))
- lezioni_private_autorizzate_at (datetime)
- lezioni_private_autorizzate_by (varchar(100))
- lezioni_private_note (text)
- user_id (varchar(255))
- tutor1_fiscal_code (varchar(16))
- tutor1_phone (varchar(20))
- tutor1_email (varchar(255))
- tutor2_fiscal_code (varchar(16))
- tutor2_phone (varchar(20))
- tutor2_email (varchar(255))
- nationality (varchar(100))
- region (varchar(100))
- consent_image (tinyint(1))
- consent_marketing (tinyint(1))
- consent_newsletter (tinyint(1))
- previous_membership_number (varchar(50))
- data_quality_flag (varchar(50))
- title (varchar(20))
- whatsapp (varchar(20))
- consent_sms (tinyint(1))
- email_pec (varchar(255))
- family_code (varchar(50))
- athena_group (varchar(100))
- alias (varchar(100))
- cancellation_date (date)
- company_name (varchar(200))
- company_fiscal_code (varchar(16))
- company_address (varchar(255))
- company_cap (varchar(10))
- company_city (varchar(100))
- company_province (varchar(10))
- company_phone (varchar(20))
- company_email (varchar(255))
- document_issued_by (varchar(100))
- document_issue_date (date)
- bank_name (varchar(100))
- iban (varchar(34))
- size_shirt (varchar(10))
- size_pants (varchar(10))
- size_shoes (varchar(10))
- height (varchar(10))
- weight (varchar(10))
- social_facebook (varchar(255))
- social_instagram (varchar(255))
- social_tiktok (varchar(255))
- social_youtube (varchar(255))
- website (varchar(255))
- drive_folder_url (varchar(500))
- education_title (varchar(200))
- education_institute (varchar(200))
- education_date (date)
- emergency_contact1_name (varchar(100))
- emergency_contact1_phone (varchar(20))
- emergency_contact1_email (varchar(255))
- emergency_contact2_name (varchar(100))
- emergency_contact2_phone (varchar(20))
- emergency_contact2_email (varchar(255))
- emergency_contact3_name (varchar(100))
- emergency_contact3_phone (varchar(20))
- emergency_contact3_email (varchar(255))
- sede_riferimento (varchar(100))
- athena_member_type (varchar(50))
- first_enrollment_date (date)
- consent_certificate (tinyint(1))
- consent_module (tinyint(1))
- codice_catastale (varchar(10))
- mastro_c (varchar(30))
- mastro_col (varchar(30))
- codice_fe (varchar(50))
- tutor1_birth_date (date)
- tutor1_birth_place (varchar(100))
- fattura_fatta (tinyint(1))
- athena_id (varchar(50))
- p_iva (varchar(20))
- albo_tipo (varchar(50))
- albo_sezione (varchar(50))
- albo_numero (varchar(50))
- albo_data_iscrizione (date)
- patente_tipo (varchar(20))
- patente_rilasciata_da (varchar(100))
- patente_scadenza (date)
- car_plate (varchar(20))
- tutor2_first_name (varchar(100))
- tutor2_last_name (varchar(100))
- tutor2_birth_date (date)
- tutor2_birth_place (varchar(100))
```

#### Tabella: `provinces` (Record: 107)
```text
- id (int(11))
- code (varchar(2))
- name (varchar(100))
- region (varchar(100))
- country_id (int(11))
```

#### Tabella: `member_relationships` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- related_member_id (int(11))
- relationship_type (varchar(50))
- created_at (timestamp)
```

### 🗄️ Gruppo: Attività & Corsi

#### Tabella: `courses` (Record: 602)
```text
- id (int(11))
- sku (varchar(100))
- name (varchar(255))
- description (text)
- category_id (int(11))
- studio_id (int(11))
- instructor_id (int(11))
- secondary_instructor1_id (int(11))
- secondary_instructor2_id (int(11))
- price (decimal(10,2))
- max_capacity (int(11))
- current_enrollment (int(11))
- day_of_week (varchar(20))
- start_time (varchar(10))
- end_time (varchar(10))
- recurrence_type (varchar(20))
- schedule (text)
- start_date (date)
- end_date (date)
- total_occurrences (int(11))
- active_on_holidays (tinyint(1))
- status_tags (longtext)
- internal_tags (longtext)
- active (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
- season_id (int(11))
- google_event_id (varchar(255))
- quote_id (int(11))
- level (varchar(100))
- age_group (varchar(100))
- lesson_type (longtext)
- number_of_people (varchar(50))
- activity_type (varchar(50))
```

#### Tabella: `strategic_events` (Record: 74)
```text
- id (int(11))
- title (varchar(255))
- description (text)
- event_type (varchar(100))
- start_date (date)
- end_date (date)
- all_day (tinyint(1))
- season_id (int(11))
- status (varchar(50))
- affects_calendar (tinyint(1))
- affects_planning (tinyint(1))
- affects_payments (tinyint(1))
- studio_id (int(11))
- color (varchar(50))
- is_public_holiday (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `studios` (Record: 13)
```text
- id (int(11))
- name (varchar(255))
- floor (varchar(50))
- operating_hours (text)
- operating_days (text)
- capacity (int(11))
- equipment (text)
- notes (text)
- active (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
- google_calendar_id (varchar(255))
```

#### Tabella: `seasons` (Record: 3)
```text
- id (int(11))
- name (varchar(255))
- description (text)
- start_date (date)
- end_date (date)
- active (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `studio_bookings` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- studio_id (int(11))
- service_id (int(11))
- title (varchar(255))
- description (text)
- booking_date (date)
- start_time (varchar(20))
- end_time (varchar(20))
- status (varchar(50))
- paid (tinyint(1))
- amount (decimal(10,2))
- google_event_id (varchar(255))
- instructor_id (int(11))
- season_id (int(11))
- created_at (timestamp)
- updated_at (timestamp)
```

### 🗄️ Gruppo: Iscrizioni & Tessere

#### Tabella: `enrollments` (Record: 12234)
```text
- id (int(11))
- member_id (int(11))
- course_id (int(11))
- status (varchar(50))
- enrollment_date (timestamp)
- notes (text)
- created_at (timestamp)
- season_id (int(11))
- online_source (tinyint(1))
- pending_medical_cert (tinyint(1))
- pending_membership (tinyint(1))
- completion_notes (text)
- details (longtext)
- participation_type (varchar(50))
- target_date (date)
- source_file (varchar(50))
```

#### Tabella: `memberships` (Record: 3305)
```text
- id (int(11))
- member_id (int(11))
- membership_number (varchar(100))
- previous_membership_number (varchar(100))
- barcode (varchar(100))
- issue_date (date)
- expiry_date (date)
- status (varchar(50))
- type (varchar(100))
- fee (decimal(10,2))
- created_at (timestamp)
- updated_at (timestamp)
- renewal_type (varchar(50))
- is_renewal (tinyint(1))
- renewed_from_id (int(11))
- entity_card_number (varchar(100))
- entity_card_expiry_date (date)
- membership_type (varchar(50))
- season_competence (varchar(50))
- season_start_year (int(11))
- season_end_year (int(11))
- notes (text)
- season_id (int(11))
- data_quality_flag (varchar(50))
```

#### Tabella: `medical_certificates` (Record: 2867)
```text
- id (int(11))
- member_id (int(11))
- issue_date (date)
- expiry_date (date)
- doctor_name (varchar(255))
- notes (text)
- status (varchar(50))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `member_forms_submissions` (Record: 1)
```text
- id (int(11))
- member_id (int(11))
- form_type (varchar(50))
- form_version (varchar(20))
- season_id (int(11))
- payload_data (longtext)
- signed_at (datetime)
- signed_by_ip (varchar(45))
- signature_hash (varchar(255))
- created_by (int(11))
- created_at (datetime)
- updated_at (datetime)
```

### 🗄️ Gruppo: Contabilità & Cassa

#### Tabella: `payments` (Record: 12062)
```text
- id (int(11))
- member_id (int(11))
- enrollment_id (int(11))
- amount (decimal(10,2))
- type (varchar(100))
- description (text)
- status (varchar(50))
- due_date (date)
- paid_date (date)
- payment_method_id (int(11))
- payment_method (varchar(100))
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
- season_id (int(11))
- created_by_id (varchar(255))
- updated_by_id (varchar(255))
- booking_id (int(11))
- membership_id (int(11))
- quantity (int(11))
- quota_description (varchar(255))
- period (varchar(255))
- total_quota (decimal(10,2))
- discount_code (varchar(100))
- discount_value (decimal(10,2))
- discount_percentage (decimal(5,2))
- promo_code (varchar(100))
- promo_value (decimal(10,2))
- promo_percentage (decimal(5,2))
- deposit (decimal(10,2))
- annual_balance (decimal(10,2))
- receipts_count (int(11))
- transfer_confirmation_date (date)
- payment_note_labels (text)
- enrollment_detail_labels (text)
- global_enrollment_id (int(11))
- accounting_code (varchar(20))
- vat_code (varchar(10))
- cost_center_code (varchar(50))
- source (varchar(20))
- operator_name (varchar(100))
- gbrh_numero (varchar(50))
- gbrh_data_emissione (date)
- gbrh_data_scadenza (date)
- gbrh_data_utilizzo (date)
- gbrh_iban (varchar(34))
```

#### Tabella: `promo_rules` (Record: 50)
```text
- id (int(11))
- tenant_id (int(11))
- code (varchar(50))
- label (varchar(120))
- rule_type (enum('percentage','fixed','blocked_price'))
- value (decimal(8,2))
- valid_from (date)
- valid_to (date)
- max_uses (int(11))
- used_count (int(11))
- exclude_open (tinyint(1))
- not_cumulative (tinyint(1))
- target_type (varchar(30))
- company_name (varchar(120))
- member_id (int(11))
- metadata (longtext)
- created_at (timestamp)
- updated_at (timestamp)
- approved_by (varchar(50))
- internal_notes (text)
```

#### Tabella: `quotes` (Record: 12)
```text
- id (int(11))
- name (varchar(255))
- amount (decimal(10,2))
- category (varchar(100))
- notes (text)
- active (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `cost_centers` (Record: 7)
```text
- id (int(11))
- tenant_id (int(11))
- code (varchar(30))
- label (varchar(120))
- description (text)
- is_active (tinyint(1))
- created_at (timestamp)
```

#### Tabella: `carnet_wallets` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- wallet_type_id (int(11))
- total_units (tinyint(4))
- used_units (tinyint(4))
- expiry_days (tinyint(4))
- payment_id (int(11))
- trial_date (date)
- purchased_at (date)
- expires_at (date)
- is_active (tinyint(1))
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
- group_size (tinyint(4))
- location_type (varchar(30))
- price_per_unit (decimal(8,2))
- total_paid (decimal(8,2))
- bonus_units (tinyint(4))
```

### 🗄️ Gruppo: HR & Staff

#### Tabella: `team_scheduled_shifts` (Record: 84)
```text
- id (int(11))
- employee_id (int(11))
- data (date)
- postazione (varchar(50))
- ora_inizio (time)
- ora_fine (time)
- template_id (int(11))
- note (varchar(255))
- created_by_user_id (varchar(255))
- created_at (datetime)
- updated_at (datetime)
- modified_by_user_id (varchar(255))
```

#### Tabella: `team_activity_types` (Record: 36)
```text
- id (int(11))
- team (enum('segreteria','ass_manutenzione','tutti'))
- label (varchar(200))
- categoria (varchar(50))
- attivo (tinyint(1))
- sort_order (int(11))
- created_at (datetime)
```

#### Tabella: `users` (Record: 19)
```text
- id (varchar(255))
- email (varchar(255))
- first_name (varchar(100))
- last_name (varchar(100))
- profile_image_url (longtext)
- created_at (timestamp)
- updated_at (timestamp)
- username (varchar(255))
- password (varchar(255))
- role (varchar(50))
- phone (varchar(50))
- last_seen_at (timestamp)
- current_session_start (timestamp)
- last_session_duration (int(11))
- email_verified (tinyint(1))
- otp_token (varchar(10))
- otp_expires_at (datetime)
```

#### Tabella: `team_employees` (Record: 16)
```text
- id (int(11))
- member_id (int(11))
- user_id (varchar(255))
- display_order (int(11))
- team (enum('segreteria','ass_manutenzione','ufficio','amministrazione','comunicazione','direzione'))
- tariffa_oraria (decimal(5,2))
- stipendio_fisso_mensile (decimal(8,2))
- data_assunzione (date)
- attivo (tinyint(1))
- note_hr (text)
- created_at (datetime)
- updated_at (datetime)
```

#### Tabella: `payslips` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- month (tinyint(4))
- year (smallint(6))
- hours_taught (decimal(6,2))
- rate (decimal(8,2))
- total (decimal(10,2))
- status (enum('bozza','confermato','pagato'))
- notes (text)
- confirmed_by (varchar(100))
- confirmed_at (datetime)
- created_at (timestamp)
```

#### Tabella: `staff_presenze` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- course_id (int(11))
- date (date)
- hours (decimal(4,2))
- source (enum('auto','manual'))
- status (enum('bozza','confermato'))
- confirmed_by (varchar(100))
- confirmed_at (datetime)
- notes (text)
- created_at (timestamp)
```

### 🗄️ Gruppo: Sistema & Log

#### Tabella: `user_activity_logs` (Record: 2589)
```text
- id (int(11))
- user_id (varchar(255))
- action (varchar(50))
- entity_type (varchar(50))
- entity_id (varchar(255))
- details (longtext)
- ip_address (varchar(45))
- created_at (timestamp)
```

#### Tabella: `user_session_segments` (Record: 1524)
```text
- id (int(11))
- user_id (varchar(255))
- started_at (datetime)
- last_heartbeat_at (timestamp)
- ended_at (datetime)
- tipo (enum('online','pausa'))
- durata_minuti (int(11))
- created_at (datetime)
```

#### Tabella: `custom_list_items` (Record: 297)
```text
- id (int(11))
- list_id (int(11))
- value (varchar(255))
- sort_order (int(11))
- active (tinyint(1))
- color (varchar(7))
```

#### Tabella: `express_sessions` (Record: 81)
```text
- session_id (varchar(128))
- expires (int(11) unsigned)
- data (mediumtext)
```

#### Tabella: `custom_lists` (Record: 35)
```text
- id (int(11))
- name (varchar(255))
- system_name (varchar(100))
- description (text)
- created_at (timestamp)
- system_code (varchar(50))
- linked_activities (longtext)
```

#### Tabella: `team_notes` (Record: 28)
```text
- id (int(11))
- author_id (varchar(255))
- author_name (varchar(255))
- title (varchar(255))
- content (text)
- category (varchar(50))
- is_pinned (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
- target_url (varchar(255))
- deleted_at (timestamp)
- deleted_by (varchar(255))
```

#### Tabella: `team_comments` (Record: 16)
```text
- id (int(11))
- author_id (varchar(255))
- author_name (varchar(255))
- content (text)
- priority (varchar(20))
- is_resolved (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
- assigned_to (varchar(255))
- parent_id (int(11))
```

#### Tabella: `todos` (Record: 6)
```text
- id (int(11))
- text (text)
- completed (tinyint(1))
- created_by (varchar(255))
- created_at (timestamp)
- completed_by (varchar(255))
- completed_at (timestamp)
```

#### Tabella: `system_configs` (Record: 1)
```text
- id (int(11))
- key_name (varchar(255))
- value (text)
- description (text)
- updated_at (timestamp)
```

### 🗄️ Altre Tabelle (Non Assegnate)

#### Tabella: `accounting_periods` (Record: 30)
```text
- id (int(11))
- tenant_id (int(11))
- season_id (int(11))
- year (smallint(6))
- month (tinyint(4))
- label (varchar(50))
- is_closed (tinyint(1))
- closed_at (timestamp)
- notes (text)
- created_at (timestamp)
```

#### Tabella: `pay_notes` (Record: 28)
```text
- id (int(11))
- name (varchar(100))
- color (varchar(50))
- sort_order (int(11))
- active (tinyint(1))
- created_at (timestamp)
```

#### Tabella: `team_postazioni` (Record: 25)
```text
- id (int(11))
- nome (varchar(50))
- conta_ore (tinyint(1))
- colore (varchar(7))
- attiva (tinyint(1))
- ordine (int(11))
- created_at (timestamp)
```

#### Tabella: `price_matrix` (Record: 24)
```text
- id (int(11))
- tenant_id (int(11))
- season_id (int(11))
- category (varchar(100))
- quantity_type (varchar(50))
- course_count (int(11))
- valid_from_month (int(11))
- valid_to_month (int(11))
- base_price (decimal(8,2))
- max_slots (int(11))
- exclude_from_promo (tinyint(1))
- notes (text)
- created_at (timestamp)
```

#### Tabella: `team_monthly_reports` (Record: 16)
```text
- id (int(11))
- employee_id (int(11))
- anno (year(4))
- mese (tinyint(4))
- ore_totali (decimal(6,2))
- giorni_lavorati (tinyint(4))
- stipendio_fisso (decimal(8,2))
- ore_extra_pos (decimal(5,2))
- ore_extra_neg (decimal(5,2))
- importo_extra (decimal(8,2))
- cnt_FE (tinyint(4))
- cnt_PE (tinyint(4))
- cnt_ML (tinyint(4))
- cnt_F (tinyint(4))
- cnt_AI (tinyint(4))
- cnt_AG (tinyint(4))
- cnt_MT (tinyint(4))
- cnt_IN (tinyint(4))
- export_at (datetime)
- locked (tinyint(1))
- created_at (datetime)
- updated_at (datetime)
```

#### Tabella: `price_list_items` (Record: 14)
```text
- id (int(11))
- price_list_id (int(11))
- entity_type (varchar(50))
- entity_id (int(11))
- price (decimal(10,2))
- created_at (timestamp)
- quote_id (int(11))
```

#### Tabella: `enroll_details` (Record: 13)
```text
- id (int(11))
- name (varchar(100))
- color (varchar(50))
- sort_order (int(11))
- active (tinyint(1))
- created_at (timestamp)
```

#### Tabella: `company_agreements` (Record: 11)
```text
- id (int(11))
- tenant_id (int(11))
- company_name (varchar(150))
- company_type (varchar(50))
- discount_courses (decimal(5,2))
- discount_merch (decimal(5,2))
- discount_other (decimal(5,2))
- exclude_open (tinyint(1))
- exclude_other_promos (tinyint(1))
- eligible_who (text)
- special_rules (text)
- promo_rule_id (int(11))
- valid_from (date)
- valid_to (date)
- is_active (tinyint(1))
- approved_by (varchar(50))
- requires_verification (tinyint(1))
- verification_notes (text)
- metadata (longtext)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `act_statuses` (Record: 9)
```text
- id (int(11))
- name (varchar(100))
- color (varchar(50))
- sort_order (int(11))
- active (tinyint(1))
- created_at (timestamp)
```

#### Tabella: `course_quotes_grid` (Record: 9)
```text
- id (int(11))
- activity_type (varchar(50))
- category (varchar(100))
- description (varchar(255))
- details (text)
- corsi_week (int(11))
- months_data (longtext)
- sort_order (int(11))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `instructor_agreements` (Record: 9)
```text
- id (int(11))
- tenant_id (int(11))
- member_id (int(11))
- season_id (int(11))
- agreement_type (enum('flat_monthly','pack_hours','variable_monthly'))
- base_monthly_amount (decimal(8,2))
- pack_hours (tinyint(4))
- spese_mensili (decimal(8,2))
- billing_day (tinyint(4))
- payment_mode (enum('contanti','bonifico','fattura','pos'))
- studio_id (int(11))
- schedule_notes (text)
- notes (text)
- is_active (tinyint(1))
- metadata (longtext)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `wc_product_mapping` (Record: 8)
```text
- id (int(11))
- tenant_id (int(11))
- wc_product_id (int(11))
- wc_product_name (varchar(200))
- stargem_category (varchar(50))
- stargem_course_count (tinyint(4))
- stargem_activity_type (varchar(50))
- notes (text)
```

#### Tabella: `pricing_rules` (Record: 7)
```text
- id (int(11))
- tenant_id (int(11))
- rule_code (varchar(50))
- rule_label (varchar(120))
- applies_to (varchar(50))
- rule_type (varchar(30))
- trigger_condition (varchar(50))
- trigger_value (decimal(8,2))
- effect_type (varchar(30))
- effect_value (decimal(8,2))
- requires_authorization (tinyint(1))
- authorized_by (varchar(50))
- priority (tinyint(4))
- is_active (tinyint(1))
- notes (text)
- metadata (longtext)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `user_roles` (Record: 7)
```text
- id (int(11))
- name (varchar(255))
- description (text)
- permissions (longtext)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `price_lists` (Record: 6)
```text
- id (int(11))
- name (varchar(255))
- valid_from (date)
- valid_to (date)
- active (tinyint(1))
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `team_checkin_events` (Record: 6)
```text
- id (int(11))
- employee_id (int(11))
- timestamp (datetime)
- tipo (enum('IN','OUT'))
- postazione (varchar(50))
- device (varchar(100))
- override_admin (tinyint(1))
- note (text)
```

#### Tabella: `team_shift_templates` (Record: 6)
```text
- id (int(11))
- employee_id (int(11))
- settimana_tipo (enum('A','B','C','D','E'))
- giorno_settimana (tinyint(4))
- ora_inizio (time)
- ora_fine (time)
- postazione (enum('RECEPTION','PRIMO','SECONDO','UFFICIO','AMM.ZIONE','PAUSA','RIPOSO','RIUNIONE','STUDIO_1','STUDIO_2','MALATTIA','PERMESSO','WORKSHOP'))
- note (text)
- created_at (datetime)
```

#### Tabella: `team_shift_diary_entries` (Record: 5)
```text
- id (int(11))
- employee_id (int(11))
- shift_id (int(11))
- data (date)
- ora_slot (time)
- postazione (enum('RECEPTION','PRIMO','SECONDO','UFFICIO','AMM.ZIONE','PAUSA','RIPOSO','RIUNIONE','STUDIO_1','STUDIO_2','MALATTIA','PERMESSO'))
- activity_type_id (int(11))
- attivita_libera (varchar(300))
- quantita (int(11))
- minuti (smallint(6))
- note (text)
- ok_flag (tinyint(1))
- created_at (datetime)
```

#### Tabella: `booking_services` (Record: 4)
```text
- id (int(11))
- name (varchar(255))
- description (text)
- price (decimal(10,2))
- color (varchar(20))
- active (tinyint(1))
- created_at (timestamp)
- category_id (int(11))
```

#### Tabella: `welfare_providers` (Record: 4)
```text
- id (int(11))
- tenant_id (int(11))
- name (varchar(80))
- requires_membership_fee (tinyint(1))
- requires_medical_cert (tinyint(1))
- extra_fee_percent (decimal(5,2))
- available_categories (text)
- operative_notes (text)
- is_active (tinyint(1))
- metadata (longtext)
- updated_at (timestamp)
```

#### Tabella: `agreement_monthly_overrides` (Record: 3)
```text
- id (int(11))
- agreement_id (int(11))
- season_id (int(11))
- month (tinyint(4))
- override_amount (decimal(8,2))
- notes (varchar(255))
```

#### Tabella: `pagodil_tiers` (Record: 3)
```text
- id (int(11))
- tenant_id (int(11))
- provider_name (varchar(50))
- range_min (decimal(8,2))
- range_max (decimal(8,2))
- fee_amount (decimal(8,2))
- fee_type (varchar(20))
- installments_max (tinyint(4))
- is_active (tinyint(1))
```

#### Tabella: `staff_rates` (Record: 3)
```text
- id (int(11))
- tenant_id (int(11))
- service_code (varchar(50))
- service_label (varchar(120))
- amount (decimal(8,2))
- rate_type (varchar(20))
- applicable_to (varchar(50))
- studio_restriction (text)
- requires_membership (tinyint(1))
- requires_medical_cert (tinyint(1))
- max_sessions_per_week (tinyint(4))
- is_active (tinyint(1))
- notes (text)
- metadata (longtext)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `team_week_assignments` (Record: 3)
```text
- id (int(11))
- week_start (date)
- settimana (char(1))
- is_manual_override (tinyint(1))
- note (varchar(255))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `webhook_logs` (Record: 3)
```text
- id (int(11))
- tenant_id (int(11))
- source (varchar(30))
- event_type (varchar(80))
- external_id (varchar(120))
- raw_payload (longtext)
- status (varchar(20))
- processed_at (timestamp)
- error_message (text)
- payment_id (int(11))
- created_at (timestamp)
```

#### Tabella: `import_configs` (Record: 2)
```text
- id (int(11))
- name (varchar(255))
- entity_type (varchar(50))
- source_type (varchar(50))
- field_mapping (longtext)
- import_key (varchar(100))
- created_at (timestamp)
```

#### Tabella: `team_attendance_logs` (Record: 2)
```text
- id (int(11))
- employee_id (int(11))
- data (date)
- ore_lavorate (decimal(4,2))
- tipo_assenza (enum('FE','PE','ML','F','AI','AG','MT','IN'))
- check_in (datetime)
- check_out (datetime)
- note (text)
- modified_by_admin (varchar(255))
- modified_at (datetime)
- created_at (datetime)
```

#### Tabella: `__drizzle_migrations` (Record: 1)
```text
- id (bigint(20) unsigned)
- hash (text)
- created_at (bigint(20))
```

#### Tabella: `countries` (Record: 1)
```text
- id (int(11))
- code (varchar(3))
- name (varchar(100))
- is_default (tinyint(1))
```

#### Tabella: `deprecation_logs` (Record: 1)
```text
- id (int(11))
- table_name (varchar(100))
- operation (varchar(20))
- triggered_at (timestamp)
- note (text)
```

#### Tabella: `journal_entries` (Record: 1)
```text
- id (int(11))
- tenant_id (int(11))
- period_id (int(11))
- payment_id (int(11))
- entry_date (date)
- description (varchar(255))
- debit_account (varchar(50))
- credit_account (varchar(50))
- amount (decimal(10,2))
- vat_amount (decimal(10,2))
- vat_code (varchar(10))
- cost_center_id (int(11))
- is_auto (tinyint(1))
- notes (text)
- created_at (timestamp)
- created_by_id (varchar(50))
```

#### Tabella: `knowledge` (Record: 1)
```text
- id (varchar(100))
- sezione (varchar(100))
- titolo (varchar(255))
- descrizione (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `member_packages` (Record: 1)
```text
- id (int(11))
- member_id (int(11))
- package_code (varchar(50))
- package_type (varchar(50))
- total_uses (int(11))
- used_uses (int(11))
- price_paid (decimal(10,2))
- notes (text)
- active (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `access_logs` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- barcode (varchar(100))
- access_time (timestamp)
- access_type (varchar(50))
- membership_status (varchar(50))
- notes (text)
```

#### Tabella: `activities` (Record: 0)
```text
- id (int(11))
- tenant_id (int(11))
- category_id (int(11))
- location_id (int(11))
- name (varchar(255))
- start_time (timestamp)
- end_time (timestamp)
- instructor_id (int(11))
- max_capacity (int(11))
- base_price (decimal(10,2))
- is_punch_card (tinyint(1))
- punch_card_total_accesses (int(11))
- extra_info_overrides (longtext)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `attendances` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- course_id (int(11))
- enrollment_id (int(11))
- attendance_date (timestamp)
- type (varchar(50))
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
- season_id (int(11))
```

#### Tabella: `audit_logs` (Record: 0)
```text
- id (int(11))
- action (varchar(50))
- entity_type (varchar(100))
- entity_id (int(11))
- performed_by (varchar(255))
- details (text)
- created_at (timestamp)
```

#### Tabella: `carnet_sessions` (Record: 0)
```text
- id (int(11))
- wallet_id (int(11))
- session_number (tinyint(4))
- session_date (date)
- session_time_start (time)
- session_time_end (time)
- instructor_id (int(11))
- is_bonus (tinyint(1))
- notes (varchar(255))
- created_at (timestamp)
```

#### Tabella: `custom_reports` (Record: 0)
```text
- id (int(11))
- name (varchar(255))
- description (text)
- entity_type (varchar(100))
- selected_fields (longtext)
- filters (longtext)
- sort_field (varchar(100))
- sort_direction (varchar(10))
- created_by (varchar(255))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `gem_conversations` (Record: 0)
```text
- id (int(11))
- channel (enum('member','staff'))
- participant_id (int(11))
- participant_user_id (varchar(255))
- status (enum('bot','human','closed'))
- assigned_to (varchar(255))
- bot_context (longtext)
- last_message_at (datetime)
- unread_team (int(11))
- unread_participant (int(11))
- created_at (datetime)
- updated_at (datetime)
```

#### Tabella: `gem_messages` (Record: 0)
```text
- id (int(11))
- conversation_id (int(11))
- sender_type (enum('member','staff','team','bot'))
- sender_id (varchar(255))
- content (text)
- attachment_url (varchar(500))
- attachment_name (varchar(255))
- attachment_size (int(11))
- quick_link_type (enum('corso','tessera','pagamento'))
- quick_link_id (int(11))
- is_read (tinyint(1))
- created_at (datetime)
```

#### Tabella: `member_discounts` (Record: 0)
```text
- id (int(11))
- tenant_id (int(11))
- member_id (int(11))
- promo_rule_id (int(11))
- discount_type (varchar(30))
- discount_value (decimal(8,2))
- discount_percent (decimal(5,2))
- approved_by (varchar(50))
- approved_at (date)
- valid_for_season_id (int(11))
- valid_from (date)
- valid_to (date)
- is_used (tinyint(1))
- used_at (timestamp)
- payment_id (int(11))
- bonus_note (text)
- internal_notes (text)
- company_agreement_id (int(11))
- metadata (longtext)
- created_at (timestamp)
- updated_at (timestamp)
- created_by_id (varchar(50))
```

#### Tabella: `member_duplicate_exclusions` (Record: 0)
```text
- id (int(11))
- member_id_1 (int(11))
- member_id_2 (int(11))
- excluded_by (varchar(255))
- excluded_at (timestamp)
```

#### Tabella: `member_uploads` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- document_type (enum('certificato_medico','documento_identita','altro'))
- filename (varchar(255))
- file_url (varchar(500))
- file_size (int(11))
- mime_type (varchar(100))
- uploaded_at (datetime)
- verified_by (varchar(255))
- verified_at (datetime)
- notes (text)
- season_id (int(11))
```

#### Tabella: `messages` (Record: 0)
```text
- id (int(11))
- sender_id (varchar(50))
- receiver_id (varchar(50))
- content (text)
- is_read (tinyint(1))
- timestamp (timestamp)
```

#### Tabella: `notifications` (Record: 0)
```text
- id (int(11))
- user_id (varchar(50))
- title (varchar(255))
- message (text)
- type (varchar(50))
- is_read (tinyint(1))
- created_at (timestamp)
```

#### Tabella: `sessions` (Record: 0)
```text
- sid (varchar(128))
- sess (longtext)
- expire (timestamp)
```

#### Tabella: `staff_contracts_compliance` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- doc_type (enum('diploma_tesserino','carta_identita','codice_fiscale','permesso_soggiorno','foto_id','video_promo'))
- doc_value (text)
- has_doc (tinyint(1))
- expires_at (date)
- notes (text)
- updated_at (timestamp)
```

#### Tabella: `staff_disciplinary_log` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- event_type (enum('richiamo_verbale','ammonizione_scritta','sospensione','interruzione_rapporto'))
- event_date (date)
- description (text)
- staff_response (text)
- staff_response_at (date)
- decision (text)
- resolved_at (date)
- created_by (varchar(100))
- created_at (timestamp)
```

#### Tabella: `staff_document_signatures` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- doc_type (enum('regolamento_staff','codice_disciplinare_staff'))
- doc_version (varchar(10))
- signed_at (datetime)
- signed_by (varchar(100))
- method (enum('manual','kiosk'))
- notes (text)
```

#### Tabella: `staff_sostituzioni` (Record: 0)
```text
- id (int(11))
- absent_member_id (int(11))
- substitute_member_id (int(11))
- course_id (int(11))
- absence_date (date)
- lesson_description (varchar(255))
- payment_to (enum('assente','sostituto','nessuno'))
- amount_override (decimal(8,2))
- notes (text)
- visto_segreteria (tinyint(1))
- visto_elisa (tinyint(1))
- created_by (varchar(100))
- created_at (timestamp)
```

#### Tabella: `team_document_alerts` (Record: 0)
```text
- id (int(11))
- document_id (int(11))
- employee_id (int(11))
- tipo (enum('scadenza','mancante','aggiornamento_richiesto'))
- data_alert (date)
- inviato_at (datetime)
- risolto (tinyint(1))
- created_at (datetime)
```

#### Tabella: `team_document_versions` (Record: 0)
```text
- id (int(11))
- document_id (int(11))
- versione_numero (tinyint(4))
- file_url (varchar(500))
- file_name (varchar(200))
- file_size (int(11))
- mime_type (varchar(100))
- hash_file (varchar(64))
- uploaded_by (varchar(255))
- uploaded_at (datetime)
- note_versione (text)
```

#### Tabella: `team_documents` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- tipo (enum('carta_identita','codice_fiscale','permesso_soggiorno','patente','certificato_medico','diploma','contratto','busta_paga','report_mensile','comunicazione','altro'))
- titolo (varchar(200))
- caricato_da (enum('employee','admin'))
- visibile_dipendente (tinyint(1))
- is_current (tinyint(1))
- scadenza (date)
- created_at (datetime)
```

#### Tabella: `team_employee_activity_log` (Record: 0)
```text
- id (int(11))
- employee_id (int(11))
- eseguita_da (varchar(255))
- azione (varchar(100))
- entita_modificata (varchar(50))
- entita_id (int(11))
- valore_prima (text)
- valore_dopo (text)
- ip_address (varchar(45))
- created_at (datetime)
```

#### Tabella: `team_handover_notes` (Record: 0)
```text
- id (int(11))
- employee_id (int(11))
- shift_id (int(11))
- data (date)
- postazione (enum('RECEPTION','PRIMO','SECONDO','UFFICIO','AMM.ZIONE'))
- testo (text)
- priorita (enum('low','medium','high'))
- letta_da (longtext)
- created_at (datetime)
```

#### Tabella: `team_leave_requests` (Record: 0)
```text
- id (int(11))
- employee_id (int(11))
- tipo (enum('FE','PE','ML','altro'))
- data_inizio (date)
- data_fine (date)
- ore_totali (decimal(4,2))
- status (enum('pending','approved','rejected'))
- approved_by (varchar(255))
- approved_at (datetime)
- note_dipendente (text)
- note_admin (text)
- created_at (datetime)
- updated_at (datetime)
```

#### Tabella: `team_maintenance_tickets` (Record: 0)
```text
- id (int(11))
- employee_id (int(11))
- studio_numero (varchar(10))
- titolo (varchar(200))
- descrizione (text)
- status (enum('open','in_progress','closed'))
- foto_url (varchar(500))
- risolto_da (varchar(255))
- risolto_at (datetime)
- created_at (datetime)
- updated_at (datetime)
```

#### Tabella: `team_note_reactions` (Record: 0)
```text
- id (int(11))
- note_id (int(11))
- user_id (varchar(255))
- author_name (varchar(255))
- reaction_type (varchar(50))
- emoji (varchar(10))
- created_at (timestamp)
```

#### Tabella: `team_notifications` (Record: 0)
```text
- id (int(11))
- type (varchar(20))
- reference_id (int(11))
- title (varchar(255))
- message (text)
- is_read (tinyint(1))
- user_id (varchar(255))
- created_at (timestamp)
```

#### Tabella: `team_profile_change_requests` (Record: 0)
```text
- id (int(11))
- employee_id (int(11))
- campo_modificato (varchar(100))
- valore_vecchio (text)
- valore_nuovo (text)
- motivazione (text)
- status (enum('pending','approved','rejected'))
- requested_at (datetime)
- reviewed_by (varchar(255))
- reviewed_at (datetime)
- note_admin (text)
```

#### Tabella: `team_tasks` (Record: 0)
```text
- id (int(11))
- text (varchar(500))
- completed (tinyint(1))
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tabella: `universal_enrollments` (Record: 0)
```text
- id (int(11))
- member_id (int(11))
- activity_detail_id (int(11))
- status (varchar(50))
- enrollment_date (date)
- residual_entries (int(11))
- notes (text)
- extra_data (longtext)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 3. MAPPA FRONTEND ↔ DATABASE (Stato Attuale)

Mappatura logica tra le schermate dell'applicativo e le tabelle del database.

### 3.1 Anagrafica Generale
**File:** `client/src/pages/members.tsx` | **URL:** `/anagrafica`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| first_name, last_name, email, mobile, fiscal_code, crm_profile_level | members | ✅ | Completamente mappati |
| data_quality_flag | members | ❌ | Nascosto, utile sbloccare per admin |

### 3.2 GemPass & Tesseramenti
**File:** `client/src/pages/gempass.tsx`, `memberships.tsx`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| membership_number, expiry_date, status | memberships | ✅ | |
| first_name, last_name | members | ✅ | (JOIN) |
| barcode, issue_date, fee | memberships | ❌ | Da aggiungere in UI |

### 3.3 Gestione Corsi & Iscritti
**File:** `client/src/pages/courses.tsx`, `scheda-corso.tsx`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| name, day_of_week, start_time, instructor_id | courses | ✅ | |
| status_tags, internal_tags | courses | ✅ | Standardizzati con checkmark/badge UI |
| total_occurrences | courses | ✅ | Usato per "effettuate / rimanenti" |
| participation_type | enrollments | ⚠️ | Da aggiungere |

### 3.4 Contabilità
**File:** `client/src/pages/accounting-sheet.tsx`, `payments.tsx`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| amount, type, status, paid_date, payment_method | payments | ✅ | |
| operator_name, source, total_quota, deposit | payments | ⚠️ | Urgente da aggiungere in UI per Audit veloce |

### 3.5 Planning Strategico e GemTeam
**File:** `client/src/pages/planning.tsx`, `gemteam.tsx`
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| category_id, active | courses | ✅ | Colori e opacità visiva |
| shift_start, shift_end, postazione_id | team_scheduled_shifts | ✅ | Layout a griglia settimanale implementato |

### 3.6 Checklist Lavori UI da Terminare
- [ ] Aggiungere colonne `operator_name` e `source` nella tabella /pagamenti.
- [ ] Includere `data_quality_flag` nella vista anagrafica dettagliata (profilo admin).
- [ ] Rendere visibile `barcode` e `fee` nel Modale GemPass.
