import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Wrench, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GemTeamMe() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Auth Guard
  const userRole = (user as any)?.role?.toLowerCase() || "";
  
  // Se non è un dipendente, lo reindirizziamo al pannello admin GemTeam
  if (userRole !== "dipendente") {
    setLocation("/gemteam");
    return null;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto mt-12 animate-in fade-in zoom-in-95 duration-500">
      <Card className="bg-slate-50 border-slate-200 shadow-sm text-center py-10 px-6">
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8 text-blue-600" />
           </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Workspace in allestimento</h2>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Il tuo workspace personale — in costruzione.<br/><br/>
          I dati relativi a turni, presenze e cedolini saranno disponibili a breve.
          Per assistenza: <a href="mailto:info@studio-gem.it" className="text-primary hover:underline font-semibold">info@studio-gem.it</a>
        </p>
        <Button onClick={() => logoutMutation.mutate()} variant="outline" className="bg-white hover:bg-slate-100 flex items-center gap-2 mx-auto">
          <LogOut className="w-4 h-4" /> Torna al login
        </Button>
      </Card>
    </div>
  );
}
