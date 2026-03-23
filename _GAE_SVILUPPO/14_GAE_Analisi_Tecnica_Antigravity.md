# Analisi Tecnica e Audit Strutturale per Transizione SaaS (Fase 3 - STI)
**Autore:** Antigravity (AI Core Dev)
**Data:** 23 Marzo 2026
**Obiettivo:** Blueprint per la transizione architetturale da 11 DB Silos a Modello Unificato (STI - Single Table Inheritance) per scalabilità, tolleranza ai guasti e interfacciamento AI/CRM.

---

## 1. Mappatura delle Discrepanze e JSON Schema
Gli 11 silos attuali (Corsi, Workshop, Lezioni Private, Campus, Domenica in Movimento, Saggi, ecc.) presentano un nucleo di campi identici per l'85% (Nome, Date, Prezzo, Istruttore, Studio, Status).
Le **discrepanze (campi unici)** riscontrate nei moduli periferici includono:
- **Campus / Vacanze Studio:** "Taglia Maglietta", "Allergie Specifiche", "Autorizzazione Trasporto".
- **Saggi / Eventi:** "Ruolo nello Spettacolo", "Numero Biglietti Omaggio".
- **Affitti (Bookings):** "Attrezzatura Extra Richiesta", "Note Tecniche Allestimento".

**Conferma Strategica:** Utilizzeremo assolutamente il pattern `JSONB` per la colonna `extra_info_schema` (o `metadata`) nella nuova tabella unificata `activities` (e di riflesso in `enrollments`). Questo approccio `Schema-less` per i dati volatili:
1. Evita la creazione di 30 colonne con valori `NULL` per il 90% del tempo.
2. Permette di lanciare nuove tipologie di attività senza eseguire gravose migrazioni SQL (`ALTER TABLE`).

## 2. Integrità Contabile e "Pagamenti Orfani"
Attualmente, la tabella `payments` è un collo di bottiglia relazionale. Deve mantenere referenze implicite o esplicite verso 11 tabelle di iscrizione separate (`course_enrollments`, `workshop_enrollments`, `rental_bookings`, ecc.).
*   **Rischio Orfani:** Se un'iscrizione legacy in un silo periferico veniva cancellata ("hard delete") senza un vincolo di integrità referenziale severo (`ON DELETE CASCADE`), il pagamento rimaneva nel DB senza un padrone verificabile, generando discrepanze in cassa.
*   **Logica del Data Pump (Migrazione):**
    Il "Data Pump" (script di migrazione ETL) leggerà tutte le 11 tabelle di `_enrollments`. 
    Genererà nuove righe nella tabella unificata `enrollments`, assegnando a ciascuna un nuovo UUID univoco. 
    Contestualmente, mapperà le Foreign Key (FK) dei vecchi pagamenti, sostituendo le 11 colonne frammentate (`entityId`, `entityType`) con una singola ed inviolabile FK: `enrollment_id`. Questo blinderà l'integrità contabile a livello di database.

## 3. Gerarchia delle Sottocategorie e Rendering UI
Con il passaggio a `activities` (unica tabella), la differenziazione semantica e visiva avverrà tramite due layer:
*   **`activity_type` (Enum DB):** Il discriminante logico backend (es. `COURSE`, `WORKSHOP`, `RENTAL`, `EVENT`). Gestisce come l'API valuta conflitti, capienze e revenue.
*   **`ui_rendering_type` (Metadato Frontend):** Questo campo istruirà il frontend dinamico (`ActivityUnifiedModal.tsx`).
    *   Se `ui_rendering_type = 'SEASONAL_RECURENCE'`: Il React component inietterà gli input per selezionare "Giorni della Settimana" (Lun-Ven) e "Orario Inizio/Fine".
    *   Se `ui_rendering_type = 'EXACT_DATETIME'`: Il React component monterà un calendario DateTimePicker per gli affitti o i workshop secchi.
    Questo disaccoppia il database dalla User Experience, permettendo di mostrare maschere perfette senza duplicare file React.

## 4. Performance e Scalabilità (9.000+ Record)
Il caricamento in memoria (DOM) di 9.000 o più righe anagrafiche collassa storicamente il thread principale del browser.
*   **Soglia di Virtualizzazione:** Fissiamo la soglia critica a **~500-800 record**. Oltre tale limite, le tabelle React (es. Maschera Input / Elenco Tesserati) utilizzeranno librerie come `@tanstack/react-virtual`. Invece di renderizzare 9.000 nodi HTML, verranno disegnati solo i 20 nodi fisicamente visibili sullo schermo in quel momento, riciclando i div durante lo scroll. L'impatto sulla RAM scenderà del 95%.
*   **Error Boundaries:** Confermo l'assoluta necessità architetturale di implementare i React *Error Boundaries*. Avvolgendo la Maschera Input, il Calendario e i Pagamenti in "recinti di errore", un crash fatale dovuto a un dato corrotto in un silo isolerà il malfunzionamento, mostrando un avviso solo in quel riquadro e mantenendo in piedi (e operative) le casse e le restanti view.

## 5. Moduli AI e Integrazioni Esterne
Una struttura SaaS STI trasforma l'applicativo in una "Scatola Modulare" con prese di corrente standardizzate.
*   **Copilot UI / Agenti AI:** Un agente AI interno non dovrà più sapersi giostrare tra 11 endpoint API. L'Agente leggerà l'unico endpoint `GET /api/activities` e modificherà i dati tramite `POST /api/activities`. Potrà tradurre linguaggio naturale ("Iscrivi Mario al nuovo workshop di Salsa") in istruzioni universali inviate alla Maschera Input unificata.
*   **Clarissa CRM & Contabilità Esterna:** I software esterni si innesteranno tramite **Webhooks**. Quando la tabella unificata `enrollments` subisce un `INSERT`, il sistema scalerà un evento (Event-Driven) che Clarissa CRM ascolterà per avviare il funnel di marketing o che il plugin di fatturazione elettronica utilizzerà per generare lo scontrino telematico. La convergenza su STI è l'unico modo per garantire che queste interazioni avvengano con il 100% di affidabilità senza costringere i plugin a gestire le singolari eccezioni storiche.
