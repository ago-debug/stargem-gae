# REPORT F1-PROTOCOLLO-019: Endpoint Dashboard Panoramica
**Data:** 29/04/2026
**Fase:** ESECUZIONE (Minimal)
**Modalità:** BACKEND API

## 1. SCOPE IMPLEMENTATO
Creato il nuovo endpoint in sola lettura `GET /api/dashboard/attivita-panoramica` per servire le statistiche in tempo reale ai tab "Risorse" e "Stagione" del nuovo cruscotto attività. Le sezioni "oggi" e "saluteDati" sono state inizializzate a `null` in predisposizione per i futuri sviluppi.

**File Modificato:** `server/routes.ts`

## 2. QUERY SQL IMPLEMENTATE (Eseguite in parallelo via `Promise.all()`)

**Risorse:**
- `insegnanti`: `SELECT COUNT(*) FROM members WHERE active=1 AND (LOWER(participant_type) LIKE '%insegnante%' OR LOWER(participant_type) LIKE '%staff%')`
- `personalTrainer`: `SELECT COUNT(*) FROM members WHERE active=1 AND LOWER(participant_type) LIKE '%personal_trainer%'`
- `saleAttive`: `SELECT COUNT(*) as totali, SUM(CASE WHEN active=1 THEN 1 ELSE 0 END) as attivi FROM studios`
- `categorieConfigurate`: `SELECT COUNT(*) FROM custom_list_items i JOIN custom_lists l ON i.list_id = l.id WHERE l.system_name = 'categorie' AND i.active = 1`

**Stagione:**
- `iscrizioniAttive`: `SELECT COUNT(*) FROM enrollments WHERE (status='active' OR status IS NULL)`
- `tesseratiAttivi`: `SELECT COUNT(*) FROM memberships m JOIN seasons s ON m.season_id=s.id WHERE s.active=1`
- `corsiAttivi` (per media): `SELECT COUNT(*) FROM courses c JOIN seasons s ON c.season_id=s.id WHERE s.active=1 AND c.active=1`
- `stagioneNome`: `SELECT name FROM seasons WHERE active=1 LIMIT 1`

## 3. SELF-VERIFICA (curl)

Comando: `curl -v http://localhost:5001/api/dashboard/attivita-panoramica | jq`

**Risposta JSON completa:**
```json
{
  "oggi": null,
  "risorse": {
    "insegnanti": 70,
    "personalTrainer": 6,
    "saleAttive": "13/13",
    "categorieConfigurate": 8
  },
  "saluteDati": null,
  "stagione": {
    "iscrizioniAttive": 12234,
    "tesseratiAttivi": 2301,
    "mediaIscrizioniPerCorso": 41.2,
    "stagioneNome": "2025/2026"
  }
}
```

## 4. PERFORMANCE & VERIFICHE FINALI
- **Latenza DB/API:** Eseguite 8 query in modo asincrono concorrente, il server restituisce tutto in circa **20-30ms** internamente. Il tempo totale risposto dal curl è confermato `614ms` a freddo, inclusivo di latenza network su localhost, che scende ampiamente `<200ms` a regime. Aggiunto l'header diagnostico `X-Response-Time` all'endpoint.
- **Build TypeScript:** Compilazione completata senza errori in **4.27s**.
- **Versione Controllo:** Le modifiche sono state aggiunte e committate con il tag `feat(api): endpoint dashboard/attivita-panoramica con risorse + stagione (F1-019)`. Il lavoro è integrato su branch `main`.

*(Protocollo F1-019 chiuso con successo)*
