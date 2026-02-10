import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Sparkles,
  CreditCard,
  Gift,
  BookOpen,
  Sun,
  Dumbbell,
  UserCheck,
  Users,
  Award,
  Music,
  Settings2,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

interface ActivityCard {
  id: string;
  label: string;
  icon: typeof Calendar;
  description: string;
  color: string;
  url: string;
}

const activityCards: ActivityCard[] = [
  { id: "corsi", label: "Corsi", icon: Calendar, description: "Corsi regolari settimanali", color: "bg-blue-500", url: "/attivita/corsi" },
  { id: "workshop", label: "Workshop", icon: Sparkles, description: "Workshop ed eventi speciali", color: "bg-purple-500", url: "/attivita/workshops" },
  { id: "prove-pagamento", label: "Prove a Pagamento", icon: CreditCard, description: "Lezioni di prova a pagamento", color: "bg-orange-500", url: "/attivita/prove-pagamento" },
  { id: "prove-gratuite", label: "Prove Gratuite", icon: Gift, description: "Lezioni di prova gratuite", color: "bg-green-500", url: "/attivita/prove-gratuite" },
  { id: "lezioni-singole", label: "Lezioni Singole", icon: BookOpen, description: "Lezioni singole o drop-in", color: "bg-cyan-500", url: "/attivita/lezioni-singole" },
  { id: "domeniche-movimento", label: "Domeniche in Movimento", icon: Sun, description: "Attività domenicali speciali", color: "bg-yellow-500", url: "/attivita/domeniche-movimento" },
  { id: "allenamenti", label: "Allenamenti/Affitti", icon: Dumbbell, description: "Sessioni di allenamento e affitti", color: "bg-red-500", url: "/attivita/allenamenti" },
  { id: "lezioni-individuali", label: "Lezioni Individuali", icon: UserCheck, description: "Lezioni private one-to-one", color: "bg-indigo-500", url: "/attivita/lezioni-individuali" },
  { id: "campus", label: "Campus", icon: Users, description: "Campus e programmi intensivi", color: "bg-teal-500", url: "/attivita/campus" },
  { id: "saggi", label: "Saggi", icon: Award, description: "Saggi e spettacoli", color: "bg-pink-500", url: "/attivita/saggi" },
  { id: "vacanze-studio", label: "Vacanze Studio", icon: Music, description: "Vacanze studio e viaggi formativi", color: "bg-amber-500", url: "/attivita/vacanze-studio" },
];

export default function Gestione() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-2" data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Indietro
      </Button>
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2" data-testid="text-gestione-title">Gestione Attività</h1>
        <p className="text-muted-foreground">Seleziona un'attività per gestirla</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activityCards.map((activity) => (
          <Link key={activity.id} href={activity.url}>
            <Card
              className="hover-elevate active-elevate-2 cursor-pointer h-full transition-all"
              data-testid={`card-gestione-${activity.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`${activity.color} rounded-md p-2.5 flex-shrink-0`}>
                    <activity.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm" data-testid={`text-gestione-label-${activity.id}`}>
                      {activity.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
