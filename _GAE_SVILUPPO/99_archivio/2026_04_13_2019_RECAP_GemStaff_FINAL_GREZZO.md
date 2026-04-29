# RECAP_GemStaff — Modulo Completato
**Modulo:** GemStaff — Staff Manager  
**Suite:** StarGem (Geos SSDRL / studio-gem.it)  
**Data completamento:** 13 Aprile 2026  
**Ultimo commit:** `c886267` + push finale in corso  
**Ultimo backup:** `gemstaff_ASSOLUTO_20260413.sql`

---

## 1. Stato Finale

| Elemento | Valore |
|---|---|
| Insegnanti attivi | 68 |
| Personal Trainer | 6 |
| Tabelle nuove create | 7 |
| Tabelle eliminate | 1 (instr_rates) |
| File eliminati | 1 (instructors.tsx) |
| Errori TypeScript | 0 |
| Email automatiche | ✅ operative |

---

## 2. Rotte Frontend

| Rotta | Accesso | Descrizione |
|---|---|---|
| `/gemstaff` | Admin / Operator | Modulo completo 6 tab |
| `/gemstaff/me` | Insegnante | Dashboard personale |
| `/first-login` | Pubblica | Primo accesso + OTP |
| `/forgot-password` | Pubblica | Reset password |

---

## 3. Tab e Permessi

| Tab | Contenuto | Admin | Operator | Insegnante |
|---|---|---|---|---|
| 1 — Anagrafica | Lista + CRUD + pannello dettaglio | ✅ completo | ✅ sola lettura | ❌ |
| 2 — Personal Trainer | Lista PT | ✅ | ✅ | ❌ |
| 3 — Compliance | 6 card documenti | ✅ modifica | ✅ sola lettura | ❌ |
| 4 — Accordi Economici | Tariffe | ✅ | ❌ nascosta | ❌ |
| 5 — Presenze | Matrice mensile + sostituzioni | ✅ + conferma | ✅ inserimento | ❌ |
| 6 — Disciplinare | Log richiami | ✅ | ❌ nascosta | ❌ |

**Pagina /gemstaff/me (solo insegnante):**
- Dati anagrafici personali
- Presenze del mese corrente
- Documenti compliance (6 card)
- Cedolino mensile

---

## 4. Flusso Account Insegnanti

```
1. Admin → GemStaff Tab 1 → pannello dettaglio insegnante
2. Sezione "Account di Sistema" → "Crea Account"
3. Sistema genera OTP 6 cifre (valido 24h)
4. Email automatica parte a insegnante (noreply@studio-gem.it)
   Oggetto: "Benvenuto in StarGem — Accesso Staff"
5. Insegnante va su /first-login
6. Inserisce email + OTP + nuova password
7. Email conferma "✅ Account StarGem attivato" inviata
8. Login successivi → redirect automatico a /gemstaff/me
```

**Password dimenticata:**
```
1. Insegnante va su /forgot-password
2. Inserisce email
3. Sistema genera nuovo OTP + manda email reset
   Oggetto: "StarGem — Reset Password"
4. Insegnante va su /first-login con nuovo OTP
```

---

## 5. Email Automatiche (SMTP)

| Evento | Template | Oggetto |
|---|---|---|
| Crea account | `sendWelcomeEmail()` | "Benvenuto in StarGem — Accesso Staff" |
| Forgot password | `sendResetPasswordEmail()` | "StarGem — Reset Password" |
| Primo login completato | `sendActivationConfirmEmail()` | "✅ Account StarGem attivato" |

**Config SMTP:**
```
SMTP_HOST=mail.studio-gem.it
SMTP_PORT=465 (SSL)
SMTP_USER=noreply@studio-gem.it
SMTP_FROM="Studio Gem" <noreply@studio-gem.it>
```
⚠️ SMTP funziona solo sul VPS in produzione (relay locale bloccato da IONOS per sicurezza).

---

## 6. Tabelle DB

