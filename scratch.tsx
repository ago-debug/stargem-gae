import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Sheet, ArrowRight, Settings2, Key, Loader2, Save, Trash2, Users, BookOpen, CreditCard, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  { key: "fiscalCode", label: "Codice Fiscale", required: true },
  { key: "firstName", label: "Nome", required: true },
  { key: "lastName", label: "Cognome", required: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefono" },
  { key: "mobile", label: "Cellulare" },
  { key: "dateOfBirth", label: "Data Nascita" },
  { key: "placeOfBirth", label: "Luogo Nascita" },
  { key: "birthProvince", label: "Provincia Nascita" },
  { key: "address", label: "Indirizzo" },
  { key: "city", label: "Città" },
  { key: "postalCode", label: "CAP" },
  { key: "province", label: "Provincia" },
  { key: "gender", label: "Sesso" },
  { key: "nationality", label: "Nazionalità" },
  { key: "region", label: "Regione" },
  { key: "birthCountry", label: "Nazione Nascita" },
  { key: "secondaryEmail", label: "Email Secondaria" },
  { key: "notes", label: "Note" },
  { key: "adminNotes", label: "Note Admin" },
  { key: "privacyDate", label: "Data Privacy" },
  { key: "newsletterConsent", label: "Consenso Newsletter" },
  { key: "marketingConsent", label: "Consenso Marketing" },
  { key: "imageConsent", label: "Consenso Immagine" },
  { key: "documentType", label: "Tipo Documento" },
  { key: "documentExpiry", label: "Scadenza Documento" },
  { key: "profession", label: "Professione" },
  { key: "tags", label: "Tags" },
  { key: "parent1LastName", label: "Cognome Genitore 1" },
  { key: "parent1FirstName", label: "Nome Genitore 1" },
  { key: "parent1FiscalCode", label: "CF Tutore 1" },
  { key: "parent1Phone", label: "Tel Tutore 1" },
  { key: "parent1Email", label: "Email Tutore 1" }
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
  { key: "depositDate", label: "Data Acconto" }
];

const ACCOUNTING_FIELDS = [
  { key: "date", label: "Data", required: true },
  { key: "description", label: "Descrizione", required: true },
  { key: "amount", label: "Importo", required: true },
  { key: "type", label: "Tipo" },
  { key: "bankAccount", label: "Conto Bancario" },
  { key: "category", label: "Categoria" },
  { key: "notes", label: "Note" }
];

const ENROLLMENTS_FIELDS = [
  { key: "fiscalCode", label: "Codice Fiscale", required: true },
  { key: "courseCode", label: "Codice Corso" },
  { key: "courseName", label: "Nome Corso" },
  { key: "status", label: "Stato Iscrizione" },
  { key: "enrollmentDate", label: "Data Iscrizione" },
  { key: "amount", label: "Importo" }
];

const MEMBERSHIPS_FIELDS = [
  { key: "fiscalCode", label: "Codice Fiscale", required: true },
  { key: "cardNumber", label: "Numero Tessera" },
  { key: "cardType", label: "Tipo Tessera" },
  { key: "issueDate", label: "Data Emissione" },
  { key: "expiryDate", label: "Data Scadenza" },
  { key: "amount", label: "Quota" },
  { key: "renewal", label: "Rinnovo" }
];

