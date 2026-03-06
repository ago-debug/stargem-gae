# Registro Decisionale Architettura SaaS (Log Interviste)

Questo documento traccia pedissequamente la cronologia del dialogo intercorso tra lo Sviluppatore e l'Amministrazione nella fase di pre-produzione del nuovo Database "Single Table Inheritance" (Marzo 2026).
Avere uno storico nero su bianco delle risposte del cliente è vitale per giustificare le scelte di design delle tabelle `activities`, `activity_categories`, `activity_details` ed `enrollments`.

---

## Intervista 1: Regole di Business Core (Corsi, Private, Affitti, Campus)
**Data:** 6 Marzo 2026
**Topic:** Riorganizzazione dei "Silos" e gestione capienze.

*   **D: Durata corsi e rimborsi?**
    *   *R (Utente):* I corsi sono annuali (Set-Giu, eccezione Luglio). Abbonamento unico, niente disdette, ammesse solo sospensioni.
*   **D: I corsi hanno posti limitati? Serve Lista d'attesa?**
    *   *R (Utente):* Sì, posti rigorosamente limitati in base alle sale. La Lista d'Attesa è obbligatoria.
*   **D: Le Private (1 to 1) si creano al momento o esistono già?**
    *   *R (Utente):* Si creano *On-Demand* nel momento esatto in cui il cliente chiama. Non esistono vuote.
*   **D: Come si pagano le private? Singolarmente o a carnet?**
    *   *R (Utente):* Vanno a Carnet (abbonamenti a scalare).
*   **D: Gestione "buchi" per Affitti Sale?**
    *   *R (Utente):* Il sistema deve supportare nativamente o un formato Calendario visivo per far prenotare gli slot, oppure poterli assegnare noi a mano (da decidere la UI).
*   **D: Tariffe Affitti?**
    *   *R (Utente):* Si paga a fascia oraria variabile (1h, 50m, 2h). Il prezzo cambia fortemente in base al tier dell'utente (Tesserato / Staff Insegnante / Esterno).
*   **D: Pagamenti Campus e Vacanze Studio (Acconti)?**
    *   *R (Utente):* Si paga tutto unicamente in colpo solo, oppure si incassa un Acconto ma il Saldo avviene a strettissimo giro (2-3 settimane). Nessun pagamento dilazionato/rateale nativo per questi eventi.
*   **D: Extra Info sui Moduli Campus (Es. Magliette)?**
    *   *R (Utente):* Assolutamente sì, servono campi extra (Maglietta, Trasporto, Welcome Kit).
*   **D: Limiti alle Prove Gratuite e Scomputo della Prova a Pagamento?**
    *   *R (Utente):* La prova a pagamento si scomputa dal totale se il cliente si iscrive. Serve un limite e vari controlli antifrode tracciati per il team per limitare furbetti nell'Open Week.

---

## Intervista 2: Requisito Multi-Tenant (SaaS), Shop, Provvigioni
**Data:** 6 Marzo 2026
**Topic:** Scalabilità dell'architettura per vendita del gestionale a terzi.

*   **D: Tesseramento (Scadenza fissa o rolling)?**
    *   *R (Utente):* Il nostro centro usa una data fissa (1 Sett - 31 Ago, quota fissa 25€). Il database SaaS dovrà però consentire variazioni.
*   **D: Obbligatorietà del Tesseramento?**
    *   *R (Utente):* Obbligatorio sempre, in teoria per tutti. Ma il software deve restare flessibile: far provare prima il corso e obbligare a tesserarsi solo dopo.
*   **D: Servizi Extra "Passivi" (Negozio magliette, lucchetti)?**
    *   *R (Utente):* Devono esistere! Vendita passiva, disancorata dai calendari.
*   **D: Questi extra passivi hanno un magazzino/giacenza da scalare?**
    *   *R (Utente):* Sì. Attualmente è su Google Sheets, ma l'Inventario/Stock fisico deve esistere e scalare.
*   **D: Ticketing Saggi (A pacchetto famiglia o singoli)?**
    *   *R (Utente):* Tutti, esterni compresi, acquistano i propri biglietti singoli online o via segreteria. Predisposizione già E-commerce.
*   **D: Provvigioni su base incassi per gli Istruttori (Esempio nei Workshop)?**
    *   *R (Utente):* Requisito vitale! Devono esistere compensi a quota fissa o a **percentuale [%]**. Gli istruttori potrebbero dover vedere quanti iscritti hanno per farsi i calcoli.
