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
  certificatoMedico: { dataScadenza: string; dataRinnovo: string; rilasciatoDa: string; pagamento: string; aNoi: string; tipo: string; fileUrl?: string; };
}

export const defaultBottomSectionsState: BottomSectionsState = {
  gift: [],
  tessere: { quota: "", pagamento: "", membershipType: "NUOVO", seasonCompetence: "CORRENTE", dataScad: "", numero: "", tesseraEnte: "", scadenzaTesseraEnte: "" },
  certificatoMedico: { dataScadenza: "", dataRinnovo: "", rilasciatoDa: "", pagamento: "", aNoi: "", tipo: "" }
};

export interface AllegatoState {
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
export type AttivitaKey = string;

export const defaultAttivitaText: Record<string, string> = attivitaKeys.reduce((acc, id) => {
  acc[id] = "";
  return acc;
}, {} as Record<string, string>);

export const defaultAttivitaArray: Record<string, string[]> = attivitaKeys.reduce((acc, id) => {
  acc[id] = [];
  return acc;
}, {} as Record<string, string[]>);

export const defaultFormData = {
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
  companyName: "",
  companyFiscalCode: "",
  companyAddress: "",
  companyCap: "",
  companyCity: "",
  companyProvince: "",
  companyPhone: "",
  companyEmail: "",
  bankName: "",
  iban: "",
  driveFolderUrl: "",
  sedeRiferimento: "",
  athenaMemberType: "",
  codiceCatastale: "",
  mastroC: "",
  mastroCol: "",
  codiceFe: "",
  previousMembershipNumber: "",
  athenaId: "",
  title: "",
  whatsapp: "",
  emailPec: "",
  familyCode: "",
  alias: "",
};

export type FormDataState = typeof defaultFormData;