// Combine import key options since the entities changed
const IMPORT_KEY_OPTIONS = [
  { key: "fiscalCode", label: "Codice Fiscale" },
  { key: "email", label: "Email" },
  { key: "sku", label: "Codice Univoco / SKU" }
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
  const [fieldMapping, setFieldMapping] = useState<Record<string, number | null>>({});
  const [importKey, setImportKey] = useState<string>("fiscalCode");
  const [autoCreateRecords, setAutoCreateRecords] = useState<boolean>(true);

  // Entity type and source type for mapping
  const [entityType, setEntityType] = useState<"members" | "payments" | "enrollments" | "memberships" | "accounting">("members");
  const [sourceType, setSourceType] = useState<"google_sheets" | "file">("file");

  // Saved configs
  const [saveConfigDialogOpen, setSaveConfigDialogOpen] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");

  // CSV delimiter for file imports
  const [csvDelimiter, setCsvDelimiter] = useState<string>(",");

  // Get current fields and import key options based on entity type
  const getCurrentFields = () => {
    switch (entityType) {
      case "members": return MEMBER_FIELDS;
      case "payments": return PAYMENTS_FIELDS;
      case "accounting": return ACCOUNTING_FIELDS;
      case "enrollments": return ENROLLMENTS_FIELDS;
      case "memberships": return MEMBERSHIPS_FIELDS;
      default: return MEMBER_FIELDS;
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
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Errore durante l\'importazione');
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
        variant: "destructive"
      });
    },
  });

  const previewHeadersMutation = useMutation({
    mutationFn: async ({ spreadsheetId, range }: { spreadsheetId: string; range: string }) => {
      return await apiRequest("POST", "/api/google-sheets/preview-headers", { spreadsheetId, range });
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
        try { savedMap = JSON.parse(savedMapStr); } catch(e){}
      }

      currentFields.forEach(field => {
        initialMapping[field.key] = savedMap[field.key] !== undefined ? savedMap[field.key] : null;
      });
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
        variant: "destructive"
      });
    },
  });

  // File preview mutation
  const filePreviewMutation = useMutation({
    mutationFn: async ({ file, delimiter }: { file: File; delimiter: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('delimiter', delimiter);
      const response = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Errore lettura file');
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
        try { savedMap = JSON.parse(savedMapStr); } catch(e){}
      }

      currentFields.forEach(field => {
        initialMapping[field.key] = savedMap[field.key] !== undefined ? savedMap[field.key] : null;
      });
      setFieldMapping(initialMapping);

      // Set default import key
      setImportKey(entityType === "members" ? "fiscalCode" : "sku");

      toast({
        title: "Anteprima caricata",
        description: `Trovate ${data.headers?.length || 0} colonne e ${data.totalRows} righe.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // File mapped import mutation
  const fileMappedImportMutation = useMutation({
    mutationFn: async (params: { file: File; fieldMapping: Record<string, number>; importKey: string; entityType: string; delimiter: string; autoCreateRecords?: boolean }) => {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('fieldMapping', JSON.stringify(params.fieldMapping));
      formData.append('importKey', params.importKey);
      formData.append('entityType', params.entityType);
      formData.append('delimiter', params.delimiter);
      formData.append('autoCreateRecords', String(params.autoCreateRecords || false));
      const response = await fetch('/api/import/mapped', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Errore importazione');
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
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (config: { name: string; entityType: string; sourceType: string; fieldMapping: Record<string, number>; importKey: string }) => {
      return await apiRequest("POST", "/api/import-configs", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/import-configs"] });
      setSaveConfigDialogOpen(false);
      setNewConfigName("");
      toast({ title: "Configurazione salvata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const mappedImportMutation = useMutation({
    mutationFn: async (params: { spreadsheetId: string; range: string; fieldMapping: Record<string, number | null>; importKey: string; entityType: string; autoCreateRecords?: boolean }) => {
      return await apiRequest("POST", "/api/google-sheets/import-mapped", params);
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
        variant: "destructive"
      });
    },
  });

  const googleSheetsImportMutation = useMutation({
    mutationFn: async ({ spreadsheetId, range, type }: { spreadsheetId: string; range: string; type: string }) => {
      return await apiRequest("POST", "/api/import/google-sheets", { spreadsheetId, range, type });
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
        variant: "destructive"
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
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }

    googleSheetsImportMutation.mutate({ spreadsheetId, range: sheetRange, type: importType });
  };

  const handlePreviewHeaders = () => {
    if (!spreadsheetId) {
      toast({
        title: "Errore",
        description: "Inserisci l'ID del foglio Google",
        variant: "destructive"
      });
      return;
    }

    previewHeadersMutation.mutate({ spreadsheetId, range: sheetRange || "A1:Z1000" });
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
        variant: "destructive"
      });
      return;
    }

    // Check for required fields based on entity type
    if (entityType === "members") {
      if (activeMapping.firstName === undefined && activeMapping.lastName === undefined) {
        toast({
          title: "Errore",
          description: "Nome o Cognome sono obbligatori",
          variant: "destructive"
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
      });
    } else {
      mappedImportMutation.mutate({
        spreadsheetId,
        range: sheetRange || "A1:Z1000",
        fieldMapping: activeMapping,
        importKey,
        entityType,
        autoCreateRecords,
      });
    }
  };

  const handleFilePreview = () => {
    if (!selectedFile) {
      toast({ title: "Errore", description: "Seleziona un file", variant: "destructive" });
      return;
    }
    filePreviewMutation.mutate({ file: selectedFile, delimiter: csvDelimiter });
  };

  const handleSaveConfig = () => {
    if (!newConfigName.trim()) {
      toast({ title: "Errore", description: "Inserisci un nome per la configurazione", variant: "destructive" });
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
    setEntityType(config.entityType as "members" | "payments" | "enrollments" | "memberships" | "accounting");
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
    setFieldMapping(prev => ({
      ...prev,
      [fieldKey]: columnIndex,
    }));
  };

  const downloadTemplate = (type: string) => {
    const templates: Record<string, string> = {
      members: "cognome,nome,codice_fiscale,email,telefono,cellulare,data_nascita,luogo_nascita,indirizzo,citta,cap,provincia,sesso,note\nRossi,Mario,RSSMRA90A15F205X,mario@email.com,021234567,3331234567,1990-01-15,Milano,Via Roma 1,Milano,20100,MI,M,\n",
      payments: "codice_fiscale,tipo_pagamento,importo,importo_pagato,metodo_pagamento,data_pagamento,descrizione,codice_corso,codice_sconto,periodo\nRSSMRA90A15F205X,ISCRIZIONE,50.00,50.00,BONIFICO,2024-01-10,Quota iscrizione,YOGA-01,,MENSILE\n",
      enrollments: "codice_fiscale,codice_corso,nome_corso,stato_iscrizione,data_iscrizione,importo\nRSSMRA90A15F205X,YOGA-01,Yoga Base,ATTIVA,2024-01-10,50.00\n",
      memberships: "codice_fiscale,numero_tessera,tipo_tessera,data_emissione,data_scadenza,quota,rinnovo\nRSSMRA90A15F205X,CSEN-001,CSEN,2024-01-10,2024-12-31,10.00,0\n",
      accounting: "data,descrizione,importo,tipo (entrata/uscita),conto,categoria,note\n2024-01-10,Stipendio insegnante,500.00,USCITA,BPM,STIPENDI,\n",
    };

    const template = templates[type];
    if (!template) return;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${type}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveMapping = () => {
    localStorage.setItem(`mappatura_${entityType}`, JSON.stringify(fieldMapping));
    toast({ title: "Mappatura salvata", description: "Verrà precaricata al prossimo import simile." });
  };

  const handleAutoMap = () => {
    // Already populated by preview response matching keys, but this forces a re-evaluation
    // based on typical columns
    const initialMapping: Record<string, number | null> = {};
    currentFields.forEach(field => {
      // Find a matching sheet header
      const match = sheetHeaders.find(h => 
        h.name.toLowerCase().includes(field.label.toLowerCase()) || 
        h.name.toLowerCase().includes(field.key.toLowerCase()) ||
        field.label.toLowerCase().includes(h.name.toLowerCase())
      );
      initialMapping[field.key] = match ? match.index : null;
    });
    setFieldMapping(initialMapping);
    toast({ title: "Auto-Mappatura", description: "Assegnazioni calcolate dove possibile." });
  };

  // Render variables
  const isImporting = mappedImportMutation.isPending || fileMappedImportMutation.isPending;
    const filteredConfigs = savedConfigs.filter(c => c.entityType === entityType);
