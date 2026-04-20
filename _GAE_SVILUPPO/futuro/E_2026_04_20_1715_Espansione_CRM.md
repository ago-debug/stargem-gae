Aggiornato al: 2026-04-20 17:15



<!-- --- INIZIO SORGENTE: futuro/14_GAE_Strategic_Plan_Clarissa_CRM.md --- -->

# PROPOSTA TECNICO-STRATEGICA: INTEGRAZIONE STUDIO GEM ↔ CLARISSA CRM

> [!NOTE]
> **FASE 2 STRATEGICA NON ATTIVA**
> L'integrazione delineata in questo documento è strutturalmente posta in *stand-by*. Essa rappresenta la "Fase 2", uno studio teorico per i prossimi trimestri. Il task ad oggi attivo e concluso tecnicamente riguarda *unicamente* la classificazione anagrafica autonoma del gestionale (CRM Interno a 4 livelli). Nessun codice relativo a Clarissa deve essere invocato od istanziato al momento.

## 1. ARCHITETTURA CONSIGLIATA: LA "SOURCE OF TRUTH"
Il principio cardine per evitare disastri architetturali è stabilire la "Verità Assoluta" per ogni dominio.

| Area di Dominio | Source of Truth (Chi Comanda) | Spiegazione |
| :--- | :--- | :--- |
| **1. Anagrafica Cliente** | **Studio Gem** | Il gestionale ha valenza contrattuale ed economica. Nome, CF, Recapiti nascono o si cambiano qui. |
| **2. Profilazione CRM (Level/Score)** | **Studio Gem** | I livelli derivano da algoritmi di calcolo su Spesa/Frequenza (dati che Clarissa non ha nativamente). |
| **3. Pagamenti** | **Studio Gem** | Monopolio assoluto. Niente deve alterare lo stato contabile dall'esterno. |
| **4. Iscrizioni / Attività** | **Studio Gem** | Gestione capienze e turni è domain-core. |
| **5. Comunicazioni / Mailing** | **Clarissa** | Nasce per questo. Scarica il carico server da Studio Gem. |
| **6. Trattative Commerciali** | **Clarissa** | Pipeline visive, follow-up telefonici e reminder di vendita vivono qui. |
| **7. Tag Cliente** | **IBRIDO** | Studio Gem emette Tag strutturali (`Neo-Iscritto`), Clarissa genera Tag comportamentali (`Ha cliccato email`). |
| **8. Storico Contatti (Telefonate)** | **Clarissa** | Log di segreteria commerciale. |
| **9. Calendario Commerciale** | **Clarissa** | Per fissare richiami e appuntamenti di vendita (diverso dal calendario Corsi/Sale di Studio Gem). |
| **10. Posta / Chat / Avvisi** | **Clarissa** | Clarissa centralizza i canali in ingresso. |

---

## 2. MODELLO DI SINCRONIZZAZIONE CONSIGLIATO
**Raccomandazione netta: Sincronizzazione Unidirezionale Guidata ad Eventi (Studio Gem → Clarissa) + Webhook di Ritorno Minimi.**

- **Perché NON bidirezionale:** Modificare un cognome o un'email in Clarissa e spingerlo al gestionale rischia di corrompere l'intestazione di fatture e ricevute già emesse o di incrociare parenti (es. genitori colla stessa email per i figli piccoli).
- **Come funziona:** Studio Gem è il *Master*. Quando un utente viene creato, aggiornato o cambia livello CRM, spinge il payload in REST API verso Clarissa. Se un parametro su Clarissa viene modificato da un venditore (es. N. di Telefono), viene sovrascritto al ciclo notturno/successivo da Studio Gem.

L'unico ritorno (Clarissa → Gem) consentito in sicurezza è una notifica Webhook per: **Disiscrizioni Email/Privacy (Opt-Out)** o per l'eventuale **creazione di "Nuovi Lead nudi"** catturati da landing page esterne (che Gem trasformerà poi in anagrafiche reali solo al primo acquisto).

---

## 3. MATRICE DEI DATI (Campi e Rischio)

| Campo | Dove Nasce | Si Sincronizza? | Verso dove | Rischio Sync | Note |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **ID Interno Gem** | Gem | SÌ | `Gem -> Clarissa` | Critico | Usato come `external_id` su Clarissa. |
| **Nome / Cognome** | Gem | SÌ | `Gem -> Clarissa` | Alto | Mai permettere a Clarissa di sovrascriverlo. |
| **Email / Telefono** | Gem | SÌ | `Gem -> Clarissa` | Medio | Dati essenziali per ricontatto in Clarissa. |
| **Codice Fiscale** | Gem | NO | - | Basso | Dato sensibile, inutile per marketing su Clarissa. |
| **Stato (Attivo/Inat)** | Gem | SÌ | `Gem -> Clarissa` | Basso | Utile per segmentare "Ex clienti". |
| **CRM Level/Score** | Gem | SÌ | `Gem -> Clarissa` | Basso | Usati su Clarissa per le automazioni (Vedi sezione E). |
| **Ultima Attività** | Gem | SÌ | `Gem -> Clarissa` | Basso | Data dell'ultimo drop-in o rinnovo (utile per Recall). |
| **Prodotti Acquistati** | Gem | NO (non i record) | - | Alto | Tradurre l'abbonamento in un "Tag" (es. `Corso-Salsa-Attivo`), non portare il record transazionale intero. |
| **Pipeline/Follow-up** | Clarissa | NO | - | Basso | Restano su Clarissa ad uso commerciale interno. |
| **Consenso Privacy** | Clarissa | SÌ | `Clarissa -> Gem` | Medio | Se l'utente clicca "Disiscrivimi" sull'email gestita in Clarissa, Gem DEVE saperlo. |

