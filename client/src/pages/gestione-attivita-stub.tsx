import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";
import { Link } from "wouter";

interface GestioneAttivitaStubProps {
  title: string;
  description: string;
}

export default function GestioneAttivitaStub({ title, description }: GestioneAttivitaStubProps) {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/gestione">
          <Button variant="ghost" size="icon" data-testid="button-back-gestione">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1" data-testid="text-activity-title">
            Gestione {title}
          </h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="w-5 h-5" />
            In fase di sviluppo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            La pagina di gestione per <strong>{title}</strong> è in fase di sviluppo. 
            Presto sarà disponibile con tutte le funzionalità di gestione complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
