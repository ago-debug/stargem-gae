import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      toast({
        title: "Attenzione",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Errore",
        description: "Inserisci l'email",
        variant: "destructive",
      });
      return;
    }
    resetMutation.mutate();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background pb-16 pt-10 text-foreground transition-colors duration-300">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-background to-blue-500/10" />

      <div className="relative z-10 mx-4 w-full max-w-md duration-500 animate-in fade-in zoom-in-95">
        <Card className="rounded-xl border-none bg-background/95 py-4 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-20 w-48 items-center justify-center overflow-hidden">
                <img
                  src={logoStarGem}
                  alt="StarGem"
                  className="size-full object-contain"
                />
              </div>
            </div>
            <CardTitle className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              Recupera accesso
            </CardTitle>
            {!success && (
              <CardDescription className="mt-1 text-sm font-medium text-muted-foreground">
                Inserisci la tua email.
                <br />
                Riceverai un codice per reimpostare la password.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="mt-4">
            {success ? (
              <div className="flex flex-col items-center space-y-6 text-center">
                <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <MailCheck className="size-8 text-emerald-600" />
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                  ✅ Se l'email è registrata, riceverai il codice a breve.
                  Controlla la tua casella email.
                </div>
                <Link
                  href="/first-login"
                  className="mt-4 block text-sm font-bold text-amber-600 underline hover:text-amber-800 dark:text-amber-400"
                >
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
                  className="mt-6 w-full bg-amber-600 hover:bg-amber-700"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending
                    ? "Invio in corso..."
                    : "Invia codice"}
                </Button>
              </form>
            )}

            <div className="mt-8 border-t pt-4 text-center">
              <Link
                href="/"
                className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" /> Torna al login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