---

## 4. IDENTITÀ E MATCH CLIENTE (Zero Duplicati)
- **Chiave Primaria di Riferimento:** `members.id` di Studio Gem.
- **Implementazione (The "Golden Record"):** 
  Ogni anagrafica creata su Studio Gem, alla primissima sync verso Clarissa, passa il proprio `members.id` dentro un custom field inalterabile di Clarissa (es. `ext_studiogem_id`).
- **Gestione Conflitti / Prevenzione Doppioni:**
  - *Problema dell'Email Raggruppata:* Spesso madri e figli usano la stessa email. Il match per Email è PERICOLOSO. Due anagrafiche diverse in Gem (Mario e Luigi, padre e figlio) con la stessa mail `famiglia@mail.com` devono creare o convivere in un unico "Gruppo/Azienda" in Clarissa se lo permette, oppure essere inviati come due Contact distinti con ID uguali alla stringa `[member.id]`.
  - Priorità di Match in creazione: 1) `ext_studiogem_id`, 2) Telefono Mobile (pulito dai prefissi), 3) Email. Se non troviamo match esatto o troviamo un conflitto di nomi palese con la stessa mail, il middleware marchia il record per "Revisione Umana".

---

## 5. RUOLO DELLA PROFILAZIONE CRM
La profilazione **NASCE in Studio Gem** e si **PROPAGA in Clarissa**.
Studio Gem macina i biglietti, le fatture e le presenze. Il motore interno di Gem dichiara: "L'utente 104 è PLATINUM".
Gem fa una chiamata API a Clarissa: `PATCH /contact/104 { tags: ["PLATINUM"] }`.

A questo punto Clarissa reagisce passivamente tramite le sue Automazioni native:
- Innesca un flusso mail premium di benvenuto Platinum.
- Assegna il lead direttamente al commerciale Senior per un upselling.
- Rimuove il contatto dalla lista di "Promozioni Sconto 10% base".

---

## 6. PIANO DI INTEGRAZIONE IN 3 FASI

### FASE 1: Sync Minima e Sicura ("Pompaggio Base")
- Gem diventa l'unico padrone dei contatti. 
- Implementazione di un worker notturno in Gem che preleva i Nomi, Email, Telefoni, Status Attivo/Inattivo e Livello CRM (Platinum/Gold/Silver) sputandoli dentro Clarissa via Push API. Nessun feedback di ritorno. Export/Import iniziale CSV fatto a mano per allineare gli ID.

### FASE 2: Webhooks e Triggers Live ("Azione Causa-Effetto")
- Smantellamento del batch notturno in favere di eventi Live.
- Salvo anagrafica in Gem -> Chiamata API immediata a Clarissa.
- Disiscrizione da mailing su Clarissa -> Webhook verso Gem che toglie la spunta "Consensi Marketing" disabilitando eventuali SMS massivi. 
- Gem calcola cambio Score CRM e passa in live il Tag a Clarissa per far partire l'email "Congratulazioni sei salito di livello!".

### FASE 3: Deep Insights e Commercial Operations
- Sync di metadati aggregati: Gem invia periodicamente a Clarissa l'`LTV` (Life Time Value: spesa totale nel gestionale) o l'`Ultima Data Presenza`. 
- Clarissa usa questi campi numerici per far apparire al commerciale una dashboard di potenziale ("Utenti Gold che non vengono da 2 mesi -> Avvia flow di richiamo telefonico").

---

## 7. DECISIONE OPERATIVA FINALE (Cosa Fare e Cosa NO)

**Cosa farei SUBITO (Step Logici):**
1. Generare l'Export CSV definitivo da Studio Gem comprendente l'Internal ID, il CFD e le anagrafiche pulite, pronto per essere macinato come Import di Setup su Clarissa.
2. Predisporre lo scaffolding di un modulo middleware isolato su Node (es. `server/integrations/clarissa.ts`) che sia capace di effettuare una call auth base per test di connessione verso le loro API.

**Cosa RIMANDEREI (A Fase 2/3):**
- Gestione webhook di ritorno da Clarissa a Gem. Troppo prematuro.
- Qualunque trigger interattivo. Per i primi due mesi, accontentarsi dell'allineamento dati anagrafici essenziali e dei flag (Silver/Gold/Platinum).

**Cosa NON FAREI ADESSO (E MAI):**
- Sincronizzare bidirezionalmente il nome o la mail o i documenti. Danno contabile.
- Esportare lo storico dei Corsi singoli e delle Tessere su Clarissa spammandole come "Prodotti". Per Clarissa, l'utente ha solo dei Tag di abbonamento aggregato, il gestionale detiene il diritto d'appello esatto.

---
*Documento Strategico approvato e mappato per le prossime Roadmap di implementazione in `_GAE_SVILUPPO`.*


<!-- --- FINE SORGENTE: futuro/14_GAE_Strategic_Plan_Clarissa_CRM.md --- -->

