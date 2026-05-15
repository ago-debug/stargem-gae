---
aggiornato: 2026-05-12T01:25
prompt_di_riferimento: F2-002
---

# Report F2-002: Refactor Anagrafica (Step 1 - Zustand Migration)

## Step 1: Creazione `mascheraStore.ts`

Ho creato il file in `client/src/lib/stores/mascheraStore.ts` come richiesto. `zustand` versione `^5.0.11` era già presente in `package.json`, dunque non è stata necessaria alcuna installazione aggiuntiva.

**Codice scritto:**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  defaultFormData, FormDataState, 
  defaultAllegatiState, AllegatiState, 
  defaultBottomSectionsState, BottomSectionsState,
  defaultAttivitaText, defaultAttivitaArray
} from '@/components/crm/CrmFormContext';

export type AttivitaKey = string;

export interface MascheraStore {
  formData: FormDataState;
  setFormData: (updater: FormDataState | ((prev: FormDataState) => FormDataState)) => void;
  handleChange: (field: string, value: string, isQuiet?: boolean) => void;
  
  dirtyFields: Record<string, boolean>;
  setDirtyFields: (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  
  allegati: AllegatiState;
  setAllegati: (updater: AllegatiState | ((prev: AllegatiState) => AllegatiState)) => void;

  openAllegatoSections: Record<string, boolean>;
  setOpenAllegatoSections: (updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;

  bottomSectionsData: BottomSectionsState;
  setBottomSectionsData: (updater: BottomSectionsState | ((prev: BottomSectionsState) => BottomSectionsState)) => void;

  photoFile: { file: File | null; preview: string | null };
  setPhotoFile: (updater: { file: File | null; preview: string | null } | ((prev: { file: File | null; preview: string | null }) => { file: File | null; preview: string | null })) => void;

  attivitaCorso: Record<AttivitaKey, string>;
  setAttivitaCorso: (updater: Record<AttivitaKey, string> | ((prev: Record<AttivitaKey, string>) => Record<AttivitaKey, string>)) => void;
  
  attivitaCodice: Record<AttivitaKey, string>;
  setAttivitaCodice: (updater: Record<AttivitaKey, string> | ((prev: Record<AttivitaKey, string>) => Record<AttivitaKey, string>)) => void;
  
  attivitaEnrollmentDetails: Record<AttivitaKey, string[]>;
  setAttivitaEnrollmentDetails: (updater: Record<AttivitaKey, string[]> | ((prev: Record<AttivitaKey, string[]>) => Record<AttivitaKey, string[]>)) => void;

  resetForm: () => void;
}

export const useMascheraStore = create<MascheraStore>()(
  persist(
    (set) => ({
      formData: defaultFormData,
      setFormData: (updater) => set((state) => ({ formData: typeof updater === 'function' ? updater(state.formData) : updater })),
      handleChange: (field, value, isQuiet = false) => set((state) => ({
        formData: { ...state.formData, [field]: value },
        dirtyFields: isQuiet ? state.dirtyFields : { ...state.dirtyFields, [field]: true }
      })),
      
      dirtyFields: {},
      setDirtyFields: (updater) => set((state) => ({ dirtyFields: typeof updater === 'function' ? updater(state.dirtyFields) : updater })),
      
      allegati: defaultAllegatiState,
      setAllegati: (updater) => set((state) => ({ allegati: typeof updater === 'function' ? updater(state.allegati) : updater })),
      
      openAllegatoSections: {},
      setOpenAllegatoSections: (updater) => set((state) => ({ openAllegatoSections: typeof updater === 'function' ? updater(state.openAllegatoSections) : updater })),
      
      bottomSectionsData: defaultBottomSectionsState,
      setBottomSectionsData: (updater) => set((state) => ({ bottomSectionsData: typeof updater === 'function' ? updater(state.bottomSectionsData) : updater })),
      
      photoFile: { file: null, preview: null },
      setPhotoFile: (updater) => set((state) => ({ photoFile: typeof updater === 'function' ? updater(state.photoFile) : updater })),
      
      attivitaCorso: defaultAttivitaText,
      setAttivitaCorso: (updater) => set((state) => ({ attivitaCorso: typeof updater === 'function' ? updater(state.attivitaCorso) : updater })),
      
      attivitaCodice: defaultAttivitaText,
      setAttivitaCodice: (updater) => set((state) => ({ attivitaCodice: typeof updater === 'function' ? updater(state.attivitaCodice) : updater })),
      
      attivitaEnrollmentDetails: defaultAttivitaArray,
      setAttivitaEnrollmentDetails: (updater) => set((state) => ({ attivitaEnrollmentDetails: typeof updater === 'function' ? updater(state.attivitaEnrollmentDetails) : updater })),
      
      resetForm: () => set({
        formData: defaultFormData, 
        dirtyFields: {}, 
        allegati: defaultAllegatiState, 
        openAllegatoSections: {},
        bottomSectionsData: defaultBottomSectionsState, 
        photoFile: { file: null, preview: null },
        attivitaCorso: defaultAttivitaText, 
        attivitaCodice: defaultAttivitaText, 
        attivitaEnrollmentDetails: defaultAttivitaArray,
      })
    }),
    {
      name: 'maschera-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        formData: state.formData, 
        dirtyFields: state.dirtyFields, 
        allegati: state.allegati,
        openAllegatoSections: state.openAllegatoSections, 
        bottomSectionsData: state.bottomSectionsData,
        attivitaCorso: state.attivitaCorso, 
        attivitaCodice: state.attivitaCodice, 
        attivitaEnrollmentDetails: state.attivitaEnrollmentDetails,
        photoFile: { file: null, preview: state.photoFile.preview } 
      }),
    }
  )
);
```

## Step 2: Svuotamento `CrmFormContext.tsx` (Thin Wrapper) ✅

Come approvato, il file `CrmFormContext.tsx` è stato spogliato di tutti i `useState` e gli `useEffect` (circa 110 righe di codice per la gestione locale e la persistenza). Ora il componente `CrmFormProvider` funge esclusivamente da *pass-through* che legge i dati da `useMascheraStore` e li inietta nel context React.

**Validazione:**
- Esecuzione di `npx tsc --noEmit` completata con `0 errori`.
- Gli altri `Tab` non ancora migrati continuano a funzionare normalmente in trasparenza tramite il context.

## Step 3 e 4: Migrazione `TabAnagrafica.tsx` e Check TypeScript Finale ✅

Il primo consumer è stato migrato:
- Sganciato dal Context per quanto riguarda `formData` e `handleChange`.
- Agganciato a `useMascheraStore` tramite *selettori specifici*.

**Fix della dipendenza circolare:**
Durante l'importazione, è stata individuata una potenziale crash al caricamento dovuta ad una dipendenza circolare tra `CrmFormContext.tsx` e `mascheraStore.ts`. Sono state perciò estratte tutte le definizioni (`FormDataState`, type, default states) all'interno del nuovo file `client/src/components/crm/CrmFormTypes.ts`, rompendo la catena e permettendo all'app di avviarsi in modo fluido.

**Validazione Re-render:**
I test sul DOM live hanno confermato il successo dell'operazione. Durante la digitazione nell'input "Nome", i log mostrano che i componenti come `TabGift` e `TabIscrizioni` non ricevono l'evento di re-render a cascata.

**Validazione Type:**
Eseguito un nuovo check TypeScript (`npx tsc --noEmit`) dopo la creazione di `CrmFormTypes.ts` ed ha generato `0 errori`.

L'architettura del CRM è ora stabilmente avviata sul nuovo binario Zustand.
