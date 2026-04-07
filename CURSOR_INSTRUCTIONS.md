# Istruzioni per Cursor AI: Unificazione Modali (Fase STI)

## Contesto per Cursor
Il progetto sta affrontando una migrazione da architettura a silos (database separati per ogni tipologia di attività) a un modello STI (Single Table Inheritance). La tabella master unificata è `courses`.

Antigravity (l'altro agente) ha già gestito la migrazione a livello backend e database, spostando i dati di questi 5 silos dentro la tabella `courses` o impostando gli script per farlo.
Il tuo compito come Cursor è **aggiornare il Frontend** in modo che queste 5 pagine utilizzino il componente universale `CourseUnifiedModal.tsx` e il fetch corretto, abbandonando i vecchi Dialog locali e isolati.

## Le 5 Sezioni da Aggiornare
I file target si trovano tutti in `client/src/pages/`:
1. `sunday-activities.tsx` (Domeniche in Movimento)
2. `workshops.tsx` (Workshop)
3. `rentals.tsx` (Affitti)
4. `recitals.tsx` (Saggi)
5. `vacation-studies.tsx` (Vacanze Studio)

---

## 🛠️ Task 1: Attivazione del Modale Condiviso (`activity-management-page.tsx`)
**Regola d'oro del progetto**: Per non toccare i core vitali, non eliminiamo cose finché non testate. 
Tutti i componenti sopra chiamano internamente `<ActivityManagementPage>`.
File da modificare: `client/src/components/activity-management-page.tsx`
- **Obiettivo**: Fare in modo che tutte queste `activityType` renderizzino il `CourseUnifiedModal` invece del vecchio `Dialog` hardcoded.
- **Modifica da fare**: Trova la riga (circa riga 840) che dice:
  `{["campus", "prenotazioni", "allenamenti"].includes(activityType || "") ? (`
  E aggiungi le 5 nuove `activityType` all'array:
  `{["campus", "prenotazioni", "allenamenti", "domeniche", "workshop", "affitti", "saggi", "vacanze"].includes(activityType || "") ? (`

---

## 🛠️ Task 2: Passaggio corretto dei parametri nelle Pagine
Per ognuna delle 5 pagine in `client/src/pages/`, applica questo aggiornamento.
Esempio per `workshops.tsx` (ripetere per le altre):

1. Dentro il componente della pagina (es. `Workshops()`), la prop `<ActivityManagementPage>` passava prima `apiEndpoint="/api/workshops"`.
   **Lasciala invariata per l'elenco della tabella, ma imposta o conferma l'attributo `activityType="workshop"`** (deve coincidere con le chiavi che hai messo nell'includes del Task 1).

**Tabella di Mappatura activityType da usare per ogni file:**
- `sunday-activities.tsx` -> `activityType="domeniche"`
- `workshops.tsx` -> `activityType="workshop"`
- `rentals.tsx` -> `activityType="affitti"`
- `recitals.tsx` -> `activityType="saggi"`
- `vacation-studies.tsx` -> `activityType="vacanze"`

---

## 🛠️ Task 3: Espansione di `CourseUnifiedModal.tsx`
Il file `client/src/components/CourseUnifiedModal.tsx` è il cuore del nuovo sistema.
Devi gestirne la UI dinamica affinché supporti i nuovi form.
1. Aggiungi il controllo nell'endpoint API (circa riga 464):
   ```typescript
   // Assicurati che l'apiEndpoint per tutte le attività citate punti allo unified /api/courses
   const apiEndpoint = (["prenotazioni", "allenamenti", "domeniche", "workshop", "affitti", "saggi", "vacanze", "campus"].includes(activityType || "")) ? "/api/courses" : "/api/courses";
   ```
2. Aggiungi la label specifica per l'intestazione del Modal in base al tipo (cerca la variabile `title` o l'intestazione del modale):
   Esempio:
   ```typescript
   const modalTitle = activityType === "domeniche" ? "Gestione Domenica in Movimento" : ...
   ```
3. Aggiungi blocchi condizionali di campi specifici.
   Esempio per Domeniche:
   ```tsx
   {activityType === "domeniche" && (
      <div className="p-4 mt-6 border border-purple-500/30 bg-purple-500/5 rounded-md space-y-4">
        <h4 className="text-sm font-semibold text-purple-900 border-b border-purple-500/20 pb-2">Dettagli Domenica</h4>
        {/* Campi specifici per domeniche ... */}
      </div>
   )}
   ```
   (Inventa o riadatta i campi in base allo schema dati e alla vecchia struttura).

---

## Output Richiesto da Cursor
Una volta effettuate queste modifiche, compila il progetto e verifica che cliccando su "Nuovo (attività)" all'interno di quelle sezioni:
1. Si apra il **Model Unificato** (`CourseUnifiedModal.tsx`).
2. Ci siano i campi corretti in base all'attività.
3. Premendo "Salva", il POST venga sputato su `/api/courses`. (Il backend di AG gestirà magicamente il salvataggio senza che esploda il DB).