| Tabella | Scopo |
|---|---|
| `staff_contracts_compliance` | Documenti (CI, CF, diploma, foto, video) |
| `staff_document_signatures` | Firme stagionali |
| `staff_disciplinary_log` | Storico disciplinare |
| `staff_presenze` | Presenze ibride auto+manuale |
| `staff_sostituzioni` | Log sostituzioni con doppio visto |
| `payslips` | Cedolini mensili |
| `deprecation_logs` | Audit trail scritture deprecate |

**Estensioni su `members`:** staff_status, lezioni_private_*, user_id  
**Estensioni su `users`:** email_verified, otp_token, otp_expires_at

---

## 7. Route API Backend

```
GET/PATCH /api/gemstaff/insegnanti/:id
POST      /api/gemstaff/crea-account/:memberId
GET       /api/gemstaff/me
GET       /api/gemstaff/pt
GET/POST  /api/gemstaff/compliance/:memberId
GET/POST  /api/gemstaff/presenze/:month/:year
POST      /api/gemstaff/presenze/conferma
GET/POST  /api/gemstaff/sostituzioni/:month/:year
GET/POST  /api/gemstaff/disciplinare/:memberId
GET       /api/gemstaff/payslips/:memberId/:month/:year
POST      /api/auth/first-login
POST      /api/auth/forgot-password
```

---

## 8. Login Hub — Redirect per Ruolo

```
admin / operator    → /calendario-attivita
insegnante          → /gemstaff/me
medico              → /medgem
dipendente          → /gemteam/me
client              → /area-clienti
```

---

## 9. Layout Insegnante

**Sidebar ridotta:**
- Logo StarGem + "Ciao [Nome] 👋" + badge STAFF
- SEZIONE PERSONALE: La mia area, Cambia password, Logout
- Nascosti: tutte le sezioni operative, connessioni live

**Header:**
- Solo avatar
- Nascosti: notifiche, badge count, connessioni

**Footer sidebar:**
- Solo avatar + nome + badge INSEGNANTE
- Nascosti: Aggiornato, Da/Azione, versione

---

## 10. Decisioni Architetturali

**instructor = member (STI)**  
`/api/instructors` legge da `members` con `participant_type LIKE '%INSEGNANTE%'`

**instructorName server-side**  
JOIN in `storage.ts` → incluso direttamente in `/api/courses`

**participant_type multi-valore**  
Query usa `LIKE '%INSEGNANTE%'` — supporta valori composti

**Regola presenze ibride:**
```
Gemdario → presenze auto (bozza)
Segreteria → corregge manualmente
Conferma mese → step MANUALE obbligatorio
Solo dopo → cedolino calcolabile
MAI automatizzare
```

---

## 11. Deprecation Warnings Attivi

`/api/instructors` POST/PATCH/DELETE emette:
- `console.warn` nel terminale server
- Header `X-Deprecation-Warning`
- Trigger `deprecation_logs` nel DB

---

## 12. TODO Futuro

| Elemento | Priorità | Note |
|---|---|---|
| Logo email (immagine rotta) | Bassa | Caricare logo.png su stargem.studio-gem.it |
| CourseUnifiedModal → /api/members | Bassa | Eliminare deprecation warning definitivamente |
| TeoCopilot contesto staff | Media | Contestualizzare AI per /gemstaff/me |
| Validazione email real-time | Media | Aggiungere in tutti i form |

---

## 13. Prossime Chat

| Priorità | Chat | RECAP |
|---|---|---|
| 🔴 Alta | Chat_GemTeam | RECAP_GemTeam_v2.docx |
| 🟠 Media | Chat_MedGem | RECAP_Chat04_MedGem.md |
| 🟡 Media | Chat_Contabilità | RECAP_Contabilita_Cassa.md |
| 🟡 Media | Chat_Dashboard | Solo F2 |

---

*StarGem Suite · RECAP GemStaff v3.0 FINAL · 13/04/2026*  
*SMTP: mail.studio-gem.it porta 465 SSL · noreply@studio-gem.it*
