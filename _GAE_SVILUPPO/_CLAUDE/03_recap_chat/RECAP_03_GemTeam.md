# RECAP_03_GemTeam
> Chat: 03_GemTeam · Periodo: 17/04/2026 → 20/04/2026
> Stato finale: ✅ Completato e operativo in produzione

---

## 1. CONTESTO E OBIETTIVO

Costruzione del modulo **GemTeam** — gestione risorse umane, turni e presenze per i 14 dipendenti di Geos SSDRL (Studio Gem Milano).

Il modulo è stato progettato per:
- Tracciare presenze fisiche (check-in/out) e online (heartbeat)
- Gestire turni settimanali con template A-E importati dall'Excel reale
- Fornire dashboard live con KPI presenze
- Integrare con le altre sezioni del gestionale (Programmazione Date, strategic_events)

---

## 2. ARCHITETTURA DB — TABELLE GEMTEAM

### Tabelle create durante questa chat

| Tabella | Record | Scopo |
|---------|--------|-------|
| `team_employees` | 16 | Anagrafica dipendenti (14 reali + Admin + BotAI) |
| `team_scheduled_shifts` | 225 | Turni reali programmati per data |
| `team_shift_templates` | 550 | Template astratti settimane tipo A-E |
| `team_week_assignments` | variabile | Override settimana tipo per settimana reale |
| `team_postazioni` | 25 | Postazioni configurabili con colore e conta_ore |
| `team_notifications` | 0 | Notifiche in-app ai dipendenti |
| `team_attendance_logs` | 2.077 | Presenze storiche Set25-Apr26 importate da Excel |
| `team_checkin_events` | 1 | Log grezzo check-in fisici |
| `team_shift_diary_entries` | 5 | Diario note fine turno |
| `team_monthly_reports` | 28 | Riepilogo mensile ore (con lock) |
| `team_leave_requests` | 0 | Richieste ferie/permessi (UI non ancora costruita) |
| `user_session_segments` | 137 | Segmenti presenza online per heartbeat |

### Tabelle condivise usate in lettura
- `members` — nome/cognome/foto dipendenti via member_id
- `users` — account login, last_seen_at
- `strategic_events` — overlay festività/chiusure nella griglia turni

### Colonne aggiunte a tabelle esistenti
- `team_employees.display_order` INT — ordine colonne griglia
- `team_employees.team` ENUM aggiornato con valore 'direzione'
- `user_session_segments.last_heartbeat_at` TIMESTAMP — fix bug heartbeat

### Tabella rimossa
- `team_shift_templates_BAK_F1_030` — backup test rimosso con F1-032

---

## 3. PROTOCOLLI ESEGUITI

### Backend (F1)
| Protocollo | Descrizione |
|------------|-------------|
| F1-001→017 | Sessioni precedenti — DB base, route API, check-in, diario |
| F1-018 | Import presenze storiche da Excel (1692 record reali + 385 test) |
| F1-019 | Audit post-import team_attendance_logs |
| F1-020 | Cleanup residui test — sospeso (385 record del 13/04 rimasti) |
| F1-021 | ADD COLUMN display_order + route PATCH reorder dipendenti |
| F1-022 | Nuove tabelle: scheduled_shifts, week_assignments, notifications, postazioni · 12 route API · enum direzione |
| F1-023 | PATCH dipendenti team · fix Arrivabene/Saracchi in direzione · verifica postazioni |
| F1-024 | Diagnosi bug contatore ore lavoro online |
| F1-025 | FIX CRITICO heartbeat — da setInterval automatico a heartbeat su attività reale DOM · soglie 5min pausa / 10min offline |
| F1-026 | UPDATE team Arrivabene e Saracchi → direzione |
| F1-027 / F1-027B | FIX CRITICO route dopo return httpServer — tutte le route F1-022 erano morte |
| F1-028 | Mappa completa DB + frontend (read-only) |
| F1-029 / F1-029B | FIX CRITICO timezone shift date query — new Date() su string YYYY-MM-DD causava 0 risultati su tutte le route GemTeam |
| F1-030 | Re-import turni da file team_TURNI.xlsx aggiornato — TRUNCATE + reimport 550 record |
| F1-031 | Apply-template settimana E (120 turni) + settimana A (103 turni) = 223 turni reali |
| F1-032 | DROP tabella BAK F1-030 + backup finale |
| F1-033 | KPI ONLINE dashboard · label Team · festività 2026 (1 maggio) · fix timezone PATCH |
| F1-034 | Fix permessi cartella dist VPS (EACCES) |
| F1-035 | Fix permessi dist una tantum |
| F1-036 | Test E2E con botAI (pianificato) |

