import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowLeft, MailCheck } from "lucide-react";
const logoStarGem = "/logo_stargem.png";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: async () => {
      // Endpoint to request OTP / reset password
      return await apiRequest("POST", "/api/auth/forgot-password", { email });
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (e: Error) => {
      // In a real app we might not want to disclose if the user exists, but here we just show the error.
      toast({ title: "Attenzione", description: e.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Errore", description: "Inserisci l'email", variant: "destructive" });
      return;
    }
    resetMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 pt-10 pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-slate-50 to-blue-500/5 z-0" />
      
      <div className="relative w-full max-w-md mx-4 z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="shadow-2xl border-none bg-white/95 backdrop-blur-sm rounded-xl py-4">
           <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                  <div className="overflow-hidden h-20 w-48 flex items-center justify-center">
                     <img src={logoStarGem} alt="StarGem" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">Recupera accesso</CardTitle>
              {!success && (
                <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                   Inserisci la tua email.<br/>Riceverai un codice per reimpostare la password.
                </CardDescription>
              )}
           </CardHeader>
           <CardContent className="mt-4">
             {success ? (
                <div className="space-y-6 flex flex-col items-center text-center">
                   <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                      <MailCheck className="w-8 h-8 text-emerald-600" />
                   </div>
                   <div className="bg-emerald-50 text-emerald-800 text-sm font-medium p-4 rounded-xl border border-emerald-200">
                      ✅ Se l'email è registrata, riceverai il codice a breve. Controlla la tua casella email.
                   </div>
                   <Link href="/first-login" className="text-amber-600 hover:text-amber-800 font-bold underline text-sm block mt-4">
                      Hai già il codice? &rarr; Vai a impostare la password
                   </Link>
                </div>
             ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                     <Label>La tua email</Label>
                     <Input 
                       type="email" 
                       value={email} 
                       onChange={(e) => setEmail(e.target.value)} 
                       placeholder="mario.rossi@example.com"
                       required
                     />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-amber-600 hover:bg-amber-700"
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending ? "Invio in corso..." : "Invia codice"}
                  </Button>
                </form>
             )}
             
             <div className="mt-8 text-center border-t pt-4">
                <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1">
                   <ArrowLeft className="w-4 h-4" /> Torna al login
                </Link>
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
