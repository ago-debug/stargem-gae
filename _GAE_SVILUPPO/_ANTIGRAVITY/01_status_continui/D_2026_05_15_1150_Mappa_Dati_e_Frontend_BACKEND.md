---
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
validita_prevista: 2026-06-11
fonti_verificate:
  - "[[stato_di_fatto_F1_backend_2026_05_11]]"
---

# D — Mappa Dati e Frontend BACKEND
**Documento Faro — Backend**

Mappatura tra le tabelle del database `stargem_v2`, le route API esposte dal backend, e lo stato effettivo delle foreign keys (FK) e migrazioni.

## 1. Mappatura Tabelle → Route API → Endpoint

| Dominio | Tabella Principale | Endpoints API Principali | Descrizione Route |
|---|---|---|---|
| **Auth/IAM** | `users`, `user_roles` | `/api/auth/login`, `/api/users` | Gestione login, sessioni e ruoli sistema. |
| **Anagrafica** | `members` | `GET/POST/PATCH /api/members` | Lettura/scrittura anagrafica cruda. |
| **Tesseramento** | `memberships` | `GET /api/memberships`, `POST /api/gempass` | Gestione enti e tessere (da disaccoppiare). |
| **Corsi/STI** | `courses` | `GET/POST /api/courses` | Erogazione classi e workshop via Single Table Inheritance. |
| **Iscrizioni** | `enrollments`, `attendances` | `GET /api/enrollments`, `POST /api/attendances/bulk` | Legame n:m tra soci e classi. |
| **Cassa** | `payments`, `course_quotes_grid` | `GET/POST /api/payments`, `POST /api/checkout` | Processamento quote e sconti, checkout transazioni. |
| **GemTeam** | `team_employees`, `team_scheduled_shifts` | `GET/POST /api/gemteam/turni` | Gestione personale interno, turni settimanali e check-in. |

## 2. Foreign Keys Critiche (Schema Relazionale)
- `members.user_id` → `users.id` (collegamento opzionale tra anagrafica fisica e account login).
- `enrollments.member_id` → `members.id` (iscrizione legata al socio).
- `enrollments.course_id` → `courses.id` (iscrizione legata all'attività STI erogata).
- `team_employees.member_id` → `members.id` (il dipendente è a tutti gli effetti censito in anagrafica).

## 3. Migrazioni Recenti (Aprile 2026)
Le ultime migrazioni hanno toccato pesantemente il dominio Quote/Pagamenti:
- `0012_quote_promo_module.sql`
- `0013_quote_promo_contabilita.sql`
- `0014_agevolazioni_completo.sql`
- `0015_carnet_prezzi_completo.sql`

Questo conferma che il motore di pricing è la feature strutturalmente più recente e complessa del backend.

### 15 Maggio 2026 - 11:50
- Nuova tabella: `import_batches`
- `members` aggiornata con colonne tolleranza import (`data_quality_flag`, `extra_data`, `tutor1_fiscal_code`).

### 18 Maggio 2026 - 15:15
- Sincronizzazione colonne mancanti su `members`: aggiunte le colonne mancanti (es. `alias`, `p_iva`) per risolvere crash `ER_BAD_FIELD_ERROR` su endpoint come `/api/instructors`.
- Modifica di diverse colonne `VARCHAR(255)` a `TEXT` per rispettare il limite ROW_SIZE (65k) in MariaDB/MySQL.
