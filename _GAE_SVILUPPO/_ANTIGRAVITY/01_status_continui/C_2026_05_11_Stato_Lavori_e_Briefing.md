---
aggiornato: 2026-05-11
ultima_verifica_vs_codice: 2026-05-11
validita_prevista: 2026-05-25
fonti_verificate:
  - "[[stato_di_fatto_F1_backend_2026_05_11]]"
---

# C — Stato Lavori e Briefing
**Documento Faro — Backend**

Sintesi dello stato di implementazione dei macro-moduli e priorità strategiche operative dettate da Gaetano.

## 1. Stato Macro-Sezioni (Audit Reale 11/05)
- 🟢 **STI & Erogazione Corsi**: Funzionante. Il passaggio a Single Table Inheritance ha azzerato il debito strutturale dei silos.
- 🟢 **Auth & Logging**: Stabile. Le tabelle di log (`user_activity_logs`) tracciano efficacemente le operazioni.
- 🟡 **Listini & Promozioni**: Dati e tabelle ok (post-migrazioni aprile), ma fortissimo accoppiamento nel flusso di checkout.
- 🔴 **CRM Anagrafica & GemTeam**: Attualmente bloccati in dev a causa dello svuotamento dei dati relazionali (0 tessere, 0 iscrizioni, 0 turni staff). Il codice c'è, ma l'ambiente non permette test visuali senza re-import.

## 2. Priorità Strategiche (Ordine Tassativo)

### PRIORITÀ 1: Anagrafica (Members)
- **Problema**: La tabella `members` funge da raccoglitore piatto per campi che dovrebbero essere relazionali (Tessere, Certificati Medici). Questo causa potenziale perdita di storicità e crash UI se estratti malamente.
- **Obiettivo**: Disaccoppiare definitivamente tessere (`memberships`) e certificati, reindirizzando le query API per eseguire JOIN corrette sulle tabelle specializzate prima di eliminare le colonne da `members`.

### PRIORITÀ 2: Pagamenti (Cassa & Checkout)
- **Problema**: Il `PaymentModuleConnector` e il flusso del checkout sono legati strettamente all'UI e al monolite `routes.ts`.
- **Obiettivo**: Disaccoppiare la business logic del prezzaggio (che legge il listino stagionale unificato) dal frontend.

### PRIORITÀ 3: Calendario (Planning & UI)
- **Problema**: Logica di calcolo temporale e griglia mescolate al codice di rendering React. Rischio di regressioni elevate ("white screen") con dati sporchi.
- **Obiettivo**: Estrazione della pura logica in un set di hook o servizi backend, alleggerendo i componenti frontend.
