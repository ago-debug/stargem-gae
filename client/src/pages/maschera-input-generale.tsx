import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Upload, Download, Paperclip, Search, Plus, Save, FileSpreadsheet, CheckCircle2, AlertCircle, RotateCcw, ArrowDown, Check, FileUp, X, Camera, Edit, Trash2, Copy } from "lucide-react";
import {
  FileText, Users, CreditCard, Gift, IdCard, Stethoscope, Activity,
  User, BookOpen, ShoppingBag, Calendar, Sparkles, Sun, Dumbbell, UserCheck, Award, Music, Database
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useSearch, useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KnowledgeInfo } from "@/components/knowledge-info";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { MultiSelectEnrollmentDetails, EnrollmentDetailBadge } from "@/components/multi-select-enrollment-details";
import { PaymentDialog, type PaymentData } from "@/components/payment-dialog";
import { NuovoPagamentoModal } from "@/components/nuovo-pagamento-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CourseSelector } from "@/components/course-selector";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, Instructor, Category, Studio } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DuplicateFiscalCode {
  fiscalCode: string;
  members: { id: number; firstName: string; lastName: string; }[];
}
interface AllegatoState {
  hasFile: boolean;
  data?: string;
  note?: string;
  fileName?: string;
}

interface AllegatiState {
  regolamento: AllegatoState & { accettato?: string };
  privacy: AllegatoState & { accettata?: string };
  certificatoMedico: AllegatoState & { dataRilascio?: string; scadenza?: string; tipo?: string };
  ricevutePagamenti: AllegatoState & { numeroRicevute?: number };
  modelloDetrazione: AllegatoState & { anno?: string; richiesto?: string };
  creditiScolastici: AllegatoState & { annoScolastico?: string; richiesto?: string };
  tesserinoTecnico: AllegatoState & { numero?: string; dataRilascio?: string };
  tesseraEnte: AllegatoState & { numero?: string; ente?: string };
}

const attivitaKeys = ["corsi", "prove-pagamento", "prove-gratuite", "lezioni-singole", "workshop", "domeniche-movimento", "allenamenti", "lezioni-individuali", "campus", "saggi", "vacanze-studio"] as const;
type AttivitaKey = typeof attivitaKeys[number];

const defaultAttivitaText: Record<AttivitaKey, string> = {
  "corsi": "", "prove-pagamento": "", "prove-gratuite": "", "lezioni-singole": "",
  "workshop": "", "domeniche-movimento": "", "allenamenti": "", "lezioni-individuali": "",
  "campus": "", "saggi": "", "vacanze-studio": "",
};

const defaultAttivitaArray: Record<AttivitaKey, string[]> = {
  "corsi": [], "prove-pagamento": [], "prove-gratuite": [], "lezioni-singole": [],
  "workshop": [], "domeniche-movimento": [], "allenamenti": [], "lezioni-individuali": [],
  "campus": [], "saggi": [], "vacanze-studio": [],
};

export interface BottomSectionsState {
  gift: { tipo: string; valore: string; numero: string; dataEmissione: string; dataScadenza: string; motivazione: string; dataUtilizzo: string; iban: string };
  tessere: { quota: string; pagamento: string; nuovoRinnovo: string; dataScad: string; numero: string; tesseraEnte: string; domanda: string };
  certificatoMedico: { dataScadenza: string; dataRinnovo: string; rilasciatoDa: string; pagamento: string; aNoi: string; tipo: string };
}

export const defaultBottomSectionsState: BottomSectionsState = {
  gift: { tipo: "", valore: "", numero: "", dataEmissione: "", dataScadenza: "", motivazione: "", dataUtilizzo: "", iban: "" },
  tessere: { quota: "", pagamento: "", nuovoRinnovo: "", dataScad: "", numero: "", tesseraEnte: "", domanda: "" },
  certificatoMedico: { dataScadenza: "", dataRinnovo: "", rilasciatoDa: "", pagamento: "", aNoi: "", tipo: "" }
};

