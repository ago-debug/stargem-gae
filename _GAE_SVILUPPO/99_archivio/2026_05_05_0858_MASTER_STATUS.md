# MASTER_STATUS — StarGem Suite
# Aggiornato: 2026_04_26_1800
# File di scambio centrale tra tutte le chat.
# Fonte: file GAE_SVILUPPO A→G + audit DB 25/04/2026

---

## PROTOCOLLO AGGIORNAMENTO

Inizio sessione: leggi questo file + ANALISI_MASTER + tutti i file GAE_SVILUPPO (A→G)
Fine sessione — template 4 campi obbligatori:

  ## [N]_[NomeChat] — aggiornato YYYY_MM_DD_HHMM
  Stato: [verde/giallo/rosso]
  Ultimo protocollo: F1-[NNN] / F2-[NNN]
  Tabelle DB toccate: [elenco]
  Pendenti: [cosa resta aperto]

---

## CONVENZIONE NOMI FILE
Formato: YYYY_MM_DD_HHMM_nomefile.ext
Il file piu recente = data piu alta nel nome.
Claude e Antigravity usano questo formato per TUTTI i file prodotti.

---

## DEPLOY — REGOLA ASSOLUTA
1. Antigravity: git commit + git push origin main → STOP
2. Gaetano: git pull manualmente su Plesk → pubblica
Antigravity NON esegue mai deploy-vps.sh, ssh VPS, npm build VPS, pm2 restart.

---

## CLASSIFICAZIONE UTENTI (fonte: 2026_04_20_classificazione_stargem_v2.pdf)

UTENTE → members (tesserato / non tesserato / partecipante)
STAFF  → participantType INSEGNANTE | PERSONAL | PERSONAL_TRAINER (tessera obbligatoria)
TEAM   → team_employees con ruolo + mansione (tessera obbligatoria)
Sovrapposizione Staff+Team = 2 account separati (policy due cappelli)

---

## 14 ATTIVITA UFFICIALI

1.Corsi  2.Workshop  3.Prove a pagamento  4.Prove gratuite
5.Lezioni singole  6.Lezioni individuali  7.Domenica in movimento
8.Allenamenti  9.Affitti  10.Campus  11.Saggi
12.Vacanze studio  13.Eventi esterni  14.Merchandising

Calendario → attivita con orario/spazio puntuale
Planning   → attivita strategiche stagionali
Merchandising → escluso da calendari

---

## STATO DB — Audit 25/04/2026
## (post import storico DEFINITIVO — Chat_22 chiusa)

Tabelle principali con record reali:
  members: 4.489 (import completo ✅)
    · 174 colonne totali
    · +13 nuove (albo, patente, tutor2, p_iva)
    · +52 campi Athena (P2)
    · +fattura_fatta, athena_id
  memberships: 3.281 (tessere StarGem pulite ✅)
    · Tessere Athena duplicate rimosse (342)
    · Tessere Athena spostate in previous_membership_number (77)
    · Vincolo unicità: member_id + season_id
  enrollments: 13.584 ✅
    · athena_iscrizioni: 9.616
    · gsheets_master_p6: 3.109 (corsi + prove)
    · workshop: 859
    · participation_type: corso / prova / STANDARD_COURSE
  payments: 3.775 ✅
    · gsheets_master: 3.257 (sz1→sz4 + gbrh)
    · workshop: 518
    · Metodi: bonifico_poste 1.299 · bonifico_bpm 1.220
              cash 616 · contanti 518 · welcomekit 35
              online 32 · gbrh 55
    · Campi: operator_name, quota_description, period,
             transfer_confirmation_date, total_quota,
             deposit, receipts_count, discount_value,
             gbrh_numero, gbrh_data_emissione,
             gbrh_data_scadenza, gbrh_data_utilizzo, gbrh_iban
  medical_certificates: 2.770 ✅
  courses: 586 (296 reali + 285 storici + 5 P6)
  users: 19 (account staff)
  seasons: 3 (24/25 · 25/26 · 26/27)
  team_employees: 16
  team_attendance_logs: 2.078
  team_scheduled_shifts: 17 (ATTENZIONE: wipe test — reimportare)
  team_shift_templates: 1 (ATTENZIONE: stesso problema)
  strategic_events: 74
  custom_list_items: 235
  cities: 8.062 | provinces: 107
  promo_rules: 50 | price_matrix: 22 | company_agreements: 11
  instructor_agreements: 8 | user_roles: 7
  studios: 13 | booking_services: 3
  audit_logs · access_logs · user_activity_logs: attive ✅

