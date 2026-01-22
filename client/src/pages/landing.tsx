import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutDashboard, Users, Calendar, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isExternalDeploy, setIsExternalDeploy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => setIsExternalDeploy(data.isExternalDeploy))
      .catch(() => {});
  }, []);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        toast({
          title: "Errore di accesso",
          description: data.message || "Credenziali non valide",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Errore",
        description: "Impossibile effettuare il login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Sistema Gestione Corsi
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Gestisci iscritti, corsi, pagamenti e molto altro in un'unica piattaforma
          </p>
          
          {isExternalDeploy ? (
            <Card className="max-w-sm mx-auto">
              <CardHeader>
                <CardTitle>Accedi</CardTitle>
                <CardDescription>Inserisci le tue credenziali</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLocalLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@local"
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password"
                      data-testid="input-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? "Accesso in corso..." : "Accedi"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
              className="min-h-11"
            >
              Accedi alla Piattaforma
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <LayoutDashboard className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>
                Panoramica completa di corsi, iscritti e scadenze
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Gestione Iscritti</CardTitle>
              <CardDescription>
                Anagrafica completa con tessere e certificati medici
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Corsi & Categorie</CardTitle>
              <CardDescription>
                Organizza corsi per categoria con insegnanti assegnati
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Report & Statistiche</CardTitle>
              <CardDescription>
                Analisi dettagliate su iscrizioni, entrate e presenze
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Funzionalità Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Gestione completa anagrafica iscritti
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Sistema iscrizioni con liste d'attesa
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Tessere associative con barcode
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Tracciamento certificati medici
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Controllo accessi tramite barcode
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Gestione insegnanti e tariffe
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Gestione pagamenti manuale
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Categorie e sottocategorie corsi
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Report e statistiche dettagliate
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Importazione dati da Google Sheets
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
