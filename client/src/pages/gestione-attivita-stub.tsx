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
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/gestione">
            <Button variant="ghost" size="icon" className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back-gestione">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-activity-title">
              {title}
            </h1>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
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
            L'area <strong>{title}</strong> è in sviluppo o attualmente in manutenzione strutturale. 
            Presto sarà disponibile con tutte le funzionalità complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