Tabelle a zero da tenere (moduli in sviluppo):
  studio_bookings · staff_presenze · staff_sostituzioni
  payslips · gem_conversations · gem_messages
  staff_contracts_compliance · staff_document_signatures

Flag qualità members da bonificare:
  tessera_mancante_da_assegnare: 1.322
  omonimo_da_verificare: 407
  mancano_dati_obbligatori: 198
  nome_match: 179
  incompleto: 20

Ultimo backup:
  CHAT22_CHIUSURA_DEFINITIVA_20260425_1005.sql (13MB) ✅
  Tutti i backup in /root/backups/ sul VPS

Criticita aperte:
  1. team_scheduled_shifts = 17 → reimportare turni reali
  2. team_shift_templates = 1 → stesso problema
  3. enrollmentId = null su ~3.200 pagamenti
     (collegati a persona ma non al corso specifico)
  4. participation_type non uniforme:
     'corso' e 'STANDARD_COURSE' coesistono
     → uniformare in Chat_08_Iscritti
  5. courses = 586 (296 reali + 285 storico + 5 P6)

## EXPORT WIZARD — implementato 25/04/2026
  Componente: client/src/components/ExportWizard.tsx
  Formati: CSV + Excel XLSX (streaming ExcelJS)
  PDF: da implementare in futuro
  Route backend: POST /api/export (streaming)
  Sezioni con ExportWizard: 10/10
    members · payments · accounting-sheet
    courses · workshops · studio-bookings
    reports · gemteam · maschera-input
    anagrafica-home
  REGOLA FUTURA: ogni nuova sezione deve
    includere ExportWizard dall'inizio

## IMPORT UNIFICATO — aggiornato 25/04/2026
  Pagina: /importa
  Logica: file aggiornato vince sul DB per anagrafica
  Dry-run: ✅ anteprima prima di eseguire
  Report CSV: ✅ scaricabile post-import
  Bottoni collegati: tutti → /importa
  Route legacy deprecate: ✅
	

---

## STATO COMPLETO DI TUTTE LE CHAT

=== COMPLETATE ===

00_errori — CHIUSA
  Protocolli: F1-099 / F2-113
  Lavori: STI completo, 0 errori TypeScript, fix multipli calendario/modal
  Tabelle: courses (DROP 16 silos legacy), categories migrate

01_quote e promozioni — FASE 1 CHIUSA (Fase 2 da fare)
  Protocolli: F1-014 / F2-011
  Lavori: 18 tabelle create, 50 promo, 9 accordi insegnanti, 11 convenzioni,
          4 welfare provider, carnet_wallets, price_matrix (22), webhook WooCommerce
  Pendenti: F1-015 — StarGem → WooCommerce (catalogo in uscita)

02_GemStaff — COMPLETATA 13-14/04/2026
  Protocolli: F1-001→016 / F2-001→019
  Backup: gemstaff_DEFINITIVO
  Lavori completati:
    - 6 tabelle create: staff_presenze, staff_sostituzioni, payslips,
      staff_contracts_compliance, staff_document_signatures, staff_disciplinary_log
    - members: 5 colonne aggiunte (staff_status, lezioni_private_autorizzate, ecc.)
    - users: 3 colonne auth (email_verified, otp_token, otp_expires_at)
    - 65 insegnanti + 6 PERSONAL_TRAINER mappati con staff_status = attivo
    - /gemstaff con 6 Tab complete (Anagrafica, PT, Compliance, Accordi, Presenze, Disciplinare)
    - /gemstaff/me per insegnanti (dati, presenze, documenti, cedolino)
    - Routing per ruolo insegnante → /gemstaff/me
    - Email automatiche welcome + reset (in attesa config SMTP in .env)
    - Deprecation warnings su /api/instructors (header + deprecation_logs)
    - Guard ruoli: Tab 4 e 6 nascosti a operator/segreteria
    - 0 errori TypeScript totali
    - Deploy VPS verificato

