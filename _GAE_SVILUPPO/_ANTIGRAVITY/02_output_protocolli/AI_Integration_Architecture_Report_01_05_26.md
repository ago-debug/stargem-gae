# Report Architetturale: Integrazione "Teo AI" e Enterprise Stack

**Data di Stesura:** 01 Maggio 2026
**Autore:** Antigravity (AI Agent)
**Fasi Coperte:** Fase 1 (Osservabilità e Backend) & Fase 2 (Frontend UX)

---

## 1. Executive Summary

Nelle ultime sessioni di lavoro, la piattaforma StarGem Manager ha subìto un profondo avanzamento architetturale passando da un gestionale puramente reattivo a una **piattaforma proattiva AI-Driven**, preparata secondo gli standard Enterprise per scalabilità, monitoraggio e assistenza utente in tempo reale.

## 2. Lo Stack di Osservabilità (Fase 1)

Prima di collegare l'Intelligenza Artificiale, l'ambiente Node.js ed Express è stato irrobustito per prevenire crash catastrofici:

- **Sentry (Error Tracking):** Inizializzato globalmente in `server/index.ts` e nel frontend `client/src/main.tsx`. Qualsiasi eccezione non gestita, sia UI che backend, viene intercettata, evitando la perdita di log preziosi.
- **PostHog (Product Analytics):** Implementato a livello globale nell'applicazione React (`main.tsx`) per monitorare il reale utilizzo delle interfacce da parte della Segreteria (eventi, navigazioni, friction points).
- **Redis con Fallback (`server/cache.ts`):** Scritto un wrapper fault-tolerant. Se Redis (caching) è offline sul server IONOS, l'applicazione degrada silenziosamente (bypassando la cache) senza causare `500 Internal Server Error`, garantendo una resilienza assoluta.
- **Playwright (Testing E2E):** Predisposto il framework `playwright.config.ts` per l'automazione futura dei test del core vitale.

## 3. L'Architettura del Motore AI (Vercel SDK)

L'infrastruttura backend per "Teo" è stata costruita adottando l'industry standard **Vercel AI SDK** (`ai@3.4.33` per mantenere la retrocompatibilità con i flussi di Express e i typed streams):

- **`server/ai.ts`:** È il cervello isolato dell'intelligenza artificiale. Contiene:
  - Il Modello (`gpt-4o-mini`).
  - Il System Prompt ("Sei Teo, assistente AI dello Studio Gem...").
  - Gli Strumenti (Tools) tipizzati con `zod`: `searchMembers` (per ispezionare `members`) e `searchCourses` (per ispezionare `courses`).
  - Questo approccio permette all'LLM di leggere il DB in modo delimitato e protetto, evitando SQL injection spontanee.
- **`/api/chat` (in `server/routes.ts`):** Endpoint che gestisce lo stream di testo e chiamate attrezzo bidirezionale in tempo reale verso il frontend.
- **`/api/ai/generate-promo`:** Endpoint stateless (REST classico) utilizzato per richieste "One-Shot" orientate alla creatività (es. testi promozionali per eventi sportivi).

## 4. Frontend e UX (Fase 2)

L'integrazione di "Teo" è stata riversata in UI dinamiche progettate per migliorare l'efficienza degli operatori:

- **TeoCopilot (`TeoCopilot.tsx`):** L'intero componente mockup è stato riscritto ed agganciato a `useChat` (`ai/react`). Gestisce input, stream dei messaggi e storicizzazione locale in tempo reale. Presente in overlay in tutte le pagine.
- **Command Palette (`CommandPalette.tsx`):** Un'interfaccia Spotlight attivata globalmente dalla shortcut `CMD+K` (o `CTRL+K`). Costruita con la libreria `cmdk`, espone azioni rapide (Es. Iscrivi Utente, Calendario) ed è già progettata per fungere da input testuale semantico per l'AI.
- **Magic Promo Button (`MagicPromoButton.tsx`):** Un pulsante AI integrato contestualmente in viste mirate (es. `scheda-domenica.tsx`). Quando premuto, l'AI genera testo WhatsApp accattivante per promuovere lo specifico evento in pagina. Dotato di funzione Copia rapida.

## 5. Correzione Type-Safe (Risoluzione Issue TypeScript)

L'integrazione di pacchetti complessi come `ai` e `@ai-sdk/react` ha causato disallineamenti di tipo tra le API di streaming e l'approccio di routing Express in `server/routes.ts`. 
Queste regressioni sono state risolte chirurgicamente riallineando l'SDK alla versione stabile `3.4.33`, ripristinando metodi standard come `pipeDataStreamToResponse` ed `execute: async ({ query }: { query: string })` nei Tools. 
Attualmente, l'ispezione `npm run check` garantisce che non vi sia alcun nuovo errore TypeScript nell'area AI.

## 6. Prossimi Passi (Operatività)

L'architettura è completata e passiva. Per attivare l'Intelligenza Artificiale, è strettamente necessario inserire una `OPENAI_API_KEY` valida nel file `.env` di produzione sul VPS IONOS. Successivamente, si potrà iniziare a testare i feedback diretti dell'Agente Teo e addestrare il suo `System Prompt` con le procedure tipiche della segreteria.