### Frontend (F2)
| Protocollo | Descrizione |
|------------|-------------|
| F2-001→015 | Sessioni precedenti — scaffold UI, tab, dashboard, check-in |
| F2-016 | Fix Tab Turni: escludi admin/botAI · full-screen |
| F2-017 | Fix filtro admin/botAI semanticamente (senza hardcode ID) |
| F2-018 | Drag & drop ordine colonne con @dnd-kit |
| F2-019 | FIX griglia vuota — mismatch orario HH:MM:SS vs HH:MM |
| F2-020 | Tab Turni unificata completa — header con data · 5 viste · celle editabili · overlay eventi |
| F2-021 | Fix header turni + rimozione Programmazione Calendario + griglia 07:00 + gruppi team |
| F2-022 | Fix dropdown postazioni + aggiungi turno + totale ore + badge A-E + team editabile |
| F2-023 | Fix postazioni credenziali + ordina colonne + settimana cliccabile + team editabile |
| F2-024 | Fix fetch credentials + layout compatto GemTeam |
| F2-025 | Fix rendering celle — copertura range oraInizio→oraFine + normalizzazione orario |
| F2-026 | Colori postazioni da DB + legenda bottone + tot ore + viste + fix conflitti |
| F2-027 | Ripristino intestazioni NOME + iniziale cognome dopo regressione |
| F2-028 | Fix inserimento turno + drag&drop + copia + legenda + vista singola |
| F2-029 | 9 fix visivi: barra triangoli · nomi · inserimento · modifica · settimana · singola · collettiva · settimanale · drag&drop |
| F2-030+ | Drag&drop reale · micro-celle 30min · copia massiva · conflict resolver · Wipe&Apply · mansione live · live widget |

---

## 4. BUG CRITICI RISOLTI

### Bug 1 — Route morte dopo return httpServer (F1-027B)
**Problema:** Tutte le route aggiunte in F1-022 erano inserite DOPO il `return httpServer` in routes.ts. Express non le raggiungeva mai — il Vite catchall restituiva index.html.
**Fix:** Spostare tutte le route prima del return httpServer.
**Regola permanente:** Dopo ogni aggiunta route verificare sempre che la riga sia minore del numero di riga di "return httpServer".

### Bug 2 — Timezone shift date query (F1-029B)
**Problema:** `new Date("YYYY-MM-DD")` in JavaScript crea mezzanotte UTC. Il driver MariaDB confronta con colonne DATE pure (no timezone) causando slittamento: la query non trova nessun record.
**Fix:** Sostituire `new Date(dataStr)` con la stringa raw in tutti i confronti DATE usando `sql`DATE(...) = ${dataStr}`` in Drizzle.
**Impatto:** Tutte le route GET turni/scheduled, presenze, diario, eventi-giorno, copy-day.

### Bug 3 — Heartbeat automatico contava presenza passiva (F1-025)
**Problema:** Il cron usava `startedAt` invece di `last_heartbeat_at` come riferimento — uccideva ogni sessione dopo 2 minuti generando 241 mini-segmenti da 0-2 minuti.
**Fix:** Aggiunta colonna `last_heartbeat_at` · heartbeat triggherato solo da eventi DOM reali (mousemove, keydown, scroll, click) · throttle 30 secondi · soglie 5min pausa / 10min offline.

### Bug 4 — Dropdown postazioni mostra solo CAMPUS (F2-028)
**Problema:** Il `<Select>` di shadcn dentro un `<Popover>` (doppio portal) tagliava visivamente le opzioni. Inoltre mancava `credentials: include` nelle fetch.
**Fix:** Sostituito con select HTML nativo + `credentials: include` su tutte le mutation.

