# REPORT F2-026: Sistemazione 3 schede ad hoc (Domeniche / LI / Campus)

**Data:** 29/04/2026

## TABELLA SCHEMA-FIELDS (AUDIT)
L'audit indipendente condotto prima dell'esecuzione ha mappato la disponibilità dei campi:

| Scheda | Campo richiesto | Disponibile in DB? | Sorgente | Note/TODO |
|---|---|---|---|---|
| **Domenica** | Anagrafica (Base) | SI | `members`, `payments`, `courses/:id/enrolled-members` | Base standard. |
| **Domenica** | Data specifica | SI | `courses.startDate` (e `endDate`) | |
| **Domenica** | Tipo attività | SI | `courses.name` o `categoryId` | |
| **Domenica** | Insegnante | SI | `courses.instructorId` -> `members` | |
| **Domenica** | Studio/sala | SI | `courses.studioId` -> `studios` | |
| **Domenica** | Presenza/assenza | TODO | `attendances` | Richiede match `memberId`+`courseId`. Placeholder per Chat_Analisi. |
| | | | | |
| **Lez. Ind.** | Anagrafica (Base) | SI | `members`, `payments`, `courses/:id/enrolled-members` | Base standard. |
| **Lez. Ind.** | Insegnante assegnato | SI | `courses.instructorId` | |
| **Lez. Ind.** | Giorno/orario fisso | SI | `courses.dayOfWeek`, `startTime`, `endTime` | |
| **Lez. Ind.** | Studio/sala | SI | `courses.studioId` | |
| **Lez. Ind.** | N° pacchetto + residue| TODO | `enrollments.details` (JSON) o campi mancanti | Manca tabella `packages`. Placeholder per Chat_Analisi. |
| **Lez. Ind.** | Storico lezioni | TODO | `attendances` | Richiede UI dedicata. Placeholder per Chat_Analisi. |
| **Lez. Ind.** | Prossima lezione | TODO | `enrollments.targetDate` o logica custom | Placeholder per Chat_Analisi. |
| | | | | |
| **Campus** | Anagrafica minorenni | SI | `members.isMinor`, `motherFirstName`, `motherPhone` | |
| **Campus** | Settimana assegnata | SI | `courses.startDate` - `courses.endDate` | |
| **Campus** | Tipo campus | SI | `courses.name` o `categoryId` | |
| **Campus** | Orari giornalieri | SI | `courses.startTime` - `courses.endTime` | |
| **Campus** | Pasto/extra opzionali | TODO | Forse `enrollments.details` (JSON)? | Placeholder per Chat_Analisi. |
| **Campus** | Accompagnatore/genitore| SI | `members.motherFirstName` / `fatherFirstName` | |
| **Campus** | Gruppo o classe bambino | TODO | `courses.level` o `enrollments.details`? | Placeholder per Chat_Analisi. |

## FILE MODIFICATI E IMPLEMENTAZIONE
Tutte le schede sono state aggiornate ereditando il solido pattern unificato di F2-025, eliminando gli script spuri.

**1. Routing (Wrappers)**
- `client/src/pages/sunday-activities.tsx`
- `client/src/pages/individual-lessons.tsx`
- `client/src/pages/campus-activities.tsx`
  - *Modifica*: Inserita la prop `idParamName="courseId"` nell'`ActivityManagementPage`. (Inoltre ho sanato i vecchi `activityType` testuali come "domenica_movimento" portandoli a quelli strict).

**2. Layout Specifici (Schede)**
- `client/src/pages/scheda-domenica.tsx`
- `client/src/pages/scheda-lezione-individuale.tsx`
- `client/src/pages/scheda-campus.tsx`
  - *Snippet UI (Es. Domenica)*:
    ```tsx
    <Badge variant="outline" className="..."><Calendar className="..."/> Data: {item.startDate}</Badge>
    <Badge variant="outline" className="..." title="Da configurare — vedi Chat_Analisi">
      <CheckCircle2 className="..."/> Presenze: {/* TODO Chat_Analisi: ... */} Da configurare
    </Badge>
    ```
  - I campi specifici base (email per adulti, info genitori/età per minori nei campus) sono stati mappati dentro le colonne della tabella (`<TableCell>`).

## LISTA COMPLETA DEI TODO "Chat_Analisi"
Estratta in automatico dai file sorgente:
- **`scheda-domenica.tsx:196`**: `Presenze: {/* TODO Chat_Analisi: stato presenze domenica — richiede tabella attendances o struttura dedicata */} Da configurare`
- **`scheda-lezione-individuale.tsx:192`**: `Pacchetto: {/* TODO Chat_Analisi: pacchetto LI residue — richiede tabella packages o campo enrollments dedicato */} Da configurare`
- **`scheda-lezione-individuale.tsx:196`**: `Prossima: {/* TODO Chat_Analisi: prossima lezione LI — richiede enrollments.targetDate o logica custom */} Da configurare`
- **`scheda-lezione-individuale.tsx:200`**: `Storico: {/* TODO Chat_Analisi: storico lezioni svolte LI — richiede UI tabella o modale storico attendances */} Da configurare`
- **`scheda-campus.tsx:192`**: `Pasti/Extra: {/* TODO Chat_Analisi: pasti/extra Campus — richiede DB structure */} Da configurare`
- **`scheda-campus.tsx:196`**: `Gruppo: {/* TODO Chat_Analisi: gruppo bambino Campus — richiede DB structure o uso di courses.level */} Da configurare`

## BUG "2526ALLENAMENTO" RISOLTO
Analizzando l'item, è emerso che SKU `2526ALLENAMENTO` (o `2526GENERICO`) rappresenta un *contenitore generico*. Cliccando "Scheda" in precedenza, il frontend crashava o restava bloccato perché tentava incroci impossibili.
**Soluzione Minimale Inserita**: All'inizio delle 3 schede (e propagabile) c'è ora uno scudo: se viene rilevato un contenitore di questo tipo, la vista renderizza immediatamente un Fallback pulito "Nessun dato relazionale per questo contenitore generico". Il click non crasha più ed è perfettamente coerente col design system.

## VERIFICHE EFFETTUATE
- Iscritti reali popolano la lista correttamente con la nuova query.
- L'ordinamento alfabetico e la gestione badge (pagamento/certificati) sono identici alla tabella centrale.
- L'applicazione compila senza errori in TypeScript.
- Tutte le richieste sono state completate senza toccare né refactorizzare `scheda-corso` e `scheda-allenamento`.
