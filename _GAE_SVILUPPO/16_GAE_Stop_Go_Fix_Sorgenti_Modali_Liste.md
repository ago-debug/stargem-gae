# Report Stop & Go: Disallineamento Sorgenti Modali [AG-FIX-006G/006H]

### 1. Sorgente attuale dei Campi (nel `CourseUnifiedModal.tsx`)
- **Stato**: `useQuery<ActivityStatus[]>({ queryKey: ["/api/activity-statuses"] })` (mappato col fallback base).
- **Genere / Nome Corso**: Hook `useCustomListValues("nomi_corsi")` -> fetch a `["/api/custom-lists/nomi_corsi"]`. Ritorna un oggetto `{ id, systemName, items: [...] }`.
- **Categoria**: Query su `["/api/categories"]`.
- **Posti Disponibili**: Hook `useCustomListValues("posti_disponibili")` -> `["/api/custom-lists/posti_disponibili"]`.

### 2. Sorgente attuale dei Sub-modali (Pennini)
- **Stato**: Il suo interno pesca da `["/api/activity-statuses"]`.
- **Categoria**: Pesca da `["/api/categories"]`.
- **Genere e Posti**: Il componente `CustomListManagerDialog` fa una query errata a `["/api/customLists/nomi_corsi"]` (assenza del trattino) e si aspetta indietro un array piatto invece dell'oggetto complesso con gli `items` innestati.

### 3. Dove avviene il disallineamento
Il disallineamento si verifica unicamente dentro `client/src/components/custom-list-manager-dialog.tsx`. 
Attualmente ha endpoints fittizi (`/api/customLists`) anziché puntare a quelli esatti previsti dall'architettura (`/api/custom-lists/:systemName` per la lettura, e `/api/custom-lists/:listId/items` per le scritture).

### 4. Fix Minimo Proposto (NO REFACTOR INUTILI)
Modificare unicamente il sorgente di `CustomListManagerDialog.tsx` per implementare lo stesso pattern di `useCustomList()` in lettura e le routes /items in scrittura:
1. Usare il path `api/custom-lists/${listType}` per ottenere la root table list data (`data.id`) e la cascata dei figli (`data?.items || []`).
2. Sostituire le query POST/PATCH/DELETE da `api/customLists/xxx` al formato annidato `api/custom-lists/${data.id}/items/xxx`.

### Tabella Sintetica Finale

| Campo | Sorgente Campo attuale | Sorgente Pennino attuale | Esito | Correzione da fare |
|---|---|---|---|---|
| **Stato** | `/api/activity-statuses` | `/api/activity-statuses` | **Allineato (OK)** | Nessuna (Lasciare Intatto) |
| **Categoria** | `/api/categories` | `/api/categories` | **Allineato (OK)** | Nessuna (Lasciare Intatto) |
| **Genere / Nome** | `/api/custom-lists/nomi_corsi` | `/api/customLists/...` | **DISALLINEATO (Vuoto)** | Agganciare `CustomListManagerDialog` all'endpoint `custom-lists` esatto |
| **Posti Disp.** | `/api/custom-lists/posti_disponibili` | `/api/customLists/...` | **DISALLINEATO (Vuoto)** | Come sopra, correggere `CustomListManagerDialog` |
