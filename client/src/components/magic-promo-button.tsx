import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface MagicPromoButtonProps {
  eventName: string;
  eventDate: string;
}

export function MagicPromoButton({ eventName, eventDate }: MagicPromoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setOpen(true);
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/ai/generate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventName, date: eventDate })
      });

      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      setResult(data.text);
    } catch (error) {
      console.error(error);
      toast({
        title: "Errore AI",
        description: "Impossibile generare il testo promozionale al momento.",
        variant: "destructive"
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      toast({
        title: "Copiato!",
        description: "Testo copiato negli appunti, pronto per WhatsApp."
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Button 
        onClick={handleGenerate} 
        variant="outline" 
        className="gap-2 bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700"
      >
        <Sparkles className="w-4 h-4" />
        Genera Testo Promozionale
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Magia in corso...
            </DialogTitle>
            <DialogDescription>
              L'AI sta scrivendo un messaggio promozionale per "{eventName}".
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[100px] flex items-center justify-center p-4 bg-slate-50 rounded-md border border-slate-100 mt-2">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="text-sm">Teo ci sta pensando...</span>
              </div>
            ) : result ? (
              <p className="whitespace-pre-wrap text-sm text-slate-700 w-full">{result}</p>
            ) : null}
          </div>

          {!loading && result && (
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setOpen(false)}>Chiudi</Button>
              <Button onClick={copyToClipboard} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                {copied ? <Check className="w-4 h-4" /> : null}
                {copied ? "Copiato" : "Copia Testo"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
