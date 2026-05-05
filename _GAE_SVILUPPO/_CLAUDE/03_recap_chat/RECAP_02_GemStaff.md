# RECAP_02_GemStaff — Sessione Completa
**Chat:** 02_GemStaff  
**Data:** 13 Aprile 2026  
**Durata:** Sessione unica — mattina → sera  
**Stato finale:** ✅ Completata al 100%  
**Ultimo commit:** `feat: GemStaff COMPLETE FINAL`  
**Backup finale:** `gemstaff_ASSOLUTO_20260413_1817.sql` — 9.2MB

---

## 1. OBIETTIVO DELLA CHAT

Costruire il modulo **GemStaff** — gestione completa dello staff di insegnanti e personal trainer di Geos SSDRL (Studio Gem Milano). Il modulo include anagrafica, compliance documenti, presenze, sostituzioni, accordi economici, storico disciplinare, cedolini e sistema di accesso dedicato per gli insegnanti.

---

## 2. PROTOCOLLI ESEGUITI — QUADRO COMPLETO

| Protocollo | Contenuto | Esito |
|---|---|---|
| F1-001 | Audit DB esistente + 7 tabelle nuove + estensioni members/users | ✅ |
| F2-001 | Scaffold /gemstaff + sidebar + 6 tab + guard ruoli base | ✅ |
| F1-002 | 16 route API GemStaff con autenticazione | ✅ |
| F2-002 | Tab 1 Anagrafica + TS cleanup 53 errori | ✅ |
| F1-003 | PT mappati (6 record), tessere GemPass agganciate | ✅ |
| F2-003 | Tessera nel dettaglio + Tab 2 PT + Tab 3 Compliance | ✅ |
| F1-004 | Route presenze, sostituzioni, disciplinare | ✅ |
| F2-004 | Tab 4 Accordi + Tab 5 Presenze/Sostituzioni | ✅ |
| F1-005 | Backup + push main | ✅ |
| F2-005 | Tab 6 Disciplinare + banner riservatezza | ✅ |
| F1-006 | Route payslip personale con guard doppio | ✅ |
| F1-007 | Screening completo impatto instructors nel sistema | ✅ |
| F2-007 | Fix field mapping + fusione instructors + tabella completa + modale 3 sezioni | ✅ |
| F1-008 | PATCH /api/gemstaff/insegnanti/:id campi GemStaff | ✅ |
| F1-009 | Screening anomalie participant_type + fix LIKE query + UPDATE 4 anomalie + instructorName JOIN | ✅ |
| F1-010 | Backup finale 9.2MB + push completo | ✅ |
| F2-010 | Rimozione /staff + redirect → /gemstaff + sidebar pulita | ✅ |
| F1-011 | Deprecation warnings backend + trigger DB + push | ✅ |
| F2-011 | Banner deprecazione frontend in instructors.tsx | ✅ |
| F1-012 | DROP instr_rates + schema.ts pulito + route /api/gemstaff/me | ✅ |
| F2-012 | /gemstaff/me creata + instructors.tsx eliminato fisicamente + redirect login | ✅ |
| F1-013 | Route crea-account insegnante + login hub redirectTo + route first-login | ✅ |
| F2-013 | UI crea account con dialog OTP + pagina /first-login + login hub | ✅ |
| F1-014 | Push + backup definitivo | ✅ |
| F2-014 | Test visivo finale + 00A/00B aggiornati | ✅ |
| F1-015 | Fix lookup first-login (email OR username) + route forgot-password + mailer utility | ✅ |
| F2-015 | Icona GemStaff cliccabile nella landing + link /first-login | ✅ |
| F1-016 | Config SMTP .env + test mailer dry run | ✅ |
| F2-016 | Label "EMAIL O USERNAME" + flusso /first-login chiarito | ✅ |
| F2-017 | Fix parametri form first-login (tempCode → otp) | ✅ |
| F2-018 | Pagina /forgot-password + link "Password dimenticata?" + miglioramenti /first-login | ✅ |
| F2-019 | Sidebar ridotta insegnante + fix /gemstaff/me stato vuoto | ✅ |
| F2-020 | Header pulita per insegnante + connessioni live nascoste + footer semplificato | ✅ |
| F1-017 | SMTP 465 SSL attivo + 3 template email + push finale + backup ASSOLUTO | ✅ |

