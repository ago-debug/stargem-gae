# 📊 ANALISI MASTER — StarGem Suite
> Documento di coordinamento globale — Chat ANALISI
> Aggiornato: 2026_04_25_1215 — v5.0
> Leggi insieme a: MASTER_STATUS + tutti i file GAE_SVILUPPO (A→G)

---

## 1. CHI SIAMO

**Cliente:** Geos SSDRL — Studio Gem Milano (danza, fitness, ballo)
**Prodotto:** StarGem Suite — gestionale SaaS per SSDRL italiane
**Sito vendita:** studio-gem.it (WooCommerce) — rimane sempre lì
**Gestionale:** stargem.studio-gem.it · porta 5001 dev
**Stack:** React + TypeScript + Tailwind / Node.js + Drizzle ORM / MariaDB 11.4 / VPS IONOS

---

## 2. SEPARAZIONE SISTEMI

```
WooCommerce = VENDITA (checkout, carrello — non si tocca)
StarGem = OPERATIVO (iscrizioni, tessere, presenze, compensi, cassa)
Integrazione = webhook + API bidirezionale
Bitrix → abbandonato → Clarissa (chat 17)
GSheet → eliminati → segreteria lavora in StarGem
```

---

## 3. CLASSIFICAZIONE UTENTI — DEFINITIVA

Fonte: 2026_04_20_classificazione_stargem_v2.pdf

```
UTENTE → categoria anagrafica base (members)
  Tesserato → memberships.status = 'attiva'
    Partecipante = frequenta attività
    Non partecipante = tessera attiva, non frequenta
  Non tesserato → no tessera o scaduta
    Può affittare, pagare, ricevere fattura

STAFF → solo tesserati
  participantType: INSEGNANTE | PERSONAL | PERSONAL_TRAINER

TEAM → solo tesserati in team_employees
  Dipendenti: ruolo + mansione + postazione
  Collaboratori: team senza rapporto dipendente fisso

Sovrapposizione Staff+Team = 2 account separati (policy due cappelli)
```

---

## 4. 14 ATTIVITÀ UFFICIALI

```
1.Corsi  2.Workshop  3.Prove a pagamento  4.Prove gratuite
5.Lezioni singole  6.Lezioni individuali  7.Domenica in movimento
8.Allenamenti  9.Affitti  10.Campus  11.Saggi
12.Vacanze studio  13.Eventi esterni  14.Merchandising

Calendario Attività → attività con orario/spazio puntuale
Planning → attività strategiche stagionali
Merchandising → escluso da calendari
```

---

## 5. STATO TECNICO — aggiornato 25/04/2026

### ✅ Completati e operativi
- GemTeam (turni da reimportare — wipe da test)
- GemStaff (6 tabelle, 65 insegnanti + 6 PT)
- GemPass (3.281 tessere, 22/22 test)
- Quote & Promo Fase 1 (18 tabelle, webhook WC)
- Auth / GemPortal / area-tesserati (7 ruoli, TeoBot)
- Import storico COMPLETO (Chat_22 chiusa F1-054)
  members: 4.489 · memberships: 3.281
  enrollments: 13.584 · payments: 3.775
  medical_certificates: 2.770 · courses: 586
- ExportWizard in 10 sezioni (CSV + Excel)
- Import unificato /importa con dry-run

### 🟡 In collaudo / da completare
- Calendario + Planning → UI FREEZE
  Raggruppamento corsi Planning sparito — da investigare
- Fix UI campi nascosti (Priorità 1b):
  GemPass / Anagrafica / Contabilità / Iscritti

### 🔴 Sensibili — non toccare
```
PaymentModuleConnector → impatta 14 route
Tessere → barcode + factory stagione
Calendario → UI FREEZE fino a collaudo completato
```

---

## 6. STATO DB — 25/04/2026

| Tabella | Record | Note |
|---------|--------|------|
| enrollments | 13.584 | ✅ |
| members | 4.489 | 174 colonne, flag qualità attivi |
| payments | 3.775 | ✅ storici importati |
| memberships | 3.281 | ✅ duplicate rimosse |
| medical_certificates | 2.770 | ✅ |
| courses | 586 | 296 reali + 285 storici + 5 P6 |
| users | 19 | account staff |
| team_attendance_logs | 2.078 | presenze reali |
| team_scheduled_shifts | 17 | ⚠️ wipe da test |
| team_shift_templates | 1 | ⚠️ wipe da test |

**Flag qualità members da bonificare:**
- tessera_mancante_da_assegnare: 1.322
- omonimo_da_verificare: 407
- mancano_dati_obbligatori: 198
- nome_match: 179
- incompleto: 20

