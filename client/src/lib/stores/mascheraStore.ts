import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  defaultFormData, FormDataState, 
  defaultAllegatiState, AllegatiState, 
  defaultBottomSectionsState, BottomSectionsState,
  defaultAttivitaText, defaultAttivitaArray, AttivitaKey
} from '@/components/crm/CrmFormTypes';



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
        // Escludiamo esplicitamente l'oggetto `file` per non causare eccezioni JSON
        photoFile: { file: null, preview: state.photoFile.preview } 
      }),
    }
  )
);
