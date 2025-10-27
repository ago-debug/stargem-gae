import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Sheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ImportData() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>("");
  const [importResult, setImportResult] = useState<any>(null);
  
  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");
  const [sheetRange, setSheetRange] = useState<string>("");

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

      <Tabs defaultValue="file" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" data-testid="tab-file-import">
            <Upload className="w-4 h-4 mr-2" />
            Carica File
          </TabsTrigger>
          <TabsTrigger value="sheets" data-testid="tab-sheets-import">
            <Sheet className="w-4 h-4 mr-2" />
            Google Sheets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <Card>
            <CardHeader>
              <CardTitle>Carica File CSV/Excel</CardTitle>
              <CardDescription>
                Seleziona un file CSV o Excel da importare. Assicurati che le colonne corrispondano al template.
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

        <TabsContent value="sheets">
          <Card>
            <CardHeader>
              <CardTitle>Importa da Google Sheets</CardTitle>
              <CardDescription>
                Collegati direttamente a un foglio di Google Sheets per importare i dati
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
                <p className="text-xs text-muted-foreground">
                  L'ID si trova nell'URL del foglio: docs.google.com/spreadsheets/d/<strong>ID_FOGLIO</strong>/edit
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Esempio: Foglio1!A1:Z100 o Iscritti!A:Z per tutte le righe
                </p>
              </div>

              <Button 
                onClick={handleGoogleSheetsImport}
                disabled={!spreadsheetId || !sheetRange || !importType || googleSheetsImportMutation.isPending}
                className="w-full"
                data-testid="button-import-sheets"
              >
                {googleSheetsImportMutation.isPending ? "Importazione in corso..." : "Importa da Google Sheets"}
              </Button>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Come trovare l'ID del foglio:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Apri il tuo foglio Google Sheets</li>
                  <li>Guarda l'URL nella barra degli indirizzi</li>
                  <li>Copia la parte tra /d/ e /edit</li>
                  <li>Incolla qui l'ID copiato</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                  {importResult.errors.map((error: any, index: number) => (
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
              <h4 className="font-medium mb-2">Importazione da File:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Scarica il template CSV appropriato cliccando su "Template"</li>
                <li>Esporta i tuoi dati da Google Sheets come file CSV o Excel</li>
                <li>Copia i dati dal tuo file al template scaricato, rispettando le colonne</li>
                <li>Seleziona il tipo di importazione e carica il file</li>
                <li>Verifica i risultati dell'importazione e correggi eventuali errori</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Importazione da Google Sheets:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Assicurati che il foglio Google sia condiviso con il tuo account</li>
                <li>Copia l'ID del foglio dall'URL</li>
                <li>Specifica il range dei dati (es. "Foglio1!A1:Z100")</li>
                <li>La prima riga deve contenere le intestazioni delle colonne</li>
                <li>Clicca su "Importa da Google Sheets" per avviare il processo</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
