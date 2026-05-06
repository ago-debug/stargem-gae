# RECAP — Chat di Analisi (Coordinamento Globale)
**Sessione:** 05 Maggio 2026  
**Tipo chat:** Chat Analisi — hub di coordinamento, nessun protocollo F1/F2 emesso  
**Stato sessione:** ✅ Chiusa — contenuto archiviabile

---

## 1. OGGETTO DELLA SESSIONE

Questa sessione ha avuto un unico tema: **scelta del modello Claude ottimale** da assegnare a ciascuna delle chat operative del progetto StarGem Suite, con l'obiettivo di bilanciare qualità del ragionamento, affidabilità nell'esecuzione e costo.

Non sono stati emessi protocolli AG-F1 o AG-F2. Nessuna modifica a DB o codebase.

---

## 2. CONTESTO DI PARTENZA

Gaetano ha chiesto una valutazione comparativa tra i tre modelli disponibili:

- **Claude Haiku 4.5** — veloce, economico, ragionamento base
- **Claude Sonnet 4.6** — bilanciato, affidabile, contesto lungo
- **Claude Opus 4.6** — massima intelligenza, lento, costoso

La domanda era contestualizzata all'architettura del progetto:  
22 moduli, 21 chat specializzate, 80+ tabelle MariaDB, due agenti Antigravity (F1 backend, F2 frontend), sistema di protocolli numerati con regole strette e DB live in produzione su VPS IONOS.

---

## 3. ANALISI COMPARATIVA — TABELLA MODELLI

| Dimensione | Haiku 4.5 | Sonnet 4.6 | Opus 4.6 |
|---|---|---|---|
| Velocità | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| Ragionamento complesso | ❌ Limitato | ✅ Solido | ✅✅ Eccellente |
| Affidabilità su codice critico | ⚠️ Rischi | ✅ Affidabile | ✅ Affidabile |
| Gestione contesto lungo | OK | Ottima | Ottima |
| Costo token | Basso | Medio | Alto |
| Adatto a StarGem | ❌ | ✅ Default | ✅ Casi specifici |

---

## 4. DECISIONI PRESE — MAPPA MODELLI PER CHAT

### 4.1 Chat di Coordinamento

| Chat | Modello assegnato | Motivazione |
|---|---|---|
| **Chat Analisi** (questa) | **Sonnet 4.6** | Uso quotidiano frequente, ragionamento architetturale solido, Opus sarebbe overkill e costoso per una chat sempre aperta |

### 4.2 Agenti di Esecuzione

| Agente | Modello assegnato | Motivazione |
|---|---|---|
| **Antigravity F1** (Backend) | **Sonnet 4.6** | Scrittura su DB live, schema Drizzle ORM, route Node.js — precisione alta obbligatoria. Haiku escluso |
| **Antigravity F2** (Frontend) | **Sonnet 4.6** | TypeScript + React, logiche STI, componenti critici — stesso livello di rischio di F1 |

### 4.3 Chat Moduli Operativi

| Chat | Modello assegnato | Motivazione |
|---|---|---|
| **Chat_04_MedGem** | Sonnet 4.6 | Audit + protocolli DB certificati medici |
| **Chat_06_Contabilità** | **Opus 4.6** ⭐ | Modulo più delicato: 3 conti bancari, prima nota, compensi. Errori qui sono irreversibili |
| **Chat_07_Gemory** | Sonnet 4.6 | Architettura note/todo, seeding SQL board Trello (15 board) |
| **Chat_08_Corsi** | Sonnet 4.6 | Audit corsi, logica STI già consolidata |
| **Chat_09_Workshop** | Sonnet 4.6 | Budget table mancante, enrollment guest — complessità media |
| **Chat_01_Quote e Promo** | **Opus 4.6** ⭐ | 5 tabelle interconnesse, 3 decisioni architetturali aperte, sync StarGem→WooCommerce — rischio logico alto |
| **Chat_14_BookGem** | Sonnet 4.6 | Modulo minimal (studios + studio_bookings), audit semplice |
| **Tutti gli altri moduli** | Sonnet 4.6 | Default per tutti i moduli non ancora avviati (🔴 Da iniziare) |

---

## 5. REGOLA OPERATIVA EMERSA

> **Haiku 4.5 è escluso da tutte le chat operative di StarGem.**  
> Il rischio di errori silenti su un DB live con 80+ tabelle supera qualsiasi vantaggio di costo o velocità.

### Strategia di risparmio token su Opus

- Usare **Sonnet** anche in Contabilità e Quote/Promo per sessioni esplorative (lettura file, analisi, discussione)
- Passare a **Opus** solo nel momento in cui si deve prendere una decisione architetturale definitiva o emettere un protocollo critico con impatto finanziario/strutturale
- Questo dimezza il consumo di Opus mantenendo la qualità dove serve

### Schema riassuntivo

```
Opus 4.6   → Chat_06_Contabilità + Chat_01_Quote e Promo
             (solo per decisioni irreversibili e protocolli critici)

Sonnet 4.6 → TUTTO IL RESTO come standard assoluto

Haiku 4.5  → Non utilizzare in nessuna chat StarGem
             (unica eccezione ammessa: domande veloci fuori progetto)
```

---

## 6. PROTOCOLLI EMESSI IN QUESTA SESSIONE

**Nessuno.** Sessione puramente analitica/consultiva. Nessuna modifica a DB, codebase o file `_GAE_SVILUPPO`.

---

## 7. PENDENZE APERTE EREDITATE DA QUESTA CHAT

Nessuna pendenza tecnica generata in questa sessione. Le pendenze generali del progetto rimangono quelle documentate in `MASTER_STATUS.md` e `ANALISI_MASTER.md`.

Per riferimento rapido, i filoni aperti al momento della chiusura di questa chat:

- GemTeam: E2E test con botAI, role-based permissions, overlay Programmazione Date nel grid turni
- MedGem: F1-001 audit prompt da eseguire
- Chat_06_Contabilità: RECAP pronto, da avviare
- Chat_07_Gemory: 15 board Trello da seedare come SQL
- Chat_08_Corsi: Audit prompt preparato, non eseguito
- Chat_09_Workshop: F1-001 pronto, non eseguito
- Chat_01_Quote e Promo: Da riaprire a F1-015/F2-012 per sync outbound StarGem→WooCommerce
- GemTeam: GemPass card assignment per 14 dipendenti
- Light/Dark/Auto theme: Assegnato a Chat_26_Dashboard

---

## 8. NOTE PER LA PROSSIMA CHAT DI ANALISI

Quando apri la nuova sessione della Chat di Analisi:

1. Esegui il check inizio sessione (leggi `00_LEGGIMI.md` via MCP)
2. Leggi `MASTER_STATUS.md` e `ANALISI_MASTER.md` per riallinearti sullo stato attuale
3. Il modello da usare è **Sonnet 4.6**
4. Le decisioni sui modelli prese in questa sessione sono definitive — non riaprire il tema

---

*RECAP generato il 05/05/2026 — Chat di Analisi — StarGem Suite v2*  
*Nessun protocollo emesso · Nessuna modifica DB · Sessione chiusa*