03_GemTeam — COMPLETATA (turni da reimportare)
  Protocolli: F1-023→035 / F2-015→016
  Lavori completati:
    - Import turni da team_TURNI.xlsx e team_20252026_PRESENZE_TEAM.xlsx
    - Dashboard 5 KPI (Presenti, Usciti, Assenti, Non Pervenuti, Online)
    - Check-in/Check-out self-service da /gemteam
    - Full-Width Shift Grid per monitor 4K
    - Esclusione silente botAI e admin dalle presenze
    - team_shift_templates_BAK_F1_030 rimossa (F1-032)
  PENDENTE CRITICO: team_scheduled_shifts = 17 (erano 225), team_shift_templates = 1 (erano 550)
    Questi dati sono stati cancellati durante i test E2E — i turni reali vanno reimportati

05_GemPass — COMPLETATA 12/04/2026
  Protocolli: F1-001→007 / F2-001→007 — 22/22 test superati
  Lavori: memberships ALTER (+is_renewal, +renewed_from_id, +notes),
          backfill 2218 record season_competence=2526,
          member_forms_submissions CREATE,
          API pubblica /api/public/membership-status/:code,
          formato tessera: 2526-000042 (con trattino)
  Pendenti: firma kiosk tablet (Phase 2)

10_Utenti / GemPortal — COMPLETATA 15/04/2026
  Protocolli: F1-001→013 / F2-001→011 + F1-014 + F2-012
  Backup: gemportal_COMPLETO_20260415_0759.sql (11MB)
  Lavori completati:
    AUTH:
    - user_roles: 7 ruoli allineati (operator, admin, insegnante, client, ecc.)
    - Login accetta email O username
    - forgot-password anti user-enumeration
    - first-login redirect per ruolo
    - email_verified = 1 per 14 staff @studio-gem.it
    - Deploy script: scripts/deploy-vps.sh creato
    - VPS regola: /opt/plesk/node/24/bin/npm install prima del build
    GEMPORTAL:
    - 3 tabelle: gem_conversations, gem_messages, member_uploads
    - TeoBot con Claude SDK @anthropic-ai/sdk attivo
    - 7 route GemChat (A-G)
    - badge navbar GemChatBadge
    - /area-tesserati live in produzione
    - Martina Ricci test verificato OK
    ONBOARDING:
    - F1-014: flussi onboarding (self-service, segreteria, WooCommerce)
    - F2-012: pagina /registrati e flussi login B2C
    - Tuning GDPR e Tutori Minori in schema.ts
    - Age checking dinamico (TIMESTAMPDIFF server-side)
    NOTA: l'import 9.400 membri e stato eseguito ma poi cancellato (dati sporchi)
          Attualmente members = 92. Nessun utente reale importato.

00_DB_Cleanup — COMPLETATA
  Lavori: activities svuotata (F1-006), universal_enrollments svuotata (F1-007),
          team_shift_templates_BAK_F1_030 rimossa (F1-032),
          16 tabelle silos legacy droppate (F1-063 da chat 00_errori)