*   **D: Promozione di scaglione/livelli (Es. da Base a Avanzato)?**
    *   *R (Utente):* Serve una grandissima funzione di "Promemoria Promo" per spostare pacchetti di 10 allievi in blocco al livello successivo a fine anno stagionale. Non deve farsi a mano uno a uno!

---

## Intervista 3: Rimborsi, Sconti Gemellati e Privacy
**Data:** 6 Marzo 2026
**Topic:** Gestione flussi anomali (Rimborsi), agevolazioni commerciali e limiti applicativi per lo Staff.

*   **D: Rimborsi monetari per disdette mediche?**
    *   *R (Utente):* Raramente rimborsi fisici. Si applica il "congelamento" della quota restante trasformandola in un *Credito/Buono* riutilizzabile in seguito. La nuova architettura deve avere un Wallet/Borsellino tracciabile per utente.
*   **D: Rimborso Quota Tessera Associativa?**
    *   *R (Utente):* Assolutamente mai. Trattenuta a prescindere in quanto funge da assicurazione.
*   **D: Esistono Sconti "Famiglia" (incrociati su anagrafiche diverse)?**
    *   *R (Utente):* Sì. Se madre, padre e figlia fanno attività, scattano agevolazioni ("Sconto Famiglia"). Serve logica di collegamento Parentela/Gruppo Familiare ai fini di calcolo carrello.
*   **D: Esistono Sconti per Multi-Disciplina (stessa persona)?**
    *   *R (Utente):* Assolutamente sì. 1 corso = X, 2 corsi = Y, 3 corsi = Z. La tabella listini deve saper prevedere il forfait in accumulo ("Tabella Dedicata sconti cumulativi").
*   **D: Visibilità del Calendario per lo Staff Insegnanti?**
    *   *R (Utente):* Ottima visibilità richiesta: un insegnante deve poter vedere il *Super Planning* generale per sapere quali sale sono libere. Può richiedere prenotazioni aula/private (via app o segreteria) basandosi su questo.
*   **D: Limiti Accesso Dati Sensibili per lo Staff?**
    *   *R (Utente):* Rigorosissimi. L'insegnante NON deve in alcun modo poter entrare nell'anagrafica degli allievi per questione di privacy (niente telefoni, niente indirizzi). Può solo vedere i nomi ed esplicitare richieste nominali senza accesso diretto ai backend personali.

---

## Intervista 4: Fisco, Hardware, Automazioni e Multi-Sede (SaaS Avanzato)
**Data:** 6 Marzo 2026
**Topic:** Requisiti "Enterprise" per la scalabilità del gestionale.

*   **D: Valenza Fiscale della Piattaforma?**
    *   *R (Utente):* Dovrà esserci un'integrazione obbligatoria (API). Pagamenti gestiti internamente, ma con aggancio formale a un sistema di contabilità/fisco (Es. Registratori RT).
*   **D: Controllo Accessi (Tornelli, Scanner)?**
    *   *R (Utente):* Assolutamente sì. Serve che l'architettura dialoghi con hardware di verifica (telecamere riconoscimento facciale, lettori QR Code / Barcode) per far smarcare autonomamente l'ingresso/presenza all'allievo.
*   **D: Abbonamenti a Addebito Ricorrente (Stripe/SEPA)?**
    *   *R (Utente):* Si possono rateizzare gli abbonamenti stagionali con addebito mensile automatico, MA serve che il software tuteli l'incasso: il cliente non deve poter revocare il mandato prima di aver saldato l'intera stagionalità pattuita.
*   **D: Architettura Multi-Sede e Franchising?**
    *   *R (Utente):* Sì, vitale. Il sistema deve governare `N` Sedi. Un insegnante deve poter lavorare su sedi diverse nel suo planning, e il sistema deve incrociare i dati per evitare sovrapposizioni d'orario.
*   **D: Esistono collaborazioni con scuole "Terze" fuori dal circuito chiuso?**
    *   *R (Utente):* Esatto. Un docente potrebbe operare in realtà completamente esterne. La sua "scheda insegnante" nel nostro DB deve includere "blocchi rossi/indisponibilità" per i giorni/orari in cui lui lavora in un'altra scuola (non nostra), in modo da avere un Calendario Condiviso perfetto.
*   **D: Gestione HR e Timbrature Staff?**
    *   *R (Utente):* Basilare. Bisogna tracciare rigorosamente presenze, assenze e sostituzioni degli Insegnanti per permettere all'amministrazione di erogare il pagamento (cedolini) a fine mese. Serve un sotto-modulo di timbratura/smarcamento ore.