---

## 3. ROTTE FRONTEND CREATE

| Rotta | Accesso | Descrizione |
|---|---|---|
| `/gemstaff` | Admin / Operator | Modulo completo 6 tab |
| `/gemstaff/me` | Insegnante | Dashboard personale |
| `/first-login` | Pubblica | Primo accesso con OTP |
| `/forgot-password` | Pubblica | Reset password |

---

## 4. TAB E PERMESSI

| Tab | Contenuto | Admin | Operator/Segreteria | Insegnante |
|---|---|---|---|---|
| 1 — Anagrafica Insegnanti | Lista CRUD + pannello dettaglio | ✅ completo | ✅ sola lettura | ❌ |
| 2 — Personal Trainer | Lista PT | ✅ | ✅ | ❌ |
| 3 — Compliance Documenti | 6 card + barra avanzamento | ✅ modifica | ✅ sola lettura | ❌ |
| 4 — Accordi Economici | Tariffe insegnanti | ✅ | ❌ NASCOSTA | ❌ |
| 5 — Presenze & Sostituzioni | Matrice mensile + log | ✅ + conferma mese | ✅ inserimento sost. | ❌ |
| 6 — Storico Disciplinare | Log richiami/ammonizioni | ✅ | ❌ NASCOSTA | ❌ |

---

## 5. PAGINA /gemstaff/me (SOLO INSEGNANTE)

Contenuto:
- **Dati Personali** — Nome, Cognome, Email, Telefono, Specializzazione
- **Le Mie Presenze** — Matrice mensile con selettore mese/anno
- **Documenti e Compliance** — 6 card con stato PRESENTE/MANCANTE
- **Il Mio Cedolino** — Selettore mese/anno + stato bozza/confermato/pagato

Link in fondo: "Hai bisogno di aiuto? Contatta la segreteria →" (mailto:info@studio-gem.it)

---

## 6. LAYOUT DEDICATO PER INSEGNANTE

**Sidebar ridotta:**
- Logo StarGem + "Ciao [Nome] 👋" + badge dorato STAFF
- SEZIONE PERSONALE: La mia area → /gemstaff/me, Cambia password → /forgot-password, Logout
- Nascosti: tutte le sezioni operative, connessioni live, versione sistema

**Header:**
- Solo avatar in alto a destra
- Nascosti: notifiche, badge count, connessioni live, icone operative

**Footer sidebar:**
- Solo avatar + Nome + badge INSEGNANTE
- Nascosti: Aggiornato, Da/Azione, versione

---

## 7. FLUSSO COMPLETO ACCOUNT INSEGNANTI

```
PRIMO ACCESSO:
1. Admin apre GemStaff Tab 1 → cerca insegnante
2. Click sulla riga → pannello dettaglio laterale
3. Sezione "Account di Sistema":
   → Se nessun account: banner + pulsante "Crea Account"
   → Click → dialog conferma con email pre-compilata
   → POST /api/gemstaff/crea-account/:memberId
   → Sistema genera OTP 6 cifre (valido 24 ore)
   → Dialog mostra OTP UNA SOLA VOLTA
   → Email automatica parte a noreply@studio-gem.it
4. Insegnante riceve email "Benvenuto in StarGem"
5. Va su /first-login (o click icona GemStaff nella landing)
6. Inserisce email + OTP + sceglie nuova password
7. POST /api/auth/first-login
8. email_verified = true, OTP annullato
9. Email conferma "✅ Account StarGem attivato" inviata
10. Redirect automatico → /gemstaff/me

ACCESSI SUCCESSIVI:
- Login con email + password → redirect /gemstaff/me

PASSWORD DIMENTICATA:
1. Click "Password dimenticata?" nella login
2. Vai su /forgot-password
3. Inserisci email → POST /api/auth/forgot-password
4. Nuovo OTP generato + email reset inviata
5. Vai su /first-login con nuovo OTP + nuova password

PANNELLO DETTAGLIO SE ACCOUNT GIÀ ATTIVO:
- Badge verde "✓ Account attivo"
- Mostra: email_verified (Verificato / Da verificare)
```