12_Gemdario — IN COLLAUDO (UI FREEZE)
  Lavori completati:
    - STI completo: 303 corsi migrati, bridge unifiedEvents
    - Calendario con colori pieni, legenda, filtri dinamici
    - Planning multi-stagione (Set-Ago), marker oggi, festività in rosso
    - Modal unificato CourseUnifiedModal
    - TimeSlotPicker.tsx creato
    - PaymentModuleConnector.tsx creato (PIN segreteria per forzature)
    - strategic_events in read/write/delete
    - Modalità COPIA con campi rossi
    - Conflitto anti-overlap rimosso intenzionalmente (F1-094)
  PENDENTE: collaudo end-to-end Planning+Calendario+Programmazione Date
  PENDENTE: raggruppamento corsi nel Planning sparito — da investigare
  ATTENZIONE: UI FREEZE — non modificare estetica fino a collaudo completato

## 12_Gemdario — aggiornato 2026_04_26_2100
Stato: 🟡 In collaudo
Ultimo protocollo: F1-016 / F2-031 (in corso)
Tabelle DB toccate:
  courses: +total_occurrences +active_on_holidays +internal_tags
           SKU cleanup 294 record
  strategic_events: +is_public_holiday +26 festività 25/26 e 26/27
  custom_lists: stato_corso(13), tag_interni(6), tipo_partecipante(7),
                metodi_pagamento(1), stato_iscrizione(vuota),
                +10 liste create (dettaglio_iscrizione, note_pagamento,
                tipi_carnet, categorie_anagrafica, canale_acquisizione,
                tessera_ente, categorie_affitti, categorie_booking,
                categorie_merchandising, campus)
  custom_list_items: seed completo tutte le liste
  enrollments: season_id aggiornato 929 prove
Tabelle droppate:
  participant_types (migrata in custom_lists)
  payment_methods (migrata in custom_lists)
Nuove route backend:
  GET /api/courses/:id/enrolled-members
  GET /api/strategic-events/closed-days
Lavori completati:
  - Fix timezone calendario e planning (setHours 12,0,0,0)
  - Corsi nascosti su giorni festivi
  - Badge Stato Corso e Interno Corso nella card
  - Contatore N Lez decrescente
  - InlineListEditor (Pennino A/B) — standard globale
  - Refactoring completo /elenchi (sidebar aree funzionali)
  - /elenchi rimossa dal menu (rotta ancora attiva)
  - Pennini inline: stato_corso, interno_corso, categorie,
    metodi_pagamento, canale_acquisizione
  - Scheda corso: JOIN reali tessera + certificato
  - Duplicazione massiva: doppio dropdown stagione + eliminazione
  - 149 file temp rimossi + attached_assets 25MB svuotati
Pendenti:
  - F2-031 in corso: 8 pennini rimanenti + rimozione /elenchi sidebar
  - Deploy Plesk + verifica visiva completa
  - B3bis: Planning corsi su festivi (verifica dopo deploy)
  - Stato Iscrizione: voci da popolare
  - GemTeam turni reimport (17 → 225)
  - Refactoring calendar.tsx (3.500 righe → sessione dedicata)
  - Navigazione history + breadcrumb tutte le pagine
  - Raggruppamento corsi Planning (bug MASTER)
  - Ricorrenza bisettimanale/mensile → Chat_08
  CONTINUARE IN: Chat_12B_Gemdario


22_Import_Export_dati — ✅ CHIUSA DEFINITIVAMENTE 25/04/2026
  Protocolli: F1-001→054
  Backup: CHAT22_CHIUSURA_DEFINITIVA_20260425_1005.sql (13MB)
  Logica import: MASTER > WORKSHOP > ATHENA > ElencoIscrizioni
  Lavori: import storico completo, ExportWizard 10 sezioni,
          /importa con dry-run, route legacy deprecate

