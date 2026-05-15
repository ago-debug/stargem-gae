import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Save, ArrowRight, ArrowLeft } from "lucide-react";

interface WizardStepProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isActive: boolean;
  onSave: () => void;
  onNext: () => void;
  onPrev?: () => void;
  blockingErrors?: string;
  lastSavedAt?: Date | null;
  isDirty?: boolean;
  isValidating?: boolean;
}

export function WizardStep({
  title,
  icon: Icon,
  children,
  isActive,
  onSave,
  onNext,
  onPrev,
  blockingErrors,
  lastSavedAt,
  isDirty,
  isValidating
}: WizardStepProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (!lastSavedAt) return;
    
    const updateTime = () => {
      setTimeAgo(formatDistanceToNow(lastSavedAt, { addSuffix: true, locale: it }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Aggiorna ogni minuto
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col h-full relative pb-24">
      <Card className="flex-1 shadow-sm border-muted">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {blockingErrors && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive flex items-start gap-2 text-sm">
              <span className="font-semibold">Errore Bloccante:</span>
              <p>{blockingErrors}</p>
            </div>
          )}
          {children}
        </CardContent>
      </Card>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-background border-t shadow-lg flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={onPrev} 
            disabled={!onPrev || isValidating}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
          </Button>
          
          <div className="text-sm text-muted-foreground hidden md:block">
            {isDirty ? (
              <span className="text-amber-500 font-medium">Modifiche non salvate...</span>
            ) : lastSavedAt ? (
              <span>Salvato {timeAgo}</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={onSave}
            disabled={!isDirty || isValidating}
            title="Scorciatoia: Ctrl+S"
          >
            <Save className="w-4 h-4 mr-2" /> Salva Bozza
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={isValidating || !!blockingErrors}
            title="Scorciatoia: Ctrl+Enter"
          >
            {isValidating ? "Validazione..." : "Avanti"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