---

## 8. LOGIN HUB — REDIRECT PER RUOLO

```
admin / operator    → /calendario-attivita
insegnante          → /gemstaff/me
medico              → /medgem
dipendente          → /gemteam/me
client              → /area-clienti
```

---

## 9. EMAIL AUTOMATICHE

| Evento | Funzione | Oggetto |
|---|---|---|
| Crea account insegnante | `sendWelcomeEmail()` | "Benvenuto in StarGem — Accesso Staff" |
| Forgot password | `sendResetPasswordEmail()` | "StarGem — Reset Password" |
| Primo login completato | `sendActivationConfirmEmail()` | "✅ Account StarGem attivato" |

**Config SMTP:**
```
SMTP_HOST=mail.studio-gem.it
SMTP_PORT=465  (SSL/TLS)
SMTP_USER=noreply@studio-gem.it
SMTP_FROM="Studio Gem" <noreply@studio-gem.it>
SMTP_PASS=[in .env — non committare]
```

**File:** `server/utils/mailer.ts`  
**Test:** `npx tsx scripts/test-mailer.ts`  
⚠️ SMTP funziona solo sul VPS in produzione (relay IONOS bloccato da IP esterni per sicurezza — normale).

---

## 10. TABELLE DB CREATE

| Tabella | Scopo | Record iniziali |
|---|---|---|
| `staff_contracts_compliance` | Burocrazia documenti (CI, CF, diploma, foto, video, contratto) | 0 |
| `staff_document_signatures` | Firme stagionali Regolamento + Codice Disciplinare | 0 |
| `staff_disciplinary_log` | Storico richiami, ammonizioni, sospensioni | 0 |
| `staff_presenze` | Presenze ibride auto (Gemdario) + manuale | 0 |
| `staff_sostituzioni` | Log sostituzioni con doppio visto (segreteria + Elisa) | 0 |
| `payslips` | Cedolini mensili insegnanti | 0 |
| `deprecation_logs` | Audit trail scritture su tabelle deprecate | 0 |

**Tabelle eliminate:**
- `instr_rates` — droppata (era vuota, STI già su members)

---

## 11. ESTENSIONI TABELLE ESISTENTI

**`members` — colonne aggiunte:**
```sql
user_id                     VARCHAR(255) NULL  -- FK → users.id
staff_status                ENUM('attivo','inattivo','archivio')
lezioni_private_autorizzate BOOLEAN DEFAULT FALSE
lezioni_private_autorizzate_at  DATETIME NULL
lezioni_private_autorizzate_by  VARCHAR(255) NULL
lezioni_private_note            TEXT NULL
```

**`users` — colonne aggiunte:**
```sql
email_verified   BOOLEAN DEFAULT FALSE
otp_token        VARCHAR(10) NULL
otp_expires_at   DATETIME NULL
```

---

## 12. ROUTE API BACKEND COMPLETE