22b_Import_Export_dati — ✅ CHIUSA 25/04/2026 ore 17:30
  Protocolli: F1-001→007 / F2-001→007
  Ultimo commit: 028531a
  Backup: CHAT22B_PRE_CAPITALIZZAZIONE_20260425.sql
  Lavori completati:
    EXPORT:
    - Date formato italiano GG/MM/AAAA, Sì/No booleani
    - Intestazione Excel coerente, anno 4 cifre
    - TZ=Europe/Rome su VPS (.env + pm2)
    - Strong typing colonne ExportWizard (5 file)
    - Streaming chunk 500 record /api/export
    - Route legacy export-csv rimosse
    MASCHERA INPUT:
    - Tessera, pagamento, certificato ora presenti
    - Certificato letto da medical_certificates
      (non dal campo legacy null in members)
    - Verificato su 4 nominativi reali
    SANITIZZAZIONE:
    - server/utils/sanitizer.ts creato e attivo
      UPPER: cognome, nome, CF, città, provincia,
             regione, nazionalità, luogo nascita
      LOWER: email, PEC, facebook, sito web
      TITLE CASE: indirizzo, professione, tutori
      Lettera maiuscola dopo cifra/slash (58A, 12/G)
    - Integrato in 5 route + webhook WooCommerce
    - Applicato a import /importa + tracking modifiche
    NORMALIZZAZIONE RETROATTIVA:
    - 3.949 record members normalizzati (BEGIN/COMMIT)
    - street_address → address (12 file refactored)
    - street_address ghost column DB (debito tecnico noto)
    SEZIONE /importa:
    - sanitizeMemberData pre-insert/update
    - modifiche_casing nel dry-run
    - colonna Modifiche Applicate nel report CSV
    - banner avviso normalizzazione step finale
  Tabelle DB toccate: members (3.949 record)
  Debito tecnico: street_address ghost column
  Pendenti per chat dedicate:
    - Fix UI GemPass → Chat_05_GemPass (PROSSIMA)
    - Validazione CF/tel/email → Chat_10_Utenti
    - Rollback import pagamenti → Chat_06
    - Badge status + participation_type → Chat_08
    - Delta import metà maggio → sessione futura
    - P5 STAFF insegnanti → sessione separata

22b_Bonifica_Dati — ✅ CHIUSA 26/04/2026 ore 18:00
  Protocolli: F1-001→010 / F2-001→007
  Ultimo commit: feat(import) Smart Routing
  Backup: CHAT22B_BONIFICA_OP1235_20260426.sql
  Lavori completati:
    BONIFICA DB enrollments:
    - Audit 7.351 record activity_type=storico
    - 24 tessere create (orfani QUOTATESSERA con CF)
    - 8 membri senza CF saltati + badge CRITICO in UI
      (BELLONI, BOCCHETTI, BURANI, CIONI, GIACOSA,
       GULIZIA, MONTANI, MOUTIQ)
    - 97 certificati medici creati (orfani DTYURI/DTNELLA)
    - 929 prove: season_id=1 assegnato
    - 285 SKU riclassificati da storico:
        27 workshop (WS*, NATALE)
        19 domenica_movimento (KUQI*, RUSSO, DOSSANTO)
        14 corso (OPEN*, CUGGEGIO, storici)
        4 campus (CAMPUSS1/S2)
        1 lezione_individuale
        1 prova_gratuita
        1 merchandising
        1 allenamenti (2526ALLENAMENTO)
        1 buono_regalo (GIFT)
        3 lasciati storico (contenitori import:
          QUOTATESSERA, DTYURI, DTNELLA)
    SMART ROUTING IMPORT (anti-recidiva):
    - shared/utils/cf-validator.ts creato
      (algoritmo italiano checksum + estrazione
       data nascita, sesso, codici nome/cognome)
    - CF obbligatorio: blocco import se mancante
    - CF invalido: blocco import + warning dry-run
    - CF valido ma incongruente con dati: warning
    - Smart Routing in /api/import/mapped:
        QUOTATESSERA → memberships automatico
        DTYURI/DTNELLA → medical_certificates auto
        altri → enrollments con season_id forzato
    - Blocco season_id NULL con conferma operatore
    - Payload dryRun arricchito:
        missingCfRecords, invalidCfRecords,
        cfWarnings, routingStats, missingSeasonRecords
    UI IMPORT:
    - Banner rosso CF mancante/invalido
    - Banner arancio stagione mancante
      (con pulsante assegna stagione 25/26)
    - Banner blu Smart Routing stats
    UI ANAGRAFICA/GEMPASS:
    - Badge CF MANCANTE in members.tsx
    - Alert rosso in anagrafica-home.tsx
    - Bottone disabilitato in gempass.tsx
      con tooltip esplicativo
  Tabelle DB toccate:
    members (8 flag), memberships (+24),
    medical_certificates (+97), enrollments (+929),
    courses (285 activity_type aggiornati)
  Debito tecnico:
    street_address ghost column (invariato)
  Da comunicare alle altre chat: vedi sezione
  INFO SPECIFICHE PER CHAT DEDICATE

