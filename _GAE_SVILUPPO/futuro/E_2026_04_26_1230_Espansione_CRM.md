Aggiornato al: 2026-04-26 12:30

# PROPOSTA TECNICO-STRATEGICA: INTEGRAZIONE STUDIO GEM ↔ CLARISSA CRM

> [!NOTE]
> **FASE 2 STRATEGICA NON ATTIVA**
> L'integrazione delineata in questo documento è strutturalmente posta in *stand-by*. Essa rappresenta la "Fase 2", uno studio teorico per i prossimi trimestri. Il task ad oggi attivo e concluso tecnicamente riguarda *unicamente* la classificazione anagrafica autonoma del gestionale (CRM Interno a 4 livelli). Nessun codice relativo a Clarissa deve essere invocato od istanziato al momento.

## 1. Architettura Consigliata: La "Source of Truth"
Il principio cardine per evitare disastri architetturali è stabilire la "Verità Assoluta" per ogni dominio.

- **Studio Gem (Master):** Anagrafica Cliente, Profilazione CRM (Level/Score), Pagamenti, Iscrizioni / Attività.
- **Clarissa (Slave/Comunicazioni):** Comunicazioni / Mailing, Trattative Commerciali, Storico Contatti (Telefonate), Calendario Commerciale.
- **Ibrido:** Tag Cliente (Gem emette tag strutturali, Clarissa tag comportamentali).

## 2. Modello di Sincronizzazione Consigliato
**Raccomandazione netta: Sincronizzazione Unidirezionale Guidata ad Eventi (Studio Gem → Clarissa) + Webhook di Ritorno Minimi.**

Studio Gem è il *Master*. Quando un utente viene creato, aggiornato o cambia livello CRM, spinge il payload in REST API verso Clarissa. L'unico ritorno consentito in sicurezza è una notifica Webhook per: **Disiscrizioni Email/Privacy (Opt-Out)** o per l'eventuale **creazione di "Nuovi Lead nudi"**.

## 3. Matrice dei Dati

| Campo | Dove Nasce | Sincronizzazione | Rischio |
| :--- | :--- | :---: | :--- |
| **ID Interno Gem** | Gem | `Gem -> Clarissa` | Critico |
| **Nome / Cognome / Email / Telefono** | Gem | `Gem -> Clarissa` | Alto/Medio |
| **Codice Fiscale / Prodotti Acquistati** | Gem | NO | Alto/Basso |
| **Stato (Attivo/Inat) / Livello CRM / Ultima Attiv.** | Gem | `Gem -> Clarissa` | Basso |
| **Pipeline/Follow-up** | Clarissa | NO | Basso |
| **Consenso Privacy** | Clarissa | `Clarissa -> Gem` | Medio |

## 4. Identità e Match Cliente (Zero Duplicati)
- **Chiave Primaria di Riferimento:** `members.id` di Studio Gem. Ogni anagrafica creata, alla primissima sync verso Clarissa, passa il proprio ID dentro un custom field inalterabile di Clarissa (`ext_studiogem_id`).
- **Problema Email Raggruppata:** Spesso madri e figli usano la stessa email. Il match per Email è PERICOLOSO. Priorità di Match in creazione: 1) `ext_studiogem_id`, 2) Telefono Mobile, 3) Email.

## 5. Ruolo della Profilazione CRM
La profilazione **NASCE in Studio Gem** e si **PROPAGA in Clarissa**. Il motore interno di Gem dichiara i livelli, e fa una chiamata API a Clarissa per reagire passivamente tramite le sue Automazioni native.

## 6. Piano di Integrazione in 3 Fasi
- **FASE 1: Sync Minima e Sicura ("Pompaggio Base")**: Export/Import CSV e worker notturno.
- **FASE 2: Webhooks e Triggers Live**: Passaggio ad eventi live e gestione disiscrizioni.
- **FASE 3: Deep Insights**: Sync di metadati aggregati come LTV e Ultima Data Presenza.

## 7. Decisione Operativa Finale
- **SUBITO:** Generare Export CSV pulito. Predisporre modulo middleware isolato (`server/integrations/clarissa.ts`).
- **RIMANDARE:** Gestione webhook di ritorno.
- **MAI FARE:** Sincronizzare bidirezionalmente campi core, esportare lo storico corsi come "Prodotti" su Clarissa.
