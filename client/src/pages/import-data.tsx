import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Sheet, ArrowRight, Settings2, Key, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// All available member fields for mapping
const MEMBER_FIELDS = [
  { key: "firstName", label: "Nome", required: true },
  { key: "lastName", label: "Cognome", required: true },
  { key: "fiscalCode", label: "Codice Fiscale" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefono" },
  { key: "mobile", label: "Cellulare" },
  { key: "dateOfBirth", label: "Data di Nascita" },
  { key: "placeOfBirth", label: "Luogo di Nascita" },
  { key: "gender", label: "Sesso (M/F)" },
  { key: "streetAddress", label: "Indirizzo" },
  { key: "city", label: "Città" },
  { key: "province", label: "Provincia (Sigla)" },
  { key: "postalCode", label: "CAP" },
  { key: "cardNumber", label: "Numero Tessera" },
  { key: "cardIssueDate", label: "Data Rilascio Tessera" },
  { key: "cardExpiryDate", label: "Scadenza Tessera" },
  { key: "entityCardType", label: "Tipo Ente (CSEN, ACSI...)" },
  { key: "entityCardNumber", label: "Numero Tessera Ente" },
  { key: "entityCardIssueDate", label: "Data Rilascio Tessera Ente" },
  { key: "entityCardExpiryDate", label: "Scadenza Tessera Ente" },
  { key: "hasMedicalCertificate", label: "Certificato Medico (Si/No)" },
  { key: "medicalCertificateExpiry", label: "Scadenza Certificato Medico" },
  { key: "isMinor", label: "Minorenne (Si/No)" },
  { key: "motherFirstName", label: "Nome Madre" },
  { key: "motherLastName", label: "Cognome Madre" },
  { key: "motherFiscalCode", label: "Codice Fiscale Madre" },
  { key: "motherEmail", label: "Email Madre" },
  { key: "motherPhone", label: "Telefono Madre" },
  { key: "motherMobile", label: "Cellulare Madre" },
  { key: "fatherFirstName", label: "Nome Padre" },
  { key: "fatherLastName", label: "Cognome Padre" },
  { key: "fatherFiscalCode", label: "Codice Fiscale Padre" },
  { key: "fatherEmail", label: "Email Padre" },
  { key: "fatherPhone", label: "Telefono Padre" },
  { key: "fatherMobile", label: "Cellulare Padre" },
  { key: "notes", label: "Note" },
];

// Import key options
const IMPORT_KEY_OPTIONS = [
  { key: "fiscalCode", label: "Codice Fiscale" },
  { key: "email", label: "Email" },
  { key: "cardNumber", label: "Numero Tessera" },
  { key: "entityCardNumber", label: "Numero Tessera Ente" },
  { key: "mobile", label: "Cellulare" },
  { key: "phone", label: "Telefono" },
];

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
  const [step, setStep] = useState<"input" | "mapping">("input");
  const [sheetHeaders, setSheetHeaders] = useState<SheetHeader[]>([]);
  const [sampleData, setSampleData] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, number | null>>({});
  const [importKey, setImportKey] = useState<string>("fiscalCode");

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
      setStep("mapping");
      
      // Initialize field mapping
      const initialMapping: Record<string, number | null> = {};
      MEMBER_FIELDS.forEach(field => {
        initialMapping[field.key] = null;
      });
      setFieldMapping(initialMapping);
      
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

  const mappedImportMutation = useMutation({
    mutationFn: async (params: { spreadsheetId: string; range: string; fieldMapping: Record<string, number | null>; importKey: string }) => {
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

    // Check for required fields using explicit undefined check (index 0 is valid)
    if (activeMapping.firstName === undefined && activeMapping.lastName === undefined) {
      toast({ 
        title: "Errore", 
        description: "Nome o Cognome sono obbligatori", 
        variant: "destructive" 
      });
      return;
    }

    mappedImportMutation.mutate({
      spreadsheetId,
      range: sheetRange || "A1:Z1000",
      fieldMapping: activeMapping,
      importKey,
    });
  };

  const handleBackToInput = () => {
    setStep("input");
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
      members: "Nome,Cognome,Email,Telefono,Data di Nascita,Indirizzo,Città,CAP,Codice Fiscale,Note\nMario,Rossi,mario.rossi@email.com,3331234567,1990-01-15,Via Roma 1,Milano,20100,RSSMRA90A15F205X,\n",
      courses: "Nome Corso,Descrizione,Prezzo,Capienza Massima,Orario\nYoga Base,Corso di yoga per principianti,50.00,20,Lun-Mer 18:00-19:30\n",
      instructors: "Nome,Cognome,Email,Telefono,Specializzazione,Tariffa Oraria\nGiovanni,Bianchi,g.bianchi@email.com,3339876543,Yoga,35.00\n",
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

  // Render mapping interface
  if (step === "mapping") {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">Mappatura Campi</h1>
            <p className="text-muted-foreground">
              Associa le colonne del foglio Google ai campi del database
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToInput} data-testid="button-back-to-input">
            Indietro
          </Button>
        </div>

        {/* Sample Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Anteprima Dati
            </CardTitle>
            <CardDescription>
              Prime righe del foglio Google per verificare i dati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    {sheetHeaders.map((header) => (
                      <TableHead key={header.index} className="whitespace-nowrap">
                        <Badge variant="secondary">{header.index}</Badge>
                        <span className="ml-2">{header.name}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleData.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      {sheetHeaders.map((header) => (
                        <TableCell key={header.index} className="whitespace-nowrap max-w-[200px] truncate">
                          {row[header.index] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Import Key Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5" />
              Chiave di Importazione
            </CardTitle>
            <CardDescription>
              Scegli il campo usato per identificare i duplicati (aggiorna esistenti se la chiave corrisponde)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={importKey} onValueChange={setImportKey}>
              <SelectTrigger className="w-full md:w-80" data-testid="select-import-key">
                <SelectValue placeholder="Seleziona chiave" />
              </SelectTrigger>
              <SelectContent>
                {IMPORT_KEY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Field Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Mappatura Campi
            </CardTitle>
            <CardDescription>
              Associa ogni campo del database alla colonna corrispondente del foglio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MEMBER_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Label className={`text-sm ${field.required ? 'font-semibold' : ''}`}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select
                      value={fieldMapping[field.key]?.toString() ?? "__none__"}
                      onValueChange={(val) => updateFieldMapping(field.key, val === "__none__" ? null : parseInt(val))}
                    >
                      <SelectTrigger className="mt-1" data-testid={`select-mapping-${field.key}`}>
                        <SelectValue placeholder="Non mappato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Non mappato</SelectItem>
                        {sheetHeaders.map((header) => (
                          <SelectItem key={header.index} value={header.index.toString()}>
                            [{header.index}] {header.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {fieldMapping[field.key] !== null && fieldMapping[field.key] !== undefined && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-6" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={handleBackToInput}>
            Annulla
          </Button>
          <Button 
            onClick={handleMappedImport}
            disabled={mappedImportMutation.isPending}
            data-testid="button-execute-mapped-import"
          >
            {mappedImportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importazione...
              </>
            ) : (
              "Esegui Importazione"
            )}
          </Button>
        </div>

        {/* Results */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.errors && importResult.errors.length > 0 ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                Risultati Importazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{importResult.imported || 0}</p>
                  <p className="text-sm text-muted-foreground">Nuovi</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{importResult.updated || 0}</p>
                  <p className="text-sm text-muted-foreground">Aggiornati</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{importResult.skipped || 0}</p>
                  <p className="text-sm text-muted-foreground">Saltati</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-destructive">
                    {importResult.errors?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Errori</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Errori Riscontrati</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="p-2 bg-destructive/10 rounded-md text-sm">
                          <Badge variant="destructive" className="mr-2">Riga {error.row}</Badge>
                          {error.message}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Importa Dati</h1>
        <p className="text-muted-foreground">
          Importa dati da file CSV/Excel o direttamente da Google Sheets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          className={`cursor-pointer hover-elevate active-elevate-2 ${importType === 'members' ? 'border-primary' : ''}`}
          onClick={() => setImportType('members')}
          data-testid="card-import-members"
        >
          <CardHeader>
            <CardTitle className="text-lg">Iscritti</CardTitle>
            <CardDescription>Importa anagrafica iscritti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplate('members');
                }}
                data-testid="button-download-members-template"
              >
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate active-elevate-2 ${importType === 'courses' ? 'border-primary' : ''}`}
          onClick={() => setImportType('courses')}
          data-testid="card-import-courses"
        >
          <CardHeader>
            <CardTitle className="text-lg">Corsi</CardTitle>
            <CardDescription>Importa elenco corsi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplate('courses');
                }}
                data-testid="button-download-courses-template"
              >
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer hover-elevate active-elevate-2 ${importType === 'instructors' ? 'border-primary' : ''}`}
          onClick={() => setImportType('instructors')}
          data-testid="card-import-instructors"
        >
          <CardHeader>
            <CardTitle className="text-lg">Insegnanti</CardTitle>
            <CardDescription>Importa anagrafica insegnanti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplate('instructors');
                }}
                data-testid="button-download-instructors-template"
              >
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sheets-advanced" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sheets-advanced" data-testid="tab-sheets-advanced">
            <Settings2 className="w-4 h-4 mr-2" />
            Google Sheets (Avanzato)
          </TabsTrigger>
          <TabsTrigger value="sheets" data-testid="tab-sheets-import">
            <Sheet className="w-4 h-4 mr-2" />
            Google Sheets (Auto)
          </TabsTrigger>
          <TabsTrigger value="file" data-testid="tab-file-import">
            <Upload className="w-4 h-4 mr-2" />
            Carica File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sheets-advanced">
          <Card>
            <CardHeader>
              <CardTitle>Importazione Avanzata da Google Sheets</CardTitle>
              <CardDescription>
                Configura manualmente la mappatura dei campi e scegli la chiave di importazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="advSpreadsheetId">ID Foglio Google</Label>
                <Input
                  id="advSpreadsheetId"
                  placeholder="1A2B3C4D5E6F7G8H9I0J..."
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  data-testid="input-adv-spreadsheet-id"
                />
                <p className="text-xs text-muted-foreground">
                  L'ID si trova nell'URL del foglio: docs.google.com/spreadsheets/d/<strong>ID_FOGLIO</strong>/edit
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advSheetRange">Range (opzionale)</Label>
                <Input
                  id="advSheetRange"
                  placeholder="Foglio1!A1:Z1000"
                  value={sheetRange}
                  onChange={(e) => setSheetRange(e.target.value)}
                  data-testid="input-adv-sheet-range"
                />
                <p className="text-xs text-muted-foreground">
                  Esempio: Foglio1!A1:Z100 o lascia vuoto per tutto il foglio
                </p>
              </div>

              <Separator />

              <Button 
                onClick={handlePreviewHeaders}
                disabled={!spreadsheetId || previewHeadersMutation.isPending}
                className="w-full"
                data-testid="button-preview-headers"
              >
                {previewHeadersMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Caricamento anteprima...
                  </>
                ) : (
                  <>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Configura Mappatura Campi
                  </>
                )}
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Vantaggi dell'importazione avanzata:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Mappa liberamente le colonne ai campi del database</li>
                  <li>Scegli quale campo usare come chiave (duplicati)</li>
                  <li>Anteprima dei dati prima dell'importazione</li>
                  <li>Supporto per tutti i campi anagrafica</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sheets">
          <Card>
            <CardHeader>
              <CardTitle>Importa da Google Sheets (Automatico)</CardTitle>
              <CardDescription>
                Mappatura automatica basata sui nomi delle colonne
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sheetsImportType">Tipo di Importazione</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger data-testid="select-sheets-import-type">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">Iscritti</SelectItem>
                    <SelectItem value="courses">Corsi</SelectItem>
                    <SelectItem value="instructors">Insegnanti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spreadsheetId">ID Foglio Google</Label>
                <Input
                  id="spreadsheetId"
                  placeholder="1A2B3C4D5E6F7G8H9I0J..."
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  data-testid="input-spreadsheet-id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sheetRange">Range</Label>
                <Input
                  id="sheetRange"
                  placeholder="Foglio1!A1:Z100"
                  value={sheetRange}
                  onChange={(e) => setSheetRange(e.target.value)}
                  data-testid="input-sheet-range"
                />
              </div>

              <Button 
                onClick={handleGoogleSheetsImport}
                disabled={!spreadsheetId || !sheetRange || !importType || googleSheetsImportMutation.isPending}
                className="w-full"
                data-testid="button-import-sheets"
              >
                {googleSheetsImportMutation.isPending ? "Importazione in corso..." : "Importa da Google Sheets"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Carica File CSV/Excel</CardTitle>
              <CardDescription>
                Seleziona un file CSV o Excel da importare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="importType">Tipo di Importazione</Label>
                <Select value={importType} onValueChange={setImportType}>
                  <SelectTrigger data-testid="select-import-type">
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">Iscritti</SelectItem>
                    <SelectItem value="courses">Corsi</SelectItem>
                    <SelectItem value="instructors">Insegnanti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">File CSV/Excel</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    data-testid="input-file"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium">Clicca per selezionare un file</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Oppure trascina il file qui
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <Button 
                onClick={handleImport}
                disabled={!selectedFile || !importType || importMutation.isPending}
                className="w-full"
                data-testid="button-import-file"
              >
                {importMutation.isPending ? "Importazione in corso..." : "Importa Dati"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {importResult && step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.errors && importResult.errors.length > 0 ? (
                <AlertCircle className="w-5 h-5 text-destructive" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              Risultati Importazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold">{importResult.imported || 0}</p>
                <p className="text-sm text-muted-foreground">Importati</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold">{importResult.skipped || 0}</p>
                <p className="text-sm text-muted-foreground">Saltati</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold text-destructive">
                  {importResult.errors?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Errori</p>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Errori Riscontrati</h4>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="p-2 bg-destructive/10 rounded-md text-sm">
                      <Badge variant="destructive" className="mr-2">Riga {error.row}</Badge>
                      {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Istruzioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Importazione Avanzata (Consigliata):</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Inserisci l'ID del foglio Google e clicca "Configura Mappatura"</li>
                <li>Visualizza l'anteprima dei dati</li>
                <li>Associa ogni campo del database alla colonna corrispondente</li>
                <li>Scegli quale campo usare come chiave per identificare i duplicati</li>
                <li>Esegui l'importazione</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Importazione da File:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Scarica il template CSV appropriato</li>
                <li>Compila il file con i tuoi dati</li>
                <li>Carica il file e avvia l'importazione</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
