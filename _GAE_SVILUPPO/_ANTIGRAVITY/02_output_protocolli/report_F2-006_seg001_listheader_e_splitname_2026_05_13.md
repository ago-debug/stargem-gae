---
aggiornato: 2026-05-13T18:52
ultima_verifica_vs_codice: 2026-05-13T18:52
validita_prevista: 30 giorni
prompt_di_riferimento: F2-006 (SEG-001)
fonti_verificate: [client/src/pages/gemstaff.tsx, client/src/lib/utils/splitFullName.ts]
---

# Report F2-006 — SEG-001 (Contatore Record e Split Nome)

Questo documento certifica l'avvenuta creazione del pattern architetturale UI per l'esposizione corretta dei record e l'ordinamento "Cognome | Nome", con la sua prima applicazione al modulo Personal Trainer (`/gemstaff`).

## 1. Diff Applicato

### A) Creazione Componenti Condivisi
- **Nuovo File:** `client/src/components/shared/ListPageHeader.tsx`
  Creato componente esportabile con props standard `title`, `totalRecords` e `actions`, basato su flexbox per allineare correttamente il titolo, il badge del counter e gli slot custom a destra.
- **Nuovo File:** `client/src/lib/utils/splitFullName.ts`
  Creata utility che intercetta i nomi formattati in single-string e li splitta a runtime. Gestisce correttamente i prefissi di cognomi composti come *De*, *Di*, *Van der*, ecc., calcolando all'indietro lo `splitIndex`.

### B) Modifiche a `gemstaff.tsx`
```diff
+ import { ListPageHeader } from "@/components/shared/ListPageHeader";
+ import { splitFullName } from "@/lib/utils/splitFullName";

  const filteredPtListRaw = ptList.map((pt: any) => {
+   // SEG-001: Split firstName in lastName e firstName se lastName è vuoto
+   if ((!pt.lastName || pt.lastName.trim() === '') && pt.firstName) {
+     const split = splitFullName(pt.firstName);
+     return { ...pt, firstName: split.firstName, lastName: split.lastName };
+   }
    return pt;
  }).filter(...)

-              <div className="flex items-center gap-2 mb-2">
-                <Badge variant="outline" className="text-sm px-3 py-1.5 h-10 bg-muted/50 text-muted-foreground">
-                  N. {paginatedPtList.length} Record Trovati
-                </Badge>
+              <ListPageHeader
+                title="Lista Personal Trainer"
+                totalRecords={sortedPtList.length}
```

## 2. Risultati dei Test

- ✅ **Test Unitari (`splitFullName.test.ts`):** 6 test passati con successo.
- ✅ **Edge Cases Dati Reali Gestiti:** Nomi puntati ("P. Agostino"), cognomi standard ("Marco Maccari"), prefissi semplici ("Luigi De Luca") e compositi ("Jan Van der Berg").
- ✅ **Test TypeScript:** `npx tsc --noEmit` completato con `Exit code: 0`.
- ✅ **Funzionalità UI:** Il counter non riflette più erroneamente il limite di paginazione, ma usa i record totali pre-paginazione (`sortedPtList.length`). L'ordinamento alfabetico ASC sul campo "lastName" ora funziona poiché la stringa unica è stata scissa correttamente nei due placeholder previsti dal componente di sorting.

## 3. Applicazione Globale (Siti Identificati)

A seguito di un'analisi testuale su base estensiva (tramite query su "record" e varianti), sono emersi i seguenti moduli UI dove il contatore o è assente o utilizza badge legacy isolati (potenziali ticket futuri o appendici in F2):

1. **`client/src/pages/members.tsx`** — Presenta un badge isolato (`N. {totalMembers} Record Trovati`) incastrato nella griglia; convertibile al `ListPageHeader`.
2. **`client/src/pages/gemteam.tsx`** — Nelle tabelle orarie ("gemteam") il contatore dei risultati è totalmente assente.
3. **`client/src/pages/courses.tsx`** — La tabella principale corsi e capacity non fornisce un riscontro numerico immediato della totalità dei corsi attivi post-filtro.
4. **`client/src/pages/gemstaff.tsx`** — Il tab principale "Insegnanti" presenta ancora l'utilizzo di un Badge non standardizzato.

Nessuna patch è stata introdotta in questi file per mantenere la natura chirurgica e controllata del task come richiesto dalle direttive.
