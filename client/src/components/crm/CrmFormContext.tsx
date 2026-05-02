import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getActiveActivities } from "@/config/activities";

export interface GiftItem {
  id: string;
  tipo: string;
  valore: string;
  numero: string;
  dataEmissione: string;
  dataScadenza: string;
  motivazione: string;
  dataUtilizzo: string;
  iban: string;
}

export interface BottomSectionsState {
  gift: GiftItem[];
  tessere: { quota: string; pagamento: string; membershipType: string; seasonCompetence: string; dataScad: string; numero: string; tesseraEnte: string; scadenzaTesseraEnte: string };
  certificatoMedico: { dataScadenza: string; dataRinnovo: string; rilasciatoDa: string; pagamento: string; aNoi: string; tipo: string };
}

export const defaultBottomSectionsState: BottomSectionsState = {
  gift: [],
  tessere: { quota: "", pagamento: "", membershipType: "NUOVO", seasonCompetence: "CORRENTE", dataScad: "", numero: "", tesseraEnte: "", scadenzaTesseraEnte: "" },
  certificatoMedico: { dataScadenza: "", dataRinnovo: "", rilasciatoDa: "", pagamento: "", aNoi: "", tipo: "" }
};

interface AllegatoState {
  hasFile: boolean;
  data?: string;
  note?: string;
  fileName?: string;
  previewUrl?: string;
}

export interface AllegatiState {
  regolamento: AllegatoState & { accettato?: string };
  privacy: AllegatoState & { accettata?: string };
  certificatoMedico: AllegatoState & { dataRilascio?: string; scadenza?: string; tipo?: string };
  ricevutePagamenti: AllegatoState & { numeroRicevute?: number };
  modelloDetrazione: AllegatoState & { anno?: string; richiesto?: string };
  creditiScolastici: AllegatoState & { annoScolastico?: string; richiesto?: string };
  tesserinoTecnico: AllegatoState & { numero?: string; dataRilascio?: string };
  tesseraEnte: AllegatoState & { numero?: string; ente?: string };
  domandaTesseramento: AllegatoState & { data?: string; accettato?: string };
}

export const defaultAllegatiState: AllegatiState = {
  regolamento: { hasFile: false, data: "", accettato: "" },
  privacy: { hasFile: false, data: "", accettata: "" },
  certificatoMedico: { hasFile: false, dataRilascio: "", scadenza: "", tipo: "" },
  ricevutePagamenti: { hasFile: false, numeroRicevute: 0, note: "" },
  modelloDetrazione: { hasFile: false, anno: "2026", richiesto: "" },
  creditiScolastici: { hasFile: false, annoScolastico: "2025/2026", richiesto: "" },
  tesserinoTecnico: { hasFile: false, numero: "", dataRilascio: "" },
  tesseraEnte: { hasFile: false, numero: "", ente: "" },
  domandaTesseramento: { hasFile: false, data: "", accettato: "" },
};

const attivitaKeys = getActiveActivities().filter(a => a.visibility.mascheraInput).map(a => a.id);
type AttivitaKey = string;

export const defaultAttivitaText: Record<string, string> = attivitaKeys.reduce((acc, id) => {
  acc[id] = "";
  return acc;
}, {} as Record<string, string>);

export const defaultAttivitaArray: Record<string, string[]> = attivitaKeys.reduce((acc, id) => {
  acc[id] = [];
  return acc;
}, {} as Record<string, string[]>);

export const defaultFormData = {
  // Intestazione
  status: "",
  stagione: "2025-2026",
  codiceId: "2526-000001",
  dataInserimento: new Date().toLocaleDateString("it-IT"),
  teamInserito: "",
  teamAggiornato: "",
  tipoPartecipante: "tesserato",
  tessera: "",
  scadenzaTessera: "",
  daDoveArriva: "",
  tesseraEnte: "",
  scadenzaTesseraEnte: "",
  ente: "",
  // Anagrafica principale
  cognome: "",
  nome: "",
  codiceFiscale: "",
  telefono: "",
  email: "",
  indirizzo: "",
  cap: "",
  citta: "",
  provincia: "",
  codComune: "",
  dataNascita: "",
  luogoNascita: "",
  provinciaNascita: "",
  sesso: "",
  eta: "",
  // Genitore 1
  cognomeGen1: "",
  nomeGen1: "",
  cfGen1: "",
  telGen1: "",
  emailGen1: "",
  indirizzoGen1: "",
  capGen1: "",
  cittaGen1: "",
  provinciaGen1: "",
  codComuneGen1: "",
  dataNascitaGen1: "",
  luogoNascitaGen1: "",
  provinciaNascitaGen1: "",
  sessoGen1: "",
  etaGen1: "",
  // Genitore 2
  cognomeGen2: "",
  nomeGen2: "",
  cfGen2: "",
  telGen2: "",
  emailGen2: "",
  indirizzoGen2: "",
  capGen2: "",
  cittaGen2: "",
  provinciaGen2: "",
  codComuneGen2: "",
  dataNascitaGen2: "",
  luogoNascitaGen2: "",
  provinciaNascitaGen2: "",
  sessoGen2: "",
  etaGen2: "",
  livello: "",
  noteInt: "",
  noteGen1: "",
  noteGen2: "",
};

export type FormDataState = typeof defaultFormData;

