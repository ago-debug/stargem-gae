import { Card, CardContent } from "@/components/ui/card";
import { Hammer, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-lg mx-4 border-none shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
        
        <CardContent className="pt-12 pb-10 px-8 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="bg-gradient-to-br from-primary/10 to-primary/30 p-4 rounded-full relative border border-primary/20 shadow-inner">
                <Hammer className="h-10 w-10 text-primary" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Modulo in Sviluppo
          </h1>
          <p className="text-slate-500 mb-8 max-w-[280px] mx-auto leading-relaxed">
            Quest'area del portale è in costruzione. Sarà attivata con la <strong className="text-primary font-semibold">Fase 28</strong> del progetto StarGem Manager.
          </p>
          
          <div className="flex flex-col items-center gap-3">
             <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/70 bg-primary/5 px-3 py-1.5 rounded-full mb-2 border border-primary/10">
                <Sparkles className="w-3.5 h-3.5" /> Funzionalità Premium
             </div>
             
             <Button 
                onClick={() => setLocation("/")}
                className="w-full sm:w-auto px-8 shadow-md hover:shadow-lg transition-all"
                variant="default"
             >
                <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla Dashboard
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
