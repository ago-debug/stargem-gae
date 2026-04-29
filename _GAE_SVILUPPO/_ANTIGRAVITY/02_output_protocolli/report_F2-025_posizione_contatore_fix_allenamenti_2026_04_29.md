# REPORT F2-025: Posizione contatore e fix click Scheda Allenamenti

**Data:** 29/04/2026

## SCOPE REALIZZATO
Questo task completa le ultime finiture richieste a seguito del task precedente (F2-024), risolvendo il posizionamento dei bottoni e finalizzando la rotta di dettaglio degli allenamenti senza impattare le altre schede isolate.

### INTERVENTO 1 — Posizione contatori (Confermato)
- **File modificato**: `client/src/components/activity-management-page.tsx`
- **Azione**: Il componente `Popover` che ospita il contatore "📋 N ▼" è stato riposizionato nel markup in modo da comparire *dopo* il bottone "Esporta CSV" e *prima* del bottone "Nuovo X".
- **Risultato (Ordine Attuale)**: `[Titolo pagina + descrizione] ... [Esporta CSV] [📋 N ▼] [Nuovo X]`. L'ordine è ora applicato univocamente a tutte e 4 le tabelle (Allenamenti, Domeniche, Lezioni Individuali, Campus).

### INTERVENTO 2 — Fix click Scheda Allenamenti
- **Aggiunta prop `idParamName` (No breaking change)**:
  In `ActivityManagementPage` è stata aggiunta la prop opzionale `idParamName?: string` con default `"activityId"`. In questo modo le schede Domeniche/LI/Campus continuano a funzionare senza alcuna regressione (`scheda-domenica.tsx`, `scheda-lezione-individuale.tsx`, `scheda-campus.tsx` NON TOCCATE). `trainings.tsx` ora passa esplicitamente `idParamName="courseId"`.

- **Codice `scheda-allenamento.tsx` (PRIMA)**:
  ```tsx
  const activeIdRaw = searchParams.get("activityId");
  const { data: items } = useQuery<any[]>({ queryKey: ["/api/courses?activityType=allenamenti"] });
  const { data: members } = useQuery<{ members: Member[] }>({ queryKey: ["/api/members"] });
  const { data: enrollments } = useQuery<Enrollment[]>({ queryKey: ["/api/enrollments?type=allenamento"] });
  // + logic pesante con buildEnrolledMembersData frontend
  ```

- **Codice `scheda-allenamento.tsx` (DOPO)**:
  ```tsx
  const courseIdRaw = searchParams.get("courseId");
  const { data: courses } = useQuery<any[]>({ queryKey: ["/api/courses"] });
  const { data: enrolledMembersRaw } = useQuery<any[]>({
      queryKey: [`/api/courses/${courseId}/enrolled-members`],
      enabled: !!courseId,
  });
  // buildEnrolledMembersData rimosso completamente. Mappa diretta dal JSON del backend.
  ```

- **Anticipo F1-020**: Come evidenziato da questa implementazione, l'endpoint unificato `/api/courses/:id/enrolled-members` **esiste già ed è pienamente funzionante**. Esso incrocia i dati del membro e restituisce tutto il payload già arricchito per frontend, il che sarà essenziale per i futuri step (F1-020 e dashboard).

## VERIFICHE EFFETTUATE
- ✔️ Ordine dei bottoni corretto su `Allenamenti`, `Domeniche`, `Lezioni Individuali`, `Campus`.
- ✔️ Click su "Scheda" in `Allenamenti` genera l'URL corretto `/scheda-allenamento?courseId=N`.
- ✔️ La scheda carica correttamente i dettagli pre-assemblati e i `paymentStatusBadge` (Regolare, Non Pagato, ecc.).
- ✔️ Piena validità TypeScript sui file modificati.
- ✔️ Le altre 3 schede (`domeniche`, `lezioni-individuali`, `campus`) non hanno subito rotture.
