import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  Sheet,
  ArrowRight,
  Settings2,
  Key,
  Loader2,
  Save,
  Trash2,
  Users,
  BookOpen,
  CreditCard,
  BarChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// All available member fields for mapping
const MEMBER_FIELDS = [
  // Anagrafica Base
  { key: "id", label: "ID StarGem (Sistema)" },
  { key: "fiscalCode", label: "Codice Fiscale", required: true },
  { key: "firstName", label: "Nome", required: true },
  { key: "lastName", label: "Cognome", required: true },
  { key: "gender", label: "Sesso" },
  { key: "dateOfBirth", label: "Data Nascita" },
  { key: "placeOfBirth", label: "Luogo Nascita" },
  { key: "birthProvince", label: "Provincia Nascita" },
  { key: "birthCountry", label: "Nazione Nascita" },
  { key: "nationality", label: "Nazionalità" },

  // Contatti e Residenza
  { key: "email", label: "Email" },
  { key: "secondaryEmail", label: "Email Secondaria" },
  { key: "phone", label: "Telefono Fisso" },
  { key: "mobile", label: "Cellulare" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "address", label: "Indirizzo" },
  { key: "city", label: "Città" },
  { key: "postalCode", label: "CAP" },
  { key: "province", label: "Provincia" },
  { key: "region", label: "Regione" },
  { key: "country", label: "Nazione Residenza" },

  // Classificazione
  { key: "athenaId", label: "Athena ID (Provenienza)" },
  { key: "participantType", label: "Tipo Partecipante" },
  { key: "fromWhere", label: "Da Dove Viene" },
  { key: "teamSegreteria", label: "Team Segreteria" },
  { key: "season", label: "Stagione" },
  { key: "insertionDate", label: "Data Inserimento" },
  { key: "title", label: "Titolo" },
  { key: "profession", label: "Professione" },

  // Tessere e Scadenze
  { key: "cardNumber", label: "Numero Tessera" },
  { key: "cardIssueDate", label: "Data Rilascio Tessera" },
  { key: "cardExpiryDate", label: "Scadenza Tessera" },
  { key: "entityCardType", label: "Tipo Ente (es. CSEN)" },
  { key: "entityCardNumber", label: "Numero Tessera Ente" },
  { key: "entityCardIssueDate", label: "Data Rilascio Ente" },
  { key: "entityCardExpiryDate", label: "Scadenza Tessera Ente" },

  // Certificati Medici
  { key: "hasMedicalCertificate", label: "Ha Certificato Medico" },
  { key: "medicalCertificateExpiry", label: "Scadenza Certificato" },

  // Dati Minorenni e Tutori
  { key: "isMinor", label: "È Minorenne" },

  { key: "motherFirstName", label: "Nome Madre (Tutore 1)" },
  { key: "motherLastName", label: "Cognome Madre (Tutore 1)" },
  { key: "motherFiscalCode", label: "CF Madre" },
  { key: "motherEmail", label: "Email Madre" },
  { key: "motherPhone", label: "Telefono Madre" },
  { key: "motherMobile", label: "Cellulare Madre" },
  { key: "motherBirthDate", label: "Data Nascita Madre" },
  { key: "motherBirthPlace", label: "Luogo Nascita Madre" },
  { key: "motherStreetAddress", label: "Indirizzo Madre" },
  { key: "motherCity", label: "Città Madre" },
  { key: "motherProvince", label: "Provincia Madre" },
  { key: "motherPostalCode", label: "CAP Madre" },

  { key: "fatherFirstName", label: "Nome Padre (Tutore 2)" },
  { key: "fatherLastName", label: "Cognome Padre (Tutore 2)" },
  { key: "fatherFiscalCode", label: "CF Padre" },
  { key: "fatherEmail", label: "Email Padre" },
  { key: "fatherPhone", label: "Telefono Padre" },
  { key: "fatherMobile", label: "Cellulare Padre" },
  { key: "fatherBirthDate", label: "Data Nascita Padre" },
  { key: "fatherBirthPlace", label: "Luogo Nascita Padre" },
  { key: "fatherStreetAddress", label: "Indirizzo Padre" },
  { key: "fatherCity", label: "Città Padre" },
  { key: "fatherProvince", label: "Provincia Padre" },
  { key: "fatherPostalCode", label: "CAP Padre" },

  // Privacy e Varie
  { key: "privacyAccepted", label: "Privacy Accettata" },
  { key: "privacyDate", label: "Data Privacy" },
  { key: "newsletterConsent", label: "Consenso Newsletter" },
  { key: "marketingConsent", label: "Consenso Marketing" },
  { key: "imageConsent", label: "Consenso Immagine" },
  { key: "documentType", label: "Tipo Documento" },
  { key: "documentExpiry", label: "Scadenza Documento" },
  { key: "notes", label: "Note Generali" },
  { key: "adminNotes", label: "Note Amministrative" },
  { key: "dataQualityFlag", label: "Flag Qualità Dati" },
  { key: "tags", label: "Tags" },
  { key: "tesserinoTecnicoNumber", label: "Numero Tesserino Tecnico" },
  { key: "tesserinoTecnicoIssueDate", label: "Scadenza Tesserino Tecnico" },
];

const PAYMENTS_FIELDS = [
  { key: "fiscalCode", label: "CF Socio", required: true },
  { key: "paymentType", label: "Tipo Pagamento", required: true },
  { key: "amount", label: "Importo", required: true },
  { key: "paidAmount", label: "Importo Pagato" },
  { key: "paymentMethod", label: "Metodo Pagamento" },
  { key: "paymentDate", label: "Data Pagamento" },
  { key: "description", label: "Descrizione" },
  { key: "courseCode", label: "Codice Corso" },
  { key: "period", label: "Periodo" },
  { key: "discountCode", label: "Codice Sconto" },
  { key: "deposit", label: "Acconto" },
  { key: "depositDate", label: "Data Acconto" },
];

const ACCOUNTING_FIELDS = [
  { key: "date", label: "Data", required: true },
  { key: "description", label: "Descrizione", required: true },
  { key: "amount", label: "Importo", required: true },
  { key: "type", label: "Tipo" },
  { key: "bankAccount", label: "Conto Bancario" },
  { key: "category", label: "Categoria" },
  { key: "notes", label: "Note" },
];

const ENROLLMENTS_FIELDS = [
  { key: "fiscalCode", label: "Codice Fiscale", required: true },
  { key: "courseCode", label: "Codice Corso" },
  { key: "courseName", label: "Nome Corso" },
  { key: "status", label: "Stato Iscrizione" },
  { key: "enrollmentDate", label: "Data Iscrizione" },
  { key: "amount", label: "Importo" },
];

