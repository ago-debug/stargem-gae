import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InlineListEditorDialog } from "@/components/inline-list-editor-dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Upload, Download, Paperclip, Search, Plus, Save, FileSpreadsheet, CheckCircle2, AlertCircle, RotateCcw, ArrowDown, Check, FileUp, X, Camera, Edit, Trash2, Copy, RefreshCw, Settings2, ShieldAlert, Info, UserPlus } from "lucide-react";
import { ExportWizard } from "@/components/ExportWizard";
import { useCFCheck, useEmailCheck, usePhoneCheck } from "@/hooks/useFieldConflictCheck";
import { ConflictBadge } from "@/components/conflict-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FileText, Users, CreditCard, Gift, IdCard, Stethoscope, Activity,
  User, BookOpen, ShoppingBag, Calendar, Sparkles, Sun, Dumbbell, UserCheck, Award, Music, Database, Building2, Globe, Receipt
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useSearch, useLocation } from "wouter";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KnowledgeInfo } from "@/components/knowledge-info";
import { MultiSelectPaymentNotes } from "@/components/multi-select-payment-notes";
import { MultiSelectParticipantType } from "@/components/multi-select-participant-type";
import { MultiSelectEnrollmentDetails, EnrollmentDetailBadge } from "@/components/multi-select-enrollment-details";
import { PaymentDialog, type PaymentData } from "@/components/payment-dialog";
import { NuovoPagamentoModal as NuovoPagamentoModalMC3 } from "@/components/payments/NuovoPagamentoModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTableHead, useSortableTable } from "@/components/sortable-table-head";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { useCustomListValues, useQuickAddCustomList } from "@/hooks/use-custom-list";
import { CourseSelector } from "@/components/course-selector";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, Instructor, Category, Studio } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemberStore } from "@/store/useMemberStore";
import { CrmFormProvider, useCrmForm } from "@/components/crm/CrmFormContext";
import { TabAnagrafica } from "@/components/crm/TabAnagrafica";
import { TabIscrizioni } from "@/components/crm/TabIscrizioni";
import { TabRicevute } from "@/components/crm/TabRicevute";
import { TabMarketing } from "@/components/crm/TabMarketing";
import { TabAllegati } from "@/components/crm/TabAllegati";
import { TabGift } from "@/components/crm/TabGift";
import { TabTessere } from "@/components/crm/TabTessere";
import StoriaProvenienzaTab from "@/components/dossiers/StoriaProvenienzaTab";
import { getActiveActivities } from "@/config/activities";
function useBarcodeScanner(onScan: (barcode: string) => void) {
  useEffect(() => {
    let barcode = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50) {
        barcode = '';
      }

      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcode.length === 16) {
          onScan(barcode);
        }
        barcode = '';
      } else if (e.key.length === 1) {
        barcode += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
}

interface DuplicateFiscalCode {
  fiscalCode: string;
  members: { id: number; firstName: string; lastName: string; }[];
}
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
  domandaTesseramento: AllegatoState & { accettato?: string };
}

const attivitaKeys = getActiveActivities().filter(a => a.visibility.mascheraInput).map(a => a.id);
type AttivitaKey = string;

const defaultAttivitaText: Record<string, string> = attivitaKeys.reduce((acc, id) => {
  acc[id] = "";
  return acc;
}, {} as Record<string, string>);

const defaultAttivitaArray: Record<string, string[]> = attivitaKeys.reduce((acc, id) => {
  acc[id] = [];
  return acc;
}, {} as Record<string, string[]>);

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

