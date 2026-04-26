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
  User, BookOpen, ShoppingBag, Calendar, Sparkles, Sun, Dumbbell, UserCheck, Award, Music, Database, Building2, Globe
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
import { NuovoPagamentoModal } from "@/components/nuovo-pagamento-modal";
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

export default function MascheraInputGenerale() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const memberIdFromUrl = urlParams.get('memberId') || urlParams.get('editMemberId');
  const actionFromUrl = urlParams.get('action');
  const { user } = useAuth();
  
  const canaliAcquisizione = useCustomListValues("provenienza_marketing");
  const quickAddCanale = useQuickAddCustomList("provenienza_marketing");
  const livelliCrm = useCustomListValues("livello_crm");
  const quickAddLivello = useQuickAddCustomList("livello_crm");

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

  const [allegati, setAllegati] = useState<AllegatiState>(() => {
    const saved = sessionStorage.getItem("mascheraInputAllegati");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultAllegatiState,
          ...parsed,
          // Ensure nested objects also fallback correctly
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
    try {
      sessionStorage.setItem("mascheraInputAllegati", JSON.stringify(allegati));
    } catch (e) {
      console.warn("Could not save allegati to sessionStorage (likely quota exceeded)", e);
    }
  }, [allegati]);

  // Unified Enrollment form states
  const [unifiedCourseId, setUnifiedCourseId] = useState<string>("");
  const [unifiedParticipationType, setUnifiedParticipationType] = useState<string>("STANDARD_COURSE");
  const [unifiedTargetDate, setUnifiedTargetDate] = useState<string>("");

  const [photoFile, setPhotoFile] = useState<{ file: File | null; preview: string | null }>(() => {
    const saved = sessionStorage.getItem("mascheraInputPhoto");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // We can only restore the base64 preview, not the actual File object
        return { file: null, preview: parsed.preview };
      } catch (e) {
        console.error("Failed to parse saved photo", e);
      }
    }
    return { file: null, preview: null };
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("mascheraInputPhoto", JSON.stringify({ preview: photoFile.preview }));
    } catch (e) {
      console.warn("Could not save photo to sessionStorage", e);
    }
  }, [photoFile]);

  const compressImage = (file: File, maxWidth = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/avif', 'image/tiff'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|heic|heif|webp|avif|tiff?)$/i)) {
      alert('Formato foto non supportato. Usa JPG, PNG, HEIC, HEIF o WebP.');
      return;
    }

    try {
      const compressedBase64 = await compressImage(file, 800, 0.7); // Photos can be smaller
      setPhotoFile({ file, preview: compressedBase64 });
      setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, photo: true }));
    } catch (e) {
      console.error("Compression failed", e);
      // Fallback to uncompressed if canvas fails
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoFile({ file, preview: e.target?.result as string });
        setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, photo: true }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile({ file: null, preview: null });
    setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, photo: true }));
  };

  const [openAllegatoSections, setOpenAllegatoSections] = useState<Record<string, boolean>>({});

  const toggleAllegatoSection = (key: string) => {
    setOpenAllegatoSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileUpload = async (key: keyof AllegatiState, file: File | null) => {
    if (!file) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato file non supportato. Usa PDF, JPG o PNG.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];

    // Compress images before saving to Base64 State to prevent MySQL packet size errors
    if (file.type.startsWith('image/')) {
      try {
        const compressedBase64 = await compressImage(file, 1200, 0.6); // Higher compression for attachments
        setAllegati(prev => ({
          ...prev,
          [key]: { ...prev[key], hasFile: true, fileName: file.name, data: today, previewUrl: compressedBase64 }
        }));
        setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
      } catch (e) {
        console.error("Attachment compression failed", e);
        // Fallback
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result as string;
          setAllegati(prev => ({
            ...prev,
            [key]: { ...prev[key], hasFile: true, fileName: file.name, data: today, previewUrl: base64Data }
          }));
          setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
        };
        reader.readAsDataURL(file);
      }
    } else {
      // PDFs shouldn't be compressed via Canvas
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        setAllegati(prev => ({
          ...prev,
          [key]: { ...prev[key], hasFile: true, fileName: file.name, data: today, previewUrl: base64Data }
        }));
        setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAllegatoFile = (key: keyof AllegatiState) => {
    if (confirm("Sei sicuro di voler rimuovere questo file?")) {
      setAllegati(prev => ({
        ...prev,
        [key]: { ...prev[key], hasFile: false, fileName: '', data: '', previewUrl: '' }
      }));
      setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
    }
  };

  const openPreview = (previewUrl?: string) => {
    if (!previewUrl) {
      alert("Anteprima non disponibile per questo file. Se è stato caricato prima dell'aggiornamento, ricaricalo per abilitare l'anteprima.");
      return;
    }
    const win = window.open();
    if (win) {
      if (previewUrl.startsWith('data:image/')) {
        win.document.write('<body style="margin:0;display:flex;justify-content:center;align-items:center;background:#f0f0f0;height:100vh;"><img src="' + previewUrl + '" style="max-width:100%; max-height:100%; object-fit:contain; box-shadow:0 10px 25px rgba(0,0,0,0.1);" /></body>');
      } else {
        win.document.write('<iframe src="' + previewUrl + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
      }
    }
  };

  const updateAllegato = (key: keyof AllegatiState, field: string, value: string | number) => {
    setAllegati(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
    setDirtyFields((prev: Record<string, boolean>) => ({ ...prev, allegati: true }));
  };

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
  const [selectedCourseToAdd, setSelectedCourseToAdd] = useState<string>("");
  const [selectedWorkshopToAdd, setSelectedWorkshopToAdd] = useState<string>("");
  const [showGiftFields, setShowGiftFields] = useState<boolean>(false);
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

  const renderMancaDato = (val: string | undefined | null) => {
    if (selectedMemberId && actionFromUrl !== "new" && (!val || String(val).trim() === "")) {
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-red-500 select-none pointer-events-none z-10">
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
      <span className="ml-auto bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] border border-warning200" title={`${count} iscrizioni attive`}>
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
                  <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className={e.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300 text-[10px] h-5' : 'text-[10px] h-5'}>
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

  const { data: memberMemberships, isLoading: loadingMemberships, error: errorMemberships } = useQuery<any[]>({
    queryKey: ["/api/memberships", "member", selectedMemberId],
    queryFn: async () => {
      const res = await fetch(`/api/memberships?memberId=${selectedMemberId}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error("Errore caricamento abbonamenti");
      }
      return res.json();
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
      if (!res.ok) throw new Error("Membro non trovato");
      return res.json();
    },
    enabled: !!selectedMemberId
  });

  const [isCrmOverrideOpen, setIsCrmOverrideOpen] = useState(false);
  const [crmOverrideData, setCrmOverrideData] = useState({ level: "NONE", reason: "", override: false });

  const recalculateCrmMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/crm/profile/${selectedMemberId}/recalculate`);
    },
    onSuccess: () => {
      refetchCurrentMember();
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Profilo CRM ricalcolato con successo" });
    }
  });

  const overrideCrmMutation = useMutation({
    mutationFn: async (data: { level: string, reason: string, override: boolean }) => {
      return await apiRequest("POST", `/api/crm/profile/${selectedMemberId}/override`, data);
    },
    onSuccess: () => {
      refetchCurrentMember();
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Forzatura CRM salvata" });
      setIsCrmOverrideOpen(false);
    }
  });

  const handleOpenCrmOverride = () => {
    setCrmOverrideData({
      level: currentMember?.crmProfileLevel || "NONE",
      reason: currentMember?.crmProfileReason || "",
      override: currentMember?.crmProfileOverride || false
    });
    setIsCrmOverrideOpen(true);
  };

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

  // Enrollment Mutations
  const addEnrollmentMutation = useMutation({
    mutationFn: async (data: { memberId?: string | number, courseId: number, participationType?: string, targetDate?: string | null, active?: boolean }) => {
      await apiRequest("POST", "/api/enrollments", {
        memberId: selectedMemberId,
        courseId: data.courseId,
        participationType: data.participationType || "STANDARD_COURSE",
        targetDate: data.targetDate || null,
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
            if (actionFromUrl === 'payment') {
              setIsNuovoPagamentoOpen(true);
            }
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
          .catch(err => console.error("Errore auto-loading membro da URL", err));
      }
    }
  }, [memberIdFromUrl, actionFromUrl]);

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
      sesso: member.gender || "",
      eta: eta,

      // Genitori
      nomeGen1: member.motherFirstName || "",
      cognomeGen1: member.motherLastName || "",
      cfGen1: member.motherFiscalCode || "",
      telGen1: member.motherPhone || "",
      emailGen1: member.motherEmail || "",

      nomeGen2: member.fatherFirstName || "",
      cognomeGen2: member.fatherLastName || "",
      cfGen2: member.fatherFiscalCode || "",
      fatherEmail: member.fatherEmail || "",
      fatherPhone: member.fatherPhone || "",

      // Intestazione defaults
      status: member.status || "active",
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
    (memberServEnrollments?.length || 0) +
    (memberWorkshopEnrollments?.length || 0);

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
    ? "bg-red-50 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" 
    : "bg-transparent opacity-80 cursor-default";

  return (
    <div className="flex flex-col h-full" data-testid="page-maschera-input-generale">
      <datalist id="province-list">{["AG","AL","AN","AO","AP","AQ","AR","AT","AV","BA","BG","BI","BL","BN","BO","BR","BS","BT","BZ","CA","CB","CE","CH","CL","CN","CO","CR","CS","CT","CZ","EN","FC","FE","FG","FI","FM","FR","GE","GO","GR","IM","IS","KR","LC","LE","LI","LO","LT","LU","MB","MC","ME","MI","MN","MO","MS","MT","NA","NO","NU","OR","PA","PC","PD","PE","PG","PI","PN","PO","PR","PT","PU","PV","PZ","RA","RC","RE","RG","RI","RM","RN","RO","SA","SI","SO","SP","SR","SS","SU","SV","TA","TE","TN","TO","TP","TR","TS","TV","UD","VA","VB","VC","VE","VI","VR","VT","VV"].map(p => <option key={p} value={p} />)}</datalist>
      <datalist id="comuni-list">{["Roma", "Milano", "Napoli", "Torino", "Palermo", "Genova", "Bologna", "Firenze", "Bari", "Catania", "Venezia", "Verona", "Messina", "Padova", "Trieste", "Brescia", "Terni", "Taranto", "Prato", "Parma", "Modena", "Reggio Calabria", "Reggio Emilia", "Perugia", "Ravenna", "Livorno", "Cagliari", "Foggia", "Rimini", "Salerno", "Ferrara", "Sassari", "Latina", "Giugliano in Campania", "Monza", "Siracusa", "Pescara", "Bergamo", "Forlì", "Trento", "Vicenza", "Bolzano", "Novara", "Piacenza", "Ancona", "Andria", "Arezzo", "Udine", "Cesena", "Lecce"].map(c => <option key={c} value={c} />)}</datalist>
      {/* Header fisso con navigazione */}
      <div className="border-b bg-gradient-to-r from-slate-50 via-white to-slate-50 sticky top-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden">
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
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">Maschera Input Generale</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Motore di registrazione e ricerca iscritti</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">

              <Button variant="outline" size="sm" className="text-xs h-8 bg-white" data-testid="button-pulisci" onClick={handleReset}>
                <RotateCcw className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Pulisci
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-white" data-testid="button-importa" onClick={handleImport}>
                <Download className="w-3 h-3 mr-1 sidebar-icon-gold" />
                Importa
              </Button>
              <ExportWizard 
                filename={currentMember?.lastName && currentMember?.firstName ? `${currentMember.lastName}_${currentMember.firstName}` : 'membro'}
                title="Esporta Membro"
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
                className={`text-xs h-8 ${Object.keys(dirtyFields).length > 0 && isFormValid ? 'gold-3d-button' : 'bg-white'} `}
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
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
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
                className="text-xs h-8 bg-white relative"
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
                        "px-2 py-0.5 text-[11px] font-bold rounded-md border tracking-wide uppercase transition-colors",
                        isTesseraExpired 
                          ? "bg-red-50 text-red-600 border-red-300 shadow-sm shadow-red-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-300 shadow-sm shadow-emerald-100"
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
          {/* FOTO + ALLEGATI DA INSERIRE - Colonna sinistra */}
          <div className="lg:w-40 shrink-0 space-y-4">
            {/* FOTO PARTECIPANTE */}
            <Card className={photoFile.preview ? "border-green-400 dark:border-green-700" : ""}>
              <CardHeader className={`pb-2 rounded-t-lg ${photoFile.preview ? 'bg-green-100 dark:bg-green-900/40' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                <CardTitle className={`flex items-center gap-2 text-sm font-bold ${photoFile.preview ? 'text-green-700 dark:text-green-300' : 'text-amber-800 dark:text-amber-200'}`}>
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
              <CardHeader className="p-3 bg-amber-100 dark:bg-amber-900/40 relative">
                <CardTitle className="text-[13px] font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider text-center">
                  ALLEGATI DA INSERIRE
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 relative">
                {!selectedMemberId && (
                  <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[1px] flex items-center justify-center p-4">
                    <div className="bg-amber-100 dark:bg-amber-900/90 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 p-3 rounded-md text-xs font-medium text-center shadow-lg shadow-amber-900/10">
                      I documenti si possono compilare solo quando è selezionato o salvato un partecipante.
                    </div>
                  </div>
                )}
                {/* DOMANDA DI TESSERAMENTO */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.domandaTesseramento.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('domandaTesseramento')}
                    data-testid="button-toggle-domanda-tesseramento"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${allegati.domandaTesseramento.hasFile ? 'text-success700 dark:text-success300' : 'text-amber-700 dark:text-amber-300'}`}>DOMANDA DI TESSERAMENTO</span>
                      {allegati.domandaTesseramento.hasFile ? (
                        <Check className="w-4 h-4 text-success600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.domandaTesseramento.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-success600 dark:text-success400">
                        <Check className="w-3 h-3" />
                        <span
                          className={`truncate max-w-[180px] ${allegati.domandaTesseramento.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={(e) => { e.stopPropagation(); openPreview(allegati.domandaTesseramento.previewUrl); }}
                        >
                          {allegati.domandaTesseramento.fileName || 'File caricato'}
                        </span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.domandaTesseramento && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border-2 border-dashed rounded-md p-3 text-center ${allegati.domandaTesseramento.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-700'}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-domanda-tesseramento"
                          onChange={(e) => {
                            handleFileUpload('domandaTesseramento', e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                          data-testid="input-upload-domanda-tesseramento"
                        />
                        {allegati.domandaTesseramento.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-success700 dark:text-success400">
                              <Check className="w-4 h-4" />
                              <span
                                className={`truncate max-w-[150px] ${allegati.domandaTesseramento.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={(e) => { e.stopPropagation(); openPreview(allegati.domandaTesseramento.previewUrl); }}
                              >
                                {allegati.domandaTesseramento.fileName || 'File caricato'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeAllegatoFile('domandaTesseramento'); }}
                              data-testid="button-remove-domanda-tesseramento"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="upload-domanda-tesseramento" className="cursor-pointer flex flex-col items-center gap-1" data-testid="label-upload-domanda-tesseramento">
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
                            className={`h-7 text-xs ${allegati.domandaTesseramento.data ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
                            value={allegati.domandaTesseramento.data || ''}
                            onChange={(e) => updateAllegato('domandaTesseramento', 'data', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Accettato</Label>
                          <Select
                            value={allegati.domandaTesseramento.accettato || ''}
                            onValueChange={(v) => updateAllegato('domandaTesseramento', 'accettato', v)}
                          >
                            <SelectTrigger className={`h-7 text-xs ${allegati.domandaTesseramento.accettato === 'si' ? 'bg-green-100 border-green-400 text-green-800' : allegati.domandaTesseramento.accettato === 'no' ? 'bg-orange-100 border-orange-400 text-orange-800' : ''}`}>
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

                {/* REGOLAMENTO */}
                <div className="border-b">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${allegati.regolamento.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('regolamento')}
                    data-testid="button-toggle-regolamento"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${allegati.regolamento.hasFile ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>REGOLAMENTO</span>
                      {allegati.regolamento.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.regolamento.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span
                          className={`truncate max-w-[180px] ${allegati.regolamento.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={(e) => { e.stopPropagation(); openPreview(allegati.regolamento.previewUrl); }}
                        >
                          {allegati.regolamento.fileName || 'File caricato'}
                        </span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.regolamento && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border-2 border-dashed rounded-md p-3 text-center ${allegati.regolamento.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-700'}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-regolamento"
                          onChange={(e) => {
                            handleFileUpload('regolamento', e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                          data-testid="input-upload-regolamento"
                        />
                        {allegati.regolamento.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span
                                className={`truncate max-w-[150px] ${allegati.regolamento.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={(e) => { e.stopPropagation(); openPreview(allegati.regolamento.previewUrl); }}
                              >
                                {allegati.regolamento.fileName || 'File caricato'}
                              </span>
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
                            className={`h-7 text-xs ${allegati.regolamento.data ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
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
                            <SelectTrigger className={`h-7 text-xs ${allegati.regolamento.accettato === 'si' ? 'bg-green-100 border-green-400 text-green-800' : allegati.regolamento.accettato === 'no' ? 'bg-orange-100 border-orange-400 text-orange-800' : ''}`}>
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
                    className={`p-3 cursor-pointer transition-colors ${allegati.privacy.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('privacy')}
                    data-testid="button-toggle-privacy"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${allegati.privacy.hasFile ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>PRIVACY</span>
                      {allegati.privacy.hasFile ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {allegati.privacy.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span
                          className={`truncate max-w-[180px] ${allegati.privacy.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={(e) => { e.stopPropagation(); openPreview(allegati.privacy.previewUrl); }}
                        >
                          {allegati.privacy.fileName || 'File caricato'}
                        </span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.privacy && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border-2 border-dashed rounded-md p-3 text-center ${allegati.privacy.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-700'}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-privacy"
                          onChange={(e) => {
                            handleFileUpload('privacy', e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                          data-testid="input-upload-privacy"
                        />
                        {allegati.privacy.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span
                                className={`truncate max-w-[150px] ${allegati.privacy.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={(e) => { e.stopPropagation(); openPreview(allegati.privacy.previewUrl); }}
                              >
                                {allegati.privacy.fileName || 'File caricato'}
                              </span>
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
                            className={`h-7 text-xs ${allegati.privacy.data ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
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
                            <SelectTrigger className={`h-7 text-xs ${allegati.privacy.accettata === 'si' ? 'bg-green-100 border-green-400 text-green-800' : allegati.privacy.accettata === 'no' ? 'bg-orange-100 border-orange-400 text-orange-800' : ''}`}>
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
                    className={`p-3 cursor-pointer transition-colors ${allegati.certificatoMedico.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
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
                    {allegati.certificatoMedico.hasFile && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                        <span
                          className={`truncate max-w-[180px] ${allegati.certificatoMedico.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                          onClick={(e) => { e.stopPropagation(); openPreview(allegati.certificatoMedico.previewUrl); }}
                        >
                          {allegati.certificatoMedico.fileName || 'File caricato'}
                        </span>
                      </div>
                    )}
                  </div>
                  {openAllegatoSections.certificatoMedico && (
                    <div className="p-3 pt-0 space-y-3">
                      <div className={`border-2 border-dashed rounded-md p-3 text-center ${allegati.certificatoMedico.hasFile ? 'border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-amber-300 dark:border-amber-700'}`}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          id="upload-certificato-medico"
                          onChange={(e) => {
                            handleFileUpload('certificatoMedico', e.target.files?.[0] || null);
                            e.target.value = '';
                          }}
                          data-testid="input-upload-certificato-medico"
                        />
                        {allegati.certificatoMedico.hasFile ? (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                              <Check className="w-4 h-4" />
                              <span
                                className={`truncate max-w-[150px] ${allegati.certificatoMedico.previewUrl ? 'cursor-pointer hover:underline' : ''}`}
                                onClick={(e) => { e.stopPropagation(); openPreview(allegati.certificatoMedico.previewUrl); }}
                              >
                                {allegati.certificatoMedico.fileName || 'File caricato'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeAllegatoFile('certificatoMedico'); }}
                              data-testid="button-remove-certificato-medico"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="upload-certificato-medico" className="cursor-pointer flex flex-col items-center gap-1" data-testid="label-upload-certificato-medico">
                            <FileUp className="w-6 h-6 text-amber-500" />
                            <span className="text-xs text-muted-foreground">Carica PDF, JPG o PNG</span>
                          </label>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Data Rilascio</Label>
                          <Input
                            type="date"
                            className={`h-7 text-xs ${allegati.certificatoMedico.dataRilascio ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
                            value={allegati.certificatoMedico.dataRilascio || ''}
                            onChange={(e) => updateAllegato('certificatoMedico', 'dataRilascio', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Scadenza</Label>
                          <Input
                            type="date"
                            className={`h-7 text-xs ${allegati.certificatoMedico.scadenza ? 'bg-green-100 border-green-300 dark:bg-green-900/30 text-green-900' : ''}`}
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
                          <SelectTrigger className={`h-7 text-xs ${allegati.certificatoMedico.tipo ? 'bg-green-100 border-green-300 text-green-900' : ''}`}>
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
                    className={`p-3 cursor-pointer transition-colors ${allegati.ricevutePagamenti.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
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
                    className={`p-3 cursor-pointer transition-colors ${allegati.modelloDetrazione.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
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
                    className={`p-3 cursor-pointer transition-colors ${allegati.creditiScolastici.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
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
                    className={`p-3 cursor-pointer transition-colors ${allegati.tesserinoTecnico.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
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
                    className={`p-3 cursor-pointer transition-colors ${allegati.tesseraEnte.hasFile ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleAllegatoSection('tesseraEnte')}
                    data-testid="button-toggle-tessera-ente"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">TESSERA ENTE</span>
                      {allegati.tesseraEnte.hasFile ? (
                        <Check className="w-4 h-4 text-success600" />
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
                    <Label className="flex items-center">Cognome <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input value={formData.cognome} onChange={(e) => handleChange("cognome", e.target.value)} className={getInputClassName("cognome", true)} />
                      {renderMancaDato(formData.cognome)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center">Nome <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input value={formData.nome} onChange={(e) => handleChange("nome", e.target.value)} className={getInputClassName("nome", true)} />
                      {renderMancaDato(formData.nome)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Codice Fiscale <span className="text-red-500 ml-1">*</span>
                      <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-destructive700 transition-colors" data-testid="link-generatore-cf">
                        <AlertTriangle className="w-4 h-4 cursor-pointer" />
                      </a>
                    </Label>
                    <div className="relative">
                      <Input
                        value={formData.codiceFiscale}
                        onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())}
                        className={getInputClassName("codiceFiscale", true)}
                      />
                      {renderMancaDato(formData.codiceFiscale)}
                      <ConflictBadge result={cfCheck} type="cf" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label className="flex items-center">Telefono <span className="text-red-500 ml-1">*</span></Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.telefono ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.telefono ? (
                          <CheckCircle2 className="w-4 h-4 text-success500" />
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
                    <div className="relative">
                      <Input
                        value={formData.telefono}
                        onChange={(e) => handleChange("telefono", e.target.value)}
                        className={`${getInputClassName("telefono", true)} ${verificaStato.telefono ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}`}
                      />
                      {renderMancaDato(formData.telefono)}
                      <ConflictBadge result={phoneCheck} type="telefono" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label className="flex items-center">Email <span className="text-red-500 ml-1">*</span></Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.email ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.email ? (
                          <CheckCircle2 className="w-4 h-4 text-success500" />
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
                    <div className="relative">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={`${getInputClassName("email", true)} ${verificaStato.email ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}`}
                      />
                      {renderMancaDato(formData.email)}
                      <ConflictBadge result={emailCheck} type="email" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center">Indirizzo residenza <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input placeholder="Via/Piazza, n. civico" value={formData.indirizzo} onChange={(e) => handleChange("indirizzo", e.target.value)} data-testid="input-indirizzo" className={getInputClassName("indirizzo", true)} />
                      {renderMancaDato(formData.indirizzo)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center">CAP <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input value={formData.cap} onChange={(e) => handleChange("cap", e.target.value)} data-testid="input-cap" className={getInputClassName("cap", true)} />
                      {renderMancaDato(formData.cap)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center">Città <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input value={formData.citta} list="comuni-list" onChange={(e) => handleChange("citta", e.target.value)} data-testid="input-citta" className={getInputClassName("citta", true)} />
                      {renderMancaDato(formData.citta)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input value={formData.provincia} list="province-list" onChange={(e) => handleChange("provincia", e.target.value)} data-testid="input-provincia" className={getInputClassName("provincia", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cod. Comune</Label>
                    <Input value={formData.codComune} onChange={(e) => handleChange("codComune", e.target.value)} data-testid="input-cod-comune" className={getInputClassName("codComune", false)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center line-clamp-1">Data di Nascita <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input
                        value={formData.dataNascita ? new Date(formData.dataNascita).toLocaleDateString('it-IT') : ''}
                        readOnly
                        className={getInputClassName("dataNascita", true, true)}
                      />
                      {renderMancaDato(formData.dataNascita)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center line-clamp-1">Luogo di Nascita <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input
                        value={formData.luogoNascita}
                        readOnly
                        className={getInputClassName("luogoNascita", true, true)}
                      />
                      {renderMancaDato(formData.luogoNascita)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center line-clamp-1">Prov. Nascita <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input
                        value={formData.provinciaNascita} list="province-list"
                        readOnly
                        className={getInputClassName("provinciaNascita", true, true)}
                      />
                      {renderMancaDato(formData.provinciaNascita)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center">Sesso <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input
                        value={formData.sesso === 'M' ? 'Maschio' : formData.sesso === 'F' ? 'Femmina' : ''}
                        readOnly
                        className={getInputClassName("sesso", true, true)}
                      />
                      {renderMancaDato(formData.sesso)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center">Età <span className="text-red-500 ml-1">*</span></Label>
                    <div className="relative">
                      <Input
                        value={formData.eta}
                        readOnly
                        className={getInputClassName("eta", true, true)}
                      />
                      {renderMancaDato(formData.eta)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {/* Tipo Partecipante è stato spostato nell'Intestazione */}
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
                      Codice Fiscale {isGen1Active && <span className="text-red-500 ml-1">*</span>}
                      <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-destructive700 transition-colors" data-testid="link-generatore-cf-gen1">
                        <AlertTriangle className="w-4 h-4 cursor-pointer" />
                      </a>
                    </Label>
                    <div className="relative">
                      <Input value={formData.cfGen1} onChange={(e) => handleChange("cfGen1", e.target.value.toUpperCase())} className={getInputClassName("cfGen1", isGen1Active)} />
                      {isGen1Active && renderMancaDato(formData.cfGen1)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Telefono {isGen1Active && <span className="text-red-500 ml-1">*</span>}</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.telGen1 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.telGen1 ? (
                          <CheckCircle2 className="w-4 h-4 text-success500" />
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
                    <div className="relative">
                      <Input
                        value={formData.telGen1}
                        onChange={(e) => handleChange("telGen1", e.target.value)}
                        className={`${getInputClassName("telGen1", isGen1Active)} ${verificaStato.telGen1 ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}`}
                      />
                      {isGen1Active && renderMancaDato(formData.telGen1)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Email {isGen1Active && <span className="text-red-500 ml-1">*</span>}</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.emailGen1 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.emailGen1 ? (
                          <CheckCircle2 className="w-4 h-4 text-success500" />
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
                    <div className="relative">
                      <Input
                        value={formData.emailGen1}
                        onChange={(e) => handleChange("emailGen1", e.target.value)}
                        className={`${getInputClassName("emailGen1", isGen1Active)} ${verificaStato.emailGen1 ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}`}
                      />
                      {isGen1Active && renderMancaDato(formData.emailGen1)}
                    </div>
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
                    <Input value={formData.cittaGen1} list="comuni-list" onChange={(e) => handleChange("cittaGen1", e.target.value)} data-testid="input-citta-gen1" className={getInputClassName("cittaGen1", false)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input value={formData.provinciaGen1} list="province-list" onChange={(e) => handleChange("provinciaGen1", e.target.value)} data-testid="input-provincia-gen1" className={getInputClassName("provinciaGen1", false)} />
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
                      className={`${getInputClassName("dataNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Luogo di Nascita</Label>
                    <Input
                      value={formData.luogoNascitaGen1}
                      readOnly
                      className={`${getInputClassName("luogoNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prov. Nascita</Label>
                    <Input
                      value={formData.provinciaNascitaGen1} list="province-list"
                      readOnly
                      className={`${getInputClassName("provinciaNascitaGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sesso</Label>
                    <Input
                      value={formData.sessoGen1 === 'M' ? 'M' : formData.sessoGen1 === 'F' ? 'F' : ''}
                      readOnly
                      className={`${getInputClassName("sessoGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Età</Label>
                    <Input
                      value={formData.etaGen1}
                      readOnly
                      className={`${getInputClassName("etaGen1", false, true)} ${!formData.cfGen1 && 'border-destructive400 bg-destructive/50'}`}
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
                      Codice Fiscale {isGen2Active && <span className="text-red-500 ml-1">*</span>}
                      <a href="/generatore-cf-stranieri" target="_blank" rel="noopener noreferrer" title="Attenzione, per gli stranieri senza codice fiscale clicca qui" className="text-destructive hover:text-destructive700 transition-colors" data-testid="link-generatore-cf-gen2">
                        <AlertTriangle className="w-4 h-4 cursor-pointer" />
                      </a>
                    </Label>
                    <div className="relative">
                      <Input value={formData.cfGen2} onChange={(e) => handleChange("cfGen2", e.target.value.toUpperCase())} className={getInputClassName("cfGen2", isGen2Active)} />
                      {isGen2Active && renderMancaDato(formData.cfGen2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Telefono {isGen2Active && <span className="text-red-500 ml-1">*</span>}</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.telGen2 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.telGen2 ? (
                          <CheckCircle2 className="w-4 h-4 text-success500" />
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
                    <div className="relative">
                      <Input
                        value={formData.telGen2}
                        onChange={(e) => handleChange("telGen2", e.target.value)}
                        className={`${getInputClassName("telGen2", isGen2Active)} ${verificaStato.telGen2 ? "bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700" : ""}`}
                      />
                      {isGen2Active && renderMancaDato(formData.telGen2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>Email {isGen2Active && <span className="text-red-500 ml-1">*</span>}</Label>
                      <span
                        className="ml-1 cursor-help"
                        title={verificaStato.emailGen2 ? "Verificato" : "Da verificare - clicca il bottone per verificare"}
                      >
                        {verificaStato.emailGen2 ? (
                          <CheckCircle2 className="w-4 h-4 text-success500" />
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
                    <div className="relative">
                      <Input
                        value={formData.emailGen2}
                        onChange={(e) => handleChange("emailGen2", e.target.value)}
                        className={`${getInputClassName("emailGen2", isGen2Active)} ${verificaStato.emailGen2 ? "bg-green-50 border-green-300" : ""}`}
                      />
                      {isGen2Active && renderMancaDato(formData.emailGen2)}
                    </div>
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
                    <Input value={formData.cittaGen2} list="comuni-list" onChange={(e) => handleChange("cittaGen2", e.target.value)} data-testid="input-citta-gen2" />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input value={formData.provinciaGen2} list="province-list" onChange={(e) => handleChange("provinciaGen2", e.target.value)} data-testid="input-provincia-gen2" />
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
                      className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Luogo di Nascita</Label>
                    <Input
                      value={formData.luogoNascitaGen2}
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prov. Nascita</Label>
                    <Input
                      value={formData.provinciaNascitaGen2} list="province-list"
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sesso</Label>
                    <Input
                      value={formData.sessoGen2 === 'M' ? 'M' : formData.sessoGen2 === 'F' ? 'F' : ''}
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Età</Label>
                    <Input
                      value={formData.etaGen2}
                      readOnly
                      className={`${formData.cfGen2 ? 'bg-warning/50 border-warning300' : 'border-destructive400 bg-destructive/50'} `}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        {/* ATTIVITÀ DI MARKETING (FULL WIDTH ROW) */}
        <Card id="attivita-marketing" className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 scroll-mt-32">
          <CardHeader className="pb-3 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg border-b border-amber-200/50">
            <CardTitle className="flex items-center justify-between text-lg font-bold text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center">🎯</span>
                Attività di marketing
              </div>
              {currentMember && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-white dark:bg-transparent"
                    onClick={(e) => { e.preventDefault(); recalculateCrmMutation.mutate(); }}
                    disabled={recalculateCrmMutation.isPending}
                    title="Ricalcola Scoring"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", recalculateCrmMutation.isPending && "animate-spin")} />
                    Ricalcola
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 bg-white dark:bg-transparent border-amber-300 hover:bg-amber-100"
                    onClick={(e) => { e.preventDefault(); handleOpenCrmOverride(); }}
                    title="Impostazioni Manuali"
                  >
                    <Settings2 className="w-4 h-4 mr-2 text-muted-foreground" />
                    Forzatura
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
              
              {/* Da Dove Arriva */}
              <div className="space-y-2 col-span-1">
                <div className="flex items-center gap-2">
                  <Label className="uppercase text-xs font-semibold text-muted-foreground">Canale di Acquisizione</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" size="icon" variant="ghost" className="h-4 w-4">
                        <Edit className="w-3 h-3 text-slate-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => e.stopPropagation()}>
                      <InlineListEditorDialog listCode="canale_acquisizione" listName="Canale Acquisizione" showColors={false} />
                    </PopoverContent>
                  </Popover>
                </div>
                <Combobox
                  name="daDoveArriva"
                  value={formData.daDoveArriva || ""}
                  onValueChange={(v) => handleChange("daDoveArriva", v)}
                  options={canaliAcquisizione.map((c: string) => ({ value: c, label: c }))}
                  placeholder="Seleziona o cerca..."
                  emptyText="Nessun canale trovato"
                  className={`bg-white dark:bg-transparent ${getInputClassName("daDoveArriva", false)}`}
                  onQuickAdd={(v) => quickAddCanale.mutate(v)}
                  isQuickAddPending={quickAddCanale.isPending}
                />
              </div>

              {/* Dati CRM Real-Time */}
              {currentMember ? (
                <>
                  <div className="space-y-2 col-span-1">
                    <div className="flex flex-col gap-1 items-start">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help hover:text-amber-600 transition-colors">
                              <Label className="uppercase text-xs font-semibold text-muted-foreground cursor-help">Livello & Score</Label>
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px] bg-white dark:bg-slate-900 border-amber-200">
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              Il livello marketing viene assegnato automaticamente in base a spesa, continuità, numero di attività e recente partecipazione. Il modello può essere aggiornato nel tempo per migliorare la classificazione.
                              <br/><br/>
                              Fattori considerati (Score 0-100):
                              <ul className="list-disc ml-4 my-1">
                                <li>Spesa ultimi 12 mesi</li>
                                <li>Continuità (Frequenza)</li>
                                <li>Numero attività/servizi</li>
                                <li>Recency (Attività recente)</li>
                              </ul>
                              <br/>
                              I livelli previsti sono: <strong>Silver, Gold, Platinum, Diamond</strong>.
                              <br/><br/>
                              La forzatura manuale è solo eccezione amministrativa e riposizione questo calcolo automatico.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-3 h-10">
                      {currentMember?.crmProfileLevel && currentMember.crmProfileLevel !== "NONE" ? (
                        <Badge className={
                          currentMember.crmProfileLevel === 'DIAMOND' ? 'bg-cyan-500 border-cyan-500 text-white w-[110px] h-7 text-sm flex justify-center shadow-sm shadow-cyan-200/50' :
                          currentMember.crmProfileLevel === 'PLATINUM' ? 'bg-slate-900 border-slate-900 text-white w-[110px] h-7 text-sm flex justify-center' : 
                          currentMember.crmProfileLevel === 'GOLD' ? 'bg-amber-500 border-amber-500 text-white w-[110px] h-7 text-sm flex justify-center' : 
                          'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300 w-[110px] h-7 text-sm flex justify-center'
                        }>
                          {currentMember.crmProfileLevel}
                        </Badge>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">-</span>
                      )}

                      {currentMember?.crmProfileLevel && currentMember.crmProfileLevel !== "NONE" && (
                        <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                          {currentMember.crmProfileScore || 0} <span className="text-sm font-normal">pts</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="uppercase text-xs font-semibold text-muted-foreground flex items-center gap-2">
                      Dettagli Algoritmo
                      {currentMember?.crmProfileOverride && (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 h-5 text-[10px] px-1.5 flex items-center gap-1 cursor-help leading-none" title="Forzatura manuale attiva">
                          <ShieldAlert className="w-3 h-3" />
                          Forzato
                        </Badge>
                      )}
                    </Label>
                    <div className="bg-white/50 dark:bg-black/20 p-2.5 rounded-md border border-amber-200/50 min-h-[40px] flex items-center text-sm text-muted-foreground break-words italic">
                      {currentMember?.crmProfileReason || "Nessun ricalcolo effettuato di recente."}
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-3 flex items-center justify-center p-4 border border-dashed border-amber-300 rounded-md bg-white/30 text-amber-800/60 text-sm">
                  Salva o seleziona un partecipante per attivare il calcolo CRM.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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

        {/* GIFT - BUONO - RESO - HELLO GEM */}
        <Card id="gift" className="scroll-mt-32">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between gap-2 text-lg">
              <span className="flex items-center gap-2">
                <Gift className="w-5 h-5 sidebar-icon-gold" />
                Gift - Buono - Reso - Hello Gem
              </span>
              <Button
                size="sm"
                className="gold-3d-button"
                data-testid="button-aggiungi-gift"
                disabled={!selectedMemberId}
                onClick={() => {
                  setShowGiftFields(true);
                  setBottomSectionsData(prev => ({
                    ...prev,
                    gift: [...prev.gift, { id: Date.now().toString(), tipo: "", valore: "", numero: "", dataEmissione: "", dataScadenza: "", motivazione: "", dataUtilizzo: "", iban: "" }]
                  }));
                  setDirtyFields(prev => ({ ...prev, gift_added: true }));
                }}
              >
                <Plus className="w-4 h-4" />
                Aggiungi
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedMemberId ? (
              <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
                Salva o seleziona un partecipante per sbloccare questa sezione
              </div>
            ) : showGiftFields && bottomSectionsData.gift.length > 0 ? (
              <div className="space-y-8">
                {bottomSectionsData.gift.map((item, index) => (
                  <div key={item.id || index} className="space-y-4 relative pt-4 border-t border-border/50 first:pt-0 first:border-t-0">
                    {index > 0 && (
                      <div className="absolute top-4 right-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-8 px-2"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler rimuovere questo elemento?")) {
                              setBottomSectionsData(prev => ({ ...prev, gift: prev.gift.filter((_, i) => i !== index) }));
                              setDirtyFields(prev => ({ ...prev, gift_removed: true }));
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Rimuovi
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={item.tipo} onValueChange={(v) => handleBottomSectionChange('gift', 'tipo', v, index)}>
                          <SelectTrigger className={getBottomSectionClassName('gift', `tipo_${index}`)}>
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
                        <Input type="number" value={item.valore} onChange={(e) => handleBottomSectionChange('gift', 'valore', e.target.value, index)} className={getBottomSectionClassName('gift', `valore_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Numero</Label>
                        <Input value={item.numero} onChange={(e) => handleBottomSectionChange('gift', 'numero', e.target.value, index)} className={getBottomSectionClassName('gift', `numero_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Emissione</Label>
                        <Input type="date" value={item.dataEmissione} onChange={(e) => handleBottomSectionChange('gift', 'dataEmissione', e.target.value, index)} className={getBottomSectionClassName('gift', `dataEmissione_${index}`)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Data Scadenza</Label>
                        <Input type="date" value={item.dataScadenza} onChange={(e) => handleBottomSectionChange('gift', 'dataScadenza', e.target.value, index)} className={getBottomSectionClassName('gift', `dataScadenza_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Acquistato/Utilizzato per - Motivazione</Label>
                        <Input value={item.motivazione} onChange={(e) => handleBottomSectionChange('gift', 'motivazione', e.target.value, index)} className={getBottomSectionClassName('gift', `motivazione_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Utilizzo/Reso (Convalida)</Label>
                        <Input type="date" value={item.dataUtilizzo} onChange={(e) => handleBottomSectionChange('gift', 'dataUtilizzo', e.target.value, index)} className={getBottomSectionClassName('gift', `dataUtilizzo_${index}`)} />
                      </div>
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input value={item.iban} onChange={(e) => handleBottomSectionChange('gift', 'iban', e.target.value, index)} className={getBottomSectionClassName('gift', `iban_${index}`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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
            {!selectedMemberId ? (
              <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
                Salva o seleziona un partecipante per sbloccare questa sezione
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="flex justify-end items-center mb-4">
                  {selectedMemberId && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setLocation(`/tessere-certificati?newTessera=true&memberId=${selectedMemberId}`)}
                    >
                      <Plus className="w-4 h-4" />
                      Nuova Tessera
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    const isReadOnly = !!topTesseraMembership;
                    const isEntityCardReadOnly = topTesseraMembership && !!topTesseraMembership.entityCardNumber;
                    const hasEntityCard = !!(formData.tesseraEnte || formData.scadenzaTesseraEnte || topTesseraMembership?.entityCardNumber);
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Quota Tessera</Label>
                            <Input 
                              type={isNaN(Number(
                                (!topTesseraMembership?.fee || Number(topTesseraMembership.fee) === 0) && !isTesseraExpired && topTesseraMembership
                                  ? "importa dati db" 
                                  : (topTesseraMembership?.fee || bottomSectionsData.tessere.quota)
                              )) ? "text" : "number"} 
                              value={
                                (!topTesseraMembership?.fee || Number(topTesseraMembership.fee) === 0) && !isTesseraExpired && topTesseraMembership
                                  ? "importa dati db" 
                                  : (topTesseraMembership?.fee || bottomSectionsData.tessere.quota)
                              } 
                              readOnly={isReadOnly} 
                              disabled={isReadOnly} 
                              onChange={(e) => handleBottomSectionChange('tessere', 'quota', e.target.value)} 
                              className={getBottomSectionClassName('tessere', 'quota')} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Pagamento Tessera</Label>
                            <Input type="date" value={topTesseraMembership?.issueDate ? new Date(topTesseraMembership.issueDate).toISOString().split('T')[0] : bottomSectionsData.tessere.pagamento} readOnly={true} disabled={true} onChange={(e) => handleBottomSectionChange('tessere', 'pagamento', e.target.value)} className="bg-muted text-muted-foreground opacity-100" />
                          </div>
                          <div className="space-y-2">
                             <Label>Tipo</Label>
                             <Select 
                               value={topTesseraMembership?.renewalType ? topTesseraMembership.renewalType.toUpperCase() : bottomSectionsData.tessere.membershipType} 
                               disabled={isReadOnly}
                               onValueChange={(val) => handleBottomSectionChange('tessere', 'membershipType', val)}
                             >
                               <SelectTrigger className={getBottomSectionClassName('tessere', 'membershipType')}>
                                 <SelectValue placeholder="Seleziona Tipo" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="NUOVO">Nuovo</SelectItem>
                                 <SelectItem value="RINNOVO">Rinnovo</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="space-y-2">
                             <Label>Competenza</Label>
                             <Select 
                               value={topTesseraMembership?.seasonCompetence || bottomSectionsData.tessere.seasonCompetence} 
                               disabled={isReadOnly}
                               onValueChange={(val) => handleBottomSectionChange('tessere', 'seasonCompetence', val)}
                             >
                               <SelectTrigger className={getBottomSectionClassName('tessere', 'seasonCompetence')}>
                                 <SelectValue placeholder="Seleziona Competenza" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="CORRENTE">Corrente</SelectItem>
                                 <SelectItem value="SUCCESSIVA">Successiva</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
                           <div className="space-y-2">
                             <Label>Data Scadenza (Auto)</Label>
                             <Input 
                               type="date" 
                               value={
                                 (topTesseraMembership?.expiryDate ? new Date(topTesseraMembership.expiryDate).toISOString().split('T')[0] : null) 
                                 || topTesseraScad 
                                 || bottomSectionsData.tessere.dataScad
                               } 
                               readOnly={true} 
                               disabled={true} 
                               onChange={(e) => handleBottomSectionChange('tessere', 'dataScad', e.target.value)} 
                               className="bg-muted text-muted-foreground opacity-100 placeholder:italic" 
                               placeholder="Calcolata da sistema"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label>N. Tessera (Auto)</Label>
                             <Input value={topTesseraNumero || bottomSectionsData.tessere.numero} placeholder="Assegnato post-salvataggio" readOnly={true} disabled={true} className="bg-muted text-muted-foreground opacity-100" />
                           </div>
                          <div className="space-y-2">
                             <Label>Barcode</Label>
                             <Input value={topTesseraMembership?.barcode || (topTesseraNumero ? `T${topTesseraNumero.replace('-', '')}` : '')} readOnly disabled className={`bg-transparent opacity-80 cursor-default`} />
                          </div>
                          <div className="space-y-2">
                             <Label>Stato</Label>
                             <div className="h-10 flex items-center">
                               {topTesseraMembership ? (
                                 <Badge variant={!isTesseraExpired ? 'default' : 'secondary'} className={isTesseraExpired ? "bg-red-50 text-red-600 border-red-300" : "shadow-sm"}>
                                   {!isTesseraExpired ? 'Attiva' : 'Scaduta'}
                                 </Badge>
                               ) : (
                                 <span className="text-sm text-muted-foreground italic">Nessuna</span>
                               )}
                             </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Tessera Ente</Label>
                            <Input 
                              value={
                                topTesseraMembership?.entityCardNumber 
                                || formData.tesseraEnte 
                                || bottomSectionsData.tessere.tesseraEnte 
                                || ((!topTesseraMembership?.entityCardNumber && !isTesseraExpired && topTesseraMembership) ? "Libertas" : "")
                              } 
                              readOnly={isEntityCardReadOnly} 
                              disabled={isEntityCardReadOnly} 
                              onChange={(e) => handleBottomSectionChange('tessere', 'tesseraEnte', e.target.value)} 
                              className={getBottomSectionClassName('tessere', 'tesseraEnte')} 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Scadenza Tessera Ente</Label>
                            <Input type="date" value={hasEntityCard ? (topTesseraMembership?.entityCardExpiryDate ? new Date(topTesseraMembership.entityCardExpiryDate).toISOString().split('T')[0] : (formData.scadenzaTesseraEnte ? new Date(formData.scadenzaTesseraEnte).toISOString().split('T')[0] : '')) : bottomSectionsData.tessere.scadenzaTesseraEnte} readOnly={true} disabled={true} onChange={(e) => handleBottomSectionChange('tessere', 'scadenzaTesseraEnte', e.target.value)} className={getBottomSectionClassName('tessere', 'scadenzaTesseraEnte')} />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
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
            {!selectedMemberId ? (
              <div className="text-center p-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed my-4">
                Salva o seleziona un partecipante per sbloccare questa sezione
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Data Scadenza Certificato</Label>
                    <Input type="date" value={bottomSectionsData.certificatoMedico.dataScadenza} onChange={(e) => handleBottomSectionChange('certificatoMedico', 'dataScadenza', e.target.value)} className={getBottomSectionClassName('certificatoMedico', 'dataScadenza')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data di Rinnovo</Label>
                    <Input type="date" value={bottomSectionsData.certificatoMedico.dataRinnovo} onChange={(e) => handleBottomSectionChange('certificatoMedico', 'dataRinnovo', e.target.value)} className={getBottomSectionClassName('certificatoMedico', 'dataRinnovo')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Rilasciato Da</Label>
                    <Input 
                      value={
                        bottomSectionsData.certificatoMedico.rilasciatoDa
                      } 
                      onChange={(e) => handleBottomSectionChange('certificatoMedico', 'rilasciatoDa', e.target.value)} 
                      className={getBottomSectionClassName('certificatoMedico', 'rilasciatoDa')} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pagamento</Label>
                    <Input 
                      type="number" 
                      placeholder="€ 40" 
                      value={
                        bottomSectionsData.certificatoMedico.pagamento
                      } 
                      onChange={(e) => handleBottomSectionChange('certificatoMedico', 'pagamento', e.target.value)} 
                      className={getBottomSectionClassName('certificatoMedico', 'pagamento')} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>A Noi</Label>
                    <Input 
                      type="number" 
                      placeholder="12,5" 
                      value={
                        bottomSectionsData.certificatoMedico.aNoi
                      } 
                      onChange={(e) => handleBottomSectionChange('certificatoMedico', 'aNoi', e.target.value)} 
                      className={getBottomSectionClassName('certificatoMedico', 'aNoi')} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo Certificato</Label>
                    <Select 
                      value={
                        bottomSectionsData.certificatoMedico.tipo
                      } 
                      onValueChange={(v) => handleBottomSectionChange('certificatoMedico', 'tipo', v)}
                    >
                      <SelectTrigger className={getBottomSectionClassName('certificatoMedico', 'tipo')}>
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
              </>
            )}
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
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
                  {/* Active Enrollments List (Read-Only) */}
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
                          <div key={e.id} className="grid grid-cols-[130px_160px_180px_160px_1fr_auto] items-center p-2.5 bg-muted/20 border rounded-md group hover:bg-muted/40 transition-colors gap-3">

                            {/* Nome Corso */}
                            <div className="font-bold text-sm truncate" title={course?.name}>
                              {course?.name || 'Corso sconosciuto'}
                            </div>

                            {/* Codice Corso (SKU) */}
                            <div className="font-medium text-[11px] text-slate-900 truncate" title={course?.sku || undefined}>
                              {course?.sku}
                            </div>

                            {/* Info Temporali */}
                            <div className="text-xs text-muted-foreground flex flex-col gap-0.5 truncate">
                              <span>Iscritto: {new Date(e.enrollmentDate).toLocaleDateString('it-IT')}</span>
                              {course?.dayOfWeek && <span>• {course.dayOfWeek} {course.startTime}</span>}
                            </div>
                            
                            {/* Dettagli Partecipazione (Modalità) */}
                            <div className="flex flex-col items-start gap-1 overflow-hidden">
                              {e.participationType === 'FREE_TRIAL' && <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 font-medium">Prova Gratuita</Badge>}
                              {e.participationType === 'PAID_TRIAL' && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-medium">Prova a Pagamento</Badge>}
                              {e.participationType === 'SINGLE_LESSON' && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-medium">Lezione Singola</Badge>}
                              {(!e.participationType || e.participationType === 'STANDARD_COURSE') && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 font-medium">Iscrizione Standard</Badge>}
                              
                              {e.targetDate && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium mt-0.5">
                                  <Calendar className="w-2.5 h-2.5"/>
                                  {new Date(e.targetDate).toLocaleDateString('it-IT')}
                                </span>
                              )}
                            </div>

                            {/* Dettagli Opzionali (Note Extra) */}
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
                              <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className={e.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300 text-[10px] h-5' : 'text-[10px] h-5'}>
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
            <div className="opacity-75 grayscale-[20%]">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-muted/30 px-2 py-1 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground line-through decoration-muted-foreground/50">Prove a Pagamento</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-normal">Sola Lettura (Usa modulo Corsi)</Badge>
              </h3>
              {renderGenericEnrollmentList(memberPtEnrollments, paidTrials, removePtEnrollmentMutation, "Nessuna prova a pagamento registrata.", "Storico Prove a Pagamento", "le prove a pagamento", "paidTrialId")}
            </div>

            {/* PROVE GRATUITE */}
            <div className="opacity-75 grayscale-[20%]">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-muted/30 px-2 py-1 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground line-through decoration-muted-foreground/50">Prove Gratuite</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-normal">Sola Lettura (Usa modulo Corsi)</Badge>
              </h3>
              {renderGenericEnrollmentList(memberFtEnrollments, freeTrials, removeFtEnrollmentMutation, "Nessuna prova gratuita registrata.", "Storico Prove Gratuite", "le prove gratuite", "freeTrialId")}
            </div>

            {/* LEZIONI SINGOLE */}
            <div className="opacity-75 grayscale-[20%]">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-muted/30 px-2 py-1 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground line-through decoration-muted-foreground/50">Lezioni Singole</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-normal">Sola Lettura (Usa modulo Corsi)</Badge>
              </h3>
              {renderGenericEnrollmentList(memberSlEnrollments, singleLessons, removeSlEnrollmentMutation, "Nessuna lezione singola registrata.", "Storico Lezioni Singole", "le lezioni singole", "singleLessonId")}
            </div>

            {/* WORKSHOP */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Calendar className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/workshop" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-workshop">Workshop</Link>
                <KnowledgeInfo id="workshop" />
                <SectionBadge count={memberWorkshopEnrollments?.length || 0} />
              </h3>

              {renderGenericEnrollmentList(memberWorkshopEnrollments, workshops, removeWorkshopEnrollmentMutation, "Nessun workshop registrato.", "Workshop Registrati", "i workshop", "workshopId")}
            </div>

            {/* DOMENICHE IN MOVIMENTO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Sun className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/domeniche-movimento" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-domeniche-movimento">Domeniche in Movimento</Link>
                <KnowledgeInfo id="domeniche-in-movimento" />
                <SectionBadge count={memberSaEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberSaEnrollments, sundayActivities, removeSaEnrollmentMutation, "Nessuna domenica in movimento registrata.", "Domeniche in Movimento Registrate", "le domeniche in movimento", "sundayActivityId")}
            </div>

            {/* ALLENAMENTI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Dumbbell className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/allenamenti" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-allenamenti">Allenamenti</Link>
                <KnowledgeInfo id="allenamenti" />
                <SectionBadge count={memberTrEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberTrEnrollments, trainings, removeTrEnrollmentMutation, "Nessun allenamento registrato.", "Allenamenti Registrati", "gli allenamenti", "trainingId")}
            </div>

            {/* AFFITTI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Building2 className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/prenotazioni-sale" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-affitti">Affitti</Link>
                <KnowledgeInfo id="affitti" />
              </h3>
              {renderGenericEnrollmentList([], [], dummyMutation, "Nessun affitto sala registrato.", "Affitti Registrati", "gli affitti", "affittiId")}
            </div>

            {/* LEZIONI INDIVIDUALI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <UserCheck className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/lezioni-individuali" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-lezioni-individuali">Lezioni Individuali</Link>
                <KnowledgeInfo id="lezioni-individuali" />
                <SectionBadge count={memberIlEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberIlEnrollments, individualLessons, removeIlEnrollmentMutation, "Nessuna lezione individuale registrata.", "Lezioni Individuali Registrate", "le lezioni individuali", "individualLessonId")}
            </div>

            {/* CAMPUS */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Users className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/campus" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-campus">Campus</Link>
                <KnowledgeInfo id="campus" />
                <SectionBadge count={memberCaEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberCaEnrollments, campusActivities, removeCaEnrollmentMutation, "Nessun campus registrato.", "Campus Registrati", "i campus", "campusActivityId")}
            </div>

            {/* SAGGI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Award className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/saggi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-saggi">Saggi</Link>
                <KnowledgeInfo id="saggi" />
                <SectionBadge count={memberReEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberReEnrollments, recitals, removeReEnrollmentMutation, "Nessun saggio registrato.", "Saggi Registrati", "i saggi", "recitalId")}
            </div>

            {/* VACANZA STUDIO */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Music className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/vacanze-studio" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-vacanze-studio">Vacanze Studio</Link>
                <KnowledgeInfo id="vacanze-studio" />
                <SectionBadge count={memberVsEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberVsEnrollments, vacationStudies, removeVsEnrollmentMutation, "Nessuna vacanza studio registrata.", "Vacanze Studio Registrate", "le vacanze studio", "vacationStudyId")}
            </div>

            {/* MERCHANDISING */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/merchandising" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-merchandising">Merchandising</Link>
                <KnowledgeInfo id="merchandising" />
              </h3>
              {renderGenericEnrollmentList([], [], dummyMutation, "Nessun articolo di merchandising registrato.", "Merchandising Registrato", "il merchandising", "merchandisingId")}
            </div>

            {/* EVENTI ESTERNI */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 border-b pb-2 bg-warning/50 dark:bg-warning/900/20 px-2 py-1 rounded flex items-center gap-2">
                <Globe className="w-4 h-4 sidebar-icon-gold flex-shrink-0" />
                <Link href="/attivita/servizi" className="rounded px-1 py-0.5 transition-colors hover:bg-accent/60 cursor-pointer no-underline" data-testid="link-attivita-eventi-esterni">Eventi Esterni</Link>
                <KnowledgeInfo id="eventi-esterni" />
                <SectionBadge count={memberServEnrollments?.length || 0} />
              </h3>
              {renderGenericEnrollmentList(memberServEnrollments, bookingServices, removeServEnrollmentMutation, "Nessun evento esterno registrato.", "Eventi Esterni Registrati", "gli eventi esterni", "serviceId")}
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
      
      {/* Modale Forzatura livello marketing */}
      <Dialog open={isCrmOverrideOpen} onOpenChange={setIsCrmOverrideOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forzatura livello marketing</DialogTitle>
            <DialogDescription className="text-sm">
              Modifica manualmente il livello assegnato a questo partecipante. Selezionando un livello, il calcolo automatico verrà disattivato finché la forzatura resta attiva.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md border border-amber-200/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2 mt-4 text-sm">
            <span className="text-amber-800 dark:text-amber-200 font-medium whitespace-nowrap">Stato attuale a sistema:</span>
            <div className="flex gap-4">
              <span className="text-slate-700 dark:text-slate-300"><span className="font-semibold">{currentMember?.crmProfileLevel && currentMember.crmProfileLevel !== "NONE" ? currentMember.crmProfileLevel : "Nessuno"}</span></span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">{currentMember?.crmProfileScore || 0} pts</span>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="crm-override-toggle"
                checked={crmOverrideData.override}
                onCheckedChange={(val: boolean | string) => setCrmOverrideData(prev => ({ ...prev, override: !!val }))}
              />
              <Label htmlFor="crm-override-toggle" className="font-semibold cursor-pointer">Attiva forzatura manuale</Label>
            </div>

            {crmOverrideData.override && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label>Livello</Label>
                  <Combobox
                    name="livelloCrm"
                    value={crmOverrideData.level || ""}
                    onValueChange={(v) => setCrmOverrideData(prev => ({ ...prev, level: v }))}
                    options={[{value: "NONE", label: "Nessun livello"}, ...livelliCrm.map((l: string) => ({ value: l.toUpperCase(), label: l }))]}
                    placeholder="Seleziona livello..."
                    emptyText="Nessun livello trovato"
                    onQuickAdd={(v) => quickAddLivello.mutate(v)}
                    isQuickAddPending={quickAddLivello.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Motivazione Forzatura <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Es: Cliente storico VIP inserito manualmente..."
                    value={crmOverrideData.reason}
                    onChange={(e) => setCrmOverrideData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCrmOverrideOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => overrideCrmMutation.mutate(crmOverrideData as any)}
              disabled={overrideCrmMutation.isPending || (crmOverrideData.override && !crmOverrideData.reason.trim())}
            >
              <Save className="w-4 h-4 mr-2" />
              Salva Impostazioni
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