interface CrmFormContextType {
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  dirtyFields: Record<string, boolean>;
  setDirtyFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleChange: (field: string, value: string) => void;
  
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
  const [formData, setFormData] = useState<FormDataState>(() => {
    const saved = sessionStorage.getItem("mascheraInputFormData");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved formData", e);
      }
    }
    return defaultFormData;
  });

  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>(() => {
    const saved = sessionStorage.getItem("mascheraInputDirtyFields");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved dirtyFields", e);
      }
    }
    return {};
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setDirtyFields((prev) => ({ ...prev, [field]: true }));
  };

  const [allegati, setAllegati] = useState<AllegatiState>(() => {
    const saved = sessionStorage.getItem("mascheraInputAllegati");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultAllegatiState,
          ...parsed,
          regolamento: { ...defaultAllegatiState.regolamento, ...parsed.regolamento },
          privacy: { ...defaultAllegatiState.privacy, ...parsed.privacy },
          certificatoMedico: { ...defaultAllegatiState.certificatoMedico, ...parsed.certificatoMedico },
          ricevutePagamenti: { ...defaultAllegatiState.ricevutePagamenti, ...parsed.ricevutePagamenti },
          modelloDetrazione: { ...defaultAllegatiState.modelloDetrazione, ...parsed.modelloDetrazione },
          creditiScolastici: { ...defaultAllegatiState.creditiScolastici, ...parsed.creditiScolastici },
          tesserinoTecnico: { ...defaultAllegatiState.tesserinoTecnico, ...parsed.tesserinoTecnico },
          tesseraEnte: { ...defaultAllegatiState.tesseraEnte, ...parsed.tesseraEnte },
          domandaTesseramento: { ...defaultAllegatiState.domandaTesseramento, ...parsed.domandaTesseramento },
        };
      } catch (e) {
        console.error("Failed to parse saved allegati", e);
      }
    }
    return defaultAllegatiState;
  });

  const [openAllegatoSections, setOpenAllegatoSections] = useState<Record<string, boolean>>({});

  const [bottomSectionsData, setBottomSectionsData] = useState<BottomSectionsState>(() => {
    const saved = sessionStorage.getItem("mascheraInputBottomSections");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved bottomSections", e);
      }
    }
    return defaultBottomSectionsState;
  });

  const [photoFile, setPhotoFile] = useState<{ file: File | null; preview: string | null }>(() => {
    const saved = sessionStorage.getItem("mascheraInputPhoto");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { file: null, preview: parsed.preview };
      } catch (e) {
        console.error("Failed to parse saved photo", e);
      }
    }
    return { file: null, preview: null };
  });

  const [attivitaCorso, setAttivitaCorso] = useState<Record<AttivitaKey, string>>(() => {
    const saved = sessionStorage.getItem("mascheraInputAttivitaCorso");
    if (saved) return JSON.parse(saved);
    return { ...defaultAttivitaText };
  });

  const [attivitaCodice, setAttivitaCodice] = useState<Record<AttivitaKey, string>>(() => {
    const saved = sessionStorage.getItem("mascheraInputAttivitaCodice");
    if (saved) return JSON.parse(saved);
    return { ...defaultAttivitaText };
  });

  const [attivitaEnrollmentDetails, setAttivitaEnrollmentDetails] = useState<Record<AttivitaKey, string[]>>(() => {
    const saved = sessionStorage.getItem("mascheraInputAttivitaEnrollmentDetails");
    if (saved) return JSON.parse(saved);
    return { ...defaultAttivitaArray };
  });

  // Persist all state automatically
  useEffect(() => { sessionStorage.setItem("mascheraInputFormData", JSON.stringify(formData)); }, [formData]);
  useEffect(() => { sessionStorage.setItem("mascheraInputDirtyFields", JSON.stringify(dirtyFields)); }, [dirtyFields]);
  useEffect(() => { sessionStorage.setItem("mascheraInputBottomSections", JSON.stringify(bottomSectionsData)); }, [bottomSectionsData]);
  useEffect(() => { try { sessionStorage.setItem("mascheraInputAllegati", JSON.stringify(allegati)); } catch (e) {} }, [allegati]);
  useEffect(() => { try { sessionStorage.setItem("mascheraInputPhoto", JSON.stringify({ preview: photoFile.preview })); } catch (e) {} }, [photoFile]);
  useEffect(() => { sessionStorage.setItem("mascheraInputAttivitaCorso", JSON.stringify(attivitaCorso)); }, [attivitaCorso]);
  useEffect(() => { sessionStorage.setItem("mascheraInputAttivitaCodice", JSON.stringify(attivitaCodice)); }, [attivitaCodice]);
  useEffect(() => { sessionStorage.setItem("mascheraInputAttivitaEnrollmentDetails", JSON.stringify(attivitaEnrollmentDetails)); }, [attivitaEnrollmentDetails]);

  return (
    <CrmFormContext.Provider value={{
      formData, setFormData,
      dirtyFields, setDirtyFields,
      handleChange,
      allegati, setAllegati,
      openAllegatoSections, setOpenAllegatoSections,
      bottomSectionsData, setBottomSectionsData,
      photoFile, setPhotoFile,
      attivitaCorso, setAttivitaCorso,
      attivitaCodice, setAttivitaCodice,
      attivitaEnrollmentDetails, setAttivitaEnrollmentDetails,
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