**Backup:** CHAT22_CHIUSURA_DEFINITIVA_20260425_1005.sql (13MB)

---

## 7. ARCHITETTURA IDENTITÀ DIGITALE

```
members.user_id → FK → users.id (onDelete: set null)
Flusso: INSERT users → PATCH members.user_id = UUID
Ruoli: operator · admin · client · medico · insegnante · dipendente
user_roles: colonna 'name' (non 'roleName')
Policy due cappelli: doppio ruolo = 2 account separati
Login: email O username + password
```

---

## 8. MAPPA 23 CHAT

| # | Chat | Stato | Priorità |
|---|------|-------|---------|
| 01 | Quote e Promo | 🟡 Fase 2 da fare | Media |
| 02 | GemStaff | ✅ Completa | — |
| 03 | GemTeam | ✅ (turni da reimportare) | Media |
| 04 | MedGem | 🔴 Da iniziare | Media |
| 05 | GemPass | ✅ + Fix UI da fare | Alta |
| 06 | Contabilità | 🔴 UI cassa da fare | Alta |
| 07 | Gemory | 🔴 Da iniziare | Normale |
| 08 | Corsi/Iscritti | 🔴 Fix UI + scheda | Alta |
| 09 | Workshop | 🔴 Da iniziare | Alta |
| 10 | Utenti/Anagrafica | ✅ + Fix UI 54 campi | Alta |
| 11 | Campus | 🔴 Da iniziare | Bassa |
| 12 | Gemdario | 🟡 UI FREEZE collaudo | Urgente |
| 13 | DomenikeInMovimento | 🔴 Da iniziare | Bassa |
| 14 | BookGem | 🔴 Da iniziare | Media |
| 15 | Saggi | 🔴 Da iniziare | Bassa |
| 16 | VacanzeStudio | 🔴 Da iniziare | Bassa |
| 17 | Clarissa | 🔴 Da iniziare | Media |
| 18 | GemEvent | 🔴 Da iniziare | Bassa |
| 19 | GemNight | 🔴 Da iniziare | Bassa |
| 20 | MerchSG | 🔴 Da iniziare | Bassa |
| 21 | TeoCopilot | 🟡 Stub attivo | Bassa |
| 22 | ImportExport | ✅ CHIUSA 25/04 F1-054 | — |
| 23 | Log_Verifiche | 🟡 Aperta 24/04 | Normale |

---

## 9. PRIORITÀ OPERATIVE

```
1b → Fix UI campi nascosti (GemPass, Anagrafica, Contabilità, Iscritti)
2  → Reimport turni GemTeam (team_TURNI.xlsx)
3  → 06_Contabilità (UI cassa, cash_registers, bank_deposits)
4  → 08_Corsi + 09_Workshop (stagione in apertura)
5  → 12_Gemdario collaudo (raggruppamento Planning)
6  → 04_MedGem + 07_Gemory
7  → resto chat in ordine
```

---

## 10. REGOLE DB INVIOLABILI

```
payments / PaymentModuleConnector → SENSIBILE (14 route) — non toccare
members → solo ADD COLUMN (mai modificare esistenti)
courses → non toccare struttura STI
enrollments → tabella iscrizioni UFFICIALE
Categorie → custom_lists + custom_list_items (no nuove *_cats)
Backup → obbligatorio dopo ogni F1 che modifica il DB
```

---

## 11. COLORI ATTIVITÀ STI

```
Corsi → categoria variabile · Allenamenti → #1e40af
Lezioni IND → #7c3aed · Workshop → #c2410c
Domeniche → #a16207 · Saggi → #be185d
Vacanze → #15803d · Campus → #0369a1 · Affitti → #374151
```

---

## 12. REGOLE OPERATIVE ANTIGRAVITY

```
F1 = AG-Backend · F2 = AG-Frontend
Chat nuova → F1-001 / F2-001
Stop & Go sempre · Max 1 numero distanza F1/F2
Claude NON anticipa codice — descrive COSA e PERCHÉ
Antigravity esplora il codebase in autonomia
Anticipare il codice condiziona la ricerca e genera errori
File GAE_SVILUPPO: formato YYYY_MM_DD_HHMM_nome.ext
```

---

## 13. INFRASTRUTTURA

```
VPS: IONOS 82.165.35.145
DB: stargem_v2 MariaDB port 3306 (VPS) / 3307 (tunnel locale)
App: pm2 porta 5001, nome: stargem
Deploy: git push → Plesk git pull manuale → npm run build → pm2 reload stargem
Backup: /root/backups/ via SSH
```

---

*StarGem Suite · ANALISI MASTER v5.0 · 2026_04_25_1215*
