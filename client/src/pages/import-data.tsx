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

  return (
    <div className="p-6 md:p-8 space-y-6 mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="w-full">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Importazione Dati</h1>
          <p className="text-muted-foreground text-sm max-w-3xl">
              Importa anagrafiche, pagamenti, iscrizioni, tessere e movimenti contabili da file Excel, CSV o Google Sheets. 
              Il sistema riconosce automaticamente le colonne e ti guida passo per passo.
          </p>
        </div>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-8">
          <h3 className="text-orange-700 font-semibold mb-2 flex items-center"><AlertCircle className="w-5 h-5 mr-2" /> Prima di importare — leggi</h3>
          <ul className="list-disc list-inside text-sm text-orange-800/90 space-y-1">
              <li>Ogni riga deve avere almeno: <strong>Codice Fiscale + Nome + Cognome + Email OPPURE Telefono</strong>. Le righe incomplete vengono saltate automaticamente.</li>
              <li>I pagamenti e i movimenti contabili <strong className="uppercase">non</strong> possono essere modificati dopo l'import. Verifica i dati prima di procedere.</li>
              <li>Se una persona esiste già nel sistema (stesso CF), i suoi dati vengono arricchiti — non duplicati.</li>
              <li>In caso di errori, scarica il report CSV al termine dell'import.</li>
          </ul>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 max-w-3xl mx-auto px-4 relative">
        <div className={`flex flex-col items-center z-10 ${wizardStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${wizardStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
          <span className="text-sm font-medium">Carica il file</span>
        </div>
        <div className={`flex-1 h-1 mx-4 rounded transition-colors ${wizardStep >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`flex flex-col items-center z-10 ${wizardStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${wizardStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
          <span className="text-sm font-medium">Mappa le colonne</span>
        </div>
        <div className={`flex-1 h-1 mx-4 rounded transition-colors ${wizardStep >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
        <div className={`flex flex-col items-center z-10 ${wizardStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${wizardStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>3</div>
          <span className="text-sm font-medium">Esegui e Riporta</span>
        </div>
      </div>

      {wizardStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { type: "members", label: "Anagrafica", icon: Users, desc: "Importa soci e partecipanti", badge: "Aggiorna se esiste · Inserisce se nuovo", fonti: "CSV · Excel (.xlsx) · Google Sheets" },
              { type: "payments", label: "Pagamenti", icon: CreditCard, desc: "Importa storico pagamenti da corsi, workshop e contanti", badge: "Solo inserimento · Mai modificare", fonti: "CSV · Excel (.xlsx) · Google Sheets", alert: "⚠ I pagamenti importati sono definitivi" },
              { type: "enrollments", label: "Iscrizioni ai Corsi", icon: BookOpen, desc: "Importa iscrizioni storiche ai corsi dalla piattaforma Athena", badge: "Aggiorna se esiste · Inserisce se nuovo", fonti: "CSV · Excel (.xlsx) — Athena" },
              { type: "memberships", label: "Tessere Associative", icon: CreditCard, desc: "Importa le tessere GemPass storiche e i rinnovi", badge: "Inserisce se non esiste", fonti: "CSV · Excel (.xlsx) — Athena", alert: "Max 10 tessere per persona (attività aperta dal 2016)" },
              { type: "accounting", label: "Movimenti Contabili", icon: BarChart2, desc: "Importa estratti conto BPM, Poste, Soldo e PostePay", badge: "Solo inserimento · Storico immutabile", fonti: "Excel (.xlsx) — BPM · Poste · Soldo", alert: "Coordinare con la sezione Contabilità prima dell'import" }
            ].map(t => {
              const Icon = t.icon;
              return (
                <Card 
                  key={t.type}
                  className={`cursor-pointer transition-colors shadow-sm hover:border-primary/50 flex flex-col ${entityType === t.type ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''}`}
                  onClick={() => setEntityType(t.type as any)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-start text-center space-y-3 h-full">
                    <Icon className={`w-8 h-8 ${entityType === t.type ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-xs text-muted-foreground min-h-[32px]">{t.desc}</div>
                    <Badge variant={t.type === 'members' || t.type === 'enrollments' ? 'default' : 'secondary'} className="text-[10px] w-full justify-center whitespace-normal text-center">{t.badge}</Badge>
                    {t.alert && (
                       <div className="text-[10px] font-medium text-amber-700 mt-2 bg-amber-50 p-1 rounded w-full line-clamp-2">{t.alert}</div>
                    )}
                    <div className="mt-auto pt-4 w-full">
                        <div className="text-[10px] text-muted-foreground mb-2">{t.fonti}</div>
                        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); downloadTemplate(t.type); }} title="Scarica il template CSV con tutte le colonne supportate">Template</Button>
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
              <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as "file" | "google_sheets")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">File Locale (.csv, .xlsx)</TabsTrigger>
                  <TabsTrigger value="google_sheets">Google Sheets</TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4 pt-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                      {selectedFile ? (
                        <>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">Trascina qui il file oppure clicca per selezionarlo</p>
                          <p className="text-xs text-muted-foreground mt-1">Formati supportati: .csv .xlsx .xls</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-2">Il separatore viene rilevato automaticamente (, o ;)</p>
                        </>
                      )}
                    </label>
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!selectedFile || filePreviewMutation.isPending}
                    onClick={() => {
                        if (!selectedFile) return;
                        filePreviewMutation.mutate({ file: selectedFile, delimiter: csvDelimiter });
                    }}
                  >
                    {filePreviewMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Procedi al Mapping"}
                  </Button>
                </TabsContent>

                <TabsContent value="google_sheets" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Importa da Google Sheets (ID del foglio Google)</Label>
                      <Input value={spreadsheetId} onChange={(e) => setSpreadsheetId(e.target.value)} placeholder="1A2B3C..." />
                      <p className="text-xs text-muted-foreground">Trovi l'ID nell'URL del foglio: docs.google.com/spreadsheets/d/[ID]/edit</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Intervallo (opzionale)</Label>
                      <Input value={sheetRange} onChange={(e) => setSheetRange(e.target.value)} placeholder="Foglio1!A1:Z1000" />
                      <p className="text-xs text-muted-foreground">Esempio: Foglio1!A1:Z1000 — lascia vuoto per tutto il foglio</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={!spreadsheetId || previewHeadersMutation.isPending}
                    onClick={handlePreviewHeaders}
                  >
                    {previewHeadersMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Procedi al Mapping"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {wizardStep === 2 && (
        <div className="space-y-6">
          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" onClick={handleBackToInput}>Indietro</Button>
            <Button variant="outline" onClick={handleSaveMapping}><Save className="w-4 h-4 mr-2" /> Salva questa mappatura</Button>
            <Button variant="outline" onClick={handleAutoMap}><Settings2 className="w-4 h-4 mr-2"/> Auto-Mappa tutto</Button>
            <Button className="ml-auto" onClick={() => setWizardStep(3)}><ArrowRight className="w-4 h-4 mr-2"/> Continua allo Step 3</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Mappa le colonne</CardTitle>
              <CardDescription>
                  Il sistema ha riconosciuto automaticamente alcune colonne (✅). Per le altre, scegli il campo corrispondente oppure seleziona 'Ignora'.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0 text-sm">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-2 bg-muted rounded-t-md font-semibold font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  <div>Colonna Excel / CSV</div>
                  <div className="w-24 text-center">Stato</div>
                  <div>Campo DB</div>
                </div>
                <div className="border border-t-0 rounded-b-md divide-y overflow-hidden">
                  {sheetHeaders.map(header => {
                    const mappedDbFieldKey = Object.keys(fieldMapping).find(k => fieldMapping[k] === header.index);
                    const isMapped = !!mappedDbFieldKey;
                    
                    return (
                      <div key={header.index} className={`grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-3 transition-colors ${isMapped ? 'bg-background' : 'bg-muted/30'}`}>
                        <div className="font-medium truncate" title={header.name}>{header.index + 1}. {header.name}</div>
                        <div className="w-24 flex justify-center">
                            {isMapped ? (
                              <Badge className="bg-green-600/10 text-green-700 hover:bg-green-600/20 border-green-600/20 shadow-none"><CheckCircle className="w-3 h-3 mr-1" /> Mappato</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground"><AlertCircle className="w-3 h-3 mr-1" /> Ignorato</Badge>
                            )}
                        </div>
                        <div>
                          <Select 
                            value={mappedDbFieldKey || "__none__"}
                            onValueChange={(val) => {
                                const newMap = {...fieldMapping};
                                if (mappedDbFieldKey) newMap[mappedDbFieldKey] = null;
                                if (val !== "__none__") newMap[val] = header.index;
                                setFieldMapping(newMap);
                            }}
                          >
                            <SelectTrigger className={`h-8 font-medium ${!isMapped && 'opacity-70'}`}>
                              <SelectValue placeholder="Seleziona campo..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="__none__" className="text-muted-foreground italic">— Ignora questa colonna —</SelectItem>
                              {currentFields.map(cf => (
                                <SelectItem key={cf.key} value={cf.key}>
                                  {cf.label} {cf.required ? <span className="text-destructive">*</span> : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )
                  })}
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
                <Table className="border min-w-max">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {currentFields.filter(f => fieldMapping[f.key] !== null).map(f => (
                        <TableHead key={f.key} className="font-semibold text-primary/80 whitespace-nowrap">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleData.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {currentFields.filter(f => fieldMapping[f.key] !== null).map(f => (
                          <TableCell key={f.key} className="whitespace-nowrap max-w-[250px] truncate">
                            {row[fieldMapping[f.key] as number] || <span className="text-muted-foreground/30 italic">-vuoto-</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    {sampleData.length === 0 && (
                      <TableRow>
                         <TableCell colSpan={currentFields.length} className="text-center py-8 text-muted-foreground">Nessun dato in anteprima</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="mt-4 text-sm text-muted-foreground text-center space-y-1">
                <div>Vengono visualizzate le prime righe tradotte secondo la mappatura aggiornata in tempo reale.</div>
                <div className="font-medium text-foreground">
                  Trovate {sampleData.length} righe totali &middot;{' '}
                  {fieldMapping["fiscalCode"] !== null && fieldMapping["fiscalCode"] !== undefined ? sampleData.filter(r => r[fieldMapping["fiscalCode"] as number]).length : 0} con Codice Fiscale (verranno importate) &middot;{' '}
                  {fieldMapping["fiscalCode"] !== null && fieldMapping["fiscalCode"] !== undefined ? sampleData.filter(r => !r[fieldMapping["fiscalCode"] as number]).length : sampleData.length} senza CF (verranno saltate)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {wizardStep === 3 && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setWizardStep(2)}>Indietro</Button>
          </div>

          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-primary">Importazione in corso</CardTitle>
              <CardDescription>Il sistema processeerà {sampleData.length} righe ignorando gli ID duplicati primari.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-10 space-y-6">
              
              {!importResult && (
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg"
                    onClick={handleMappedImport}
                    disabled={isImporting}
                  >
                    {isImporting ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Settings2 className="w-6 h-6 mr-3" />}
                    {isImporting ? "Elaborazione in corso... non chiudere questa finestra." : "CONFERMA E AVVIA IMPORTAZIONE"}
                  </Button>
              )}

              {importResult && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-green-600 mb-1">{importResult.inserted || importResult.imported || 0}</p>
                      <p className="text-sm font-semibold text-green-700 uppercase tracking-widest">✅ Inseriti</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-blue-600 mb-1">{importResult.updated || 0}</p>
                      <p className="text-sm font-semibold text-blue-700 uppercase tracking-widest">🔄 Aggiornati</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-amber-600 mb-1">{importResult.skipped || 0}</p>
                      <p className="text-sm font-semibold text-amber-700 uppercase tracking-widest">⏭ Saltati</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
                      <p className="text-4xl font-black text-destructive mb-1">{importResult.errors?.length || 0}</p>
                      <p className="text-sm font-semibold text-red-700 uppercase tracking-widest">❌ Errori</p>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-center">
                         <div className="inline-block bg-destructive/10 text-destructive px-4 py-2 rounded-lg font-medium text-sm mb-4">
                             Attenzione: Si sono verificati {importResult.errors.length} errori durante la procedura.
                         </div>
                         <br/>
                         <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => {
                            const csv = "riga,CF,motivo_errore\n" + importResult.errors!.map(e => `${e.row},NA,"${e.message.replace(/"/g, '""')}"`).join("\n");
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `error_report_${entityType}.csv`;
                            a.click();
                         }}>
                            <Download className="w-4 h-4 mr-2" /> Scarica report completo
                         </Button>
                         <p className="text-xs text-muted-foreground mt-2">Il file CSV contiene riga, CF, motivo per ogni anomalia</p>
                         <div className="mt-8">
                             <Button onClick={() => setWizardStep(1)}>Fai un altro import</Button>
                         </div>
                    </div>
                  )}

                  {!importResult.errors?.length && (
                      <>
                        <div className="inline-flex items-center justify-center text-green-600 font-medium bg-green-50 px-6 py-3 rounded-full">
                            <CheckCircle className="w-5 h-5 mr-2" /> Importazione conclusa con successo senza alcun errore.
                        </div>
                        <div className="mt-8">
                            <Button onClick={() => setWizardStep(1)}>Fai un altro import</Button>
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
            <h4 className="font-semibold mb-2">Importazione da file:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Seleziona il tipo di dati da importare cliccando sulla card corrispondente.</li>
              <li>Carica il file (.csv, .xlsx o .xls) oppure inserisci l'ID del foglio Google.</li>
              <li>Verifica la mappatura delle colonne e l'anteprima dei dati.</li>
              <li>Avvia l'import e scarica il report.</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Formati supportati:</h4>
            <p className="text-muted-foreground">
              Il sistema accetta file Excel (.xlsx), CSV con virgola o punto e virgola, 
              e fogli Google Sheets direttamente dall'URL. Le colonne vengono riconosciute 
              automaticamente anche nei formati GSheets (an_cod_fiscale, an_nome...) 
              e Athena (Cod. Fisc., Cognome...).
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Sicurezza dei dati:</h4>
            <p className="text-muted-foreground">
              I dati esistenti non vengono mai sovrascritti. Se una persona è già presente (stesso CF), 
              vengono completati solo i campi vuoti. I pagamenti e i movimenti contabili non possono essere 
              modificati dopo l'import.
            </p>
          </div>
        </CardContent>
      </Card>
      
    </div>

  );
}