### Bug 5 — Celle griglia vuote nonostante dati in DB (F2-025)
**Problema:** Il confronto orario `t.oraInizio === hour` falliva perché DB restituisce `"08:30:00"` mentre gli slot sono `"08:30"`. Inoltre `t.employeeId === dip.id` poteva fallire per type mismatch string/number.
**Fix:** Normalizzazione con padStart + confronto range `slot >= oraInizio AND slot < oraFine` + confronto ID come stringa.

---

## 5. ARCHITETTURA SISTEMA PRESENZA ONLINE

```
Frontend (user-presence-tracker.tsx):
  Ascolta: mousemove, mousedown, keydown, scroll, click, touchstart
  Aggiorna lastActivityTime = Date.now()
  Se passati > 30 secondi dall'ultimo heartbeat → POST /api/users/presence/heartbeat

Backend cron (ogni 2 minuti):
  Segmenti ONLINE con last_heartbeat_at < 5 min fa → chiudi online, crea PAUSA
  Segmenti PAUSA con last_heartbeat_at < 10 min fa → chiudi PAUSA (OFFLINE)

Legenda stati:
  🟢 ONLINE  — attività reale negli ultimi 5 min
  🟡 PAUSA   — nessuna attività tra 5 e 10 min
  ⚫ OFFLINE — nessuna attività da più di 10 min

REGOLA: il sistema conta SOLO il lavoro reale.
Tenere la pagina aperta senza fare nulla → PAUSA dopo 5 min.
```

---

## 6. MAPPING DIPENDENTI — NOME FILE EXCEL → EMPLOYEE_ID DB

| ID | firstName | lastName | team |
|----|-----------|----------|------|
| 1 | Alexandra | Maldonado | segreteria |
| 2 | Giuditta | Fumagalli | segreteria |
| 3 | Estefany | Segura | segreteria |
| 4 | Nura | Hani | segreteria |
| 5 | Joel | Villon | segreteria |
| 6 | Kevin | Bonilla | ass_manutenzione |
| 7 | Jasir | Blanco | ass_manutenzione |
| 8 | Diego | Candelario | ass_manutenzione |
| 9 | Sara | Jannelli | ufficio |
| 10 | Massimiliano | Nembri | ufficio |
| 11 | Santo | Mantice | amministrazione |
| 12 | Elisa | Arrivabene | direzione |
| 13 | Gaetano | Ambrosio | direzione |
| 14 | Stefano | Saracchi | direzione |
| 15 | Admin Master | — | (sistema) |
| 16 | Bot AI | — | (sistema) |

---

## 7. POSTAZIONI — 25 VOCI CONFIGURATE

| Postazione | Conta Ore | Colore |
|------------|-----------|--------|
| AMM.ZIONE | ✅ | #CEB8F6 |
| CAMPUS | ✅ | #9FE1CB |
| CORSI | ✅ | #B5D4F4 |
| EVENTO EST. | ✅ | #FAC775 |
| FERIE | ❌ | #D3D1C7 |
| FESTA | ❌ | #F1EFE8 |
| FORMAZ-1p | ✅ | #C0DD97 |
| FORMAZ-2p | ✅ | #C0DD97 |
| FORMAZ-rec | ✅ | #C0DD97 |
| MAGAZZINI | ✅ | #FAC775 |
| MALATTIA | ❌ | #F7C1C1 |
| MANUTENZ. | ✅ | #9FE1CB |
| PAUSA | ❌ | #D3D1C7 |
| PERMESSO | ❌ | #FAEEDA |
| PRIMO | ✅ | #B5D4F4 |
| RECEPTION | ✅ | #C0DD97 |
| RIPOSO | ❌ | #F1EFE8 |
| RIUNIONE | ✅ | #EEEDFE |
| SAGGI | ✅ | #FAC775 |
| SECONDO | ✅ | #9FE1CB |
| SMART W | ✅ | #B5D4F4 |
| STUDIO 1 e 2 | ✅ | #EEEDFE |
| TEATRO | ✅ | #FAC775 |
| UFFICIO | ✅ | #FAC775 |
| WORKSHOP | ✅ | #EEEDFE |

**Formula ore:** ogni slot = 30 minuti · conta_ore = true → contribuisce al totale

---

## 8. ROUTE API GEMTEAM — ELENCO COMPLETO

