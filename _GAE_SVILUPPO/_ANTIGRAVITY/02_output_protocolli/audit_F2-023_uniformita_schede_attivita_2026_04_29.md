# AUDIT F2-023: UNIFORMITÀ SCHEDE ATTIVITÀ AL PATTERN CORSI

**Data:** 29/04/2026

## A) PATTERN SCHEDA CORSO (Riferimento Canonico)
Il file `client/src/pages/courses.tsx` definisce il pattern di riferimento:
- **Contatore (Alto a Destra)**: È implementato come un `Popover` (Bottone `📋 {filteredCourses.length} Corsi ▼`). Al click, mostra un dropdown con un riepilogo raggruppato per "Categoria" e "Genere/Nome".
- **Bottoni della singola Card/Riga**:
  - `Scheda`: Utilizza `wouter` per navigare a `/scheda-corso?courseId=${course.id}`.
  - `Edit`: Apre il componente condiviso `CourseUnifiedModal` passando l'oggetto corso.
  - `Delete`: Apre un `AlertDialog` che verifica prima la presenza di iscritti (`getCourseEnrollmentCount(id) > 0`). Se ci sono iscritti, blocca l'eliminazione mostrando un Toast "Azione Bloccata".
- **Componente di Dettaglio**: Rimanda a una pagina dedicata `client/src/pages/scheda-corso.tsx` che legge il parametro `courseId` dalla query string.
- **Architettura**: La pagina `/attivita/corsi` è hardcoded (non usa wrapper generici per l'impalcatura della pagina, ma usa `CourseUnifiedModal` per l'edit).

---

## B) PATTERN ATTUALE DELLE PAGINE DEDICATE
Analisi dello stato attuale di `/attivita/<tipo>`:

| Pagina | Usa Wrapper Generico? | Contatore/Popover | Bottone "Scheda" (Routing) | Bottone "Edit" | Bottone "Delete" | Componente di Dettaglio (Destinazione) |
|---|---|---|---|---|---|---|
| **Workshop** (`workshops.tsx`) | No (Duplicato) | Presente | `/scheda-corso?workshopId=...` | Apre `CourseUnifiedModal` | Apre Modale Eliminazione | Rotto. `scheda-corso.tsx` non legge `workshopId`. |
| **Allenamenti** (`trainings.tsx`) | Sì (`ActivityManagementPage`) | **Assente** | `/scheda-allenamento?activityId=...` | Apre `CourseUnifiedModal` | Funzionante | Rotto. `scheda-allenamento.tsx` fa fetch su `["/api/"]`. |
| **Domeniche** (`sunday-activities.tsx`) | Sì (`ActivityManagementPage`) | **Assente** | `/scheda-domenica?activityId=...` | Apre `CourseUnifiedModal` | Funzionante | `scheda-domenica.tsx` (endpoint `["/api/sunday-activities"]`). |
| **Lez. Individ.** (`individual-lessons.tsx`) | Sì (`ActivityManagementPage`) | **Assente** | `/scheda-lezione-individuale?activityId=...` | Apre `CourseUnifiedModal` | Funzionante | `scheda-lezione-individuale.tsx` (endpoint `["/api/individual-lessons"]`). |
| **Campus** (`campus-activities.tsx`) | Sì (`ActivityManagementPage`) | **Assente** | `/scheda-campus?activityId=...` | Apre `CourseUnifiedModal` | Funzionante | `scheda-campus.tsx` (endpoint API campus). |

---

## C) ARCHITETTURA: ESISTE UN COMPONENTE COMUNE?
Sì. Esiste `<ActivityManagementPage>` in `client/src/components/activity-management-page.tsx`.
- Viene utilizzato correttamente da 4 attività (Allenamenti, Domeniche, Lezioni Individuali, Campus) come "wrapper" di layout e logica per le viste a lista/tabella.
- **MA** Corsi e Workshop non lo usano (sono hardcoded e duplicati).
- **Inoltre**, per quanto riguarda i **dettagli della scheda** (il "click" su "Scheda"), NON esiste un componente comune. Attualmente ci sono 6-9 file duplicati (`scheda-corso.tsx`, `scheda-allenamento.tsx`, ecc.), molti dei quali non funzionano perché chiamano endpoint inesistenti (es. `["/api/"]`).

---

## D) PROPOSTA DI ALLINEAMENTO RACCOMANDATA

La mia raccomandazione è una **soluzione ibrida ad alta efficienza** (mix tra Soluzione 2 e 3):

1. **Risoluzione Problema 1 (Contatori)**: 
   - **Estendere `ActivityManagementPage`** per includere il Popover dei contatori (passando le statistiche calcolate come props). In questo modo, le 4 pagine che lo usano lo ereditano automaticamente a costo zero.
2. **Risoluzione Problema 2 (Schede non collegate)**:
   - **Creare un UNICO componente `SchedaAttivita` generico** (o estendere `scheda-corso.tsx` per supportare tutti i tipi usando la STI del database, visto che backend-side i corsi sono già tutti in un'unica tabella `courses`).
   - Mappare tutte le view in modo che il bottone "Scheda" punti a `/dettaglio-attivita?id=...&type=...`.

**Effort Stimato:**
- **Fase 1 (Contatori su Wrapper)**: ~15-20 minuti.
- **Fase 2 (Refactor Dettaglio Scheda Singolo)**: ~45-60 minuti per convergere i vari `scheda-*.tsx` rotti in un unico flusso stabile.
- **Effort Totale**: ~1-1.5 ore.

---

## E) RISCHI E DIPENDENZE
- **I modali ad hoc futuri**: Se scegliamo la Soluzione 1 (tutto separato e duplicato), i file non andranno in conflitto tra chat separate, ma il debito tecnico esploderà, costringendo a sistemare bug uguali in 6 posti diversi.
- **La Soluzione 2 (Wrapper Generico per la Lista + Modali Ad Hoc passati come children/props)** minimizza i conflitti. I modali di modifica futuri (es. Modale Edit Campus o Modale Edit Workshop) potranno essere passati ad `ActivityManagementPage` tramite una prop opzionale `customEditModal`. Se non viene fornito, usa `CourseUnifiedModal`.
- **Così facendo**: Il framework generale (lista, contatori, delete) rimane uno solo e sicuro, ma la logica specifica (cosa c'è nel form di Edit) viene isolata file per file senza pestarsi i piedi.