const MEMBERSHIPS_FIELDS = [
  { key: "fiscalCode", label: "Codice Fiscale", required: true },
  { key: "cardNumber", label: "Numero Tessera" },
  { key: "cardType", label: "Tipo Tessera" },
  { key: "issueDate", label: "Data Emissione" },
  { key: "expiryDate", label: "Data Scadenza" },
  { key: "amount", label: "Quota" },
  { key: "renewal", label: "Rinnovo" },
];

// Combine import key options since the entities changed
const IMPORT_KEY_OPTIONS = [
  { key: "fiscalCode", label: "Codice Fiscale" },
  { key: "email", label: "Email" },
  { key: "sku", label: "Codice Univoco / SKU" },
];

interface ImportConfig {
  id: number;
  name: string;
  entityType: string;
  sourceType: string;
  fieldMapping: Record<string, number>;
  importKey: string | null;
}

interface SheetHeader {
  index: number;
  name: string;
  originalName: string;
}

interface ImportResult {
  success?: boolean;
  inserted?: number;
  imported?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  errors?: { row: number; message: string }[];
}

export default function ImportData() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");
  const [sheetRange, setSheetRange] = useState<string>("");

  // Mapping state
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [sheetHeaders, setSheetHeaders] = useState<SheetHeader[]>([]);
  const [sampleData, setSampleData] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<
    Record<string, number | null>
  >({});
  const [importKey, setImportKey] = useState<string>("fiscalCode");
  const [autoCreateRecords, setAutoCreateRecords] = useState<boolean>(true);

  // Entity type and source type for mapping
  const [entityType, setEntityType] = useState<
    "members" | "payments" | "enrollments" | "memberships" | "accounting"
  >("members");
  const [sourceType, setSourceType] = useState<
    "google_sheets" | "file" | "raw_text"
  >("file");
  const [rawText, setRawText] = useState<string>("");

  // Saved configs
  const [saveConfigDialogOpen, setSaveConfigDialogOpen] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");

  // CSV delimiter for file imports
  const [csvDelimiter, setCsvDelimiter] = useState<string>(",");

  // Get current fields and import key options based on entity type
  const getCurrentFields = () => {
    switch (entityType) {
      case "members":
        return MEMBER_FIELDS;
      case "payments":
        return PAYMENTS_FIELDS;
      case "accounting":
        return ACCOUNTING_FIELDS;
      case "enrollments":
        return ENROLLMENTS_FIELDS;
      case "memberships":
        return MEMBERSHIPS_FIELDS;
      default:
        return MEMBER_FIELDS;
    }
  };
  const currentFields = getCurrentFields();
  const currentImportKeyOptions = IMPORT_KEY_OPTIONS;

  // Fetch saved import configs
  const { data: savedConfigs = [] } = useQuery<ImportConfig[]>({
    queryKey: ["/api/import-configs"],
  });

  const importMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Errore durante l'importazione");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast({
        title: "Importazione completata",
        description: `${data.imported} record importati con successo`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const previewHeadersMutation = useMutation({
    mutationFn: async ({
      spreadsheetId,
      range,
    }: {
      spreadsheetId: string;
      range: string;
    }) => {
      return await apiRequest("POST", "/api/google-sheets/preview-headers", {
        spreadsheetId,
        range,
      });
    },
    onSuccess: (data: any) => {
      setSheetHeaders(data.headers || []);
      setSampleData(data.sampleData || []);
      setWizardStep(2);
      setSourceType("google_sheets");

      // Initialize field mapping based on current entity type
      const initialMapping: Record<string, number | null> = {};
      const savedMapStr = localStorage.getItem(`mappatura_${entityType}`);
      let savedMap: Record<string, number> = {};
      if (savedMapStr) {
        try {
          savedMap = JSON.parse(savedMapStr);
        } catch (e) {
          /* ignore */
        }
      }

      const headers = data.headers || [];
      currentFields.forEach((field) => {
        if (savedMap[field.key] !== undefined) {
          initialMapping[field.key] = savedMap[field.key];
        } else {
          // Auto-mappatura intelligente: SOLO corrispondenze esatte per evitare disastri
          const match = headers.find((h: any) => {
            const hName = h.name.toLowerCase().trim();
            const fLabel = field.label.toLowerCase().trim();
            const fKey = field.key.toLowerCase().trim();
            return hName === fLabel || hName === fKey;
          });
          initialMapping[field.key] = match ? match.index : null;
        }
      });

      // Rimuoviamo eventuali duplicati nell'auto-mappatura
      const usedIndexes = new Set<number>();
      for (const k of Object.keys(initialMapping)) {
        if (initialMapping[k] !== null) {
          if (usedIndexes.has(initialMapping[k]!)) initialMapping[k] = null;
          else usedIndexes.add(initialMapping[k]!);
        }
      }
      setFieldMapping(initialMapping);

      // Set default import key
      setImportKey(entityType === "members" ? "fiscalCode" : "sku");

      toast({
        title: "Anteprima caricata",
        description: `Trovate ${data.headers?.length || 0} colonne. Configura la mappatura.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // File preview mutation
  const filePreviewMutation = useMutation({
    mutationFn: async ({
      file,
      delimiter,
    }: {
      file: File;
      delimiter: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("delimiter", delimiter);
      const response = await fetch("/api/import/preview", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Errore lettura file");
      return response.json();
    },
    onSuccess: (data: any) => {
      setSheetHeaders(data.headers || []);
      setSampleData(data.sampleData || []);
      setWizardStep(2);
      setSourceType("file");

      // Initialize field mapping
      const initialMapping: Record<string, number | null> = {};
      const savedMapStr = localStorage.getItem(`mappatura_${entityType}`);
      let savedMap: Record<string, number> = {};
      if (savedMapStr) {
        try {
          savedMap = JSON.parse(savedMapStr);
        } catch (e) {
          /* ignore */
        }
      }

      const headers = data.headers || [];
      currentFields.forEach((field) => {
        if (savedMap[field.key] !== undefined) {
          initialMapping[field.key] = savedMap[field.key];
        } else {
          // Auto-mappatura intelligente: SOLO corrispondenze esatte
          const match = headers.find((h: any) => {
            const hName = h.name.toLowerCase().trim();
            const fLabel = field.label.toLowerCase().trim();
            const fKey = field.key.toLowerCase().trim();
            return hName === fLabel || hName === fKey;
          });
          initialMapping[field.key] = match ? match.index : null;
        }
      });

      const usedIndexes = new Set<number>();
      for (const k of Object.keys(initialMapping)) {
        if (initialMapping[k] !== null) {
          if (usedIndexes.has(initialMapping[k]!)) initialMapping[k] = null;
          else usedIndexes.add(initialMapping[k]!);
        }
      }
      setFieldMapping(initialMapping);

      // Set default import key
      setImportKey(entityType === "members" ? "fiscalCode" : "sku");

      toast({
        title: "Anteprima caricata",
        description: `Trovate ${data.headers?.length || 0} colonne e ${data.totalRows} righe.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [dryRunData, setDryRunData] = useState<any>(null);
  const [seasonOverride, setSeasonOverride] = useState<number | null>(null);
  const [showOnlyMissingSeason, setShowOnlyMissingSeason] = useState(false);

  const dryRunMutation = useMutation({
    mutationFn: async (params: {
      file: File;
      fieldMapping: Record<string, number>;
      importKey: string;
      entityType: string;
      delimiter: string;
      seasonOverride?: number | null;
    }) => {
      const formData = new FormData();
      formData.append("file", params.file);
      formData.append("fieldMapping", JSON.stringify(params.fieldMapping));
      formData.append("importKey", params.importKey);
      formData.append("entityType", params.entityType);
      formData.append("delimiter", params.delimiter);
      if (params.seasonOverride)
        formData.append("seasonOverride", String(params.seasonOverride));
      formData.append("isDryRun", "true");
      const response = await fetch("/api/import/mapped", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Errore dry-run");
      return response.json();
    },
    onSuccess: (data: any) => {
      setDryRunData(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore Dry Run",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // File mapped import mutation
  const fileMappedImportMutation = useMutation({
    mutationFn: async (params: {
      file: File;
      fieldMapping: Record<string, number>;
      importKey: string;
      entityType: string;
      delimiter: string;
      autoCreateRecords?: boolean;
      seasonOverride?: number | null;
    }) => {
      const formData = new FormData();
      formData.append("file", params.file);
      formData.append("fieldMapping", JSON.stringify(params.fieldMapping));
      formData.append("importKey", params.importKey);
      formData.append("entityType", params.entityType);
      formData.append("delimiter", params.delimiter);
      formData.append(
        "autoCreateRecords",
        String(params.autoCreateRecords || false),
      );
      if (params.seasonOverride)
        formData.append("seasonOverride", String(params.seasonOverride));
      const response = await fetch("/api/import/mapped", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Errore importazione");
      return response.json();
    },
    onSuccess: (data: any) => {
      setImportResult(data);
      toast({
        title: "Importazione completata",
        description: `${data.imported} nuovi, ${data.updated} aggiornati`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (config: {
      name: string;
      entityType: string;
      sourceType: string;
      fieldMapping: Record<string, number>;
      importKey: string;
    }) => {
      return await apiRequest("POST", "/api/import-configs", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import-configs"] });
      setSaveConfigDialogOpen(false);
      setNewConfigName("");
      toast({ title: "Configurazione salvata" });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/import-configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import-configs"] });
      toast({ title: "Configurazione eliminata" });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const mappedImportMutation = useMutation({
    mutationFn: async (params: {
      spreadsheetId: string;
      range: string;
      fieldMapping: Record<string, number | null>;
      importKey: string;
      entityType: string;
      autoCreateRecords?: boolean;
      seasonOverride?: number | null;
    }) => {
      return await apiRequest(
        "POST",
        "/api/google-sheets/import-mapped",
        params,
      );
    },
    onSuccess: (data: any) => {
      setImportResult(data);
      toast({
        title: "Importazione completata",
        description: `${data.imported} nuovi, ${data.updated} aggiornati`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const googleSheetsImportMutation = useMutation({
    mutationFn: async ({
      spreadsheetId,
      range,
      type,
    }: {
      spreadsheetId: string;
      range: string;
      type: string;
    }) => {
      return await apiRequest("POST", "/api/import/google-sheets", {
        spreadsheetId,
        range,
        type,
      });
    },
    onSuccess: (data: any) => {
      setImportResult(data);
      toast({
        title: "Importazione completata",
        description: `${data.imported} record importati con successo da Google Sheets`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = () => {
    if (!selectedFile || !importType) {
      toast({
        title: "Errore",
        description: "Seleziona un file e un tipo di importazione",
        variant: "destructive",
      });
      return;
    }

    importMutation.mutate({ file: selectedFile, type: importType });
  };

  const handleGoogleSheetsImport = () => {
    if (!spreadsheetId || !sheetRange || !importType) {
      toast({
        title: "Errore",
        description: "Completa tutti i campi richiesti",
        variant: "destructive",
      });
      return;
    }

    googleSheetsImportMutation.mutate({
      spreadsheetId,
      range: sheetRange,
      type: importType,
    });
  };

  const handlePreviewHeaders = () => {
    if (!spreadsheetId) {
      toast({
        title: "Errore",
        description: "Inserisci l'ID del foglio Google",
        variant: "destructive",
      });
      return;
    }

    previewHeadersMutation.mutate({
      spreadsheetId,
      range: sheetRange || "A1:Z1000",
    });
  };

  const handleMappedImport = () => {
    // Filter out null mappings
    const activeMapping: Record<string, number> = {};
    for (const [key, value] of Object.entries(fieldMapping)) {
      if (value !== null && value >= 0) {
        activeMapping[key] = value;
      }
    }

    if (Object.keys(activeMapping).length === 0) {
      toast({
        title: "Errore",
        description: "Mappa almeno un campo",
        variant: "destructive",
      });
      return;
    }

    // Check for required fields based on entity type
    if (entityType === "members") {
      if (
        activeMapping.firstName === undefined &&
        activeMapping.lastName === undefined
      ) {
        toast({
          title: "Errore",
          description: "Nome o Cognome sono obbligatori",
          variant: "destructive",
        });
        return;
      }
    }

    // Use file import or Google Sheets import based on source type
    if (sourceType === "file" && selectedFile) {
      fileMappedImportMutation.mutate({
        file: selectedFile,
        fieldMapping: activeMapping,
        importKey,
        entityType,
        delimiter: csvDelimiter,
        autoCreateRecords,
        seasonOverride,
      });
    } else {
      mappedImportMutation.mutate({
        spreadsheetId,
        range: sheetRange || "A1:Z1000",
        fieldMapping: activeMapping,
        importKey,
        entityType,
        autoCreateRecords,
        seasonOverride,
      });
    }
  };

  const handleFilePreview = () => {
    if (!selectedFile) {
      toast({
        title: "Errore",
        description: "Seleziona un file",
        variant: "destructive",
      });
      return;
    }
    filePreviewMutation.mutate({ file: selectedFile, delimiter: csvDelimiter });
  };

  const handleSaveConfig = () => {
    if (!newConfigName.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un nome per la configurazione",
        variant: "destructive",
      });
      return;
    }

    const activeMapping: Record<string, number> = {};
    for (const [key, value] of Object.entries(fieldMapping)) {
      if (value !== null && value >= 0) {
        activeMapping[key] = value;
      }
    }

    saveConfigMutation.mutate({
      name: newConfigName,
      entityType,
      sourceType,
      fieldMapping: activeMapping,
      importKey,
    });
  };

  const handleLoadConfig = (config: ImportConfig) => {
    setEntityType(
      config.entityType as
        | "members"
        | "payments"
        | "enrollments"
        | "memberships"
        | "accounting",
    );
    setFieldMapping(config.fieldMapping);
    if (config.importKey) {
      setImportKey(config.importKey);
    }
    toast({ title: "Configurazione caricata", description: config.name });
  };

  const handleBackToInput = () => {
    setWizardStep(1);
    setSheetHeaders([]);
    setSampleData([]);
    setFieldMapping({});
    setImportResult(null);
  };

  const updateFieldMapping = (fieldKey: string, columnIndex: number | null) => {
    setFieldMapping((prev) => ({
      ...prev,
      [fieldKey]: columnIndex,
    }));
  };

  const downloadTemplate = (type: string) => {
    const templates: Record<string, string> = {
      members:
        "id_db,cognome,nome,codice_fiscale,email,telefono,cellulare,whatsapp,data_nascita,luogo_nascita,provincia_nascita,indirizzo,citta,cap,provincia,sesso,tipo_partecipante,cf_tutore,nome_tutore,telefono_tutore,note,stato\n,Rossi,Mario,RSSMRA90A15F205X,mario@email.com,021234567,3331234567,,1990-01-15,Milano,MI,Via Roma 1,Milano,20100,MI,M,,,,,,ATTIVO\n",
      payments:
        "id_db,codice_fiscale,cognome,nome,tipo_pagamento,importo,importo_pagato,metodo_pagamento,data_pagamento,descrizione,codice_corso,codice_sconto,valore_sconto,periodo,operatore,canale_vendita,data_accredito,numero_ricevute,acconto\n,RSSMRA90A15F205X,Rossi,Mario,ISCRIZIONE,50.00,50.00,BONIFICO,2024-01-10,Quota iscrizione,YOGA-01,,,MENSILE,Admin,,,1,\n",
      enrollments:
        "id_db,codice_fiscale,cognome,nome,codice_corso,nome_corso,stato_iscrizione,tipo_partecipazione,data_iscrizione,stagione,note,fonte\n,RSSMRA90A15F205X,Rossi,Mario,YOGA-01,Yoga Base,ATTIVA,ALLIEVO,2024-01-10,2024-2025,,\n",
      memberships:
        "id_db,codice_fiscale,cognome,nome,numero_tessera,tipo_tessera,ente,data_emissione,data_scadenza,quota,rinnovo,stagione,stato\n,RSSMRA90A15F205X,Rossi,Mario,CSEN-001,CSEN,CSEN,2024-01-10,2024-12-31,10.00,0,2024-2025,ATTIVA\n",
      accounting:
        "id_db,data,descrizione,importo,tipo,conto,categoria,id_transazione_banca,note\n,2024-01-10,Stipendio insegnante,500.00,USCITA,BPM,STIPENDI,,\n",
    };

    const template = templates[type];
    if (!template) return;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${type}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveMapping = () => {
    localStorage.setItem(
      `mappatura_${entityType}`,
      JSON.stringify(fieldMapping),
    );
    toast({
      title: "Mappatura salvata",
      description: "Verrà precaricata al prossimo import simile.",
    });
  };

  const handleResetMapping = () => {
    localStorage.removeItem(`mappatura_${entityType}`);
    setFieldMapping({});
    toast({
      title: "Mappatura azzerata",
      description: "Le impostazioni salvate sono state eliminate.",
    });
    // Ricarica l'anteprima per ri-applicare solo l'automapping puro
    if (sourceType === "file" && selectedFile) {
      filePreviewMutation.mutate({
        file: selectedFile,
        delimiter: csvDelimiter,
      });
    } else if (sourceType === "google_sheets" && spreadsheetId) {
      previewHeadersMutation.mutate({
        spreadsheetId,
        range: sheetRange || "A1:Z1000",
      });
    }
  };

  const handleAutoMap = () => {
    // Already populated by preview response matching keys, but this forces a re-evaluation
    // based on typical columns
    const initialMapping: Record<string, number | null> = {};
    currentFields.forEach((field) => {
      // Find a matching sheet header
      const match = sheetHeaders.find(
        (h) =>
          h.name.toLowerCase().includes(field.label.toLowerCase()) ||
          h.name.toLowerCase().includes(field.key.toLowerCase()) ||
          field.label.toLowerCase().includes(h.name.toLowerCase()),
      );
      initialMapping[field.key] = match ? match.index : null;
    });
    setFieldMapping(initialMapping);
    toast({
      title: "Auto-Mappatura",
      description: "Assegnazioni calcolate dove possibile.",
    });
  };

  // Render variables
  const isImporting =
    mappedImportMutation.isPending || fileMappedImportMutation.isPending;
  const filteredConfigs = savedConfigs.filter(
    (c) => c.entityType === entityType,
  );

  // Calcolo colonne mappate e non mappate
  const unmappedHeaders = sheetHeaders.filter(
    (h) => !Object.values(fieldMapping).includes(h.index),
  );
  const mappedHeaders = sheetHeaders.filter((h) =>
    Object.values(fieldMapping).includes(h.index),
  );
  const unmappedText = unmappedHeaders.map((h) => `- ${h.name}`).join("\n");

  const renderMappingRow = (header: SheetHeader, isMapped: boolean) => {
    const mappedDbFieldKey = Object.keys(fieldMapping).find(
      (k) => fieldMapping[k] === header.index,
    );
    const usedFieldKeys = Object.keys(fieldMapping).filter(
      (k) => fieldMapping[k] !== null,
    );

    return (
      <div
        key={header.index}
        className={`grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 transition-colors ${isMapped ? "bg-background" : "bg-muted/30"}`}
      >
        <div className="truncate font-medium" title={header.name}>
          {header.index + 1}. {header.name}
        </div>
        <div className="flex w-24 justify-center">
          {isMapped ? (
            <Badge className="border-green-600/20 bg-green-600/10 text-green-700 shadow-none hover:bg-green-600/20">
              <CheckCircle className="mr-1 size-3" /> Mappato
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <AlertCircle className="mr-1 size-3" /> Da Mappare
            </Badge>
          )}
        </div>
        <div>
          <Select
            value={mappedDbFieldKey || "__none__"}
            onValueChange={(val) => {
              const newMap = { ...fieldMapping };
              if (mappedDbFieldKey) newMap[mappedDbFieldKey] = null;
              if (val !== "__none__") newMap[val] = header.index;
              setFieldMapping(newMap);
            }}
          >
            <SelectTrigger
              className={`h-8 font-medium ${!isMapped && "opacity-70"}`}
            >
              <SelectValue placeholder="Seleziona campo..." />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem
                value="__none__"
                className="italic text-muted-foreground"
              >
                — Ignora questa colonna —
              </SelectItem>
              {currentFields
                .filter(
                  (cf) =>
                    !usedFieldKeys.includes(cf.key) ||
                    mappedDbFieldKey === cf.key,
                )
                .map((cf) => (
                  <SelectItem key={cf.key} value={cf.key}>
                    {cf.label}{" "}
                    {cf.required ? (
                      <span className="text-destructive">*</span>
                    ) : (
                      ""
                    )}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const executeDryRun = (overrideSeasonId?: number) => {
    if (sourceType === "file" && selectedFile) {
      const activeMapping: Record<string, number> = {};
      for (const [key, value] of Object.entries(fieldMapping)) {
        if (value !== null && value !== undefined && (value as number) >= 0)
          activeMapping[key] = value as number;
      }
      dryRunMutation.mutate({
        file: selectedFile,
        fieldMapping: activeMapping,
        importKey,
        entityType,
        delimiter: csvDelimiter,
        seasonOverride: overrideSeasonId || seasonOverride,
      });
    }
  };

  return (
    <div className="mx-auto space-y-6 p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="mb-2 text-3xl font-semibold text-foreground">
            Importazione Dati
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Importa anagrafiche, pagamenti, iscrizioni, tessere e movimenti
            contabili da file Excel, CSV o Google Sheets. Il sistema riconosce
            automaticamente le colonne e ti guida passo per passo.
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
        <h3 className="mb-2 flex items-center font-semibold text-orange-700">
          <AlertCircle className="mr-2 size-5" /> Prima di importare — leggi
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-orange-800/90">
          <li>
            Ogni riga deve avere almeno:{" "}
            <strong>
              Codice Fiscale + Nome + Cognome + Email OPPURE Telefono
            </strong>
            . Le righe incomplete vengono saltate automaticamente.
          </li>
          <li>
            I pagamenti e i movimenti contabili{" "}
            <strong className="uppercase">non</strong> possono essere modificati
            dopo l'import. Verifica i dati prima di procedere.
          </li>
          <li>
            Se una persona esiste già nel sistema (stesso CF), i suoi dati
            vengono arricchiti — non duplicati.
          </li>
          <li>
            In caso di errori, scarica il report CSV al termine dell'import.
          </li>
        </ul>
      </div>

      {/* Stepper */}
      <div className="relative mx-auto mb-8 flex max-w-3xl items-center justify-between px-4">
        <div
          className={`z-10 flex flex-col items-center ${wizardStep >= 1 ? "text-primary" : "text-muted-foreground"}`}
        >
          <div
            className={`mb-2 flex size-10 items-center justify-center rounded-full font-bold transition-colors ${wizardStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            1
          </div>
          <span className="text-sm font-medium">Carica il file</span>
        </div>
        <div
          className={`mx-4 h-1 flex-1 rounded transition-colors ${wizardStep >= 2 ? "bg-primary" : "bg-muted"}`}
        ></div>
        <div
          className={`z-10 flex flex-col items-center ${wizardStep >= 2 ? "text-primary" : "text-muted-foreground"}`}
        >
          <div
            className={`mb-2 flex size-10 items-center justify-center rounded-full font-bold transition-colors ${wizardStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            2
          </div>
          <span className="text-sm font-medium">Mappa le colonne</span>
        </div>
        <div
          className={`mx-4 h-1 flex-1 rounded transition-colors ${wizardStep >= 3 ? "bg-primary" : "bg-muted"}`}
        ></div>
        <div
          className={`z-10 flex flex-col items-center ${wizardStep >= 3 ? "text-primary" : "text-muted-foreground"}`}
        >
          <div
            className={`mb-2 flex size-10 items-center justify-center rounded-full font-bold transition-colors ${wizardStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            3
          </div>
          <span className="text-sm font-medium">Esegui e Riporta</span>
        </div>
      </div>

      {wizardStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[
              {
                type: "members",
                label: "Anagrafica",
                icon: Users,
                desc: "Importa soci e partecipanti",
                badge: "Aggiorna se esiste · Inserisce se nuovo",
                fonti: "CSV · Excel (.xlsx) · Google Sheets",
              },
              {
                type: "payments",
                label: "Pagamenti",
                icon: CreditCard,
                desc: "Importa storico pagamenti da corsi, workshop e contanti",
                badge: "Solo inserimento · Mai modificare",
                fonti: "CSV · Excel (.xlsx) · Google Sheets",
                alert: "⚠ I pagamenti importati sono definitivi",
              },
              {
                type: "enrollments",
                label: "Iscrizioni ai Corsi",
                icon: BookOpen,
                desc: "Importa iscrizioni storiche ai corsi dalla piattaforma Athena",
                badge: "Aggiorna se esiste · Inserisce se nuovo",
                fonti: "CSV · Excel (.xlsx) — Athena",
              },
              {
                type: "memberships",
                label: "Tessere Associative",
                icon: CreditCard,
                desc: "Importa le tessere GemPass storiche e i rinnovi",
                badge: "Inserisce se non esiste",
                fonti: "CSV · Excel (.xlsx) — Athena",
                alert: "Max 10 tessere per persona (attività aperta dal 2016)",
              },
              {
                type: "accounting",
                label: "Movimenti Contabili",
                icon: BarChart,
                desc: "Importa estratti conto BPM, Poste, Soldo e PostePay",
                badge: "Solo inserimento · Storico immutabile",
                fonti: "Excel (.xlsx) — BPM · Poste · Soldo",
                alert:
                  "Coordinare con la sezione Contabilità prima dell'import",
              },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <Card
                  key={t.type}
                  className={`flex cursor-pointer flex-col shadow-sm transition-colors hover:border-primary/50 ${entityType === t.type ? "border-primary bg-primary/5 ring-1 ring-primary" : ""}`}
                  onClick={() => setEntityType(t.type as any)}
                >
                  <CardContent className="flex h-full flex-col items-center justify-start space-y-3 p-4 text-center">
                    <Icon
                      className={`size-8 ${entityType === t.type ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <div className="font-semibold">{t.label}</div>
                    <div className="min-h-[32px] text-xs text-muted-foreground">
                      {t.desc}
                    </div>
                    <Badge
                      variant={
                        t.type === "members" || t.type === "enrollments"
                          ? "default"
                          : "secondary"
                      }
                      className="w-full justify-center whitespace-normal text-center text-xxs"
                    >
                      {t.badge}
                    </Badge>
                    {t.alert && (
                      <div className="mt-2 line-clamp-2 w-full rounded bg-amber-50 p-1 text-xxs font-medium text-amber-700 dark:bg-amber-950/20">
                        {t.alert}
                      </div>
                    )}
                    <div className="mt-auto w-full pt-4">
                      <div className="mb-2 text-xxs text-muted-foreground">
                        {t.fonti}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadTemplate(t.type);
                        }}
                        title="Scarica il template CSV con tutte le colonne supportate"
                      >
                        Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sorgente Dati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs
                value={sourceType}
                onValueChange={(v) =>
                  setSourceType(v as "file" | "google_sheets" | "raw_text")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="file">
                    File Locale (.csv, .xlsx)
                  </TabsTrigger>
                  <TabsTrigger value="google_sheets">Google Sheets</TabsTrigger>
                  <TabsTrigger value="raw_text">Incolla Testo</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4 pt-4">
                  <div className="rounded-lg border-2 border-dashed bg-muted/20 p-8 text-center">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex cursor-pointer flex-col items-center"
                    >
                      <Upload className="mb-4 size-12 text-muted-foreground" />
                      {selectedFile ? (
                        <>
                          <p className="text-sm font-medium">
                            {selectedFile.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">
                            Trascina qui il file oppure clicca per selezionarlo
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Formati supportati: .csv .xlsx .xls
                          </p>
                          <p className="mt-2 text-xxs text-muted-foreground/70">
                            Il separatore viene rilevato automaticamente (, o ;)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!selectedFile || filePreviewMutation.isPending}
                    onClick={() => {
                      if (!selectedFile) return;
                      filePreviewMutation.mutate({
                        file: selectedFile,
                        delimiter: csvDelimiter,
                      });
                    }}
                  >
                    {filePreviewMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      "Procedi al Mapping"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="google_sheets" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Importa da Google Sheets (ID del foglio Google)
                      </Label>
                      <Input
                        value={spreadsheetId}
                        onChange={(e) => setSpreadsheetId(e.target.value)}
                        placeholder="1A2B3C..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Trovi l'ID nell'URL del foglio:
                        docs.google.com/spreadsheets/d/[ID]/edit
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Intervallo (opzionale)</Label>
                      <Input
                        value={sheetRange}
                        onChange={(e) => setSheetRange(e.target.value)}
                        placeholder="Foglio1!A1:Z1000"
                      />
                      <p className="text-xs text-muted-foreground">
                        Esempio: Foglio1!A1:Z1000 — lascia vuoto per tutto il
                        foglio
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={
                      !spreadsheetId || previewHeadersMutation.isPending
                    }
                    onClick={handlePreviewHeaders}
                  >
                    {previewHeadersMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      "Procedi al Mapping"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="raw_text" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Incolla i dati (formato CSV)</Label>
                      <Textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Cognome,Nome,Email&#10;Rossi,Mario,mario@esempio.it"
                        className="min-h-[200px] font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Incolla il testo completo del CSV copiato. La prima riga
                        deve contenere le intestazioni.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!rawText || filePreviewMutation.isPending}
                    onClick={() => {
                      if (!rawText) return;
                      // Create a virtual file from the raw text
                      const file = new File([rawText], "raw_input.csv", {
                        type: "text/csv",
                      });
                      filePreviewMutation.mutate({
                        file,
                        delimiter: csvDelimiter,
                      });
                    }}
                  >
                    {filePreviewMutation.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      "Procedi al Mapping"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {wizardStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleBackToInput}>
              Indietro
            </Button>
            <Button variant="outline" onClick={handleSaveMapping}>
              <Save className="mr-2 size-4" /> Salva questa mappatura
            </Button>
            <Button
              variant="outline"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={handleResetMapping}
            >
              <Trash2 className="mr-2 size-4" /> Azzera Mappatura
            </Button>
            <Button
              className="ml-auto"
              onClick={() => {
                setWizardStep(3);
                executeDryRun();
              }}
            >
              <ArrowRight className="mr-2 size-4" /> Continua allo Step 3
            </Button>
          </div>

          <Card className="border-amber-500/20 shadow-sm">
            <CardHeader className="border-b bg-amber-50/50 pb-4 dark:bg-amber-950/20">
              <CardTitle className="flex items-center text-amber-800">
                <AlertCircle className="mr-2 size-5" />
                Da Mappare ({unmappedHeaders.length} colonne)
              </CardTitle>
              <CardDescription>
                Queste colonne non sono state riconosciute automaticamente.
                Assegna un campo o lasciale ignorate. Man mano che le assegni,
                si sposteranno nel pannello in basso.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0 text-sm">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b bg-muted/50 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <div>Colonna Excel / CSV</div>
                  <div className="w-24 text-center">Stato</div>
                  <div>Campo DB Destinazione</div>
                </div>
                <div className="max-h-[400px] divide-y overflow-hidden overflow-y-auto">
                  {unmappedHeaders.length === 0 ? (
                    <div className="p-8 text-center italic text-muted-foreground">
                      Perfetto! Tutte le colonne sono state mappate o ignorate.
                    </div>
                  ) : (
                    unmappedHeaders.map((header) =>
                      renderMappingRow(header, false),
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 shadow-sm">
            <CardHeader className="border-b bg-green-50/50 pb-4 dark:bg-green-950/10">
              <CardTitle className="flex items-center text-green-700">
                <CheckCircle className="mr-2 size-5" />
                Colonne Già Mappate ({mappedHeaders.length})
              </CardTitle>
              <CardDescription>
                Queste colonne sono già state associate e sono pronte per
                l'importazione.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0 text-sm">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b bg-muted/50 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <div>Colonna Excel / CSV</div>
                  <div className="w-24 text-center">Stato</div>
                  <div>Campo DB Destinazione</div>
                </div>
                <div className="max-h-[400px] divide-y overflow-hidden overflow-y-auto">
                  {mappedHeaders.length === 0 ? (
                    <div className="p-8 text-center italic text-muted-foreground">
                      Nessuna colonna mappata al momento.
                    </div>
                  ) : (
                    mappedHeaders.map((header) =>
                      renderMappingRow(header, true),
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anteprima dati (prime 5 righe)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full pb-4">
                <Table className="min-w-max border">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {currentFields
                        .filter((f) => fieldMapping[f.key] !== null)
                        .map((f) => (
                          <TableHead
                            key={f.key}
                            className="whitespace-nowrap font-semibold text-primary/80"
                          >
                            {f.label}
                          </TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {currentFields
                          .filter((f) => fieldMapping[f.key] !== null)
                          .map((f) => (
                            <TableCell
                              key={f.key}
                              className="max-w-[250px] truncate whitespace-nowrap"
                            >
                              {row[fieldMapping[f.key] as number] || (
                                <span className="italic text-muted-foreground/30">
                                  -vuoto-
                                </span>
                              )}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                    {sampleData.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={currentFields.length}
                          className="py-8 text-center text-muted-foreground"
                        >
                          Nessun dato in anteprima
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4 space-y-1 text-center text-sm text-muted-foreground">
                <div>
                  Vengono visualizzate le prime righe tradotte secondo la
                  mappatura aggiornata in tempo reale.
                </div>
                <div className="font-medium text-foreground">
                  Trovate {sampleData.length} righe totali &middot;{" "}
                  {fieldMapping["fiscalCode"] !== null &&
                  fieldMapping["fiscalCode"] !== undefined
                    ? sampleData.filter(
                        (r) => r[fieldMapping["fiscalCode"] as number],
                      ).length
                    : 0}{" "}
                  con Codice Fiscale (verranno importate) &middot;{" "}
                  {fieldMapping["fiscalCode"] !== null &&
                  fieldMapping["fiscalCode"] !== undefined
                    ? sampleData.filter(
                        (r) => !r[fieldMapping["fiscalCode"] as number],
                      ).length
                    : sampleData.length}{" "}
                  senza CF (verranno saltate)
                </div>
              </div>
            </CardContent>
          </Card>

          {unmappedHeaders.length > 0 && (
            <Card className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/10">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-700">
                  <AlertCircle className="mr-2 size-5" />
                  Richiedi Nuove Colonne ad Antigravity
                </CardTitle>
                <CardDescription className="text-orange-800/80">
                  Hai {unmappedHeaders.length} colonne ignorate perché non
                  esistono nel sistema. Se ti servono davvero, copia l'elenco e
                  invialo ad Antigravity per farle creare.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  readOnly
                  value={unmappedText}
                  className="min-h-[100px] border-orange-200 bg-background/50 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Ciao Antigravity, puoi creare nel database queste nuove colonne per il modulo ${entityType}?\n\n${unmappedText}`,
                    );
                    toast({
                      title: "Copiato negli appunti!",
                      description:
                        "Ora puoi incollare il testo nella chat con Antigravity.",
                    });
                  }}
                >
                  <Download className="mr-2 size-4" /> Copia testo per
                  Antigravity
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {wizardStep === 3 && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setWizardStep(2)}>
              Indietro
            </Button>
          </div>

          <Card className="border-primary/20 shadow-md">
            <CardHeader className="border-b border-primary/10 bg-primary/5">
              <CardTitle className="text-primary">
                Importazione in corso
              </CardTitle>
              <CardDescription>
                Il sistema processeerà {sampleData.length} righe ignorando gli
                ID duplicati primari.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-10 text-center">
              {!importResult && (
                <>
                  {dryRunMutation.isPending ? (
                    <div className="flex flex-col items-center justify-center p-8">
                      <Loader2 className="mb-4 size-8 animate-spin text-primary" />
                      <p className="text-muted-foreground">
                        Generazione anteprima azioni (Dry-Run)...
                      </p>
                    </div>
                  ) : dryRunData ? (
                    <div className="space-y-6 text-left animate-in fade-in">
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-xl bg-green-50 p-4 text-center">
                          <p className="text-3xl font-black text-green-600">
                            {dryRunData.toInsert}
                          </p>
                          <p className="text-xs font-semibold text-green-700">
                            DA INSERIRE
                          </p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-4 text-center dark:bg-blue-950/20">
                          <p className="text-3xl font-black text-blue-600">
                            {dryRunData.toUpdate}
                          </p>
                          <p className="text-xs font-semibold text-blue-700">
                            DA AGGIORNARE
                          </p>
                        </div>
                        <div className="rounded-xl bg-gray-50 p-4 text-center">
                          <p className="text-3xl font-black text-muted-foreground">
                            {dryRunData.unchanged}
                          </p>
                          <p className="text-xs font-semibold text-foreground/80">
                            INVARIATI
                          </p>
                        </div>
                        <div className="rounded-xl bg-red-50 p-4 text-center dark:bg-red-950/20">
                          <p className="text-3xl font-black text-red-600">
                            {dryRunData.errors}
                          </p>
                          <p className="text-xs font-semibold text-red-700">
                            ERRORI/DA SALTARE
                          </p>
                        </div>
                      </div>

                      {/* SEZIONE A — CF mancante o invalido */}
                      {(dryRunData.missingCfRecords?.length > 0 ||
                        dryRunData.invalidCfRecords?.length > 0) && (
                        <Alert
                          variant="destructive"
                          className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                        >
                          <AlertCircle className="size-4 text-red-600" />
                          <AlertTitle className="text-red-800 dark:text-red-400">
                            {(dryRunData.missingCfRecords?.length || 0) +
                              (dryRunData.invalidCfRecords?.length || 0)}{" "}
                            record con CF mancante o non valido non verranno
                            importati.
                          </AlertTitle>
                          <AlertDescription className="mt-2 text-red-700">
                            Correggere i dati nel file CSV e reimportare.
                            <details className="mt-2 cursor-pointer">
                              <summary className="font-medium">
                                Visualizza i record bloccati
                              </summary>
                              <ul className="mt-2 max-h-40 list-disc overflow-auto pl-4 text-xs">
                                {dryRunData.missingCfRecords?.map(
                                  (r: any, i: number) => (
                                    <li key={`m-${i}`}>
                                      {r.nome} {r.cognome} — CF Mancante
                                    </li>
                                  ),
                                )}
                                {dryRunData.invalidCfRecords?.map(
                                  (r: any, i: number) => (
                                    <li key={`i-${i}`}>
                                      {r.nome} {r.cognome} — CF Invalido (
                                      {r.cf || "n/d"})
                                    </li>
                                  ),
                                )}
                              </ul>
                            </details>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* SEZIONE B — Season_id mancante */}
                      {dryRunData.missingSeasonRecords?.length > 0 && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <AlertCircle className="size-4 text-orange-600" />
                          <AlertTitle className="text-orange-800">
                            {dryRunData.missingSeasonRecords.length} iscrizioni
                            senza stagione associata.
                          </AlertTitle>
                          <AlertDescription className="mt-2 text-orange-700">
                            Confermare prima di procedere.
                            <div className="mt-3 flex gap-3">
                              <Button
                                size="sm"
                                className="bg-orange-600 text-white hover:bg-orange-700"
                                onClick={() => {
                                  setSeasonOverride(1);
                                  executeDryRun(1);
                                }}
                              >
                                Assegna stagione 25/26 a tutti
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-300 text-orange-800 hover:bg-orange-100"
                                onClick={() =>
                                  setShowOnlyMissingSeason(
                                    !showOnlyMissingSeason,
                                  )
                                }
                              >
                                {showOnlyMissingSeason
                                  ? "Mostra Tutti"
                                  : "Revisiona manualmente"}
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* SEZIONE C — Smart Routing attivato */}
                      {dryRunData.routingStats && (
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                          <CheckCircle className="size-4 text-blue-600" />
                          <AlertTitle className="text-blue-800 dark:text-blue-300">
                            Smart Routing attivo:
                          </AlertTitle>
                          <AlertDescription className="mt-2 text-blue-700">
                            <ul className="list-disc pl-4">
                              {dryRunData.routingStats.tessere > 0 && (
                                <li>
                                  {dryRunData.routingStats.tessere} tessere →
                                  memberships
                                </li>
                              )}
                              {dryRunData.routingStats.certificati > 0 && (
                                <li>
                                  {dryRunData.routingStats.certificati}{" "}
                                  certificati → medical_certificates
                                </li>
                              )}
                              {dryRunData.routingStats.iscrizioni > 0 && (
                                <li>
                                  {dryRunData.routingStats.iscrizioni}{" "}
                                  iscrizioni → enrollments
                                </li>
                              )}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="max-h-60 overflow-hidden overflow-y-auto rounded-md border text-sm">
                        <Table>
                          <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                              <TableHead>CF</TableHead>
                              <TableHead>Nominativo</TableHead>
                              <TableHead>Azione</TableHead>
                              <TableHead>Dettaglio</TableHead>
                              <TableHead>Modifiche Applicate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dryRunData.preview
                              ?.filter((r: any) =>
                                showOnlyMissingSeason
                                  ? r.azione === "ERRORE" || r.cf === "MANCANTE"
                                  : true,
                              )
                              .slice(0, 50)
                              .map((r: any, i: number) => (
                                <TableRow key={i}>
                                  <TableCell className="font-mono">
                                    {r.cf}
                                  </TableCell>
                                  <TableCell>
                                    {r.cognome} {r.nome}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        r.azione === "INSERISCI"
                                          ? "default"
                                          : r.azione === "AGGIORNA"
                                            ? "secondary"
                                            : r.azione === "ERRORE"
                                              ? "destructive"
                                              : "outline"
                                      }
                                    >
                                      {r.azione}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {r.campiModificati?.join(", ")}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {r.modificheCasing?.length > 0
                                      ? r.modificheCasing.join(" | ")
                                      : "Nessuna"}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="mt-6 flex justify-center">
                        <Button
                          size="lg"
                          className="h-14 px-8 text-lg"
                          onClick={handleMappedImport}
                          disabled={isImporting}
                        >
                          {isImporting ? (
                            <Loader2 className="mr-3 size-6 animate-spin" />
                          ) : (
                            <Settings2 className="mr-3 size-6" />
                          )}
                          {isImporting
                            ? "Elaborazione in corso..."
                            : "CONFERMA E AVVIA IMPORTAZIONE REALE"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="lg" onClick={handleMappedImport}>
                      Forza Importazione Diretta
                    </Button>
                  )}
                </>
              )}

              {importResult && (
                <div className="duration-500 animate-in fade-in slide-in-from-bottom-4">
                  <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10 p-6">
                      <p className="mb-1 text-4xl font-black text-green-600">
                        {importResult.inserted || importResult.imported || 0}
                      </p>
                      <p className="text-sm font-semibold uppercase tracking-widest text-green-700">
                        ✅ Inseriti
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
                      <p className="mb-1 text-4xl font-black text-blue-600">
                        {importResult.updated || 0}
                      </p>
                      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                        🔄 Aggiornati
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 p-6">
                      <p className="mb-1 text-4xl font-black text-amber-600">
                        {importResult.skipped || 0}
                      </p>
                      <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
                        ⏭ Saltati
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-6">
                      <p className="mb-1 text-4xl font-black text-destructive">
                        {importResult.errors?.length || 0}
                      </p>
                      <p className="text-sm font-semibold uppercase tracking-widest text-red-700">
                        ❌ Errori
                      </p>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-center">
                      <div className="mb-4 inline-block rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                        Attenzione: Si sono verificati{" "}
                        {importResult.errors.length} errori durante la
                        procedura.
                      </div>
                      <br />
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                        onClick={() => {
                          const csv =
                            "riga,CF,motivo_errore\n" +
                            importResult
                              .errors!.map(
                                (e) =>
                                  `${e.row},NA,"${e.message.replace(/"/g, '""')}"`,
                              )
                              .join("\n");
                          const blob = new Blob([csv], { type: "text/csv" });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `error_report_${entityType}.csv`;
                          a.click();
                        }}
                      >
                        <Download className="mr-2 size-4" /> Scarica report
                        completo
                      </Button>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Il file CSV contiene riga, CF, motivo per ogni anomalia
                      </p>
                      <div className="mt-8">
                        <Button onClick={() => setWizardStep(1)}>
                          Fai un altro import
                        </Button>
                      </div>
                    </div>
                  )}

                  {!importResult.errors?.length && (
                    <>
                      <div className="inline-flex items-center justify-center rounded-full bg-green-50 px-6 py-3 font-medium text-green-600">
                        <CheckCircle className="mr-2 size-5" /> Importazione
                        conclusa con successo senza alcun errore.
                      </div>
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            const csv =
                              "CF,Nome,Cognome,Azione,CampiModificati,ModificheApplicate\n" +
                              (dryRunData?.preview || [])
                                .map(
                                  (r: any) =>
                                    `${r.cf || ""},${r.nome || ""},${r.cognome || ""},${r.azione || ""},"${(r.campiModificati || []).join(",")}","${r.modificheCasing?.length > 0 ? r.modificheCasing.join(" | ") : "Nessuna"}"`,
                                )
                                .join("\n");
                            const blob = new Blob([csv], { type: "text/csv" });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `report_import_${entityType}.csv`;
                            a.click();
                          }}
                        >
                          <Download className="size-4" /> Scarica Report CSV
                        </Button>
                      </div>
                      <div className="mt-8">
                        <Button onClick={() => setWizardStep(1)}>
                          Fai un altro import
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sezione Istruzioni in fondo */}
      <Card className="mt-12 bg-muted/30">
        <CardHeader>
          <CardTitle>Come funziona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div>
            <h4 className="mb-2 font-semibold">Importazione da file:</h4>
            <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
              <li>
                Seleziona il tipo di dati da importare cliccando sulla card
                corrispondente.
              </li>
              <li>
                Carica il file (.csv, .xlsx o .xls) oppure inserisci l'ID del
                foglio Google.
              </li>
              <li>
                Verifica la mappatura delle colonne e l'anteprima dei dati.
              </li>
              <li>Avvia l'import e scarica il report.</li>
            </ol>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Formati supportati:</h4>
            <p className="text-muted-foreground">
              Il sistema accetta file Excel (.xlsx), CSV con virgola o punto e
              virgola, e fogli Google Sheets direttamente dall'URL. Le colonne
              vengono riconosciute automaticamente anche nei formati GSheets
              (an_cod_fiscale, an_nome...) e Athena (Cod. Fisc., Cognome...).
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Sicurezza dei dati:</h4>
            <p className="text-muted-foreground">
              {entityType === "members" &&
                "Se una persona esiste già (stesso CF), i suoi dati vengono aggiornati con quelli del file. Solo pagamenti e storico non vengono mai modificati."}
              {entityType === "payments" &&
                "I pagamenti importati sono definitivi e non possono essere modificati dopo l'import."}
              {entityType === "enrollments" &&
                "Se l'iscrizione esiste già (stessa persona + stesso corso), viene saltata automaticamente. Non vengono creati duplicati."}
              {entityType === "memberships" &&
                "Se la tessera esiste già per quella stagione, viene aggiornata la data di scadenza e lo stato. Non vengono creati duplicati."}
              {entityType === "accounting" &&
                "I movimenti contabili sono storico immutabile. Solo inserimento, mai modifica."}
              {![
                "members",
                "payments",
                "enrollments",
                "memberships",
                "accounting",
              ].includes(entityType) && "Verifica i dati prima di procedere."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
