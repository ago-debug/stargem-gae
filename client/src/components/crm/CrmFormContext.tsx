import React, { createContext, useContext, ReactNode } from "react";
import { useMascheraStore } from "@/lib/stores/mascheraStore";
import {
  GiftItem, BottomSectionsState, defaultBottomSectionsState,
  AllegatoState, AllegatiState, defaultAllegatiState,
  AttivitaKey, defaultAttivitaText, defaultAttivitaArray,
  defaultFormData, FormDataState
} from "./CrmFormTypes";

export type {
  GiftItem, BottomSectionsState,
  AllegatoState, AllegatiState,
  AttivitaKey, FormDataState
};
export {
  defaultBottomSectionsState,
  defaultAllegatiState,
  defaultAttivitaText,
  defaultAttivitaArray,
  defaultFormData
};
interface CrmFormContextType {
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  dirtyFields: Record<string, boolean>;
  setDirtyFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleChange: (field: string, value: string, isQuiet?: boolean) => void;
  
  allegati: AllegatiState;
  setAllegati: React.Dispatch<React.SetStateAction<AllegatiState>>;
  openAllegatoSections: Record<string, boolean>;
  setOpenAllegatoSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  
  bottomSectionsData: BottomSectionsState;
  setBottomSectionsData: React.Dispatch<React.SetStateAction<BottomSectionsState>>;
  
  photoFile: { file: File | null; preview: string | null };
  setPhotoFile: React.Dispatch<React.SetStateAction<{ file: File | null; preview: string | null }>>;
  
  // Attivita
  attivitaCorso: Record<AttivitaKey, string>;
  setAttivitaCorso: React.Dispatch<React.SetStateAction<Record<AttivitaKey, string>>>;
  attivitaCodice: Record<AttivitaKey, string>;
  setAttivitaCodice: React.Dispatch<React.SetStateAction<Record<AttivitaKey, string>>>;
  attivitaEnrollmentDetails: Record<AttivitaKey, string[]>;
  setAttivitaEnrollmentDetails: React.Dispatch<React.SetStateAction<Record<AttivitaKey, string[]>>>;
  
  selectedMemberId: number | null;
  actionFromUrl: string | null;
  verificaStato: Record<string, boolean>;
  setVerificaStato: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  avviaVerifica: (type: string, field: string) => void;
}

const CrmFormContext = createContext<CrmFormContextType | undefined>(undefined);

export interface CrmFormProviderProps {
  children: ReactNode;
  selectedMemberId: number | null;
  actionFromUrl: string | null;
  verificaStato: Record<string, boolean>;
  setVerificaStato: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  avviaVerifica: (type: string, field: string) => void;
}

export function CrmFormProvider({ 
  children,
  selectedMemberId,
  actionFromUrl,
  verificaStato,
  setVerificaStato,
  avviaVerifica
}: CrmFormProviderProps) {
  const store = useMascheraStore();

  return (
    <CrmFormContext.Provider value={{
      formData: store.formData, setFormData: store.setFormData,
      dirtyFields: store.dirtyFields, setDirtyFields: store.setDirtyFields,
      handleChange: store.handleChange,
      
      allegati: store.allegati, setAllegati: store.setAllegati,
      openAllegatoSections: store.openAllegatoSections, setOpenAllegatoSections: store.setOpenAllegatoSections,
      
      bottomSectionsData: store.bottomSectionsData, setBottomSectionsData: store.setBottomSectionsData,
      
      photoFile: store.photoFile, setPhotoFile: store.setPhotoFile,
      
      attivitaCorso: store.attivitaCorso, setAttivitaCorso: store.setAttivitaCorso,
      attivitaCodice: store.attivitaCodice, setAttivitaCodice: store.setAttivitaCodice,
      attivitaEnrollmentDetails: store.attivitaEnrollmentDetails, setAttivitaEnrollmentDetails: store.setAttivitaEnrollmentDetails,
      
      selectedMemberId,
      actionFromUrl,
      verificaStato, setVerificaStato,
      avviaVerifica
    }}>
      {children}
    </CrmFormContext.Provider>
  );
}

export function useCrmForm() {
  const context = useContext(CrmFormContext);
  if (context === undefined) {
    throw new Error("useCrmForm must be used within a CrmFormProvider");
  }
  return context;
}