```
GET    /api/gemteam/dipendenti
PATCH  /api/gemteam/dipendenti/:id (team, displayOrder)
PATCH  /api/gemteam/dipendenti/reorder

GET    /api/gemteam/turni (template A-E)
GET    /api/gemteam/turni/week-assignment
POST   /api/gemteam/turni/week-assignment
GET    /api/gemteam/turni/scheduled
POST   /api/gemteam/turni/scheduled
PATCH  /api/gemteam/turni/scheduled/:id
DELETE /api/gemteam/turni/scheduled/:id
POST   /api/gemteam/turni/apply-template
POST   /api/gemteam/turni/copy-day
GET    /api/gemteam/turni/ore-mensili
GET    /api/gemteam/turni/eventi-giorno

GET    /api/gemteam/presenze/:anno/:mese
POST   /api/gemteam/checkin
GET    /api/gemteam/checkin/status/:id
GET    /api/gemteam/checkin/oggi

GET    /api/gemteam/diario/:employee_id/:data
POST   /api/gemteam/diario

GET    /api/gemteam/postazioni
POST   /api/gemteam/postazioni
PATCH  /api/gemteam/postazioni/:id
DELETE /api/gemteam/postazioni/:id

GET    /api/gemteam/notifiche
PATCH  /api/gemteam/notifiche/:id/letta

GET    /api/users/presence/active
POST   /api/users/presence/heartbeat
```

---

## 9. REGOLE OPERATIVE STABILITE IN QUESTA CHAT

### Regola Deploy — ASSOLUTA
```
1. Antigravity: git commit + git push origin main
2. STOP — nessun altro comando
3. Gaetano: pull e build manuale su Plesk
MAI: bash scripts/deploy-vps.sh · ssh root@... · npm run build VPS · pm2 restart
```

### Regola Nomenclatura
```
GemTeam → MAI "Staff" — sempre "Team", "Dipendenti", "Personale"
GemStaff → MAI "Team" — sempre "Staff", "Insegnanti"
```

### Regola Route
```
Dopo ogni aggiunta route in routes.ts verificare SEMPRE:
grep -n "return httpServer" server/routes.ts
La riga della route DEVE essere minore del return httpServer.
```

### Regola Heartbeat
```
Il heartbeat è basato su attività reale DOM.
NON usare setInterval automatico.
Soglie: PAUSA = 5 min · OFFLINE = 10 min
Throttle: max 1 heartbeat ogni 30 secondi
```

### Regola Date Query
```
MAI usare new Date("YYYY-MM-DD") per confronti con colonne DATE MariaDB.
Usare sempre la stringa raw: sql`DATE(campo) = ${dataStr}`
```

---

## 10. PENDENTI FASE 2 (non bloccanti)

| # | Pendente | Priorità |
|---|----------|----------|
| 1 | Overlay Programmazione Date nella griglia turni | 🟡 Media |
| 2 | Test E2E completo con account botAI | 🟡 Media |
| 3 | Permessi per ruolo tab (F2-016) — testare con dipendente reale | 🟡 Media |
| 4 | Tessere GemPass da assegnare ai 14 dipendenti | 🟡 Media |
| 5 | Festività nazionali italiane 2026 complete in strategic_events (solo 1 maggio inserita) | 🟡 Bassa |
| 6 | F1-020 cleanup 385 residui test del 13/04 in team_attendance_logs | 🟡 Bassa |
| 7 | Collaboratori (Ago Genca) hardcoded → tabella DB futura | 🟡 Bassa |

---

## 11. BACKUP SESSIONE

```
gemteam_F1-020_cleanup_*.sql
gemteam_F1-021_*.sql
gemteam_F1-022_*.sql
gemteam_sessione_20260417_fine.sql
gemteam_F1-025_sessions_*.sql
gemteam_F1-030_presenze_pre_cleanup_*.sql
gemteam_sessione_20260419_fine.sql  ← BACKUP MASTER FINALE
```

Tutti in: `/root/backups/` sul VPS IONOS 82.165.35.145

---

## 12. NOTE FINALI

**Gaetano dichiara GemTeam completato** in data 20/04/2026.

Il modulo è operativo in produzione su `stargem.studio-gem.it`.
I pendenti fase 2 non bloccano l'utilizzo quotidiano del sistema.

La prossima priorità secondo MASTER_STATUS è **10_Utenti** (accessi GemPortal).
