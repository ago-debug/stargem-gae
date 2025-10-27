import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UtentiPermessi() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Utenti e Permessi</h1>
        <p className="text-muted-foreground">
          Gestisci gli utenti del sistema e i loro permessi
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Funzionalità in sviluppo. Questa pagina permetterà di gestire utenti, ruoli e permessi del sistema.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Gestione Utenti</CardTitle>
          <CardDescription>
            Questa funzionalità permetterà di:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Creare e gestire account utente per staff e insegnanti</li>
            <li>Assegnare ruoli (Admin, Staff, Insegnante, Receptionist)</li>
            <li>Configurare permessi granulari per ogni ruolo</li>
            <li>Visualizzare log di accesso e attività utenti</li>
            <li>Gestire sessioni attive e password reset</li>
          </ul>

          <div className="pt-4">
            <Button disabled data-testid="button-add-user">
              <UserCog className="w-4 h-4 mr-2" />
              Aggiungi Utente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
