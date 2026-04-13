import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, FileCheck, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function FirstLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const emailParam = searchParams.get("email") || "";
  const { user } = useAuth(); // Usually user exists, but wait, this route can be accessed publicly

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  // Sync email se cambia
  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam, email]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const payload = { email, otp, newPassword: password };
      return await apiRequest("POST", "/api/auth/first-login", payload);
    },
    onSuccess: (data: any) => {
      // Re-fetch user query
      queryClient.setQueryData(["/api/user"], data);
      setSuccess(true);
      toast({
        title: "Password impostata con successo!",
        description: "Reindirizzamento in corso...",
      });
      setTimeout(() => {
        setLocation(data.redirectTo || "/gemstaff/me");
      }, 2000);
    },
    onError: (e: Error) => {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
       toast({ title: "Errore", description: "La nuova password deve contenere almeno 8 caratteri", variant: "destructive" });
       return;
    }
    if (password !== confirmPassword) {
       toast({ title: "Errore", description: "Le password non coincidono", variant: "destructive" });
       return;
    }
    if (!otp) {
       toast({ title: "Errore", description: "Inserisci il codice temporaneo", variant: "destructive" });
       return;
    }
    confirmMutation.mutate();
  };

  if (success) {
     return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
           <Card className="w-full max-w-md shadow-lg border-emerald-200">
              <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center space-y-4 text-center">
                 <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                    <PartyPopper className="w-8 h-8 text-emerald-600" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800">Account Attivato!</h2>
                 <p className="text-muted-foreground">La tua password è stata impostata con successo. Tra pochi secondi sarai reindirizzato al tuo spazio personale.</p>
              </CardContent>
           </Card>
        </div>
     );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 pt-10 pb-16">
      {/* Sfondo decorativo vettoriale premium */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-slate-50 to-blue-500/5 z-0" />
      
      <div className="relative w-full max-w-md mx-4 z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="shadow-2xl border-none bg-white/95 backdrop-blur-sm rounded-xl">
           <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center shadow-inner">
                     <Lock className="w-8 h-8 text-amber-600" />
                  </div>
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">Primo accesso — Imposta la tua password</CardTitle>
              <CardDescription className="text-sm font-medium text-slate-500">
                 Imposta la tua password personale per continuare
              </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                  <Label>La tua email</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    readOnly={!!emailParam}
                    className={emailParam ? "bg-slate-100" : ""}
                    required
                  />
               </div>
               
               <div className="space-y-2">
                  <Label>Codice OTP (ricevuto dalla segreteria)</Label>
                  <Input 
                    type="text" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Es. A2B4C6"
                    className="tracking-widest uppercase"
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-slate-500 italic mt-1">Il codice OTP ti è stato comunicato dalla segreteria. È valido 24 ore.</p>
               </div>

               <div className="space-y-2 pt-2 border-t">
                  <Label>Scegli una nuova password</Label>
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 8 caratteri"
                    minLength={8}
                    required
                  />
               </div>

               <div className="space-y-2">
                  <Label>Conferma password</Label>
                  <Input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ripeti la password"
                    minLength={8}
                    required
                  />
               </div>

               <Button 
                 type="submit" 
                 className="w-full mt-6 bg-amber-600 hover:bg-amber-700"
                 disabled={confirmMutation.isPending}
               >
                 {confirmMutation.isPending ? "Salvataggio..." : "Imposta Password"}
               </Button>
             </form>
             
             <div className="mt-6 flex items-center justify-center space-x-2 text-slate-400">
               <span className="h-px w-full bg-slate-200"></span>
               <span className="text-xs uppercase tracking-wider whitespace-nowrap">OPPURE</span>
               <span className="h-px w-full bg-slate-200"></span>
             </div>
             
             <div className="mt-6 flex flex-col items-center justify-center space-y-4">
                <a href="mailto:info@studio-gem.it" className="text-sm font-semibold text-primary hover:underline flex items-center gap-2">
                   Non hai ancora il codice? &rarr; Contatta la segreteria
                </a>
                <a href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1">
                   &larr; Torna al login
                </a>
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