function MascheraInputGeneraleContent(props?: any) {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const memberIdFromUrl = props?.params?.id || urlParams.get('memberId') || urlParams.get('editMemberId');
  const actionFromUrl = urlParams.get('action');
  const { user } = useAuth();

  const {
    formData, setFormData,
    dirtyFields, setDirtyFields,
    handleChange: handleChangeCtx,
    allegati, setAllegati,
    openAllegatoSections, setOpenAllegatoSections,
    bottomSectionsData, setBottomSectionsData,
    photoFile, setPhotoFile,
    attivitaCorso, setAttivitaCorso,
    attivitaCodice, setAttivitaCodice,
    attivitaEnrollmentDetails, setAttivitaEnrollmentDetails,
    verificaStato, setVerificaStato,
    avviaVerifica: avviaVerificaCtx
  } = useCrmForm();

  


  useBarcodeScanner((barcode) => {
    if (/^[A-Z0-9]{16}$/i.test(barcode)) {
      handleChange("codiceFiscale", barcode.toUpperCase());
      toast({ title: "Tessera Sanitaria Rilevata", description: "Codice Fiscale acquisito con successo." });
    }
  });

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
    domandaTesseramento: { hasFile: false, data: "", accettato: "" },
  };

  /* allegati moved to context */

  /* bottomSections moved to context */

  

  

  // Unified Enrollment form states
  const [unifiedCourseId, setUnifiedCourseId] = useState<string>("");
  const [unifiedParticipationType, setUnifiedParticipationType] = useState<string>("STANDARD_COURSE");
  const [unifiedTargetDate, setUnifiedTargetDate] = useState<string>("");

  /* photoFile moved to context */

  


  const defaultFormData = {
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
  };

  /* formData moved to context */

  // Track modified fields for Color Coding
  /* dirtyFields moved to context */

  // Save to sessionStorage whenever formData or dirtyFields change
  

  
  const [isSaved, setIsSaved] = useState(false);

  // Helper for input color coding based on user requirements
  const getInputClassName = (fieldName: string, required: boolean = false, isAutoPopulated: boolean = false) => {
    const value = (formData as any)[fieldName];
    const isDirty = dirtyFields[fieldName];

    // Priority 1: Red for fields that *will* be auto-populated
    const isNewMask = !selectedMemberId && !formData.nome && !formData.cognome;
    if (isAutoPopulated && !formData.codiceFiscale && !value && !isSaved && !isNewMask) {
      return 'bg-destructive/50 border-destructive400 transition-colors text-destructive900';
    }

    // Priority 2: Giallino if user is actively writing/editing (isDirty)
    if (isDirty) {
      return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 transition-colors text-yellow-900 dark:text-yellow-400';
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
        return 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 transition-colors text-green-900 dark:text-green-400';
      }
    }

    // Priority 4: Grigio for empty mandatory fields
    if (required && !value) {
      return 'bg-muted/50 border-muted-foreground/30 transition-colors';
    }

    // Default
    return 'transition-colors';
  };

  const getBottomSectionClassName = (sectionName: string, fieldName: string) => {
    const isDirty = dirtyFields[`${sectionName}_${fieldName}`];
    let value = '';

    if (sectionName === 'gift') {
      // Gift is an array now, skip generic value check for background unless handled per-item
      return isDirty ? 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 transition-colors text-yellow-900 dark:text-yellow-400' : 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 transition-colors text-green-900 dark:text-green-400';
    } else {
      value = (bottomSectionsData as any)[sectionName]?.[fieldName];
    }

    if (isDirty) {
      return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 transition-colors text-yellow-900 dark:text-yellow-400';
    }
    if (value && !isDirty) {
      return 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 transition-colors text-green-900 dark:text-green-400';
    }
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
  const [initialAction, setInitialAction] = useState<string | null>(null);
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

  // Active Member State for Enrollments from Zustand
  const selectedMemberId = useMemberStore((state) => state.selectedMemberId);
  const setSelectedMemberId = useMemberStore((state) => state.setSelectedMemberId);

  const [showGiftFields, setShowGiftFields] = useState<boolean>(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  /* verificaStato moved */

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

  const renderMancaDato = (val: string | undefined | null) => {
    if (selectedMemberId && actionFromUrl !== "new" && (!val || String(val).trim() === "")) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xxs font-bold text-red-500 select-none pointer-events-none z-10">
          <AlertTriangle className="w-3 h-3 fill-red-500 text-white" /> Manca Dato
        </div>
      );
    }
    return null;
  };

  const handleBottomSectionChange = (section: keyof BottomSectionsState, field: string, value: any, itemIndex?: number) => {
    setBottomSectionsData(prev => {
      if (section === 'gift' && typeof itemIndex === 'number') {
        const newGiftArr = [...prev.gift];
        newGiftArr[itemIndex] = { ...newGiftArr[itemIndex], [field]: value };
        return { ...prev, gift: newGiftArr };
      }
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: value
        }
      };
    });
    setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, [`${section}_${field}`]: true }));
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
      setBottomSectionsData({
        ...defaultBottomSectionsState,
        tessere: {
          ...defaultBottomSectionsState.tessere,
          membershipType: "NUOVO",
          seasonCompetence: "CORRENTE"
        }
      });
      setShowGiftFields(false);

      setFormData((prev: any) => ({
        ...prev,
        status: "",
        stagione: "",
        codiceId: "",
        dataInserimento: "",
        teamInserito: "",
        teamAggiornato: "",
        cognome: "", nome: "", codiceFiscale: "", telefono: "", email: "",
        indirizzo: "", cap: "", citta: "", provincia: "", codComune: "",
        dataNascita: "", luogoNascita: "", provinciaNascita: "", sesso: "", eta: "",
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

  const { data: memberMemberships, isLoading: loadingMemberships, error: errorMemberships } = useQuery<any[]>({
    queryKey: ["/api/memberships", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/memberships?memberId=${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento abbonamenti");
      }
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    },
    enabled: !!selectedMemberId,
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

  const { data: memberMedicalCertificates } = useQuery<any[]>({
    queryKey: ["/api/medical-certificates", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/medical-certificates?memberId=${selectedMemberId}`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento certificati medici");
      }
      return res.json();
    },
    enabled: !!selectedMemberId,
  });

  const { data: currentMember, refetch: refetchCurrentMember } = useQuery<any>({
    queryKey: ["/api/members/current", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/members/${selectedMemberId}`);
      if (!res.ok) throw new Error("Utente non trovato");
      return res.json();
    },
    enabled: !!selectedMemberId
  });



  const combinedPayments = [...(Array.isArray(memberPayments) ? memberPayments : []), ...payments];

  const { sortConfig: sortConfigPayments, handleSort: handleSortPayments, sortItems: sortItemsPayments, isSortedColumn: isSortedColumnPayments } = useSortableTable<any>("createdAt");

  const getPaymentSortValue = (payment: any, key: string) => {
    switch (key) {
      case "createdAt": return payment.createdAt || payment.paidDate || payment.date || "";
      case "attivita": return payment.attivita || payment.type || "";
      case "dettaglio": return payment.dettaglioNome || payment.description || payment.quotaDescription || "";
      case "dataPagamento": return payment.dataPagamento || payment.paidDate || payment.date || "";
      case "metodoPagamento": return payment.nota || payment.notes || payment.notePagamento || payment.notaPagamento || "";
      case "importo": return Number(payment.totaleQuota || payment.totalQuota || payment.amount || 0);
      default: return null;
    }
  };

  const sortedPayments = sortItemsPayments(combinedPayments, getPaymentSortValue);


  // Intercept memberId from URL and auto-load Profile
  useEffect(() => {
    if (memberIdFromUrl) {
      const id = parseInt(memberIdFromUrl);
      if (!isNaN(id)) {
        fetch(`/api/members/${id}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Utente non trovato');
          })
          .then(member => {
            if (actionFromUrl === 'payment' || actionFromUrl === 'rinnova-tessera') {
              setInitialAction(actionFromUrl);
            }
            handleSelectMember(member);
            // Gestione scroll automatico post-caricamento anagrafica
            if (window.location.hash) {
              setTimeout(() => {
                const id = window.location.hash.replace('#', '');
                const element = document.getElementById(id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 500); // Piccolo delay per attendere il render dei dati
            }
          })
          .catch(err => console.error("Errore auto-loading utente da URL", err));
      }
    }
  }, [memberIdFromUrl, actionFromUrl]);

  // Effetto dedicato per aprire il modale in modo sicuro dopo il montaggio
  useEffect(() => {
    if (initialAction === 'payment' || initialAction === 'rinnova-tessera') {
      const timer = setTimeout(() => {
        setIsNuovoPagamentoOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialAction]);

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
      indirizzo: member.address || "",
      cap: member.postalCode || "",
      citta: member.city || "",
      provincia: member.province || "",
      dataNascita: member.dateOfBirth || "",
      luogoNascita: member.placeOfBirth || "",
      provinciaNascita: member.birthProvince || "",
      codComune: member.fiscalCode?.length === 16 ? member.fiscalCode.substring(11, 15) : "",
      sesso: member.gender || "",
      eta: eta,

      // Genitori
      nomeGen1: member.motherFirstName || "",
      cognomeGen1: member.motherLastName || "",
      cfGen1: member.motherFiscalCode || "",
      telGen1: member.motherMobile || member.motherPhone || "",
      emailGen1: member.motherEmail || "",
      indirizzoGen1: member.motherStreetAddress || "",
      cittaGen1: member.motherCity || "",
      provinciaGen1: member.motherProvince || "",
      codComuneGen1: member.motherFiscalCode?.length === 16 ? member.motherFiscalCode.substring(11, 15) : "",
      capGen1: member.motherPostalCode || "",
      dataNascitaGen1: member.motherBirthDate || "",
      luogoNascitaGen1: member.motherBirthPlace || "",
      provinciaNascitaGen1: member.motherBirthProvince || "",

      nomeGen2: member.fatherFirstName || "",
      cognomeGen2: member.fatherLastName || "",
      cfGen2: member.fatherFiscalCode || "",
      telGen2: member.fatherMobile || member.fatherPhone || "",
      emailGen2: member.fatherEmail || "",
      indirizzoGen2: member.fatherStreetAddress || "",
      cittaGen2: member.fatherCity || "",
      provinciaGen2: member.fatherProvince || "",
      codComuneGen2: member.fatherFiscalCode?.length === 16 ? member.fatherFiscalCode.substring(11, 15) : "",
      capGen2: member.fatherPostalCode || "",
      dataNascitaGen2: member.fatherBirthDate || "",
      luogoNascitaGen2: member.fatherBirthPlace || "",
      provinciaNascitaGen2: member.fatherBirthProvince || "",

      // Intestazione defaults
      status: member.status || "active",
      stagione: member.season || "2025-2026",
      codiceId: member.internalId || "2526-000001",
      previousMembershipNumber: member.previousMembershipNumber || "",
      athenaId: member.athenaId || "",
      dataInserimento: member.insertionDate || new Date().toLocaleDateString("it-IT"),
      teamInserito: member.createdAt ? `${member.createdBy || 'Sistema'}, ${formatAuditDate(member.createdAt)}` : "",
      teamAggiornato: member.updatedAt ? `${member.updatedBy || 'Sistema'}, ${formatAuditDate(member.updatedAt)}` : "",
      daDoveArriva: member.fromWhere || "",
      tipoPartecipante: member.participantType || "tesserato", // Updated to map participantType
      tessera: member.cardNumber || "",
      scadenzaTessera: member.cardExpiryDate || "",
    }));

    // Populate complex allegati flags from DB JSON if available
    if (member.attachmentMetadata) {
      setAllegati((prev) => {
        try {
          const parsed = typeof member.attachmentMetadata === 'string' ? JSON.parse(member.attachmentMetadata) : member.attachmentMetadata;
          if (!parsed) return prev;
          return {
            ...defaultAllegatiState,
            ...parsed,
            regolamento: { ...defaultAllegatiState.regolamento, ...(parsed.regolamento || {}) },
            privacy: { ...defaultAllegatiState.privacy, ...(parsed.privacy || {}) },
            certificatoMedico: { ...defaultAllegatiState.certificatoMedico, ...(parsed.certificatoMedico || {}) },
            ricevutePagamenti: { ...defaultAllegatiState.ricevutePagamenti, ...(parsed.ricevutePagamenti || {}) },
            modelloDetrazione: { ...defaultAllegatiState.modelloDetrazione, ...(parsed.modelloDetrazione || {}) },
            creditiScolastici: { ...defaultAllegatiState.creditiScolastici, ...(parsed.creditiScolastici || {}) },
            tesserinoTecnico: { ...defaultAllegatiState.tesserinoTecnico, ...(parsed.tesserinoTecnico || {}) },
            tesseraEnte: { ...defaultAllegatiState.tesseraEnte, ...(parsed.tesseraEnte || {}) },
            domandaTesseramento: { ...defaultAllegatiState.domandaTesseramento, ...(parsed.domandaTesseramento || {}) },
          };
        } catch (e) {
          console.error("Failed to parse attachmentMetadata on participant load", e);
          return prev;
        }
      });
    } else {
      // Legacy basic flags or empty state
      setAllegati(prev => ({
        ...prev,
        modelloDetrazione: { ...prev.modelloDetrazione, richiesto: member.detractionModelRequested ? "si" : "no", anno: member.detractionModelYear || "2026" },
        creditiScolastici: { ...prev.creditiScolastici, richiesto: member.schoolCreditsRequested ? "si" : "no", annoScolastico: member.schoolCreditsYear || "2025/2026" },
        tesserinoTecnico: { ...prev.tesserinoTecnico, numero: member.tesserinoTecnicoNumber || "" },
      }));
    }

    // Rehydrate bottom sections
    setBottomSectionsData((prev) => {
      let gift = typeof member.giftMetadata === 'string' ? JSON.parse(member.giftMetadata) : (member.giftMetadata || prev.gift);
      if (typeof gift === 'string') {
        try { gift = JSON.parse(gift); } catch(e) {}
      }
      
      const defaultTessere = {
        quota: "",
        pagamento: "",
        membershipType: "NUOVO", // Changed from nuovoRinnovo
        seasonCompetence: "CORRENTE", // Added
        dataScad: "",
        numero: "",
        fileInput: null,
        tesseraEnte: "",
        scadenzaTesseraEnte: ""
      };
      
      const defaultCertificato = {
        dataEmissione: "",
        dataScadenza: "",
        fileInput: null
      };

      let tessere = member.tessereMetadata 
        ? (typeof member.tessereMetadata === 'string' ? JSON.parse(member.tessereMetadata) : member.tessereMetadata) 
        : defaultTessere;
      if (typeof tessere === 'string') {
        try { tessere = JSON.parse(tessere); } catch(e) {}
      }
        
      let certificatoMedico = member.certificatoMedicoMetadata 
        ? (typeof member.certificatoMedicoMetadata === 'string' ? JSON.parse(member.certificatoMedicoMetadata) : member.certificatoMedicoMetadata) 
        : defaultCertificato;
      if (typeof certificatoMedico === 'string') {
        try { certificatoMedico = JSON.parse(certificatoMedico); } catch(e) {}
      }

      // Convert legacy single object to array
      if (gift && !Array.isArray(gift)) {
        if (gift.tipo || gift.valore || gift.numero) {
          gift = [{ ...gift, id: Date.now().toString() }];
        } else {
          gift = [];
        }
      }

      // Auto-open Gift section if there is data
      if (Array.isArray(gift) && gift.length > 0) {
        setShowGiftFields(true);
      } else {
        setShowGiftFields(false);
      }

      return {
        gift,
        tessere,
        certificatoMedico,
      };
    });

    // Set selected member ID for queries
    setSelectedMemberId(member.id);

    // Update photo
    if (member.photoUrl) {
      setPhotoFile({ file: null, preview: member.photoUrl });
    } else {
      setPhotoFile({ file: null, preview: null });
    }

    setShowResults(false);
    setSearchTerm(`${member.lastName} ${member.firstName} `);
    setDirtyFields({});
    sessionStorage.removeItem("mascheraInputDirtyFields");
    setIsSaved(true);
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      await apiRequest("DELETE", `/api/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Pagamento rimosso con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore rimozione pagamento", description: error.message, variant: "destructive" });
    }
  });

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

        // Rehydrate allegati state to keep the green boxes alive without re-selecting
        if (m.attachmentMetadata) {
          setAllegati((prev) => {
            try {
              const parsed = typeof m.attachmentMetadata === 'string' ? JSON.parse(m.attachmentMetadata) : m.attachmentMetadata;
              if (!parsed) return prev;
              return {
                ...defaultAllegatiState,
                ...parsed,
                regolamento: { ...defaultAllegatiState.regolamento, ...(parsed.regolamento || {}) },
                privacy: { ...defaultAllegatiState.privacy, ...(parsed.privacy || {}) },
                certificatoMedico: { ...defaultAllegatiState.certificatoMedico, ...(parsed.certificatoMedico || {}) },
                ricevutePagamenti: { ...defaultAllegatiState.ricevutePagamenti, ...(parsed.ricevutePagamenti || {}) },
                modelloDetrazione: { ...defaultAllegatiState.modelloDetrazione, ...(parsed.modelloDetrazione || {}) },
                creditiScolastici: { ...defaultAllegatiState.creditiScolastici, ...(parsed.creditiScolastici || {}) },
                tesserinoTecnico: { ...defaultAllegatiState.tesserinoTecnico, ...(parsed.tesserinoTecnico || {}) },
                tesseraEnte: { ...defaultAllegatiState.tesseraEnte, ...(parsed.tesseraEnte || {}) },
                domandaTesseramento: { ...defaultAllegatiState.domandaTesseramento, ...(parsed.domandaTesseramento || {}) },
              };
            } catch (e) {
              console.error("Failed to parse attachmentMetadata in onSuccess", e);
              return prev;
            }
          });
        }
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
      address: formData.indirizzo,
      city: formData.citta,
      province: formData.provincia,
      postalCode: formData.cap,
      dateOfBirth: formData.dataNascita,
      placeOfBirth: formData.luogoNascita,
      birthProvince: formData.provinciaNascita,
      gender: formData.sesso,
      isMinor: parseInt(formData.eta) < 18,
      participantType: formData.tipoPartecipante,
      
      // Legacy / Storico
      previousMembershipNumber: formData.previousMembershipNumber,
      athenaId: formData.athenaId,

      // Intestazione and defaults
      season: formData.stagione,
      internalId: formData.codiceId, // Will be overridden on the backend if new
      cardNumber: formData.tessera, // Will be overridden on the backend if new

      // Genitori
      motherFirstName: formData.nomeGen1 || null,
      motherLastName: formData.cognomeGen1 || null,
      motherFiscalCode: formData.cfGen1 || null,
      motherEmail: formData.emailGen1 || null,
      motherMobile: formData.telGen1 || null,
      motherStreetAddress: formData.indirizzoGen1 || null,
      motherCity: formData.cittaGen1 || null,
      motherProvince: formData.provinciaGen1 || null,
      motherPostalCode: formData.capGen1 || null,
      motherBirthDate: formData.dataNascitaGen1 || null,
      motherBirthPlace: formData.luogoNascitaGen1 || null,
      motherBirthProvince: formData.provinciaNascitaGen1 || null,

      fatherFirstName: formData.nomeGen2 || null,
      fatherLastName: formData.cognomeGen2 || null,
      fatherFiscalCode: formData.cfGen2 || null,
      fatherEmail: formData.emailGen2 || null,
      fatherMobile: formData.telGen2 || null,
      fatherStreetAddress: formData.indirizzoGen2 || null,
      fatherCity: formData.cittaGen2 || null,
      fatherProvince: formData.provinciaGen2 || null,
      fatherPostalCode: formData.capGen2 || null,
      fatherBirthDate: formData.dataNascitaGen2 || null,
      fatherBirthPlace: formData.luogoNascitaGen2 || null,
      fatherBirthProvince: formData.provinciaNascitaGen2 || null,

      // Allegati Flags (from allegati state)
      detractionModelRequested: allegati.modelloDetrazione.richiesto === "si",
      detractionModelYear: allegati.modelloDetrazione.anno,
      schoolCreditsRequested: allegati.creditiScolastici.richiesto === "si",
      schoolCreditsYear: allegati.creditiScolastici.annoScolastico,
      tesserinoTecnicoNumber: allegati.tesserinoTecnico.numero,
      attachmentMetadata: allegati, // The new JSON column containing everything
      giftMetadata: bottomSectionsData.gift,
      tessereMetadata: bottomSectionsData.tessere,
      certificatoMedicoMetadata: bottomSectionsData.certificatoMedico,

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

      // Identify if this payment is a membership fee
      const pAny = p as any;
      const isMembership = p.attivita === "Tesseramento" || p.attivita?.toLowerCase().includes("tessera") || pAny.quotaDescription?.toLowerCase().includes("tessera") || pAny.type === "membership";
      // 1. Prioritize UUID/static block ID if we had one (for now we use fiscalCode)
      // 2. MemberId if exists
      // 3. FiscalCode as fallback
      const referenceKey = memberData.id ? memberData.id.toString() : (formData.codiceFiscale || "unknown");

      return {
        courseId: parseInt(p.dettaglioId) || null,
        amount: p.totaleQuota?.toString() || "0.00",
        type: isMembership ? "membership" : p.attivita,
        status: isPending ? "pending" : "paid",
        tempId: isMembership ? "membership_fee" : p.attivita, 
        referenceKey: isMembership ? referenceKey : undefined,
        details: p
      };
    });

    saveMutation.mutate({ memberData, enrollments, payments: paymentsPayload });
  };

  const hasOrphanPayments = payments.some(p => !p.attivita || !p.dettaglioId);

  const etaMember = parseInt(formData.eta) || 0;
  const isMinor = etaMember > 0 && etaMember < 18;

  const cfCheck = useCFCheck(formData.codiceFiscale, selectedMemberId || undefined);
  const emailCheck = useEmailCheck(formData.email, isMinor, selectedMemberId || undefined);
  const phoneCheck = usePhoneCheck(formData.telefono, isMinor, selectedMemberId || undefined);

  const hasConflicts = (cfCheck.available === false) || 
                       (emailCheck.available === false && !isMinor) || 
                       (phoneCheck.available === false && !isMinor);
  const hasParentData = !!(
    (formData.nomeGen1?.trim() && formData.cognomeGen1?.trim() && formData.cfGen1?.trim()) ||
    (formData.nomeGen2?.trim() && formData.cognomeGen2?.trim() && formData.cfGen2?.trim())
  );

  const isFormValid = !!(
    formData.cognome?.trim() &&
    formData.nome?.trim() &&
    formData.codiceFiscale?.trim() &&
    formData.telefono?.trim() &&
    formData.email?.trim() &&
    (!isMinor || hasParentData) &&
    !hasOrphanPayments
  );

  // Stato campi Corso e Codice per ogni sotto-sezione Attività
  /* attivitaCorso moved to context */

  /* attivitaCodice moved to context */

  /* attivitaEnrollmentDetails moved to context */

  

  

  


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
        if (Object.keys(attivitaCorso).includes(payment.attivita)) {
          const key = payment.attivita as AttivitaKey;
          setAttivitaCorso(prev => ({ ...prev, [key]: String(corso.id) }));
          setAttivitaCodice(prev => ({ ...prev, [key]: corso.sku }));
        }
      }
    }

    // --- Tessere Legacy Auto-fill Logic è STRAPPATA VIA ---
    // Tutto il calcolo dei numeri tessera, anno d'inizio/fine e autogenerazione barcode
    // Ora è gestito in modo deterministico dal backend Node (server/utils/season.ts)
    // Check if there's existing tessere data to determine if it's a "RINNOVO"
    const hasTessereData = !!bottomSectionsData.tessere.numero;
    const defaultDateStr = new Date().toISOString().split('T')[0];

    setBottomSectionsData(prev => ({
      ...prev,
      tessere: {
        ...prev.tessere,
        pagamento: prev.tessere.pagamento || defaultDateStr,
        membershipType: hasTessereData ? "RINNOVO" : "NUOVO",
        seasonCompetence: "CORRENTE"
      }
    }));
    setDirtyFields(prev => ({ ...prev, tessere: true }));

    setEditingPaymentId(null);
  };

  const handleDeletePayment = (id: string) => {
    if (confirm("Sei sicuro di voler eliminare definitivamente questo pagamento? ATTENZIONE: l'azione è irreversibile.")) {
      deletePaymentMutation.mutate(parseInt(id));
      // Optionally update local state immediately for snappy UX, but invalidateQueries handles it.
      setPayments(payments.filter(p => String(p.id) !== id));
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
    setLocation('/importa');
  };

  const isGen1Active = formData.nomeGen1.trim() !== "" || formData.cognomeGen1.trim() !== "";
  const isGen2Active = formData.nomeGen2.trim() !== "" || formData.cognomeGen2.trim() !== "";

  // Top Tessera Info Computation
  const topTesseraMembership = memberMemberships && memberMemberships.length > 0 
    ? [...memberMemberships].sort((a: any, b: any) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime())[0]
    : null;
  const topTesseraNumero = topTesseraMembership ? topTesseraMembership.membershipNumber : bottomSectionsData.tessere.numero;
  let topTesseraScad = topTesseraMembership ? topTesseraMembership.expiryDate : bottomSectionsData.tessere.dataScad;
  if (topTesseraScad && topTesseraScad.includes('T')) {
      topTesseraScad = topTesseraScad.split('T')[0];
  }
  const isTesseraExpired = topTesseraScad && new Date(topTesseraScad) < new Date();
  const topTesseraClass = isTesseraExpired
    ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" 
    : "bg-transparent opacity-80 cursor-default";

  return (
    <div className="flex flex-col h-full" data-testid="page-maschera-input-generale">
      <div className="p-4 bg-amber-100/50 border-b border-amber-200 text-amber-800 flex items-center justify-between text-sm">
        <p><strong>🟡 Stai usando la maschera classica.</strong> La nuova Pratica Guidata sarà l'unico flusso dal 28 Maggio.</p>
        <Button variant="outline" size="sm" onClick={() => window.location.href = '/dossiers/nuovo/wizard'} className="border-amber-300 text-amber-700 hover:bg-amber-100">Provala ora</Button>
      </div>
      <datalist id="province-list">{["AG","AL","AN","AO","AP","AQ","AR","AT","AV","BA","BG","BI","BL","BN","BO","BR","BS","BT","BZ","CA","CB","CE","CH","CL","CN","CO","CR","CS","CT","CZ","EN","FC","FE","FG","FI","FM","FR","GE","GO","GR","IM","IS","KR","LC","LE","LI","LO","LT","LU","MB","MC","ME","MI","MN","MO","MS","MT","NA","NO","NU","OR","PA","PC","PD","PE","PG","PI","PN","PO","PR","PT","PU","PV","PZ","RA","RC","RE","RG","RI","RM","RN","RO","SA","SI","SO","SP","SR","SS","SU","SV","TA","TE","TN","TO","TP","TR","TS","TV","UD","VA","VB","VC","VE","VI","VR","VT","VV"].map(p => <option key={p} value={p} />)}</datalist>
      <datalist id="comuni-list">{["Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna", "Firenze", "Bari", "Catania", "Venezia", "Verona", "Messina", "Padova", "Trieste", "Brescia", "Terni", "Taranto", "Prato", "Parma", "Modena", "Reggio Calabria", "Reggio Emilia", "Perugia", "Ravenna", "Livorno", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara", "Sassari", "Latina", "Giugliano in Campania", "Monza", "Siracusa", "Pescara", "Bergamo", "Forlì", "Trento", "Vicenza", "Bolzano", "Novara", "Piacenza", "Ancona", "Andria", "Arezzo", "Udine", "Cesena", "Lecce"].map(c => <option key={c} value={c} />)}</datalist>
      {/* Header fisso con navigazione */}
      <div className="border-b bg-gradient-to-r from-slate-50 dark:from-background via-white to-slate-50 dark:to-background sticky top-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden">
        {/* Premium Decorators */}
        <div className="absolute top-[-20%] right-[-5%] w-[150px] h-[150px] rounded-full bg-primary/5 blur-[40px] pointer-events-none" />
        
        <div className="p-5 space-y-4 relative z-10">
          {/* Riga titolo e pulsanti azioni */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex bg-gradient-to-br from-primary/10 to-primary/5 p-2.5 rounded-xl border border-primary/10 shadow-inner">
                <Users className="w-6 h-6 text-primary drop-shadow-sm" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">Maschera Input Generale</h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Motore di registrazione e ricerca iscritti</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">

              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-pulisci" onClick={handleReset}>
                <RotateCcw className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Pulisci
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-background" data-testid="button-importa" onClick={handleImport}>
                <Download className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Importa
              </Button>
              <ExportWizard 
                filename={currentMember?.lastName && currentMember?.firstName ? `${currentMember.lastName}_${currentMember.firstName}` : 'utente'}
                title="Esporta Utente"
                data={currentMember ? (() => {
                  const latestPayment = combinedPayments && combinedPayments.length > 0 
                    ? [...combinedPayments].sort((a, b) => new Date(b.paidDate || b.paymentDate || b.dataPagamento || b.createdAt).getTime() - new Date(a.paidDate || a.paymentDate || a.dataPagamento || a.createdAt).getTime())[0] 
                    : null;
                  
                  const latestCert = memberMedicalCertificates && memberMedicalCertificates.length > 0 
                    ? [...memberMedicalCertificates].sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime())[0] 
                    : null;

                  const certExpiry = latestCert?.expiryDate || bottomSectionsData.certificatoMedico?.dataScadenza || currentMember.medicalCertificateExpiry || currentMember.certificatoMedicoMetadata?.dataScadenza || (formData && (formData as any).scadenzaCertificatoMedico ? (formData as any).scadenzaCertificatoMedico : '');
                  
                  // Se abbiamo lo status dal DB usiamo quello (traducendolo in italiano), altrimenti calcoliamo dalla data
                  let certStatus = '';
                  if (latestCert?.status === 'valid') certStatus = 'VALIDO';
                  else if (latestCert?.status === 'expired' || latestCert?.status === 'invalid') certStatus = 'SCADUTO';
                  else if (certExpiry) certStatus = new Date(certExpiry) > new Date() ? 'VALIDO' : 'SCADUTO';

                  return [{
                    ...currentMember,
                    membershipNumber: bottomSectionsData.tessere.numero || topTesseraNumero,
                    membershipExpiry: bottomSectionsData.tessere.dataScad || (topTesseraMembership ? topTesseraMembership.expiryDate : ''),
                    membershipStatus: bottomSectionsData.tessere.dataScad ? (new Date(bottomSectionsData.tessere.dataScad) > new Date() ? 'ATTIVA' : 'SCADUTA') : (topTesseraMembership ? (new Date(topTesseraMembership.expiryDate) > new Date() ? 'ATTIVA' : 'SCADUTA') : ''),
                    lastPaymentAmount: latestPayment ? (latestPayment.amount || latestPayment.importo || '') : '',
                    lastPaymentDate: latestPayment ? (latestPayment.paidDate || latestPayment.paymentDate || latestPayment.dataPagamento || '') : '',
                    medicalCertExpiry: certExpiry,
                    medicalCertStatus: certStatus
                  }];
                })() : []}
                expandable={true}
                columns={[
                  { key: 'id', label: 'ID Database', default: true },
                  { key: 'lastName', label: 'Cognome', default: true },
                  { key: 'firstName', label: 'Nome', default: true },
                  { key: 'fiscalCode', label: 'Codice Fiscale', default: true },
                  { key: 'email', label: 'Email', default: true },
                  { key: 'phone', label: 'Telefono', default: true },
                  { key: 'membershipNumber', label: 'Numero Tessera', default: true },
                  { key: 'membershipExpiry', label: 'Scadenza Tessera', default: true, type: 'date' },
                  { key: 'membershipStatus', label: 'Stato Tessera', default: true },
                  { key: 'lastPaymentAmount', label: 'Importo Ultimo Pagamento', default: false, type: 'number' },
                  { key: 'lastPaymentDate', label: 'Data Ultimo Pagamento', default: false, type: 'date' },
                  { key: 'medicalCertExpiry', label: 'Scadenza Certificato', default: false, type: 'date' },
                  { key: 'medicalCertStatus', label: 'Stato Certificato', default: false }
                ]}
              />
              <Button
                variant="outline"
                size="sm"
                className={`text-xs h-8 ${Object.keys(dirtyFields).length > 0 && isFormValid ? 'gold-3d-button' : 'bg-background'} `}
                data-testid="button-salva"
                disabled={!isFormValid || saveMutation.isPending || Object.keys(dirtyFields).length === 0 || hasConflicts}
                title={hasConflicts ? "Risolvi i conflitti prima di salvare" : (!isFormValid ? (hasOrphanPayments ? "Errore: Ci sono pagamenti orfani (senza attività). Correggi prima di salvare." : "Compila tutti i campi obbligatori (*) per salvare") : Object.keys(dirtyFields).length === 0 ? "Nessuna modifica da salvare" : "")}
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
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((member) => (
                    <div
                      key={member.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSelectMember(member)}
                    >
                      <div className="font-bold">{member.lastName} {member.firstName}</div>
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
              { id: "anagrafica", label: "Utente", icon: Users },
              { id: "pagamenti", label: "Pagamenti", icon: CreditCard },
              { id: "ricevute", label: "Ricevute", icon: Receipt },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Stato</Label>
                <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger className={getInputClassName("status", false)}>
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="inactive">Inattivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <Label>Codice ID</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-warning/100 text-warning800 border-warning300">Auto</Badge>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center line-clamp-1">Tipo Partecipante * {renderMancaDato(formData.tipoPartecipante)}</Label>
                <MultiSelectParticipantType
                  value={formData.tipoPartecipante || ""}
                  onChange={(v) => handleChange("tipoPartecipante", v)}
                  className={getInputClassName("tipoPartecipante", true)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tessera</Label>
                <Input value={topTesseraNumero || ''} readOnly disabled className={topTesseraClass} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Scadenza Tessera
                  {topTesseraScad && (
                    <div 
                      className={cn(
                        "px-2 py-0.5 text-xxs font-bold rounded-md border tracking-wide uppercase transition-colors",
                        isTesseraExpired 
                          ? "bg-red-50 dark:bg-red-950/20 text-red-600 border-red-300 shadow-sm shadow-red-100" 
                          : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-300 shadow-sm shadow-emerald-100"
                      )}
                    >
                      {isTesseraExpired ? "Scaduta" : "Attiva"}
                    </div>
                  )}
                </Label>
                <Input type="date" value={topTesseraScad || ''} readOnly disabled className={topTesseraClass} />
              </div>
              <div className="space-y-2">
                <Label>Tipo Certificato</Label>
                <Select value={bottomSectionsData.certificatoMedico.tipo} disabled>
                  <SelectTrigger className={`bg-transparent opacity-80 cursor-default`}>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_agonistico">Sportivo Non Agonistico</SelectItem>
                    <SelectItem value="agonistico">Sportivo Agonistico</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Scadenza Certificato</Label>
                <Input type="date" value={bottomSectionsData.certificatoMedico.dataScadenza} readOnly disabled className={`bg-transparent opacity-80 cursor-default`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ANAGRAFICA con ALLEGATI */}
        <div id="anagrafica" className="scroll-mt-32 flex flex-col lg:flex-row gap-4">
          <TabAllegati />

          <div className="flex-1 flex flex-col gap-4">
            <TabAnagrafica renderMancaDato={renderMancaDato} getInputClassName={getInputClassName} />
          </div>
        </div>

        <TabMarketing
          currentMember={currentMember}
          getInputClassName={getInputClassName}
        />

        {/* PAGAMENTI */}
        <Card id="pagamenti" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 sidebar-icon-gold" />
                Pagamenti
              </span>
              <Button
                size="sm"
                className="gold-3d-button"
                data-testid="button-aggiungi-pagamento"
                disabled={!selectedMemberId}
                onClick={() => {
                  setEditingPaymentId(null);
                  setIsNuovoPagamentoOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Nuovo Pagamento
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {!selectedMemberId ? (
                <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
                  Salva o seleziona un partecipante per sbloccare questa sezione
                </div>
              ) : (payments.length === 0 && (!memberPayments || memberPayments.length === 0)) ? (
                <div className="text-center py-8 text-muted-foreground border rounded bg-muted/20">
                  Nessun pagamento registrato. Clicca su "Nuovo Pagamento" per inserirne uno.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableTableHead sortKey="createdAt" currentSort={sortConfigPayments} onSort={handleSortPayments}>Data Ins.</SortableTableHead>
                        <SortableTableHead sortKey="attivita" currentSort={sortConfigPayments} onSort={handleSortPayments}>Attività</SortableTableHead>
                        <SortableTableHead sortKey="dettaglio" currentSort={sortConfigPayments} onSort={handleSortPayments}>Dettaglio</SortableTableHead>
                        <SortableTableHead sortKey="dataPagamento" currentSort={sortConfigPayments} onSort={handleSortPayments}>Data Pagamento</SortableTableHead>
                        <SortableTableHead sortKey="metodoPagamento" currentSort={sortConfigPayments} onSort={handleSortPayments}>Metodo di Pagamento</SortableTableHead>
                        <SortableTableHead sortKey="importo" currentSort={sortConfigPayments} onSort={handleSortPayments} className="text-right">Importo</SortableTableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPayments.map((payment, idx) => {
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
                            <TableCell className={cn(isSortedColumnPayments("createdAt") && "sorted-column-cell")}>{pDataInserimento ? new Date(pDataInserimento).toLocaleDateString('it-IT') : "-"}</TableCell>
                            <TableCell className={cn("capitalize", isSortedColumnPayments("attivita") && "sorted-column-cell")}>{pAttivita ? pAttivita.replace("-", " ") : "-"}</TableCell>
                            <TableCell className={cn(isSortedColumnPayments("dettaglio") && "sorted-column-cell")}>{pDettaglio || "-"}</TableCell>
                            <TableCell className={cn(isSortedColumnPayments("dataPagamento") && "sorted-column-cell")}>{pDataPagamento ? new Date(pDataPagamento).toLocaleDateString('it-IT') : "-"}</TableCell>
                            <TableCell className={cn(isSortedColumnPayments("metodoPagamento") && "sorted-column-cell")}>{pNote || "-"}</TableCell>
                            <TableCell className={cn("text-right", isSortedColumnPayments("importo") && "sorted-column-cell")}>€ {Number(pImporto).toFixed(2)}</TableCell>
                            <TableCell className="flex items-center gap-2 justify-end">
                              {!isExistingDBPayment && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Copia Testo per Email/WhatsApp"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-300"
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

            {/* Nuovo Pagamento Modal (Unificato MC3) */}
            <NuovoPagamentoModalMC3
              isOpen={isNuovoPagamentoOpen}
              onClose={() => setIsNuovoPagamentoOpen(false)}
              defaultMemberId={selectedMemberId ? Number(selectedMemberId) : undefined}
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

                <TabGift
          selectedMemberId={selectedMemberId}
          showGiftFields={showGiftFields}
          setShowGiftFields={setShowGiftFields}
          bottomSectionsData={bottomSectionsData}
          setBottomSectionsData={setBottomSectionsData}
          setDirtyFields={setDirtyFields}
          handleBottomSectionChange={handleBottomSectionChange}
          getBottomSectionClassName={getBottomSectionClassName}
        />

        <TabTessere 
          topTesseraMembership={topTesseraMembership}
          topTesseraNumero={topTesseraNumero}
          topTesseraScad={topTesseraScad}
          isTesseraExpired={isTesseraExpired}
        />

        <TabIscrizioni />
        <TabRicevute />
        {selectedMemberId && <StoriaProvenienzaTab memberId={Number(selectedMemberId)} />}

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
              I seguenti codici fiscali sono presenti in più di un utente. Clicca sul nome per visualizzare e modificare il utente.
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
                        {member.lastName} {member.firstName}
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

export default function MascheraInputGenerale(props?: any) {
  const urlParams = new URLSearchParams(window.location.search);
  const memberIdStr = props?.params?.id || urlParams.get('memberId') || urlParams.get('editMemberId');
  const actionFromUrl = urlParams.get('action');
  
  const storeMemberId = useMemberStore((state) => state.selectedMemberId);
  const finalMemberId = storeMemberId !== null ? storeMemberId : (memberIdStr ? Number(memberIdStr) : null);
  
  const [verificaStato, setVerificaStato] = useState<Record<string, boolean>>({
    telefono: false,
    email: false,
    cfGen1: false,
    cfGen2: false
  });

  const avviaVerifica = (type: string, field: string) => {
    setVerificaStato(prev => ({ ...prev, [field]: true }));
  };

  return (
    <CrmFormProvider
      selectedMemberId={finalMemberId}
      actionFromUrl={actionFromUrl}
      verificaStato={verificaStato}
      setVerificaStato={setVerificaStato}
      avviaVerifica={avviaVerifica}
    >
      <MascheraInputGeneraleContent {...props} />
    </CrmFormProvider>
  );
}