23_Log_Verifiche — 🟡 APERTA 24/04/2026
  Obiettivo: collegare audit_log UI,
  tracciamento azioni in tempo reale
  Tabelle esistenti nel DB:
    audit_logs · access_logs · user_activity_logs
    team_employee_activity_log · webhook_logs
  Pendenti: analisi struttura log, UI visualizzazione,
    popolamento automatico da routes

=== DA AVVIARE — ORDINE PRIORITA ===

PRIORITA 1 — ✅ COMPLETATA — Import anagrafica reale
  Chat_22_ImportExport — F1-001→054 — CHIUSA 25/04/2026
  members: 4.489 · memberships: 3.281
  enrollments: 13.584 · payments: 3.775
  medical_certificates: 2.770 · courses: 586
  Vedi D_2026_04_25_1205_Stato_DB_Reale.md
  Vedi D2_2026_04_24_1200_Stato_Mappa_Frontend.md

PRIORITA 1b — Fix UI campi nascosti (chat dedicate)
  DATI IMPORTATI MA NON VISIBILI IN UI:

  → Chat_05_GemPass:
    memberships.membership_type → Tipo ente (ENDAS/OPES/LIBERTAS)
    memberships.issue_date → Data emissione tessera
    memberships.season_id → Stagione (1=25/26, 3=24/25)
    memberships.fee → Quota tessera pagata
    members.data_quality_flag → Badge segnalazione problemi
    DA CREARE: tabella membership_events (storico azioni tessera)
    DA CREARE: bottone "Dati da verificare" (1.322 tessere mancanti)
    DA CREARE: funzione "Assegna Tessera" rapida
    DA CREARE: bottone "Assegna Tessera" per flag tessera_mancante

  → Chat_10_Utenti (Anagrafica):
    54+ campi Athena importati ma non mostrati in UI:
    mobile, secondary_email, email_pec
    address, city, province, postal_code, region
    nationality, birth_nation
    tutor1_fiscal_code, tutor1_phone, tutor1_email
    tutor1_birth_date, tutor1_birth_place
    consent_sms, consent_image, consent_newsletter
    privacy_accepted, privacy_date
    company_name, company_fiscal_code, company_city
    document_type, document_expiry
    bank_name, iban
    size_shirt, size_pants, size_shoes, height, weight
    emergency_contact_1/2/3 name/phone/email
    education_title, education_institute
    fattura_fatta, athena_id, from_where
    p_iva, albo_*, patente_*, car_plate
    tutor2_first_name/last_name/birth_date/birth_place
    Badge flag qualità colorati:
      tessera_mancante → 🟡
      omonimo_da_verificare → 🔴
      mancano_dati_obbligatori → 🟠
      incompleto → ⚪

  → Chat_06_Contabilità:
    payments.operator_name → Chi ha inserito il pagamento
    payments.source → Canale/sede di vendita
    payments.transfer_confirmation_date → Data entrata sul conto
    payments.quota_description → Descrizione quota
      (es. "2 CORSI ADULTI, 1 QUOTA TESSERA")
    payments.period → Periodo (es. "SETTEMBRE - OTTOBRE 2025")
    payments.total_quota → Totale quota lorda
    payments.deposit → Acconto versato
    payments.receipts_count → Numero ricevute fatte
    payments.discount_code → Codice sconto applicato
    payments.discount_value → Valore sconto
    payments.gbrh_numero/date/iban → Dati buoni gift

  → Chat_08_Corsi/Iscritti:
    enrollments.status → Badge colorato per stato
      (active=verde, pending=giallo, cancelled=rosso)
    enrollments.participation_type → corso/prova
      ATTENZIONE: uniformare 'corso' e 'STANDARD_COURSE'
    enrollments.source_file → Fonte import
    enrollments.notes → Note interne iscrizione
    enrollments.season_id → Stagione iscrizione
    Filtri da aggiungere: per stagione, per status,
      per tipo partecipazione

