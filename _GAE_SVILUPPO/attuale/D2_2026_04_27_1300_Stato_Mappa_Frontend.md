Aggiornato al: 2026-04-27 13:00

# MAPPA FRONTEND ↔ DATABASE
## StarGem Suite

Questo documento mappa le relazioni tra ogni pagina/componente del frontend e le tabelle/colonne del DB.

---
### 1. Anagrafica Generale
**File:** client/src/pages/members.tsx
**URL:** /anagrafica
**API:** GET /api/members, GET /api/members/total

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| first_name | members | ✅ | |
| last_name | members | ✅ | |
| email | members | ✅ | |
| mobile | members | ✅ | |
| fiscal_code | members | ✅ | |
| crm_profile_level | members | ✅ | |
| data_quality_flag | members | ❌ | nascosto, da sbloccare per admin |
| season_id | members | ❌ | usato per logica di filtraggio |
| created_at | members | ❌ | |

---
### 2. GemPass — Tesseramenti
**File:** client/src/pages/gempass.tsx
**URL:** /gempass
**API:** GET /api/gempass/firme-all, GET /api/memberships

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| membership_number | memberships | ✅ | |
| expiry_date | memberships | ✅ | |
| status | memberships | ✅ | |
| season_competence | memberships | ✅ | |
| first_name | members (JOIN) | ✅ | |
| last_name | members (JOIN) | ✅ | |
| barcode | memberships | ❌ | nascosto, utile sbloccarlo |
| issue_date | memberships | ❌ | da aggiungere |
| fee | memberships | ❌ | da aggiungere in UI |

---
### 3. Tessere & Certificati Medici
**File:** client/src/pages/memberships.tsx
**URL:** /memberships
**API:** GET /api/memberships

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| membership_number | memberships | ✅ | |
| expiry_date | memberships | ✅ | |
| type | memberships | ✅ | |
| fee | memberships | ✅ | |
| barcode | memberships | ✅ | |
| status | memberships | ❌ | non sempre mostrato esplicitamente |
| issue_date | memberships | ❌ | |

---
### 4. Iscritti per Attività
**File:** client/src/pages/iscritti_per_attivita.tsx
**URL:** /iscritti-per-attivita
**API:** GET /api/enrollments, GET /api/courses

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| enrollment_date | enrollments | ✅ | |
| details | enrollments | ✅ | |
| first_name | members (JOIN) | ✅ | |
| last_name | members (JOIN) | ✅ | |
| status | enrollments | ❌ | nascosto, utile per vedere chi è sospeso |
| participation_type | enrollments | ⚠️ | mancante, da aggiungere |
| season_id | enrollments | ❌ | |
| notes | enrollments | ❌ | |

---
### 5. Scheda Contabile
**File:** client/src/pages/accounting-sheet.tsx
**URL:** /scheda-contabile
**API:** GET /api/payments, GET /api/members/:id

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| amount | payments | ✅ | |
| type | payments | ✅ | |
| status | payments | ✅ | |
| paid_date | payments | ✅ | |
| payment_method | payments | ✅ | |
| operator_name | payments | ⚠️ | mancante, da aggiungere (chi scrive) |
| source | payments | ⚠️ | mancante, da aggiungere (canale vendita) |
| total_quota | payments | ⚠️ | mancante, da aggiungere |
| receipts_count | payments | ⚠️ | mancante |
| deposit | payments | ⚠️ | mancante |
| transfer_confirmation_date | payments | ⚠️ | mancante |

---
### 6. Lista Pagamenti
**File:** client/src/pages/payments.tsx
**URL:** /pagamenti
**API:** GET /api/payments

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| amount | payments | ✅ | |
| status | payments | ✅ | |
| paid_date | payments | ✅ | |
| payment_method | payments | ✅ | |
| description | payments | ✅ | |
| operator_name | payments | ⚠️ | mancante, utile per audit veloce |
| source | payments | ⚠️ | mancante |

---
### 7. Calendario Attività
**File:** client/src/pages/calendar.tsx
**URL:** /calendario
**API:** GET /api/courses, GET /api/studios

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| name | courses | ✅ | |
| day_of_week | courses | ✅ | |
| start_time | courses | ✅ | |
| end_time | courses | ✅ | |
| current_enrollment | courses | ✅ | per badge riempimento |
| max_capacity | courses | ✅ | per calcolo capienza |
| studio_id | courses | ✅ | mappa aule fisiche |
| instructor_id | courses | ✅ | mappa docenti |
| status_tags | courses | ❌ | metadati nascosti |

---
### 8. Planning Strategico
**File:** client/src/pages/planning.tsx
**URL:** /planning
**API:** GET /api/activities-unified-preview, GET /api/seasons

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| name | courses (STI) | ✅ | nome unificato |
| category_id | courses | ✅ | per filtri e colori |
| active | courses | ✅ | opacità visiva in base a stato |
| schedule | courses | ❌ | JSON configurazioni ricorrenti complesse |

---
### 9. GemStaff
**File:** client/src/pages/gemstaff.tsx
**URL:** /gemstaff
**API:** GET /api/staff_presenze, GET /api/staff_sostituzioni

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| data | staff_presenze | ✅ | |
| ore | staff_presenze | ✅ | |
| member_id | staff_presenze | ✅ | istruttore associato |
| note | staff_presenze | ✅ | |

---
### 10. GemTeam
**File:** client/src/pages/gemteam.tsx
**URL:** /gemteam
**API:** GET /api/team-employees, GET /api/team-scheduled-shifts

**DB → UI:**
| Campo DB | Tabella | Mostrato | Note |
|---|---|---|---|
| first_name | team_employees | ✅ | |
| last_name | team_employees | ✅ | |
| shift_start | team_scheduled_shifts| ✅ | |
| shift_end | team_scheduled_shifts| ✅ | |
| postazione_id | team_scheduled_shifts| ✅ | associazione desk |
| activity_id | team_scheduled_shifts| ✅ | task assegnato |