export default function MascheraInputGenerale() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const memberIdFromUrl = urlParams.get('memberId');
  const { user } = useAuth();

  const formatAuditDate = (dateString?: string | Date | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const defaultAllegatiState: AllegatiState = {
    regolamento: { hasFile: false, data: "", accettato: "" },
    privacy: { hasFile: false, data: "", accettata: "" },
    certificatoMedico: { hasFile: false, dataRilascio: "", scadenza: "", tipo: "" },
    ricevutePagamenti: { hasFile: false, numeroRicevute: 0, note: "" },
    modelloDetrazione: { hasFile: false, anno: "2026", richiesto: "" },
    creditiScolastici: { hasFile: false, annoScolastico: "2025/2026", richiesto: "" },
    tesserinoTecnico: { hasFile: false, numero: "", dataRilascio: "" },
    tesseraEnte: { hasFile: false, numero: "", ente: "" },
  };

  const [allegati, setAllegati] = useState<AllegatiState>(() => {
    const saved = sessionStorage.getItem("mascheraInputAllegati");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved allegati", e);
      }
    }
    return defaultAllegatiState;
  });

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

  useEffect(() => {
    sessionStorage.setItem("mascheraInputBottomSections", JSON.stringify(bottomSectionsData));
  }, [bottomSectionsData]);

  useEffect(() => {
    sessionStorage.setItem("mascheraInputAllegati", JSON.stringify(allegati));
  }, [allegati]);

  const [photoFile, setPhotoFile] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null });

  const handlePhotoUpload = (file: File | null) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/avif', 'image/tiff'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|heic|heif|webp|avif|tiff?)$/i)) {
      alert('Formato foto non supportato. Usa JPG, PNG, HEIC, HEIF o WebP.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoFile({ file, preview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile({ file: null, preview: null });
  };

  const [openAllegatoSections, setOpenAllegatoSections] = useState<Record<string, boolean>>({});

  const toggleAllegatoSection = (key: string) => {
    setOpenAllegatoSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileUpload = (key: keyof AllegatiState, file: File | null) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato file non supportato. Usa PDF, JPG o PNG.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    setAllegati(prev => ({
      ...prev,
      [key]: { ...prev[key], hasFile: true, fileName: file.name, data: today }
    }));
  };

  const removeAllegatoFile = (key: keyof AllegatiState) => {
    setAllegati(prev => ({
      ...prev,
      [key]: { ...prev[key], hasFile: false, fileName: '', data: '' }
    }));
  };

  const updateAllegato = (key: keyof AllegatiState, field: string, value: string | number) => {
    setAllegati(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const defaultFormData = {
    // Intestazione
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
    allievo: "",
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
  };

  const [formData, setFormData] = useState(() => {
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

  // Track modified fields for Color Coding
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

  // Save to sessionStorage whenever formData or dirtyFields change
  useEffect(() => {
    sessionStorage.setItem("mascheraInputFormData", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem("mascheraInputDirtyFields", JSON.stringify(dirtyFields));
  }, [dirtyFields]);
  const [isSaved, setIsSaved] = useState(false);

  // Helper for input color coding based on user requirements
  const getInputClassName = (fieldName: string, required: boolean = false, isAutoPopulated: boolean = false) => {
    const value = (formData as any)[fieldName];
    const isDirty = dirtyFields[fieldName];

    // Priority 1: Red for fields that *will* be auto-populated
    if (isAutoPopulated && !formData.codiceFiscale && !value && !isSaved) {
      return 'bg-red-50 border-red-400 transition-colors text-red-900';
    }

    // Priority 2: Giallino if user is actively writing/editing (isDirty)
    if (isDirty) {
      return 'bg-yellow-50 border-yellow-300 transition-colors text-yellow-900';
    }

    // Priority 3: Verdino if field is populated and NOT being actively edited
    // (This covers both "just saved" because saving clears isDirty, and "loaded from DB")
    if (value && !isDirty) {
      // Per la sezione Intestazione, vogliamo che diventi verde SOLO se è stato inserito un partecipante
      const isIntestazioneField = ['stagione', 'anagrafica', 'codiceId', 'dataInserimento', 'tipoPartecipante', 'tessera', 'scadenzaTessera', 'daDoveArriva', 'tesseraEnte', 'scadenzaTesseraEnte', 'ente'].includes(fieldName);
      const hasParticipant = formData.nome.trim() !== "" || formData.cognome.trim() !== "";

      if (isIntestazioneField && !hasParticipant && !isSaved) {
        // Se è un campo dell'intestazione (es. con un valore di default come Stagione) 
        // ma non c'è ancora un partecipante, lascialo del colore di base.
      } else {
        return 'bg-green-50 border-green-300 transition-colors text-green-900';
      }
    }

    // Priority 4: Grigio for empty mandatory fields
    if (required && !value) {
      return 'bg-muted/50 border-muted-foreground/30 transition-colors';
    }

    // Default
    return 'transition-colors';
  };

  // Stato attività selezionata nei pagamenti e corsi dal DB
  // NEW: Payment List State
  const [payments, setPayments] = useState<PaymentData[]>(() => {
    const saved = sessionStorage.getItem("mascheraInputPayments");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved payments", e);
      }
    }
    return [];
  });

  useEffect(() => {
    sessionStorage.setItem("mascheraInputPayments", JSON.stringify(payments));
  }, [payments]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isNuovoPagamentoOpen, setIsNuovoPagamentoOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // OLD: Single payment state (commented out or removed if not used elsewhere)
  // const [pagamentoAttivita, setPagamentoAttivita] = useState("");
  // const [pagamentoDettaglio, setPagamentoDettaglio] = useState("");

  const [corsiDB, setCorsiDB] = useState<{ id: number; name: string; sku: string }[]>([]);
  const [categorieDB, setCategorieDB] = useState<{ id: number; name: string }[]>([]);
  const [workshopCategorieDB, setWorkshopCategorieDB] = useState<{ id: number; name: string }[]>([]);
  const [domenicheCategorieDB, setDomenicheCategorieDB] = useState<{ id: number; name: string }[]>([]);
  const [allenamentiCategorieDB, setAllenamentiCategorieDB] = useState<{ id: number; name: string }[]>([]);
  const [lezioniIndCategorieDB, setLezioniIndCategorieDB] = useState<{ id: number; name: string }[]>([]);
  const [campusCategorieDB, setCampusCategorieDB] = useState<{ id: number; name: string }[]>([]);
  const [saggiCategorieDB, setSaggiCategorieDB] = useState<{ id: number; name: string }[]>([]);
  const [vacanzeCategorieDB, setVacanzeCategorieDB] = useState<{ id: number; name: string }[]>([]);
  const [partecipanteCategorieDB, setPartecipanteCategorieDB] = useState<{ id: number; name: string }[]>([]);
  // const [selectedPaymentNotes, setSelectedPaymentNotes] = useState<string[]>([]);
  // const [selectedEnrollmentDetails, setSelectedEnrollmentDetails] = useState<string[]>([]);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Active Member State for Enrollments
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState<string>("");
  const [selectedWorkshopToAdd, setSelectedWorkshopToAdd] = useState<string>("");
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  const [verificaStato, setVerificaStato] = useState({
    telefono: false,
    email: false,
    telGen1: false,
    emailGen1: false,
    telGen2: false,
    emailGen2: false,
  });

  const toggleVerifica = (campo: keyof typeof verificaStato) => {
    setVerificaStato(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const avviaVerifica = (campo: keyof typeof verificaStato, tipo: 'telefono' | 'email') => {
    const valore = tipo === 'telefono'
      ? (campo === 'telefono' ? formData.telefono : campo === 'telGen1' ? formData.telGen1 : formData.telGen2)
      : (campo === 'email' ? formData.email : campo === 'emailGen1' ? formData.emailGen1 : formData.emailGen2);

    if (!valore) {
      alert(`Inserisci prima ${tipo === 'telefono' ? 'il numero di telefono' : "l'indirizzo email"} `);
      return;
    }

    const conferma = window.confirm(
      tipo === 'telefono'
        ? `Inviare SMS di verifica a ${valore}?\n\n(Funzionalità da collegare con Twilio)`
        : `Inviare email di verifica a ${valore}?\n\n(Funzionalità da collegare con SMTP)`
    );

    if (conferma) {
      setTimeout(() => {
        setVerificaStato(prev => ({ ...prev, [campo]: true }));
        alert(`${tipo === 'telefono' ? 'Telefono' : 'Email'} verificato con successo!`);
      }, 500);
    }
  };

  const decodeFiscalCode = (cf: string) => {
    if (!cf || cf.length !== 16) return null;

    const monthMap: { [key: string]: number } = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'H': 6,
      'L': 7, 'M': 8, 'P': 9, 'R': 10, 'S': 11, 'T': 12
    };

    try {
      const yearCode = parseInt(cf.substring(6, 8));
      const currentYear = new Date().getFullYear();
      const century = yearCode > (currentYear % 100) + 10 ? 1900 : 2000;
      const year = century + yearCode;

      const monthChar = cf.charAt(8).toUpperCase();
      const month = monthMap[monthChar] || 1;

      let day = parseInt(cf.substring(9, 11));
      const sesso = day > 40 ? 'F' : 'M';
      if (day > 40) day -= 40;

      const dataNascita = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const birthDate = new Date(dataNascita);

      // Check for valid Date and valid Day
      if (isNaN(birthDate.getTime()) || birthDate.getDate() !== day) {
        return null;
      }

      const codiceComune = cf.substring(11, 15).toUpperCase();

      const today = new Date();
      let eta = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        eta--;
      }

      return { dataNascita, sesso, eta: eta.toString(), codiceComune };
    } catch (e) {
      return null;
    }
  };

  const fetchComuneFromCode = async (codice: string) => {
    try {
      const response = await fetch(`/api/comuni/by-code/${codice}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (e) {
      console.error("Errore nel recupero del comune:", e);
    }
    return null;
  };

  const handleChange = async (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, [field]: true }));

    if (field === "codiceFiscale") {
      // Set the dependent fields dirty immediately so they turn yellow while typing
      setDirtyFields((prev: Record<string, boolean>) => ({
        ...prev,
        dataNascita: true,
        sesso: true,
        eta: true,
        luogoNascita: true,
        provinciaNascita: true,
        codComune: true,
      }));

      if (value.length === 16) {
        const decoded = decodeFiscalCode(value);
        if (decoded) {
          fetchComuneFromCode(decoded.codiceComune).then(comuneData => {
            setFormData((prev: any) => ({
              ...prev,
              dataNascita: decoded.dataNascita,
              sesso: decoded.sesso,
              eta: decoded.eta,
              codComune: decoded.codiceComune,
              luogoNascita: comuneData?.name || "",
              provinciaNascita: comuneData?.province?.code || comuneData?.provinceCode || "",
            }));
          });
        } else {
          setFormData((prev: any) => ({
            ...prev,
            dataNascita: "",
            sesso: "",
            eta: "",
            luogoNascita: "",
            provinciaNascita: "",
            codComune: "",
          }));
        }
      } else {
        setFormData((prev: any) => ({
          ...prev,
          dataNascita: "",
          sesso: "",
          eta: "",
          luogoNascita: "",
          provinciaNascita: "",
          codComune: "",
        }));
      }
    }

    if (field === "cfGen1") {
      // Set the dependent fields dirty immediately so they turn yellow while typing
      setDirtyFields((prev: Record<string, boolean>) => ({
        ...prev,
        dataNascitaGen1: true,
        sessoGen1: true,
        etaGen1: true,
        luogoNascitaGen1: true,
        provinciaNascitaGen1: true,
      }));

      if (value.length === 16) {
        const decoded = decodeFiscalCode(value);
        if (decoded) {
          fetchComuneFromCode(decoded.codiceComune).then(comuneData => {
            setFormData((prev: any) => ({
              ...prev,
              dataNascitaGen1: decoded.dataNascita,
              sessoGen1: decoded.sesso,
              etaGen1: decoded.eta,
              luogoNascitaGen1: comuneData?.name || "",
              provinciaNascitaGen1: comuneData?.province?.code || "",
            }));
          });
        } else {
          setFormData((prev: any) => ({
            ...prev,
            dataNascitaGen1: "",
            sessoGen1: "",
            etaGen1: "",
            luogoNascitaGen1: "",
            provinciaNascitaGen1: "",
          }));
        }
      } else {
        setFormData((prev: any) => ({
          ...prev,
          dataNascitaGen1: "",
          sessoGen1: "",
          etaGen1: "",
          luogoNascitaGen1: "",
          provinciaNascitaGen1: "",
        }));
      }
    }

    if (field === "cfGen2") {
      // Set the dependent fields dirty immediately so they turn yellow while typing
      setDirtyFields((prev: Record<string, boolean>) => ({
        ...prev,
        dataNascitaGen2: true,
        sessoGen2: true,
        etaGen2: true,
        luogoNascitaGen2: true,
        provinciaNascitaGen2: true,
      }));

      if (value.length === 16) {
        const decoded = decodeFiscalCode(value);
        if (decoded) {
          fetchComuneFromCode(decoded.codiceComune).then(comuneData => {
            setFormData((prev: any) => ({
              ...prev,
              dataNascitaGen2: decoded.dataNascita,
              sessoGen2: decoded.sesso,
              etaGen2: decoded.eta,
              luogoNascitaGen2: comuneData?.name || "",
              provinciaNascitaGen2: comuneData?.province?.code || "",
            }));
          });
        } else {
          setFormData((prev: any) => ({
            ...prev,
            dataNascitaGen2: "",
            sessoGen2: "",
            etaGen2: "",
            luogoNascitaGen2: "",
            provinciaNascitaGen2: "",
          }));
        }
      } else {
        setFormData((prev: any) => ({
          ...prev,
          dataNascitaGen2: "",
          sessoGen2: "",
          etaGen2: "",
          luogoNascitaGen2: "",
          provinciaNascitaGen2: "",
        }));
      }
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleReset = () => {
    const hasData = formData.nome.trim() !== "" || formData.cognome.trim() !== "" || formData.codiceFiscale.trim() !== "";
    if (!hasData || window.confirm("Sei sicuro di voler pulire tutti i campi?")) {
      sessionStorage.removeItem("mascheraInputFormData");
      sessionStorage.removeItem("mascheraInputDirtyFields");
      sessionStorage.removeItem("mascheraInputAllegati");
      sessionStorage.removeItem("mascheraInputPayments");
      sessionStorage.removeItem("mascheraInputAttivitaCorso");
      sessionStorage.removeItem("mascheraInputAttivitaCodice");
      sessionStorage.removeItem("mascheraInputAttivitaEnrollmentDetails");
      sessionStorage.removeItem("mascheraInputBottomSections");

      setPayments([]);
      setAttivitaCorso(defaultAttivitaText);
      setAttivitaCodice(defaultAttivitaText);
      setAttivitaEnrollmentDetails(defaultAttivitaArray);
      setBottomSectionsData(defaultBottomSectionsState);

      setFormData((prev: any) => ({
        ...prev,
        stagione: "",
        codiceId: "",
        dataInserimento: "",
        teamInserito: "",
        teamAggiornato: "",
        cognome: "", nome: "", codiceFiscale: "", telefono: "", email: "",
        indirizzo: "", cap: "", citta: "", provincia: "", codComune: "",
        dataNascita: "", luogoNascita: "", provinciaNascita: "", sesso: "", eta: "", allievo: "",
        cognomeGen1: "", nomeGen1: "", cfGen1: "", telGen1: "", emailGen1: "",
        cognomeGen2: "", nomeGen2: "", cfGen2: "", telGen2: "", emailGen2: "",
        indirizzoGen1: "", capGen1: "", cittaGen1: "", provinciaGen1: "", codComuneGen1: "",
        dataNascitaGen1: "", luogoNascitaGen1: "", provinciaNascitaGen1: "", sessoGen1: "", etaGen1: "",
        indirizzoGen2: "", capGen2: "", cittaGen2: "", provinciaGen2: "", codComuneGen2: "",
        dataNascitaGen2: "", luogoNascitaGen2: "", provinciaNascitaGen2: "", sessoGen2: "", etaGen2: "",
        tesserinoTecnico: "", tesseraEnte: "", scadenzaTesseraEnte: "", ente: "",
        tipoPartecipante: "",
        tessera: "", scadenzaTessera: "", daDoveArriva: "",
        teamSegreteria: "",
      }));
      setDirtyFields({});
      setIsSaved(false);
      setAllegati(defaultAllegatiState);
      setPhotoFile({ file: null, preview: null });
      setSearchTerm("");
      setSelectedMemberId(null);
      toast({ title: "Form pulito", description: "Tutti i campi sono stati resettati." });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anagrafica_${formData.cognome || "export"}_${formData.nome || ""}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Esportazione completata", description: "File JSON scaricato." });
  };

  // React Query hooks can now use the functions below

  // Query for duplicate fiscal codes
  const { data: duplicateFiscalCodes } = useQuery<DuplicateFiscalCode[]>({
    queryKey: ["/api/members/duplicates"],
  });

  // Queries for Selectors (replaces simple useEffect fetches)
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: instructors } = useQuery<Instructor[]>({ queryKey: ["/api/instructors"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: studios } = useQuery<Studio[]>({ queryKey: ["/api/studios"] });
  const { data: workshops } = useQuery<any[]>({ queryKey: ["/api/workshops"] });
  const { data: enrollmentDetails } = useQuery<any[]>({ queryKey: ["/api/enrollment-details"] });

  // Extra activities base fetch
  const { data: paidTrials } = useQuery<any[]>({ queryKey: ["/api/paid-trials"] });
  const { data: freeTrials } = useQuery<any[]>({ queryKey: ["/api/free-trials"] });
  const { data: singleLessons } = useQuery<any[]>({ queryKey: ["/api/single-lessons"] });
  const { data: sundayActivities } = useQuery<any[]>({ queryKey: ["/api/sunday-activities"] });
  const { data: trainings } = useQuery<any[]>({ queryKey: ["/api/trainings"] });
  const { data: individualLessons } = useQuery<any[]>({ queryKey: ["/api/individual-lessons"] });
  const { data: campusActivities } = useQuery<any[]>({ queryKey: ["/api/campus-activities"] });
  const { data: recitals } = useQuery<any[]>({ queryKey: ["/api/recitals"] });
  const { data: vacationStudies } = useQuery<any[]>({ queryKey: ["/api/vacation-studies"] });
  const { data: bookingServices } = useQuery<any[]>({ queryKey: ["/api/booking-services"] });

  const SectionBadge = ({ count }: { count: number }) => {
    if (!count || count === 0) return null;
    return (
      <span className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] border border-yellow-200" title={`${count} iscrizioni attive`}>
        {count}
      </span>
    );
  };

  const renderGenericEnrollmentList = (
    enrollments: any[] | undefined,
    baseData: any[] | undefined,
    mutation: any,
    emptyMessage: string,
    listTitle: string,
    entityLabel: string,
    foreignKey: string
  ) => {
    if (!selectedMemberId) {
      return (
        <div className="text-center p-4 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          Seleziona un membro per gestire {entityLabel}
        </div>
      );
    }
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return <p className="text-sm text-muted-foreground italic p-2">{emptyMessage}</p>;
    }
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{listTitle}</Label>
          {enrollments.map((e: any) => {
            const assoc = baseData?.find((item: any) => item.id === e[foreignKey]);
            const hasDetails = Array.isArray(e.details) && e.details.length > 0;
            return (
              <div key={e.id} className="grid grid-cols-[140px_180px_240px_1fr_auto] items-center p-2.5 bg-muted/20 border rounded-md group hover:bg-muted/40 transition-colors gap-3">
                <div className="font-bold text-sm truncate" title={assoc?.name}>{assoc?.name || 'Attività non trovata'}</div>
                <div className="font-medium text-[11px] text-slate-900 truncate" title={assoc?.sku || undefined}>{assoc?.sku}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                  <span>Registrata il: {new Date(e.enrollmentDate || e.createdAt || new Date()).toLocaleDateString('it-IT')}</span>
                </div>
                <div className="flex items-center gap-1 overflow-hidden flex-1">
                  {hasDetails && e.details.map((detStr: string, idx: number) => {
                    const color = enrollmentDetails?.find((d: any) => d.name === detStr)?.color;
                    return <EnrollmentDetailBadge key={idx} name={detStr} color={color} className="h-5 py-0.5 px-2 text-[10px] truncate max-w-[120px]" />;
                  })}
                </div>
                <div className="flex items-center justify-end gap-3 pl-2">
                  <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className={e.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-[10px] h-5' : 'text-[10px] h-5'}>
                    {e.status === 'active' ? 'Attiva' : e.status || '?'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { if (confirm("Rimuovere questa riga?")) mutation.mutate(e.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Member Enrollments Queries
  const { data: memberEnrollments, isLoading: loadingEnrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments?type=corsi", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/enrollments?type=corsi&memberId=${selectedMemberId}`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento iscrizioni");
      }
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: memberWorkshopEnrollments } = useQuery<any[]>({
    queryKey: ["/api/workshop-enrollments", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/workshop-enrollments?memberId=${selectedMemberId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: memberPtEnrollments } = useQuery<any[]>({ queryKey: ["/api/paid-trial-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/paid-trial-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberFtEnrollments } = useQuery<any[]>({ queryKey: ["/api/free-trial-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/free-trial-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberSlEnrollments } = useQuery<any[]>({ queryKey: ["/api/single-lesson-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/single-lesson-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberSaEnrollments } = useQuery<any[]>({ queryKey: ["/api/sunday-activity-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/sunday-activity-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberTrEnrollments } = useQuery<any[]>({ queryKey: ["/api/training-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/training-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberIlEnrollments } = useQuery<any[]>({ queryKey: ["/api/individual-lesson-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/individual-lesson-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberCaEnrollments } = useQuery<any[]>({ queryKey: ["/api/campus-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/campus-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberReEnrollments } = useQuery<any[]>({ queryKey: ["/api/recital-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/recital-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberVsEnrollments } = useQuery<any[]>({ queryKey: ["/api/vacation-study-enrollments", "member", selectedMemberId], queryFn: async () => { const res = await fetch(`/api/vacation-study-enrollments?memberId=${selectedMemberId}`); if (!res.ok) return []; return res.json(); }, enabled: !!selectedMemberId });
  const { data: memberServEnrollments } = useQuery<any[]>({
    queryKey: ["/api/booking-service-enrollments", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/booking-service-enrollments`);
      if (!res.ok) return [];
      const all = await res.json();
      return all.filter((e: any) => e.memberId === selectedMemberId);
    },
    enabled: !!selectedMemberId
  });


  const { data: memberPayments, isLoading: loadingPayments } = useQuery<any[]>({
    queryKey: ["/api/payments", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/payments?memberId=${selectedMemberId}`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento pagamenti");
      }
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  // Enrollment Mutations
  const addEnrollmentMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("POST", "/api/enrollments", {
        memberId: selectedMemberId,
        courseId,
        status: "active"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi", "member", selectedMemberId] });
      toast({ title: "Iscrizione corso aggiunta" });
      setSelectedCourseToAdd("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore iscrizione corso", description: error.message, variant: "destructive" });
    }
  });

  const updateEnrollmentMutation = useMutation({
    mutationFn: async ({ enrollmentId, details }: { enrollmentId: number, details: string[] }) => {
      await apiRequest("PATCH", `/api/enrollments/${enrollmentId}`, { details });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi", "member", selectedMemberId] });
      toast({ title: "Dettagli iscrizione aggiornati" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore aggiornamento dettagli", description: error.message, variant: "destructive" });
    }
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments?type=corsi", "member", selectedMemberId] });
      toast({ title: "Iscrizione corso rimossa" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore rimozione corso", description: error.message, variant: "destructive" });
    }
  });

  const addWorkshopEnrollmentMutation = useMutation({
    mutationFn: async (workshopId: number) => {
      await apiRequest("POST", "/api/workshop-enrollments", { memberId: selectedMemberId, workshopId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments", "member", selectedMemberId] });
      toast({ title: "Iscrizione workshop aggiunta" });
      setSelectedWorkshopToAdd("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore iscrizione workshop", description: error.message, variant: "destructive" });
    }
  });

  const removeWorkshopEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/workshop-enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workshop-enrollments", "member", selectedMemberId] });
      toast({ title: "Iscrizione workshop rimossa" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore rimozione workshop", description: error.message, variant: "destructive" });
    }
  });

  const createRemoveEnrollmentMutation = (endpoint: string, successMsg: string) => useMutation({
    mutationFn: async (enrollmentId: number) => {
      await apiRequest("DELETE", `/api/${endpoint}/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${endpoint}`, "member", selectedMemberId] });
      toast({ title: successMsg });
    },
    onError: (error: Error) => {
      toast({ title: "Errore rimozione iscrizione", description: error.message, variant: "destructive" });
    }
  });

  const removePtEnrollmentMutation = createRemoveEnrollmentMutation("paid-trial-enrollments", "Prova a pagamento rimossa");
  const removeFtEnrollmentMutation = createRemoveEnrollmentMutation("free-trial-enrollments", "Prova gratuita rimossa");
  const removeSlEnrollmentMutation = createRemoveEnrollmentMutation("single-lesson-enrollments", "Lezione singola rimossa");
  const removeSaEnrollmentMutation = createRemoveEnrollmentMutation("sunday-activity-enrollments", "Domenica in movimento rimossa");
  const removeTrEnrollmentMutation = createRemoveEnrollmentMutation("training-enrollments", "Allenamento rimosso");
  const removeIlEnrollmentMutation = createRemoveEnrollmentMutation("individual-lesson-enrollments", "Lezione individuale rimossa");
  const removeCaEnrollmentMutation = createRemoveEnrollmentMutation("campus-enrollments", "Campus rimosso");
  const removeReEnrollmentMutation = createRemoveEnrollmentMutation("recital-enrollments", "Saggio rimosso");
  const removeVsEnrollmentMutation = createRemoveEnrollmentMutation("vacation-study-enrollments", "Vacanza studio rimossa");
  const removeServEnrollmentMutation = createRemoveEnrollmentMutation("booking-service-enrollments", "Servizio Extra rimosso");
  const dummyMutation = { mutate: () => toast({ title: "Funzione non attiva", description: "Utilizzare la sezione dedicata per il merchandising." }) };


  // Intercept memberId from URL and auto-load Profile
  useEffect(() => {
    if (memberIdFromUrl) {
      const id = parseInt(memberIdFromUrl);
      if (!isNaN(id)) {
        fetch(`/api/members/${id}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Membro non trovato');
          })
          .then(member => {
            handleSelectMember(member);
          })
          .catch(err => console.error("Errore auto-loading membro da URL", err));
      }
    }
  }, [memberIdFromUrl]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        fetch(`/api/members?page=1&pageSize=10&search=${encodeURIComponent(searchTerm)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data.members || []);
            setShowResults(true);
          })
          .catch(err => console.error(err))
          .finally(() => setIsSearching(false));
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectMember = (member: any) => {
    // Calculate age
    let eta = "";
    if (member.dateOfBirth) {
      const birthDate = new Date(member.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      eta = age.toString();
    }

    setFormData((prev: any) => ({
      ...prev,
      // Anagrafica
      nome: member.firstName || "",
      cognome: member.lastName || "",
      codiceFiscale: member.fiscalCode || "",
      telefono: member.mobile || member.phone || "",
      email: member.email || "",
      indirizzo: member.streetAddress || "",
      cap: member.postalCode || "",
      citta: member.city || "",
      provincia: member.province || "",
      dataNascita: member.dateOfBirth || "",
      luogoNascita: member.placeOfBirth || "",
      provinciaNascita: member.birthProvince || "",
      sesso: member.gender || "",
      eta: eta,
      allievo: member.categoryId ? member.categoryId.toString() : "",

      // Genitori
      nomeGen1: member.motherFirstName || "",
      cognomeGen1: member.motherLastName || "",
      cfGen1: member.motherFiscalCode || "",
      telGen1: member.motherPhone || "",
      emailGen1: member.motherEmail || "",

      nomeGen2: member.fatherFirstName || "",
      cognomeGen2: member.fatherLastName || "",
      cfGen2: member.fatherFiscalCode || "",
      telGen2: member.fatherPhone || "",
      emailGen2: member.fatherEmail || "",

      // Intestazione defaults
      stagione: member.season || "2025-2026",
      codiceId: member.internalId || "2526-000001",
      dataInserimento: member.insertionDate || new Date().toLocaleDateString("it-IT"),
      teamInserito: member.createdAt ? `${member.createdBy || 'Sistema'}, ${formatAuditDate(member.createdAt)}` : "",
      teamAggiornato: member.updatedAt ? `${member.updatedBy || 'Sistema'}, ${formatAuditDate(member.updatedAt)}` : "",
      daDoveArriva: member.fromWhere || "",
      tipoPartecipante: member.participantType || "tesserato", // Updated to map participantType
      tessera: member.cardNumber || "",
      scadenzaTessera: member.cardExpiryDate || "",
    }));

    // Populate simple allegati flags (complex logic omitted for brevity, just basic mapping)
    setAllegati(prev => ({
      ...prev,
      modelloDetrazione: { ...prev.modelloDetrazione, richiesto: member.detractionModelRequested ? "si" : "no", anno: member.detractionModelYear || "2026" },
      creditiScolastici: { ...prev.creditiScolastici, richiesto: member.schoolCreditsRequested ? "si" : "no", annoScolastico: member.schoolCreditsYear || "2025/2026" },
      tesserinoTecnico: { ...prev.tesserinoTecnico, numero: member.tesserinoTecnicoNumber || "" },
    }));

    // Set selected member ID for queries
    setSelectedMemberId(member.id);

    // Update photo
    if (member.photoUrl) {
      setPhotoFile({ file: null, preview: member.photoUrl });
    } else {
      setPhotoFile({ file: null, preview: null });
    }

    setShowResults(false);
    setSearchTerm(`${member.firstName} ${member.lastName} `);
    setDirtyFields({});
    sessionStorage.removeItem("mascheraInputDirtyFields");
    setIsSaved(true);
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/maschera-generale/save", payload);
      return res;
    },
    onSuccess: async (data: any) => {
      const responseData = data.member ? data : (typeof data.json === 'function' ? await data.json() : data);

      if (responseData && responseData.member) {
        const m = responseData.member;
        setFormData((prev: any) => ({
          ...prev,
          teamInserito: m.createdAt ? `${m.createdBy || 'Sistema'}, ${formatAuditDate(m.createdAt)}` : prev.teamInserito,
          teamAggiornato: m.updatedAt ? `${m.updatedBy || 'Sistema'}, ${formatAuditDate(m.updatedAt)}` : prev.teamAggiornato,
        }));
      }

      toast({
        title: "Salvataggio completato",
        description: `Dati salvati con successo per ${formData.nome} ${formData.cognome} `,
      });
      setDirtyFields({});
      sessionStorage.removeItem("mascheraInputDirtyFields");
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore nel salvataggio",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = async () => {
    // Collect all data
    const memberData = {
      id: selectedMemberId || undefined,
      firstName: formData.nome,
      lastName: formData.cognome,
      fiscalCode: formData.codiceFiscale,
      email: formData.email,
      mobile: formData.telefono,
      streetAddress: formData.indirizzo,
      city: formData.citta,
      province: formData.provincia,
      postalCode: formData.cap,
      dateOfBirth: formData.dataNascita,
      placeOfBirth: formData.luogoNascita,
      birthProvince: formData.provinciaNascita,
      gender: formData.sesso,
      isMinor: parseInt(formData.eta) < 18,
      categoryId: parseInt(formData.allievo) || undefined,

      // Genitori
      motherFirstName: formData.nomeGen1 || null,
      motherLastName: formData.cognomeGen1 || null,
      motherFiscalCode: formData.cfGen1 || null,
      motherEmail: formData.emailGen1 || null,
      motherPhone: formData.telGen1 || null,

      fatherFirstName: formData.nomeGen2 || null,
      fatherLastName: formData.cognomeGen2 || null,
      fatherFiscalCode: formData.cfGen2 || null,
      fatherEmail: formData.emailGen2 || null,
      fatherPhone: formData.telGen2 || null,

      // Allegati Flags (from allegati state)
      detractionModelRequested: allegati.modelloDetrazione.richiesto === "si",
      detractionModelYear: allegati.modelloDetrazione.anno,
      schoolCreditsRequested: allegati.creditiScolastici.richiesto === "si",
      schoolCreditsYear: allegati.creditiScolastici.annoScolastico,
      tesserinoTecnicoNumber: allegati.tesserinoTecnico.numero,

      active: true,
      photoUrl: photoFile.preview || null,
    };

    // Collect Enrollments from Attività sections
    const enrollments: any[] = [];
    Object.entries(attivitaCorso).forEach(([key, courseId]) => {
      if (courseId) {
        enrollments.push({
          courseId: parseInt(courseId),
          status: "active",
          seasonId: 1, // Default or selected season
          tempId: key, // For matching with payments
          details: attivitaEnrollmentDetails[key as AttivitaKey] || []
        });
      }
    });

    // Collect Payments (from list)
    const paymentsPayload: any[] = payments.map(p => {
      const isPending = (p.saldoTotale || 0) > 0;

      return {
        courseId: parseInt(p.dettaglioId),
        // L'importo da mostrare a database come "Valore transazione"
        amount: p.totaleQuota?.toString() || "0.00",
        type: p.attivita,
        status: isPending ? "pending" : "paid",
        tempId: p.attivita, // keeping this for matching with enrollment logic in backend if needed
        // Adding extra fields for backend to potentially use or ignore
        details: p
      };
    });

    saveMutation.mutate({ memberData, enrollments, payments: paymentsPayload });
  };

  const isFormValid = !!(
    formData.cognome.trim() &&
    formData.nome.trim()
  );

  // Stato campi Corso e Codice per ogni sotto-sezione Attività
  const [attivitaCorso, setAttivitaCorso] = useState<Record<AttivitaKey, string>>(() => {
    const saved = sessionStorage.getItem("mascheraInputAttivitaCorso");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse saved attivitaCorso", e); }
    }
    return defaultAttivitaText;
  });

  const [attivitaCodice, setAttivitaCodice] = useState<Record<AttivitaKey, string>>(() => {
    const saved = sessionStorage.getItem("mascheraInputAttivitaCodice");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse saved attivitaCodice", e); }
    }
    return defaultAttivitaText;
  });

  const [attivitaEnrollmentDetails, setAttivitaEnrollmentDetails] = useState<Record<AttivitaKey, string[]>>(() => {
    const saved = sessionStorage.getItem("mascheraInputAttivitaEnrollmentDetails");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse saved attivitaEnrollmentDetails", e); }
    }
    return defaultAttivitaArray;
  });

  useEffect(() => {
    sessionStorage.setItem("mascheraInputAttivitaCorso", JSON.stringify(attivitaCorso));
  }, [attivitaCorso]);

  useEffect(() => {
    sessionStorage.setItem("mascheraInputAttivitaCodice", JSON.stringify(attivitaCodice));
  }, [attivitaCodice]);

  useEffect(() => {
    sessionStorage.setItem("mascheraInputAttivitaEnrollmentDetails", JSON.stringify(attivitaEnrollmentDetails));
  }, [attivitaEnrollmentDetails]);


  const handleSavePayment = (payment: PaymentData) => {
    let updatedPayments = [...payments];
    if (editingPaymentId) {
      updatedPayments = updatedPayments.map(p => p.id === editingPaymentId ? { ...payment, id: editingPaymentId } : p);
    } else {
      updatedPayments.push({ ...payment, id: Date.now().toString() });
    }
    setPayments(updatedPayments);
    setDirtyFields(prev => ({ ...prev, payments: true }));

    // Auto-fill Attività section
    if (payment.attivita && payment.dettaglioId) {
      const corso = corsiDB.find(c => String(c.id) === payment.dettaglioId);
      if (corso) {
        // This assumes payment.attivita is a valid key. If not, it won't update.
        // We cast to string for index access, but should be careful.
        if (Object.keys(attivitaCorso).includes(payment.attivita)) {
          const key = payment.attivita as AttivitaKey;
          setAttivitaCorso(prev => ({ ...prev, [key]: String(corso.id) }));
          setAttivitaCodice(prev => ({ ...prev, [key]: corso.sku }));
        }
      }
    }
    setEditingPaymentId(null);
  };

  const handleDeletePayment = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo pagamento?")) {
      setPayments(payments.filter(p => p.id !== id));
    }
  };

  const handleCopyReceipt = (payment: any) => {
    // Determine source
    const details = payment.details || payment;
    const isPending = (details.saldoTotale || 0) > 0 || payment.status === "pending";
    const quotaOriginale = details.totaleQuota || payment.amount || 0;

    let text = `Riepilogo Pagamento StarGem\n`;
    text += `---------------------------------\n`;
    text += `Dettaglio: ${details.dettaglioNome || payment.quotaDescription || payment.type || "-"}\n`;
    text += `Quota Piena: € ${quotaOriginale}\n`;
    if (details.valoreSconto) text += `Sconto 1: -€ ${details.valoreSconto}\n`;
    if (details.valorePromo) text += `Sconto 2: -€ ${details.valorePromo}\n`;
    if (details.quotaTesseraCheck) text += `Quota Tessera: +€ 25\n`;
    if (details.lezioneProvaCheck) text += `Trattenuta Lezione Prova: -€ 20\n`;

    if (details.integrazioneAttiva && details.differenzaVersoNuovaQuota !== undefined) {
      text += `\n* Integrazione Applicata (entro 120gg) *\n`;
      text += `Ricalcolo Differenza da Versare: € ${details.differenzaVersoNuovaQuota}\n`;
    }

    const daPagare = details.integrazioneAttiva ? details.differenzaVersoNuovaQuota : (quotaOriginale - (details.valoreSconto || 0) - (details.valorePromo || 0) + (details.quotaTesseraCheck ? 25 : 0) - (details.lezioneProvaCheck ? 20 : 0));

    text += `---------------------------------\n`;
    text += `TOTALE SCATURITO (DA PAGARE): € ${daPagare}\n`;
    text += `IMPORTO VERSATO OGGI (Acconto): € ${details.acconto || quotaOriginale}\n`;

    if (isPending) {
      text += `\nESTRATTO CONTO: IN SOSPESO\n`;
      text += `SALDO ANCORA DA VERSARE: € ${details.saldoTotale || details.debtAmount || "Da calcolare"}\n`;
    } else {
      text += `\nESTRATTO CONTO: SALDATO CON SUCCESSO\n`;
      text += `SALDO PER QUESTA VOCE: € 0\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Testo Ricevuta copiato in memoria!", description: "Ora puoi incollarlo su WhatsApp o nelle Email (CRTL+V)." });
    }).catch((err) => {
      console.error("Failed to copy text: ", err);
      toast({ title: "Errore di Copia", description: "Impossibile copiare il testo", variant: "destructive" });
    });
  };

  useEffect(() => {
    if (courses) {
      setCorsiDB(courses.map(c => ({ id: c.id, name: c.name, sku: c.sku || "" })));
    }
  }, [courses]);

  useEffect(() => {
    if (categories) {
      setCategorieDB(categories.map(c => ({ id: c.id, name: c.name })));
    }
  }, [categories]);

  useEffect(() => {
    // Legacy fetches replaced by useQuery, except for specific categories not covered by main queries
    // Keeping simple categories fetching if needed for other parts of the form
    fetch("/api/workshop-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setWorkshopCategorieDB(data))
      .catch(() => setWorkshopCategorieDB([]));
    fetch("/api/sunday-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setDomenicheCategorieDB(data))
      .catch(() => setDomenicheCategorieDB([]));
    fetch("/api/training-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setAllenamentiCategorieDB(data))
      .catch(() => setAllenamentiCategorieDB([]));
    fetch("/api/individual-lesson-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setLezioniIndCategorieDB(data))
      .catch(() => setLezioniIndCategorieDB([]));
    fetch("/api/campus-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setCampusCategorieDB(data))
      .catch(() => setCampusCategorieDB([]));
    fetch("/api/recital-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setSaggiCategorieDB(data))
      .catch(() => setSaggiCategorieDB([]));
    fetch("/api/vacation-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setVacanzeCategorieDB(data))
      .catch(() => setVacanzeCategorieDB([]));
    fetch("/api/client-categories")
      .then(res => res.ok ? res.json() : [])
      .then(data => setPartecipanteCategorieDB(data))
      .catch(() => setPartecipanteCategorieDB([]));
  }, []);

  // Duplicate functions have been moved up

  const handleImport = () => {
    // Basic placeholder for import
    toast({ title: "Importazione", description: "Funzionalità di importazione da file non ancora implementata.", variant: "default" });
  };

  const handleGSheets = () => {
    toast({ title: "Google Sheets", description: "Integrazione Google Sheets non configurata.", variant: "default" });
  };

  const totalActivitiesCount =
    (memberEnrollments?.length || 0) +
    (memberPtEnrollments?.length || 0) +
    (memberFtEnrollments?.length || 0) +
    (memberSlEnrollments?.length || 0) +
    (memberSaEnrollments?.length || 0) +
    (memberTrEnrollments?.length || 0) +
    (memberIlEnrollments?.length || 0) +
    (memberCaEnrollments?.length || 0) +
    (memberReEnrollments?.length || 0) +
    (memberVsEnrollments?.length || 0) +
    (memberServEnrollments?.length || 0) +
    (memberWorkshopEnrollments?.length || 0);

  return (
    <div className="flex flex-col h-full" data-testid="page-maschera-input-generale">
      {/* Header fisso con navigazione */}
      <div className="border-b bg-muted/30 sticky top-0 z-10">
        <div className="p-4 space-y-4">
          {/* Riga titolo e pulsanti azioni */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Maschera Input</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Inserimento e interrogazione dati</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-gsheets" onClick={handleGSheets}>
                <FileSpreadsheet className="w-3 h-3 mr-1 sidebar-icon-gold" />
                GSheets
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-pulisci" onClick={handleReset}>
                <RotateCcw className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Pulisci
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-esporta" onClick={handleExport}>
                <Upload className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Esporta
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-importa" onClick={handleImport}>
                <Download className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Importa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs h-8 ${Object.keys(dirtyFields).length > 0 && isFormValid ? 'gold-3d-button' : 'bg-background'} `}
                data-testid="button-salva"
                disabled={(!isFormValid || saveMutation.isPending) && Object.keys(dirtyFields).length === 0}
                title={!isFormValid ? "Compila tutti i campi obbligatori (*) per salvare" : Object.keys(dirtyFields).length === 0 ? "Nessuna modifica da salvare" : ""}
                onClick={handleSave}
              >
                <Save className={`w-3 h-3 mr-1 sidebar-icon-gold ${saveMutation.isPending ? 'animate-spin' : ''} `} />
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
              </Button>
              {duplicateFiscalCodes && duplicateFiscalCodes.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 bg-black hover:bg-black/80 text-white"
                  onClick={() => setShowDuplicatesModal(true)}
                  data-testid="button-duplicate-warning"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Duplicati ({duplicateFiscalCodes.length})
                </Button>
              )}
              <Button size="sm" className="gold-3d-button h-8" data-testid="button-nuovo" onClick={handleReset}>
                <Plus className="w-4 h-4 mr-1" />
                Nuovo
              </Button>
            </div>
          </div>

          {/* Barra di ricerca */}
          <div className="relative max-w-md z-50">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca partecipante..."
              className="pl-10 bg-background"
              data-testid="input-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowResults(true); }}
            />
            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((member) => (
                    <div
                      key={member.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSelectMember(member)}
                    >
                      <div className="font-bold">{member.firstName} {member.lastName}</div>
                      <div className="text-xs text-muted-foreground">{member.fiscalCode} - {member.email}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">Nessun risultato trovato</div>
                )}
              </div>
            )}
          </div>

          {/* Tab di navigazione */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: "intestazione", label: "Intestazione", icon: FileText },
              { id: "anagrafica", label: "Anagrafica", icon: Users },
              { id: "pagamenti", label: "Pagamenti", icon: CreditCard },
              { id: "gift", label: "Gift/Buono", icon: Gift },
              { id: "tessere", label: "Tessere", icon: IdCard },
              { id: "certificato", label: "Certificato Medico", icon: Stethoscope },
              { id: "attivita", label: "Attività", icon: Activity },
            ].map((item: any) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="text-xs h-8 bg-background relative"
                data-testid={`nav - ${item.id} `}
              >
                <item.icon className="w-3 h-3 mr-1 sidebar-icon-gold" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">

        {/* INTESTAZIONE */}
        <Card id="intestazione" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 sidebar-icon-gold" />
              Intestazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ROW 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Stagione</Label>
                <Select value={formData.stagione} onValueChange={(v) => handleChange("stagione", v)}>
                  <SelectTrigger className={getInputClassName("stagione", false)}>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Codice ID (C)</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Auto</Badge>
                  <Input
                    value={formData.codiceId}
                    readOnly
                    disabled
                    className={`${getInputClassName("codiceId", false)} font-mono opacity-100 cursor-not-allowed`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Team - inserito</Label>
                <Input
                  value={formData.teamInserito}
                  readOnly
                  className={`${getInputClassName("teamInserito", false)} bg-transparent opacity-80 cursor-default`}
                />
              </div>
              <div className="space-y-2">
                <Label>Team - aggiornato</Label>
                <Input
                  value={formData.teamAggiornato}
                  readOnly
                  className={`${getInputClassName("teamAggiornato", false)} bg-transparent opacity-80 cursor-default`}
                />
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Data Inserimento</Label>
                <Input value={formData.dataInserimento} readOnly className={getInputClassName("dataInserimento", false)} />
              </div>
              <div className="space-y-2">
                <Label>Da Dove Arriva</Label>
                <Select value={formData.daDoveArriva} onValueChange={(v) => handleChange("daDoveArriva", v)}>
                  <SelectTrigger className={getInputClassName("daDoveArriva", false)}>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="passaparola">Passaparola</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo Partecipante</Label>
                <Select value={formData.tipoPartecipante} onValueChange={(v) => handleChange("tipoPartecipante", v)}>
                  <SelectTrigger className={getInputClassName("tipoPartecipante", false)}>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tesserato">Tesserato</SelectItem>
                    <SelectItem value="non_tesserato">Non Tesserato</SelectItem>
                    <SelectItem value="prova">Prova</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ente</Label>
                <Select value={formData.ente} onValueChange={(v) => handleChange("ente", v)}>
                  <SelectTrigger className={getInputClassName("ente", false)}>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acsi">ACSI</SelectItem>
                    <SelectItem value="csen">CSEN</SelectItem>
                    <SelectItem value="uisp">UISP</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ROW 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tessera</Label>
                <Input
                  value={formData.tessera}
                  onChange={(e) => handleChange("tessera", e.target.value)}
                  className={getInputClassName("tessera", false)}
                />
              </div>
              <div className="space-y-2">
                <Label>Scadenza Tessera</Label>
                <Input type="date" value={formData.scadenzaTessera} onChange={(e) => handleChange("scadenzaTessera", e.target.value)} className={getInputClassName("scadenzaTessera", false)} />
              </div>
              <div className="space-y-2">
                <Label>Tessera Ente</Label>
                <Input value={formData.tesseraEnte} onChange={(e) => handleChange("tesseraEnte", e.target.value)} className={getInputClassName("tesseraEnte", false)} />
              </div>
              <div className="space-y-2">
                <Label>Scadenza Tessera Ente</Label>
                <Input type="date" value={formData.scadenzaTesseraEnte} onChange={(e) => handleChange("scadenzaTesseraEnte", e.target.value)} className={getInputClassName("scadenzaTesseraEnte", false)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ANAGRAFICA con ALLEGATI */}
        <div id="anagrafica" className="scroll-mt-32 flex flex-col lg:flex-row gap-4">
          {/* FOTO + ALLEGATI DA INSERIRE - Colonna sinistra */}
          <div className="lg:w-40 shrink-0 space-y-4">
            {/* FOTO PARTECIPANTE */}
            <Card>
              <CardHeader className="pb-2 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
                  <Camera className="w-4 h-4" />
                  FOTO
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.heic,.heif,.webp,.avif,.tiff,.tif"
                  className="hidden"
                  id="upload-photo"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
                  data-testid="input-upload-photo"
                />
                {photoFile.preview ? (
                  <div className="relative">
                    <img
                      src={photoFile.preview}
                      alt="Foto partecipante"
                      className="w-full aspect-[3/4] object-cover rounded-md border border-input"
                      data-testid="img-photo-preview"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-1 right-1 bg-background/80 text-destructive"
                      onClick={removePhoto}
                      data-testid="button-remove-photo"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate text-center" data-testid="text-photo-filename">{photoFile.file?.name}</p>
                  </div>
                ) : (
                  <label
                    htmlFor="upload-photo"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-md aspect-[3/4] transition-colors hover:bg-muted/50"
                    data-testid="label-upload-photo"
                  >
                    <Camera className="w-10 h-10 text-amber-400" />
                    <span className="text-xs text-muted-foreground text-center px-2">Carica foto<br />JPG, PNG, HEIC, WebP</span>
                  </label>
                )}
              </CardContent>
            </Card>

            {/* ALLEGATI DA INSERIRE */}
            <Card>
              <CardHeader className="pb-2 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
                  <Paperclip className="w-4 h-4" />
                  ALLEGATI DA INSERIRE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* REGOLAMENTO */}
                <div className="border-b">
                  <div
                    className={`p - 3 cursor - pointer transition - colors ${allegati.regolamento.hasFile ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-muted/50'} `}
                    onClick={() => toggleAllegatoSection('regolamento')}
                    data-testid="button-toggle-regolamento"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text - sm font - medium ${allegati.regolamento.hasFile ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'} `}>REGOLAMENTO</span>
                      {allegati.regolamento.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.regolamento.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span className="truncate">{allegati.regolamento.fileName || 'File caricato'}</span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.regolamento && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border - 2 border - dashed rounded - md p - 3 text - center ${allegati.regolamento.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-700'} `}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-regolamento"
                          onChange={(e) => handleFileUpload('regolamento', e.target.files?.[0] || null)}
                          data-testid="input-upload-regolamento"
                        />
                        {allegati.regolamento.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="truncate">{allegati.regolamento.fileName || 'File caricato'}</span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeAllegatoFile('regolamento'); }}
                              data-testid="button-remove-regolamento"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="upload-regolamento" className="cursor-pointer flex flex-col items-center gap-1" data-testid="label-upload-regolamento">
                            <FileUp className="w-6 h-6 text-amber-500" />
                            <span className="text-xs text-muted-foreground">Carica PDF, JPG o PNG</span>
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Inserimento</Label>
                          <Input
                            type="date"
                            className="h-7 text-xs"
                            value={allegati.regolamento.data || ''}
                            onChange={(e) => updateAllegato('regolamento', 'data', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Accettato</Label>
                          <Select
                            value={allegati.regolamento.accettato || ''}
                            onValueChange={(v) => updateAllegato('regolamento', 'accettato', v)}
                          >
                            <SelectTrigger className={`h - 7 text - xs ${allegati.regolamento.accettato === 'si' ? 'bg-green-100 border-green-400 text-green-800' : allegati.regolamento.accettato === 'no' ? 'bg-orange-100 border-orange-400 text-orange-800' : ''} `}>
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Si</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PRIVACY */}
                <div className="border-b">
                  <div
                    className={`p - 3 cursor - pointer transition - colors ${allegati.privacy.hasFile ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-muted/50'} `}
                    onClick={() => toggleAllegatoSection('privacy')}
                    data-testid="button-toggle-privacy"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text - sm font - medium ${allegati.privacy.hasFile ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'} `}>PRIVACY</span>
                      {allegati.privacy.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.privacy.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span className="truncate">{allegati.privacy.fileName || 'File caricato'}</span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.privacy && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border - 2 border - dashed rounded - md p - 3 text - center ${allegati.privacy.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-700'} `}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-privacy"
                          onChange={(e) => handleFileUpload('privacy', e.target.files?.[0] || null)}
                          data-testid="input-upload-privacy"
                        />
                        {allegati.privacy.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span className="truncate">{allegati.privacy.fileName || 'File caricato'}</span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeAllegatoFile('privacy'); }}
                              data-testid="button-remove-privacy"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="upload-privacy" className="cursor-pointer flex flex-col items-center gap-1" data-testid="label-upload-privacy">
                            <FileUp className="w-6 h-6 text-amber-500" />
                            <span className="text-xs text-muted-foreground">Carica PDF, JPG o PNG</span>
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Inserimento</Label>
                          <Input
                            type="date"
                            className="h-7 text-xs"
                            value={allegati.privacy.data || ''}
                            onChange={(e) => updateAllegato('privacy', 'data', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Accettata</Label>
                          <Select
                            value={allegati.privacy.accettata || ''}
                            onValueChange={(v) => updateAllegato('privacy', 'accettata', v)}
                          >
                            <SelectTrigger className={`h - 7 text - xs ${allegati.privacy.accettata === 'si' ? 'bg-green-100 border-green-400 text-green-800' : allegati.privacy.accettata === 'no' ? 'bg-orange-100 border-orange-400 text-orange-800' : ''} `}>
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Si</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CERTIFICATO MEDICO */}
                <div className="border-b">
                  <div
                    className={`p - 3 cursor - pointer transition - colors ${allegati.certificatoMedico.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'} `}
                    onClick={() => toggleAllegatoSection('certificatoMedico')}
                    data-testid="button-toggle-certificato-medico"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">CERTIFICATO MEDICO</span>
                      {allegati.certificatoMedico.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.certificatoMedico && (
                    <div className="p-3 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Rilascio</Label>
                          <Input
                            type="date"
                            className="h-7 text-xs"
                            value={allegati.certificatoMedico.dataRilascio || ''}
                            onChange={(e) => updateAllegato('certificatoMedico', 'dataRilascio', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Scadenza</Label>
                          <Input
                            type="date"
                            className="h-7 text-xs"
                            value={allegati.certificatoMedico.scadenza || ''}
                            onChange={(e) => updateAllegato('certificatoMedico', 'scadenza', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                          value={allegati.certificatoMedico.tipo || ''}
                          onValueChange={(v) => updateAllegato('certificatoMedico', 'tipo', v)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="non_agonistico">Non Agonistico</SelectItem>
                            <SelectItem value="agonistico">Agonistico</SelectItem>
                            <SelectItem value="base">Base</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* RICEVUTE PAGAMENTI */}
                <div className="border-b">
                  <div
                    className={`p - 3 cursor - pointer transition - colors ${allegati.ricevutePagamenti.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'} `}
                    onClick={() => toggleAllegatoSection('ricevutePagamenti')}
                    data-testid="button-toggle-ricevute-pagamenti"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">RICEVUTE PAGAMENTI</span>
                      {allegati.ricevutePagamenti.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.ricevutePagamenti && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">N° Ricevute</Label>
                          <Input
                            type="number"
                            className="h-7 text-xs"
                            value={allegati.ricevutePagamenti.numeroRicevute || 0}
                            onChange={(e) => updateAllegato('ricevutePagamenti', 'numeroRicevute', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Note</Label>
                          <Input
                            className="h-7 text-xs"
                            value={allegati.ricevutePagamenti.note || ''}
                            onChange={(e) => updateAllegato('ricevutePagamenti', 'note', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* MODELLO DETRAZIONE */}
                <div className="border-b">
                  <div
                    className={`p - 3 cursor - pointer transition - colors ${allegati.modelloDetrazione.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'} `}
                    onClick={() => toggleAllegatoSection('modelloDetrazione')}
                    data-testid="button-toggle-modello-detrazione"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">MODELLO DETRAZIONE</span>
                      {allegati.modelloDetrazione.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.modelloDetrazione && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Anno</Label>
                          <Input
                            className="h-7 text-xs"
                            value={allegati.modelloDetrazione.anno || ''}
                            onChange={(e) => updateAllegato('modelloDetrazione', 'anno', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Richiesto</Label>
                          <Select
                            value={allegati.modelloDetrazione.richiesto || ''}
                            onValueChange={(v) => updateAllegato('modelloDetrazione', 'richiesto', v)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Sì</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CREDITI SCOLASTICI */}
                <div className="border-b">
                  <div
                    className={`p - 3 cursor - pointer transition - colors ${allegati.creditiScolastici.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'} `}
                    onClick={() => toggleAllegatoSection('creditiScolastici')}
                    data-testid="button-toggle-crediti-scolastici"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">CREDITI SCOLASTICI</span>
                      {allegati.creditiScolastici.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.creditiScolastici && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Anno Scolastico</Label>
                          <Input
                            className="h-7 text-xs"
                            value={allegati.creditiScolastici.annoScolastico || ''}
                            onChange={(e) => updateAllegato('creditiScolastici', 'annoScolastico', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Richiesto</Label>
                          <Select
                            value={allegati.creditiScolastici.richiesto || ''}
                            onValueChange={(v) => updateAllegato('creditiScolastici', 'richiesto', v)}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Seleziona" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="si">Sì</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TESSERINO TECNICO */}
                <div className="border-b">
                  <div
                    className={`p - 3 cursor - pointer transition - colors ${allegati.tesserinoTecnico.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'} `}
                    onClick={() => toggleAllegatoSection('tesserinoTecnico')}
                    data-testid="button-toggle-tesserino-tecnico"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">TESSERINO TECNICO</span>
                      {allegati.tesserinoTecnico.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.tesserinoTecnico && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Numero</Label>
                          <Input
                            className="h-7 text-xs"
                            placeholder="N° Tesserino"
                            value={allegati.tesserinoTecnico.numero || ''}
                            onChange={(e) => updateAllegato('tesserinoTecnico', 'numero', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data Rilascio</Label>
                          <Input
                            type="date"
                            className="h-7 text-xs"
                            value={allegati.tesserinoTecnico.dataRilascio || ''}
                            onChange={(e) => updateAllegato('tesserinoTecnico', 'dataRilascio', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TESSERA ENTE */}
                <div>
                  <div
                    className={`p - 3 cursor - pointer transition - colors ${allegati.tesseraEnte.hasFile ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-muted/50'} `}
                    onClick={() => toggleAllegatoSection('tesseraEnte')}
                    data-testid="button-toggle-tessera-ente"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">TESSERA ENTE</span>
                      {allegati.tesseraEnte.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {openAllegatoSections.tesseraEnte && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Numero</Label>
                          <Input
                            className="h-7 text-xs"
                            placeholder="N° Tessera"
                            value={allegati.tesseraEnte.numero || ''}
                            onChange={(e) => updateAllegato('tesseraEnte', 'numero', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Ente</Label>
                          <Input
                            className="h-7 text-xs"
                            placeholder="Ente"
                            value={allegati.tesseraEnte.ente || ''}
                            onChange={(e) => updateAllegato('tesseraEnte', 'ente', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ANAGRAFICA - Colonna destra */}
          <Card className="flex-1">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 sidebar-icon-gold" />
                  Anagrafica
                </div>
                <span className="text-sm font-medium px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full border border-amber-200 dark:border-amber-800/60">Dati Personali</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dati Personali */}
              <div>
                {/* L'heading "Dati Personali" è stato spostato nel CardTitle per risparmiare spazio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Cognome *</Label>
                    <Input value={formData.cognome} onChange={(e) => handleChange("cognome", e.target.value)} className={getInputClassName("cognome", true)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} className={getInputClassName("nome", true)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Codice Fiscale (J) *
                      <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-red-700 transition-colors" data-testid="link-generatore-cf">
                        <AlertTriangle className="w-4 h-4 cursor-pointer" />
                      </a>
                    </Label>
                    <Input
                      value={formData.codiceFiscale}
                      onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())}
                      className={getInputClassName("codiceFiscale", true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Telefono *</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.telefono ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.telefono ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                      </span>
                      {!verificaStato.telefono && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-5 px-2 text-xs ml-1"
                          onClick={() => avviaVerifica('telefono', 'telefono')}
                        >
                          Verifica
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.telefono}
                      onChange={(e) => handleChange("telefono", e.target.value)}
                      className={`${getInputClassName("telefono", true)} ${verificaStato.telefono ? "bg-green-50 border-green-300" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Email *</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.email ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.email ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                      </span>
                      {!verificaStato.email && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-5 px-2 text-xs ml-1"
                          onClick={() => avviaVerifica('email', 'email')}
                        >
                          Verifica
                        </Button>
                      )}
                    </div>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`${getInputClassName("email", true)} ${verificaStato.email ? "bg-green-50 border-green-300" : ""}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Indirizzo residenza *</Label>
                    <Input placeholder="Via/Piazza, n. civico" value={formData.indirizzo} onChange={(e) => handleChange("indirizzo", e.target.value)} data-testid="input-indirizzo" className={getInputClassName("indirizzo", true)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CAP *</Label>
                    <Input value={formData.cap} onChange={(e) => handleChange("cap", e.target.value)} data-testid="input-cap" className={getInputClassName("cap", true)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Città *</Label>
                    <Input value={formData.citta} onChange={(e) => handleChange("citta", e.target.value)} data-testid="input-citta" className={getInputClassName("citta", true)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input value={formData.provincia} onChange={(e) => handleChange("provincia", e.target.value)} data-testid="input-provincia" className={getInputClassName("provincia", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cod. Comune</Label>
                    <Input value={formData.codComune} onChange={(e) => handleChange("codComune", e.target.value)} data-testid="input-cod-comune" className={getInputClassName("codComune", false)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Data di Nascita *</Label>
                    <Input
                      value={formData.dataNascita ? new Date(formData.dataNascita).toLocaleDateString('it-IT') : ''}
                      readOnly
                      className={getInputClassName("dataNascita", true, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Luogo di Nascita *</Label>
                    <Input
                      value={formData.luogoNascita}
                      readOnly
                      className={getInputClassName("luogoNascita", true, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prov. Nascita *</Label>
                    <Input
                      value={formData.provinciaNascita}
                      readOnly
                      className={getInputClassName("provinciaNascita", true, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sesso *</Label>
                    <Input
                      value={formData.sesso === 'M' ? 'Maschio' : formData.sesso === 'F' ? 'Femmina' : ''}
                      readOnly
                      className={getInputClassName("sesso", true, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Età *</Label>
                    <Input
                      value={formData.eta}
                      readOnly
                      className={getInputClassName("eta", true, true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Partecipante *</Label>
                    <Select value={formData.allievo} onValueChange={(v) => handleChange("allievo", v)}>
                      <SelectTrigger className={getInputClassName("allievo", true)}>
                        <SelectValue placeholder="Seleziona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {partecipanteCategorieDB.filter((cat) => cat.id).map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Genitore 1 */}
              <div className="pt-6 mt-6 border-t border-border">
                <h3 className="inline-block text-sm font-medium px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full border border-amber-200 dark:border-amber-800/60 mb-4">Genitore 1</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Cognome</Label>
                    <Input value={formData.cognomeGen1} onChange={(e) => handleChange("cognomeGen1", e.target.value)} className={getInputClassName("cognomeGen1", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={formData.nomeGen1} onChange={(e) => handleChange("nomeGen1", e.target.value)} className={getInputClassName("nomeGen1", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Codice Fiscale
                      <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-red-700 transition-colors" data-testid="link-generatore-cf-gen1">
                        <AlertTriangle className="w-4 h-4 cursor-pointer" />
                      </a>
                    </Label>
                    <Input value={formData.cfGen1} onChange={(e) => handleChange("cfGen1", e.target.value.toUpperCase())} className={getInputClassName("cfGen1", false)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Telefono</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.telGen1 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.telGen1 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                      </span>
                      {!verificaStato.telGen1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-5 px-2 text-xs ml-1"
                          onClick={() => avviaVerifica('telGen1', 'telefono')}
                        >
                          Verifica
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.telGen1}
                      onChange={(e) => handleChange("telGen1", e.target.value)}
                      className={`${getInputClassName("telGen1", false)} ${verificaStato.telGen1 ? "bg-green-50 border-green-300" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Email</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.emailGen1 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.emailGen1 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                      </span>
                      {!verificaStato.emailGen1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-5 px-2 text-xs ml-1"
                          onClick={() => avviaVerifica('emailGen1', 'email')}
                        >
                          Verifica
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.emailGen1}
                      onChange={(e) => handleChange("emailGen1", e.target.value)}
                      className={`${getInputClassName("emailGen1", false)} ${verificaStato.emailGen1 ? "bg-green-50 border-green-300" : ""}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Indirizzo residenza</Label>
                    <Input placeholder="Via/Piazza, n. civico" value={formData.indirizzoGen1} onChange={(e) => handleChange("indirizzoGen1", e.target.value)} data-testid="input-indirizzo-gen1" className={getInputClassName("indirizzoGen1", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CAP</Label>
                    <Input value={formData.capGen1} onChange={(e) => handleChange("capGen1", e.target.value)} data-testid="input-cap-gen1" className={getInputClassName("capGen1", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Città</Label>
                    <Input value={formData.cittaGen1} onChange={(e) => handleChange("cittaGen1", e.target.value)} data-testid="input-citta-gen1" className={getInputClassName("cittaGen1", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input value={formData.provinciaGen1} onChange={(e) => handleChange("provinciaGen1", e.target.value)} data-testid="input-provincia-gen1" className={getInputClassName("provinciaGen1", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cod. Comune</Label>
                    <Input value={formData.codComuneGen1} onChange={(e) => handleChange("codComuneGen1", e.target.value)} data-testid="input-cod-comune-gen1" className={getInputClassName("codComuneGen1", false)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Data di Nascita</Label>
                    <Input
                      value={formData.dataNascitaGen1 ? new Date(formData.dataNascitaGen1).toLocaleDateString('it-IT') : ''}
                      readOnly
                      className={`${getInputClassName("dataNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-red-400 bg-red-50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Luogo di Nascita</Label>
                    <Input
                      value={formData.luogoNascitaGen1}
                      readOnly
                      className={`${getInputClassName("luogoNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-red-400 bg-red-50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prov. Nascita</Label>
                    <Input
                      value={formData.provinciaNascitaGen1}
                      readOnly
                      className={`${getInputClassName("provinciaNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-red-400 bg-red-50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sesso</Label>
                    <Input
                      value={formData.sessoGen1 === 'M' ? 'M' : formData.sessoGen1 === 'F' ? 'F' : ''}
                      readOnly
                      className={`${getInputClassName("sessoGen1", false, true)} ${!formData.cfGen1 && 'border-red-400 bg-red-50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Età</Label>
                    <Input
                      value={formData.etaGen1}
                      readOnly
                      className={`${getInputClassName("etaGen1", false, true)} ${!formData.cfGen1 && 'border-red-400 bg-red-50'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Genitore 2 */}
              <div className="pt-6 mt-6 border-t border-border">
                <h3 className="inline-block text-sm font-medium px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full border border-amber-200 dark:border-amber-800/60 mb-4">Genitore 2</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Cognome</Label>
                    <Input value={formData.cognomeGen2} onChange={(e) => handleChange("cognomeGen2", e.target.value)} className={getInputClassName("cognomeGen2", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={formData.nomeGen2} onChange={(e) => handleChange("nomeGen2", e.target.value)} className={getInputClassName("nomeGen2", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Codice Fiscale
                      <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-red-700 transition-colors" data-testid="link-generatore-cf-gen2">
                        <AlertTriangle className="w-4 h-4 cursor-pointer" />
                      </a>
                    </Label>
                    <Input value={formData.cfGen2} onChange={(e) => handleChange("cfGen2", e.target.value.toUpperCase())} className={getInputClassName("cfGen2", false)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Telefono</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.telGen2 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.telGen2 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                      </span>
                      {!verificaStato.telGen2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-5 px-2 text-xs ml-1"
                          onClick={() => avviaVerifica('telGen2', 'telefono')}
                        >
                          Verifica
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.telGen2}
                      onChange={(e) => handleChange("telGen2", e.target.value)}
                      className={`${getInputClassName("telGen2", false)} ${verificaStato.telGen2 ? "bg-green-50 border-green-300" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Email</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.emailGen2 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.emailGen2 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                        )}
                      </span>
                      {!verificaStato.emailGen2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-5 px-2 text-xs ml-1"
                          onClick={() => avviaVerifica('emailGen2', 'email')}
                        >
                          Verifica
                        </Button>
                      )}
                    </div>
                    <Input
                      value={formData.emailGen2}
                      onChange={(e) => handleChange("emailGen2", e.target.value)}
                      className={verificaStato.emailGen2 ? "bg-green-50 border-green-300" : ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Indirizzo residenza</Label>
                    <Input placeholder="Via/Piazza, n. civico" value={formData.indirizzoGen2} onChange={(e) => handleChange("indirizzoGen2", e.target.value)} data-testid="input-indirizzo-gen2" />
                  </div>
                  <div className="space-y-2">
                    <Label>CAP</Label>
                    <Input value={formData.capGen2} onChange={(e) => handleChange("capGen2", e.target.value)} data-testid="input-cap-gen2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Città</Label>
                    <Input value={formData.cittaGen2} onChange={(e) => handleChange("cittaGen2", e.target.value)} data-testid="input-citta-gen2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input value={formData.provinciaGen2} onChange={(e) => handleChange("provinciaGen2", e.target.value)} data-testid="input-provincia-gen2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cod. Comune</Label>
                    <Input value={formData.codComuneGen2} onChange={(e) => handleChange("codComuneGen2", e.target.value)} data-testid="input-cod-comune-gen2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Data di Nascita</Label>
                    <Input
                      value={formData.dataNascitaGen2 ? new Date(formData.dataNascitaGen2).toLocaleDateString('it-IT') : ''}
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'} `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Luogo di Nascita</Label>
                    <Input
                      value={formData.luogoNascitaGen2}
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'} `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prov. Nascita</Label>
                    <Input
                      value={formData.provinciaNascitaGen2}
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'} `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sesso</Label>
                    <Input
                      value={formData.sessoGen2 === 'M' ? 'M' : formData.sessoGen2 === 'F' ? 'F' : ''}
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'} `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Età</Label>
                    <Input
                      value={formData.etaGen2}
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-yellow-50 border-yellow-300' : 'border-red-400 bg-red-50'} `}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PAGAMENTI */}
        <Card id="pagamenti" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 sidebar-icon-gold" />
                Pagamenti
              </span>
              <Button size="sm" className="gold-3d-button" data-testid="button-aggiungi-pagamento" onClick={() => {
                setEditingPaymentId(null);
                setIsNuovoPagamentoOpen(true);
              }}>
                <Plus className="w-4 h-4" />
                Nuovo Pagamento
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {(payments.length === 0 && (!memberPayments || memberPayments.length === 0)) ? (
                <div className="text-center py-8 text-muted-foreground border rounded bg-muted/20">
                  Nessun pagamento registrato. Clicca su "Aggiungi" per inserirne uno.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Ins.</TableHead>
                        <TableHead>Attività</TableHead>
                        <TableHead>Dettaglio</TableHead>
                        <TableHead>Data Pagamento</TableHead>
                        <TableHead>Note Pagamenti</TableHead>
                        <TableHead className="text-right">Importo</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...(Array.isArray(memberPayments) ? memberPayments : []), ...payments].map((payment, idx) => {
                        const isExistingDBPayment = !!payment.createdAt || !!payment.amount;
                        // For Data Inserimento, use createdAt or similar if available, otherwise fallback
                        const pDataInserimento = payment.createdAt || payment.paidDate || payment.date;
                        const pDataPagamento = payment.dataPagamento || payment.paidDate || payment.date;
                        const pAttivita = payment.attivita || payment.type;
                        const pDettaglio = payment.dettaglioNome || payment.description || payment.quotaDescription;
                        const pNote = payment.nota || payment.notes || payment.notePagamento || payment.notaPagamento || "";
                        const pImporto = payment.totaleQuota || payment.totalQuota || payment.amount || 0;

                        return (
                          <TableRow key={payment.id || `db-pay-${idx}`}>
                            <TableCell>{pDataInserimento ? new Date(pDataInserimento).toLocaleDateString('it-IT') : "-"}</TableCell>
                            <TableCell className="capitalize">{pAttivita ? pAttivita.replace("-", " ") : "-"}</TableCell>
                            <TableCell>{pDettaglio || "-"}</TableCell>
                            <TableCell>{pDataPagamento ? new Date(pDataPagamento).toLocaleDateString('it-IT') : "-"}</TableCell>
                            <TableCell>{pNote || "-"}</TableCell>
                            <TableCell className="text-right">€ {Number(pImporto).toFixed(2)}</TableCell>
                            <TableCell className="flex items-center gap-2 justify-end">
                              {!isExistingDBPayment && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Copia Testo per Email/WhatsApp"
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={() => handleCopyReceipt(payment)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingPaymentId(payment.id || null);
                                      setIsPaymentDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => payment.id && handleDeletePayment(payment.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Nuovo Pagamento Modal (Unificato) */}
            <NuovoPagamentoModal
              isOpen={isNuovoPagamentoOpen}
              onClose={() => setIsNuovoPagamentoOpen(false)}
              defaultMemberId={formData.id ? parseInt(formData.id) : undefined}
            />

            <PaymentDialog
              open={isPaymentDialogOpen}
              onOpenChange={(open) => {
                setIsPaymentDialogOpen(open);
                if (!open) setEditingPaymentId(null);
              }}
              onSave={handleSavePayment}
              initialData={editingPaymentId ? payments.find(p => p.id === editingPaymentId) : null}
              corsiDB={corsiDB}
              categorieDB={categorieDB}
              memberId={memberIdFromUrl ? parseInt(memberIdFromUrl) : undefined}
            />
          </CardContent>
        </Card>

        {/* GIFT - BUONO - RESO - HELLO GEM */}
        <Card id="gift" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <Gift className="w-5 h-5 sidebar-icon-gold" />
                Gift - Buono - Reso - Hello Gem
              </span>
              <Button size="sm" className="gold-3d-button" data-testid="button-aggiungi-gift">
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={bottomSectionsData.gift.tipo} onValueChange={(v) => setBottomSectionsData(prev => ({ ...prev, gift: { ...prev.gift, tipo: v } }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gift">Gift Card</SelectItem>
                    <SelectItem value="buono">Buono</SelectItem>
                    <SelectItem value="reso">Reso</SelectItem>
                    <SelectItem value="hellogem">Hello Gem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valore/Importo</Label>
                <Input type="number" value={bottomSectionsData.gift.valore} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, gift: { ...prev.gift, valore: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Numero</Label>
                <Input value={bottomSectionsData.gift.numero} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, gift: { ...prev.gift, numero: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Data Emissione</Label>
                <Input type="date" value={bottomSectionsData.gift.dataEmissione} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, gift: { ...prev.gift, dataEmissione: e.target.value } }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Data Scadenza</Label>
                <Input type="date" value={bottomSectionsData.gift.dataScadenza} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, gift: { ...prev.gift, dataScadenza: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Acquistato/Utilizzato per - Motivazione</Label>
                <Input value={bottomSectionsData.gift.motivazione} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, gift: { ...prev.gift, motivazione: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Data Utilizzo/Reso (Convalida)</Label>
                <Input type="date" value={bottomSectionsData.gift.dataUtilizzo} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, gift: { ...prev.gift, dataUtilizzo: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={bottomSectionsData.gift.iban} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, gift: { ...prev.gift, iban: e.target.value } }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TESSERE */}
        <Card id="tessere" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="w-5 h-5 sidebar-icon-gold" />
              Tessere
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Quota Tessera (BY)</Label>
                <Input type="number" value={bottomSectionsData.tessere.quota} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, tessere: { ...prev.tessere, quota: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Pagamento Tessera (BZ)</Label>
                <Input type="date" value={bottomSectionsData.tessere.pagamento} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, tessere: { ...prev.tessere, pagamento: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Nuovo o Rinnovo (CA)</Label>
                <Select value={bottomSectionsData.tessere.nuovoRinnovo} onValueChange={(v) => setBottomSectionsData(prev => ({ ...prev, tessere: { ...prev.tessere, nuovoRinnovo: v } }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuovo">Nuovo</SelectItem>
                    <SelectItem value="rinnovo">Rinnovo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Scad. Quota Tessera (CB)</Label>
                <Input value={bottomSectionsData.tessere.dataScad} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, tessere: { ...prev.tessere, dataScad: e.target.value } }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>N. Tessera (CC)</Label>
                <Input value={bottomSectionsData.tessere.numero} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, tessere: { ...prev.tessere, numero: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Tessera Ente (CD)</Label>
                <Input value={bottomSectionsData.tessere.tesseraEnte} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, tessere: { ...prev.tessere, tesseraEnte: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Domanda di Tesseramento (CE)</Label>
                <Select value={bottomSectionsData.tessere.domanda} onValueChange={(v) => setBottomSectionsData(prev => ({ ...prev, tessere: { ...prev.tessere, domanda: v } }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sì</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CERTIFICATO MEDICO */}
        <Card id="certificato" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="w-5 h-5 sidebar-icon-gold" />
              Certificato Medico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Data Scadenza Certificato</Label>
                <Input type="date" value={bottomSectionsData.certificatoMedico.dataScadenza} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, certificatoMedico: { ...prev.certificatoMedico, dataScadenza: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Data di Rinnovo</Label>
                <Input type="date" value={bottomSectionsData.certificatoMedico.dataRinnovo} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, certificatoMedico: { ...prev.certificatoMedico, dataRinnovo: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Rilasciato Da</Label>
                <Input value={bottomSectionsData.certificatoMedico.rilasciatoDa} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, certificatoMedico: { ...prev.certificatoMedico, rilasciatoDa: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Pagamento</Label>
                <Input type="number" placeholder="€ 40" value={bottomSectionsData.certificatoMedico.pagamento} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, certificatoMedico: { ...prev.certificatoMedico, pagamento: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>A Noi</Label>
                <Input type="number" placeholder="12,5" value={bottomSectionsData.certificatoMedico.aNoi} onChange={(e) => setBottomSectionsData(prev => ({ ...prev, certificatoMedico: { ...prev.certificatoMedico, aNoi: e.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo Certificato</Label>
                <Select value={bottomSectionsData.certificatoMedico.tipo} onValueChange={(v) => setBottomSectionsData(prev => ({ ...prev, certificatoMedico: { ...prev.certificatoMedico, tipo: v } }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_agonistico">Sportivo Non Agonistico</SelectItem>
                    <SelectItem value="agonistico">Sportivo Agonistico</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ATTIVITÀ */}
        <Card id="attivita" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 sidebar-icon-gold" />
              Attività
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CORSI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Calendar className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/corsi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-corsi">Corsi</Link>
                <KnowledgeInfo id="corsi" />
                <SectionBadge count={memberEnrollments?.length || 0} />
              </h3>

              {!selectedMemberId ? (
                <div className="text-center p-4 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  Seleziona un membro per gestire le iscrizioni ai corsi
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Active Enrollments List */}
                  {loadingEnrollments ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : Array.isArray(memberEnrollments) && memberEnrollments.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Iscrizioni Attive</Label>
                      {memberEnrollments.map((e: any) => {
                        const course = courses?.find((c: any) => c.id === e.courseId);
                        const hasDetails = Array.isArray(e.details) && e.details.length > 0;
                        return (
                          <div key={e.id} className="grid grid-cols-[140px_180px_240px_1fr_auto] items-center p-2.5 bg-muted/20 border rounded-md group hover:bg-muted/40 transition-colors gap-3">

                            {/* Nome Corso */}
                            <div className="font-bold text-sm truncate" title={course?.name}>
                              {course?.name || 'Corso sconosciuto'}
                            </div>

                            {/* Codice Corso (SKU) */}
                            <div className="font-medium text-[11px] text-slate-900 truncate" title={course?.sku || undefined}>
                              {course?.sku}
                            </div>

                            {/* Info Temporali */}
                            <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                              <span>Iscritto il: {new Date(e.enrollmentDate).toLocaleDateString('it-IT')}</span>
                              {course?.dayOfWeek && <span>• {course.dayOfWeek} {course.startTime}</span>}
                            </div>

                            {/* Dettagli Iscrizione (Solo Lettura) */}
                            <div className="flex items-center gap-1 overflow-hidden flex-1">
                              {hasDetails && e.details.map((detStr: string, idx: number) => {
                                const color = enrollmentDetails?.find(d => d.name === detStr)?.color;
                                return (
                                  <EnrollmentDetailBadge
                                    key={idx}
                                    name={detStr}
                                    color={color}
                                    className="h-5 py-0.5 px-2 text-[10px] truncate max-w-[120px]"
                                  />
                                );
                              })}
                            </div>

                            {/* Stato e Azioni */}
                            <div className="flex items-center justify-end gap-3 pl-2">
                              <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className={e.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-[10px] h-5' : 'text-[10px] h-5'}>
                                {e.status === 'active' ? 'Attivo' : e.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  if (confirm("Rimuovere l'iscrizione a questo corso?")) {
                                    removeEnrollmentMutation.mutate(e.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic p-2">Nessuna iscrizione attiva.</p>
                  )}


                </div>
              )}
            </div>

            {/* PROVE A PAGAMENTO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <CreditCard className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/prove-pagamento" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-prove-pagamento">Prove a Pagamento</Link>
                <KnowledgeInfo id="prove-a-pagamento" />
                <SectionBadge count={memberPtEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberPtEnrollments, paidTrials, removePtEnrollmentMutation, "Nessuna prova a pagamento registrata.", "Prove a Pagamento Registrate", "le prove a pagamento", "paidTrialId")}
            </div>

            {/* PROVE GRATUITE */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Gift className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/prove-gratuite" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-prove-gratuite">Prove Gratuite</Link>
                <KnowledgeInfo id="prove-gratuite" />
                <SectionBadge count={memberFtEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberFtEnrollments, freeTrials, removeFtEnrollmentMutation, "Nessuna prova gratuita registrata.", "Prove Gratuite Registrate", "le prove gratuite", "freeTrialId")}
            </div>

            {/* LEZIONI SINGOLE */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <BookOpen className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/lezioni-singole" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-lezioni-singole">Lezioni Singole</Link>
                <KnowledgeInfo id="lezioni-singole" />
                <SectionBadge count={memberSlEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberSlEnrollments, singleLessons, removeSlEnrollmentMutation, "Nessuna lezione singola registrata.", "Lezioni Singole Registrate", "le lezioni singole", "singleLessonId")}
            </div>

            {/* WORKSHOP */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Calendar className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/workshop" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-workshop">Workshop</Link>
                <KnowledgeInfo id="workshop" />
                <SectionBadge count={memberWorkshopEnrollments?.length || 0} />
              </h3>

              {renderGenericEnrollmentList(memberWorkshopEnrollments, workshops, removeWorkshopEnrollmentMutation, "Nessun workshop registrato.", "Workshop Registrati", "i workshop", "workshopId")}
            </div>

            {/* DOMENICHE IN MOVIMENTO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Sun className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/domeniche-movimento" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-domeniche-movimento">Domeniche in Movimento</Link>
                <KnowledgeInfo id="domeniche-in-movimento" />
                <SectionBadge count={memberSaEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberSaEnrollments, sundayActivities, removeSaEnrollmentMutation, "Nessuna domenica in movimento registrata.", "Domeniche in Movimento Registrate", "le domeniche in movimento", "sundayActivityId")}
            </div>

            {/* ALLENAMENTI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Dumbbell className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/allenamenti" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-allenamenti">Allenamenti/Affitti</Link>
                <KnowledgeInfo id="allenamenti" />
                <SectionBadge count={memberTrEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberTrEnrollments, trainings, removeTrEnrollmentMutation, "Nessun allenamento registrato.", "Allenamenti Registrati", "gli allenamenti", "trainingId")}
            </div>

            {/* LEZIONI INDIVIDUALI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <UserCheck className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/lezioni-individuali" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-lezioni-individuali">Lezioni Individuali</Link>
                <KnowledgeInfo id="lezioni-individuali" />
                <SectionBadge count={memberIlEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberIlEnrollments, individualLessons, removeIlEnrollmentMutation, "Nessuna lezione individuale registrata.", "Lezioni Individuali Registrate", "le lezioni individuali", "individualLessonId")}
            </div>

            {/* CAMPUS */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Users className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/campus" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-campus">Campus</Link>
                <KnowledgeInfo id="campus" />
                <SectionBadge count={memberCaEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberCaEnrollments, campusActivities, removeCaEnrollmentMutation, "Nessun campus registrato.", "Campus Registrati", "i campus", "campusActivityId")}
            </div>

            {/* SAGGI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Award className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/saggi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-saggi">Saggi</Link>
                <KnowledgeInfo id="saggi" />
                <SectionBadge count={memberReEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberReEnrollments, recitals, removeReEnrollmentMutation, "Nessun saggio registrato.", "Saggi Registrati", "i saggi", "recitalId")}
            </div>

            {/* VACANZA STUDIO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Music className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/vacanze-studio" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-vacanze-studio">Vacanze Studio</Link>
                <KnowledgeInfo id="vacanze-studio" />
                <SectionBadge count={memberVsEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberVsEnrollments, vacationStudies, removeVsEnrollmentMutation, "Nessuna vacanza studio registrata.", "Vacanze Studio Registrate", "le vacanze studio", "vacationStudyId")}
            </div>

            {/* MERCHANDISING */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/merchandising" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-merchandising">Merchandising</Link>
                <KnowledgeInfo id="merchandising" />
              </h3>
              {renderGenericEnrollmentList([], [], dummyMutation, "Nessun articolo di merchandising registrato.", "Merchandising Registrato", "il merchandising", "merchandisingId")}
            </div>

            {/* SERVIZI EXTRA */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded flex items-center gap-2">
                <Database className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/servizi-extra" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-servizi-extra">Servizi Extra</Link>
                <KnowledgeInfo id="servizi-extra" />
                <SectionBadge count={memberServEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberServEnrollments, bookingServices, removeServEnrollmentMutation, "Nessun servizio extra registrato.", "Servizi Extra Registrati", "i servizi extra", "serviceId")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Fiscal Codes Modal */}
      <Dialog open={showDuplicatesModal} onOpenChange={setShowDuplicatesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Codici Fiscali Duplicati
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              I seguenti codici fiscali sono presenti in più di un membro. Clicca sul nome per visualizzare e modificare il membro.
            </p>
            {duplicateFiscalCodes?.map((duplicate) => (
              <Card key={duplicate.fiscalCode} className="p-4">
                <div className="space-y-2">
                  <div className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded inline-block">
                    {duplicate.fiscalCode}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {duplicate.members.map((member) => (
                      <Button
                        key={member.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDuplicatesModal(false);
                          handleSelectMember(member);
                        }}
                        data-testid={`button - duplicate - member - ${member.id} `}
                      >
                        {member.firstName} {member.lastName}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
