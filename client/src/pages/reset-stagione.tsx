import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetStagione() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reset Stagione</h1>
        <p className="text-muted-foreground">
          Gestisci l'archiviazione e il reset dei dati stagionali
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Funzionalità in sviluppo. Questa pagina permetterà di archiviare i dati della stagione corrente e preparare il sistema per la nuova stagione.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Reset Stagione Sportiva</CardTitle>
          <CardDescription>
            Questa funzionalità permetterà di:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Archiviare tutti i dati della stagione corrente</li>
            <li>Resettare le iscrizioni ai corsi</li>
            <li>Scadere automaticamente le tessere</li>
            <li>Mantenere lo storico per report e statistiche</li>
            <li>Preparare il sistema per la nuova stagione</li>
          </ul>

          <div className="pt-4">
            <Button disabled data-testid="button-reset-stagione">
              <RotateCcw className="w-4 h-4 mr-2" />
              Avvia Reset Stagione
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
