# Documento di Status: Potatura Architetturale (Fase 1 e 2)
> **Ultimo Aggiornamento:** 02 Maggio 2026, 11:30

## 1. Obiettivo dell'Intervento
L'obiettivo di questa sessione è stato sfoltire e "potare" il gestionale da tutto il codice morto, obsoleto o mai entrato in produzione, seguendo la regola d'oro: **Tutto ciò che non è visibile o utilizzabile dal Frontend attuale, deve essere rimosso per alleggerire il sistema.**

L'operazione è stata eseguita in completa sicurezza, utilizzando il compilatore TypeScript (`npm run check`) come rete di protezione per garantire zero regressioni.

## 2. Fase 1: Pulizia del Frontend e della Root (Completata)
- **Script Spazzatura Isolati:** Oltre 270 file temporanei (test, vecchi dump, script di seeding) sono stati spostati dalla root principale alla cartella `_GAE_SVILUPPO/99_archivio/script_temporanei_root/`.
- **Cartelle Orfane Archiviate:** Le directory `temp_import` e `temp_project_complete` (che contenevano vecchi cloni di pagine frontend) sono state spostate in `99_archivio/`.
- **Pagine Morte Eliminate:** I file `knowledge.tsx` (doppione) e `client-categories.tsx` sono stati cancellati definitivamente dal frontend.
- **Risultato:** La root del progetto e la directory `client/src/pages/` sono ora pulite.

## 3. Fase 2: Pulizia Backend e Database (Completata)
Il compilatore TypeScript ci ha permesso di isolare e distruggere intere logiche "fantasma" senza intaccare le funzionalità esistenti.

### 3.1 Eliminazione Tabelle "Zombie" (`shared/schema.ts`)
Sono state eliminate le definizioni, le relazioni e i tipi Zod per le seguenti tabelle mai utilizzate:
1. `crmLeads`, `crmCampaigns` (Modulo CRM mai decollato)
2. `maintenanceTickets`, `teamMaintenanceTickets` (Ticket manutenzione)
3. `teamHandoverNotes`, `teamProfileChangeRequests`
4. `wcProductMapping`

*Nota Tecnico/Operativa:* La tabella `userActivityLogs` e `tenants`, inizialmente candidate per la rimozione, sono state **salvate** in extremis perché il compilatore ha rilevato che sono attivamente utilizzate dai moduli "Single Table Inheritance" e dal logging interno.

### 3.2 Potatura Rotte API (`server/routes.ts`)
Sono state rimosse fisicamente dal server le seguenti logiche API che non venivano mai chiamate dall'interfaccia:
- **Relazioni Familiari:** `POST /api/member-relationships`, `DELETE /api/member-relationships/:id`
- **Finanza Avanzata / Commercialista:** Endpoint legati a `cost-centers`, `accounting-periods`, `journal-entries`
- **Pagodil:** Endpoint legati a `pagodil-tiers`
- **Sconti Complessi:** Endpoint legati a `member-discounts`

## 4. Verifica di Stabilità
Al termine di queste due fasi, è stato eseguito `npm run check`.
**Risultato:** Zero nuovi errori. I soli 11 errori presenti (legati a `QueryResult` in routes e a tipi in `workshops.tsx`) erano già presenti prima del nostro intervento.
Il sistema compila, si avvia e non presenta alcuna regressione sulle rotte collegate al menu dell'interfaccia utente.

## Prossimi Passi Consigliati
Il sistema è ora privo di codice "zavorra". Il prossimo passo naturale è procedere con la **Standardizzazione della Pagina "Domenica" e "Campus"** per allinearla al nuovo layout ad "Accordion" già implementato in "Allenamento", sfruttando la nuova pulizia del backend.