PRIORITA 2 — Reimportare turni GemTeam
  team_scheduled_shifts e team_shift_templates cancellati durante test
  Vanno reimportati da team_TURNI.xlsx prima dell'uso reale

PRIORITA 3 — 06_Contabilita_Cassa
  payments = 3.775 (storico importato ✅)
  Da fare: collegare UI cassa operativa,
  cash_registers, bank_deposits

PRIORITA 4 — 08_Corsi, 09_Workshop, 14_BookGem
  Stagione in apertura — schede corso e WS urgenti

PRIORITA 5 — 04_MedGem, 07_Gemory
PRIORITA 6 — 11_Campus, 13_Domeniche, 15_Saggi, 16_Vacanze
PRIORITA 7 — 17_Clarissa, 18_GemEvent, 19_GemNight, 20_MerchSG

---

## ARCHITETTURA AUTH DEFINITIVA

members.user_id → FK → users.id (onDelete: set null)
user_id NULL = nessun account / user_id pieno = login attiva
Flusso: INSERT users → PATCH members.user_id = UUID
Ruoli (users.role testo libero): operator, admin, client, medico, insegnante, dipendente
user_roles: colonna si chiama 'name' (NON roleName)
Login: email O username + password
Policy due cappelli: doppio ruolo = 2 account separati

---

## REGOLE DB INVIOLABILI

payments / PaymentModuleConnector → SENSIBILE — non toccare (14 route collegate)
members → solo ADD COLUMN (mai modificare esistenti)
courses → non toccare struttura STI
enrollments → tabella iscrizioni UFFICIALE (universal_enrollments da droppare)
Categorie → custom_lists + custom_list_items (no nuove tabelle *_cats)
Backup → obbligatorio dopo ogni F1 che modifica il DB

---

## AREE SENSIBILI — NON TOCCARE

PaymentModuleConnector — impatta 14 route
Tessere / parser barcode — non modificare
Calendario — UI FREEZE — non abbellire fino a collaudo completato

---

## INFRASTRUTTURA

VPS: IONOS 82.165.35.145
DB: stargem_v2 su MariaDB port 3306 (VPS) / 3307 (SSH tunnel locale)
App: pm2 porta 5001, nome app: stargem
Nginx: reverse proxy su stargem.studio-gem.it
Deploy: git push → Plesk git pull manuale → npm run build → pm2 reload stargem
Backup path: /root/backups/ sul VPS (via SSH mysqldump)
Ultimo backup: CHAT22B_BONIFICA_OP1235_20260426.sql ✅
Backup disponibili in /root/backups/:
  CHAT22_CHIUSURA_DEFINITIVA_20260425_1005.sql (13MB)
  CHAT22B_PRE_CAPITALIZZAZIONE_20260425.sql

## INFO SPECIFICHE PER CHAT DEDICATE