```
GET    /api/gemstaff/insegnanti              Lista insegnanti (LIKE '%INSEGNANTE%')
GET    /api/gemstaff/insegnanti/:id          Profilo + tessera + compliance + firme
PATCH  /api/gemstaff/insegnanti/:id          Aggiorna campi GemStaff
GET    /api/gemstaff/pt                      Lista Personal Trainer
GET    /api/gemstaff/compliance/:memberId    Documenti compliance
POST   /api/gemstaff/compliance/:memberId    Upsert documento
GET    /api/gemstaff/firme/:memberId         Firme documenti stagionali
POST   /api/gemstaff/firme                   Registra firma
GET    /api/gemstaff/presenze/:month/:year   Matrice presenze mensile
GET    /api/gemstaff/presenze/:id/:month/:year  Presenze singolo
POST   /api/gemstaff/presenze                Inserimento manuale
POST   /api/gemstaff/presenze/conferma       Conferma mese (obbligatorio prima cedolino)
GET    /api/gemstaff/sostituzioni/:month/:year  Log sostituzioni
POST   /api/gemstaff/sostituzioni            Registra sostituzione
PATCH  /api/gemstaff/sostituzioni/:id/visto  Aggiorna visto
GET    /api/gemstaff/disciplinare/:memberId  Storico disciplinare
POST   /api/gemstaff/disciplinare            Nuovo evento
PATCH  /api/gemstaff/disciplinare/:id        Aggiorna risposta/decisione
GET    /api/gemstaff/payslips/:memberId      Lista cedolini
GET    /api/gemstaff/payslips/:id/:month/:year  Cedolino specifico
POST   /api/gemstaff/crea-account/:memberId  Crea account utente per insegnante
GET    /api/gemstaff/me                      Profilo personale insegnante loggato
POST   /api/auth/first-login                 Primo accesso + cambio password
POST   /api/auth/forgot-password             Reset password con nuovo OTP
```

---

## 13. DECISIONI ARCHITETTURALI PRESE

### instructor = member (STI confermato)
```typescript
// shared/schema.ts
export type InsertInstructor = Partial<InsertMember>;
export type Instructor = Member;  // STESSA COSA
```
`/api/instructors` legge da `members` con `participant_type LIKE '%INSEGNANTE%'`.  
Nessuna tabella separata. Tutto su `members`.

### instructorName server-side (fix architetturale)
JOIN aggiunta in `server/storage.ts` → `instructorName` incluso direttamente nel payload di `/api/courses`.  
Il calendario non fa più chiamate extra a `/api/instructors` per risolvere i nomi.

### participant_type multi-valore
Query GemStaff usa `LIKE '%INSEGNANTE%'` per catturare valori composti come `'tesserato, Staff/Insegnante'`.  
Il sistema supporta multi-ruolo per persona.

### Collegamento members ↔ users
```
members.user_id → users.id  (FK monodirezionale)
```
Se `user_id` è NULL → persona senza account digitale (allievo passivo).  
Se `user_id` ha valore → persona con accesso al gestionale.

### Regola presenze ibride — FONDAMENTALE
```
Gemdario → genera presenze automatiche (source='auto', status='bozza')
Segreteria → corregge manualmente se necessario
Conferma mese → STEP MANUALE OBBLIGATORIO prima del cedolino
Solo dopo conferma → cedolino calcolabile
MAI automatizzare il passaggio a payslips
```

### Regola sostituzioni — doppio visto
```
Sostituzione inserita → visto_segreteria + visto_elisa
Entrambi i visti richiesti prima di conferma mese
```

---

## 14. DEPRECATION WARNINGS ATTIVI

`/api/instructors` (POST/PATCH/DELETE) emette:
- `console.warn('[⚠️ DEPRECATION]...')` nel terminale server
- Header `X-Deprecation-Warning` nella risposta HTTP
- Trigger `deprecation_logs` nel DB per audit

**Cosa resta da fare (futuro):**
- Aggiornare `CourseUnifiedModal` per usare `/api/members` invece di `/api/instructors`
- Dopo aggiornamento → deprecation warning sparisce definitivamente

---

## 15. FILE ELIMINATI O MODIFICATI CHIAVE

