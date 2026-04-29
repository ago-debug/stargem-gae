# RECAP_02_GemStaff
> Aggiornato: 2026_04_28_1700 (convertito da originale 2026_04_13_2019)
> Stato chat: ✅ Completata
> Ultimo protocollo: F1-016 / F2-019

---

## 1. SCOPO E PERIMETRO

Modulo HR per la gestione di staff insegnanti e personal trainer.
Governa anagrafica, accordi economici, cedolini, presenze, sostituzioni,
documenti compliance e disciplinare.

NON gestisce: i dipendenti del team segreteria/manutenzione (vedi
Chat_03_GemTeam), i pagamenti dei membri (vedi Chat_06_Contabilità),
le tessere associative (vedi Chat_05_GemPass).

Visibile a: admin, operator (sola lettura su tab sensibili), insegnante
(solo `/gemstaff/me`).

---

## 2. STATO ATTUALE

### Cosa è già fatto
- 6 tabelle nuove create + 1 droppata (`instr_rates`)
- 68 insegnanti attivi + 6 personal trainer mappati con `staff_status='attivo'`
- `/gemstaff` con 6 tab complete (Anagrafica, PT, Compliance, Accordi,
  Presenze, Disciplinare) + permessi per ruolo
- `/gemstaff/me` per insegnante (dati, presenze, documenti, cedolino)
- `/first-login` e `/forgot-password` con OTP via email
- Email automatiche welcome + reset + activation confirm via SMTP
  (mail.studio-gem.it porta 465 SSL — funziona solo su VPS)
- Routing post-login per ruolo (admin → calendario, insegnante → /gemstaff/me)
- Deprecation warnings su `/api/instructors` (header + log DB)
- Layout sidebar ridotto per insegnanti
- 0 errori TypeScript
- Deploy VPS verificato

### Cosa è in corso
- Nessun lavoro attivo. Chat chiusa il 13/04/2026.

### Cosa è bloccato
- Nessun blocco.

---

## 3. TABELLE DB COINVOLTE

| Tabella | Ruolo | Record | Note |
|---|---|---|---|
| `staff_contracts_compliance` | doc CI/CF/diploma/foto/video | 0 | da popolare in uso reale |
| `staff_document_signatures` | firme stagionali | 0 | idem |
| `staff_disciplinary_log` | storico richiami | 0 | idem |
| `staff_presenze` | presenze ibride auto+manuale | 0 | da popolare in uso reale |
| `staff_sostituzioni` | log sostituzioni doppio visto | 0 | idem |
| `payslips` | cedolini mensili | 0 | calcolabili solo dopo conferma manuale presenze |
| `deprecation_logs` | audit scritture deprecate | 1 | trigger attivo |
| `members` | +5 colonne staff_* | 4.918 | staff_status, lezioni_private_*, user_id |
| `users` | +3 colonne auth | 19 | email_verified, otp_token, otp_expires_at |

---

## 4. FILE CHIAVE NEL CODEBASE

- `client/src/pages/gemstaff.tsx` — modulo 6 tab admin/operator
- `client/src/pages/gemstaff-me.tsx` — vista personale insegnante
- `client/src/pages/first-login.tsx` — primo accesso + OTP
- `client/src/pages/forgot-password.tsx` — reset password
- `server/routes/gemstaff.ts` — API completa modulo
- `server/utils/email.ts` — sendWelcomeEmail / sendResetPasswordEmail / sendActivationConfirmEmail
- `shared/schema.ts` § staff_* + § users auth
- `server/storage.ts` — JOIN instructorName server-side incluso in `/api/courses`

---

## 5. DECISIONI ARCHITETTURALI APERTE

### Decisione 1 — Logo email
- **Stato:** ⏳ aperta — bassa priorità
- **Note:** caricare `logo.png` su `stargem.studio-gem.it` per email senza immagine rotta

### Decisione 2 — Deprecation /api/instructors
- **Stato:** ⏳ aperta
- **Note:** CourseUnifiedModal usa ancora vecchia route. Migrare a `/api/members` filtro INSEGNANTE per eliminare warning.

### Decisione 3 — TeoCopilot contesto staff
- **Stato:** ⏳ aperta — media priorità
- **Note:** contestualizzare assistente AI per `/gemstaff/me`

### Decisione 4 — Validazione email real-time
- **Stato:** ⏳ aperta — media priorità
- **Note:** aggiungere validazione formato email in tutti i form (anche Chat_10_Utenti)

---

## 6. PROTOCOLLI ESEGUITI

### Backend (F1)
- F1-001 → F1-016 — ✅ tutti chiusi (6 tabelle create, refactoring instructor=member STI,
  email SMTP, route gemstaff, OTP system, deprecation system)

### Frontend (F2)
- F2-001 → F2-019 — ✅ tutti chiusi (6 tab, gemstaff/me, first-login, forgot-password,
  redirect ruolo, sidebar ridotta insegnante, deprecation header gestione)

---

## 7. PENDENTI

In ordine di priorità:

1. [ ] (bassa) Caricare `logo.png` su VPS per email
2. [ ] (bassa) Migrare CourseUnifiedModal a `/api/members` (eliminare deprecation warning)
3. [ ] (media) TeoCopilot con contesto staff in `/gemstaff/me`
4. [ ] (media) Validazione email real-time nei form (sinergia con Chat_10)
5. [ ] (uso reale) Popolamento progressivo di staff_presenze, staff_sostituzioni, payslips, ecc.

---

## 8. INTERSEZIONI CON ALTRE CHAT

- **Chat_03_GemTeam** — modulo HR sorella per dipendenti segreteria.
  Stessa logica architetturale, divisione netta members<staff>/<team>employees.
- **Chat_05_GemPass** — gli insegnanti hanno tessera obbligatoria
  (vedere RECAP_05 per regole CF mancante).
- **Chat_06_Contabilità** — i payslips si collegano ai pagamenti compensi.
- **Chat_10_Utenti** — sinergia su validazione email real-time.

---

## 9. NOTE PER LA PROSSIMA SESSIONE

- **`instructor = member`** (architettura STI): `/api/instructors` legge da
  `members` con `participant_type LIKE '%INSEGNANTE%'`.
- **`participant_type` multi-valore**: query usano `LIKE '%XXX%'`,
  supportano valori composti.
- **Regola presenze ibride NON automatizzare**:
  Gemdario → presenze auto (bozza) → segreteria corregge manualmente
  → conferma mese MANUALE obbligatoria → solo dopo cedolino calcolabile.
- **SMTP funziona solo sul VPS in produzione** — relay locale bloccato da IONOS.
- **Backup di chiusura**: `gemstaff_ASSOLUTO_20260413.sql`
- **Ultimo commit**: `c886267`

---

*Aggiornato l'ultima volta da: Claude (chat di Analisi) in data 2026_04_28_1700
basato su: RECAP_GemStaff_FINAL_v3.0_2026_04_13_2019*