→ Chat_05_GemPass (PROSSIMA DA APRIRE):
  Leggi: D_2026_04_25_1215_Stato_DB_Reale.md
         D2_2026_04_25_1215_Stato_Mappa_Frontend.md
  memberships ora ha 3.305 record (+24 da bonifica)
    membership_type (ENDAS/OPES/LIBERTAS) · issue_date
    season_id (1=25/26, 3=24/25) · fee
  DA CREARE: tabella membership_events
  DA CREARE: bottone "Dati da verificare"
  DA CREARE: funzione "Assegna Tessera"
  season_id FK: seasons.id (1=25/26, 2=26/27, 3=24/25)
  NOVITÀ DA CHAT_22b/BONIFICA:
    - 24 tessere create (data_quality_flag=da_verificare)
    - Badge CF MANCANTE attivo su 8 membri in UI
      (members.tsx, anagrafica-home.tsx, gempass.tsx)
    - 8 senza CF: BELLONI, BOCCHETTI, BURANI, CIONI,
      GIACOSA, GULIZIA, MONTANI, MOUTIQ
      → completare CF prima che possano avere tessera
    - ExportWizard strong typing attivo
    - sanitizer.ts su tutti i salvataggi
    - TZ=Europe/Rome su VPS

→ Chat_10_Utenti/Anagrafica (DOPO Chat_05):
  NOVITÀ DA CHAT_22b/BONIFICA:
    - CF validator algoritmo italiano in shared/utils/
    - Validazione CF obbligatoria all'import
    - 8 membri con CF mancante (flag mancano_dati_obbligatori)
    - sanitizer.ts: UPPER/LOWER/TITLE CASE attivo su members
  Leggi: D_2026_04_25_1205_Stato_DB_Reale.md
         D2_2026_04_24_1200_Stato_Mappa_Frontend.md
  members ha 174 colonne — 54+ non mostrate in UI
  Vedi PRIORITA 1b per lista completa campi da aggiungere
  Badge flag qualità da implementare per bonifica dati

→ Chat_06_Contabilità (AGGIORNA):
  payments ha 3.775 record con 10+ campi non visibili in UI
  Vedi PRIORITA 1b per lista completa
  ExportWizard già integrato in accounting-sheet.tsx e payments.tsx
  NOVITÀ DA CHAT_22b/BONIFICA:
    - 2526GIFT (21 iscrizioni) = buono_regalo
      Da gestire come sezione dedicata buoni regalo
    - Rollback import pagamenti ancora pendente (ALTA PRIORITÀ)
    - Smart Routing import: i pagamenti NON passano
      più per enrollments per errore

→ Chat_08_Corsi/Iscritti (AGGIORNA):
  enrollments ha 13.584 record — status tutti 'active'
  participation_type: 'corso' e 'STANDARD_COURSE' da uniformare
  Vedi PRIORITA 1b per lista campi da mostrare
  NOVITÀ DA CHAT_22b/BONIFICA:
    - 285 SKU riclassificati da storico:
      27 workshop, 19 domenica_movimento, 14 corso,
      4 campus, 1 lezione_individuale, 1 prova_gratuita,
      1 merchandising, 1 allenamenti, 1 buono_regalo
    - 929 prove: season_id=1 aggiornato
    - 3 SKU restano storico (contenitori import):
      QUOTATESSERA, DTYURI, DTNELLA — non toccare
    - Smart Routing attivo: nuovi import non
      creeranno più record storico in enrollments

→ Chat_23_Log (APERTA):
  Tabelle log già esistenti nel DB:
    audit_logs · access_logs · user_activity_logs (2.084 record)
    team_employee_activity_log · webhook_logs
  Prima azione: analizza struttura e verifica se le routes
  le popolano già, poi costruisci UI visualizzazione

→ Chat_12_Gemdario (IN COLLAUDO):
  ATTENZIONE UI FREEZE — non modificare estetica
  Raggruppamento corsi nel Planning sparito — da investigare
  Non toccare calendar.tsx, attivita.tsx fino a collaudo

→ FUTURO — Delta import metà maggio:
  Fonte: GSheets aggiornato (stesso formato MASTER)
  Modalità: --solo-nuovi (salta CF già presenti)
  Sezione /importa già pronta con logica aggiornamento

→ FUTURO — P5 STAFF insegnanti:
  File: STAFF__PERSONAL__ALTRI.xlsx
  Campi: social, diploma, drive folder
  Da fare in sessione separata