| File | Azione | Motivo |
|---|---|---|
| `client/src/pages/instructors.tsx` | ELIMINATO fisicamente | Fuso in GemStaff |
| `shared/schema.ts` | Rimossi instructorRates, instructorRatesRelations | instr_rates droppata |
| `server/storage.ts` | JOIN instructorName aggiunta | Fix architettura calendario |
| `server/utils/mailer.ts` | CREATO | 3 template email automatiche |
| `client/src/pages/gemstaff.tsx` | CREATO | Modulo principale 6 tab |
| `client/src/pages/gemstaff-me.tsx` | CREATO | Dashboard insegnante |
| `client/src/pages/first-login.tsx` | CREATO | Primo accesso OTP |
| `client/src/pages/forgot-password.tsx` | CREATO | Reset password |
| `client/src/components/app-sidebar.tsx` | MODIFICATO | Sidebar ridotta per insegnante |
| `client/src/App.tsx` | MODIFICATO | ProtectedRoute fix + redirect + login hub |
| `client/src/pages/auth-page.tsx` | MODIFICATO | Label EMAIL O USERNAME + icona GemStaff |
| `server/auth.ts` | MODIFICATO | Login hub redirectTo + first-login + forgot-password |
| `server/routes.ts` | MODIFICATO | Tutte le route GEMSTAFF + deprecation warnings |

---

## 16. ACCOUNT DI TEST CREATO

| Campo | Valore |
|---|---|
| Nome | Cavallo Pazzo |
| Email | gae71@mac.com |
| Ruolo | insegnante |
| Member ID | 9555 |
| User ID | faaf36de-3d6c-429c-92ae-d2e38dccb715 |
| Stato | account attivo, email_verified=true |

---

## 17. NUMERI FINALI

| Metrica | Valore |
|---|---|
| Insegnanti attivi in GemStaff | 68 |
| Personal Trainer | 6 |
| Anomalie participant_type corrette | 4 (Serini, Ambrosio, Arrivabene, Palma) |
| Tabelle create | 7 |
| Tabelle eliminate | 1 (instr_rates) |
| File eliminati | 1 (instructors.tsx) |
| Errori TypeScript | 0 |
| Protocolli F1 eseguiti | 17 |
| Protocolli F2 eseguiti | 21 |
| Commit push | 4 (d281d77, 5fff8b1, c886267, finale) |
| Backup disponibili su VPS | 3 (F1-001, DEFINITIVO, ASSOLUTO) |

---

## 18. TODO FUTURI (NON URGENTI)

| Elemento | Priorità | Note |
|---|---|---|
| Logo email (immagine rotta) | Bassa | Caricare logo.png su stargem.studio-gem.it/logo.png |
| CourseUnifiedModal → /api/members | Bassa | Elimina deprecation warning definitivamente |
| TeoCopilot contesto staff | Media | Contestualizzare AI per /gemstaff/me |
| Validazione email real-time | Media | Aggiungere in tutti i form (previene typo come gmil.com) |
| forgot-password locale | Nessuna | Funziona in produzione VPS — non serve fix locale |

---

## 19. MASTER_STATUS — AGGIORNAMENTO FINALE

```
## 02_GemStaff — aggiornato 13/04/2026
Stato: ✅ Completata
Ultimo protocollo: F1-017 / F2-021
Tabelle DB toccate: staff_presenze · staff_sostituzioni · 
  payslips · staff_contracts_compliance · 
  staff_document_signatures · staff_disciplinary_log · 
  deprecation_logs · ALTER members (user_id, staff_status, 
  lezioni_private_*) · ALTER users (email_verified, 
  otp_token, otp_expires_at) · DROP instr_rates
Pendenti: forgot-password solo su VPS (relay IONOS blocca 
  da IP esterni) — nessun fix necessario al codice
```

---

*StarGem Suite · RECAP_02_GemStaff · Sessione 13/04/2026*  
*Commit finale: feat: GemStaff COMPLETE FINAL*  
*Backup: gemstaff_ASSOLUTO_20260413_1817.sql — 9.2MB*  
*SMTP: mail.studio-gem.it porta 465 SSL · noreply@studio-gem.it*
