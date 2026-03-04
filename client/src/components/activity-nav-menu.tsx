import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Calendar, Sparkles, CreditCard, Gift, BookOpen,
  Sun, Dumbbell, UserCheck, Users, Award, Music, Database
} from "lucide-react";

const activityMenuItems = [
  { id: "panoramica", label: "Panoramica", icon: Activity, url: "/attivita" },
  { id: "corsi", label: "Corsi", icon: Calendar, url: "/attivita/corsi" },
  { id: "workshop", label: "Workshop", icon: Sparkles, url: "/attivita/workshops" },
  { id: "prove-pagamento", label: "Prove a Pagamento", icon: CreditCard, url: "/attivita/prove-pagamento" },
  { id: "prove-gratuite", label: "Prove Gratuite", icon: Gift, url: "/attivita/prove-gratuite" },
  { id: "servizi", label: "Servizi Extra", icon: Database, url: "/attivita/servizi" },
  { id: "lezioni-singole", label: "Lezioni Singole", icon: BookOpen, url: "/attivita/lezioni-singole" },
  { id: "domeniche-movimento", label: "Domeniche in Movimento", icon: Sun, url: "/attivita/domeniche-movimento" },
  { id: "allenamenti", label: "Allenamenti/Affitti", icon: Dumbbell, url: "/attivita/allenamenti" },
  { id: "lezioni-individuali", label: "Lezioni Individuali", icon: UserCheck, url: "/attivita/lezioni-individuali" },
  { id: "campus", label: "Campus", icon: Users, url: "/attivita/campus" },
  { id: "saggi", label: "Saggi", icon: Award, url: "/attivita/saggi" },
  { id: "vacanze-studio", label: "Vacanze Studio", icon: Music, url: "/attivita/vacanze-studio" },
];

export function ActivityNavMenu() {
  const [location, navigate] = useLocation();
  const { data: summary } = useQuery<Record<string, { total: number, active: number }>>({
    queryKey: ["/api/activities-summary"],
  });

  return (
    <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-2 px-1 scrollbar-thin" data-testid="activity-nav-menu">
      {activityMenuItems.map((item) => {
        const activeCount = summary?.[item.id]?.active || 0;

        return (
          <Button
            key={item.id}
            variant="outline"
            size="sm"
            onClick={() => navigate(item.url)}
            className={`relative text-xs h-8 whitespace-nowrap flex-shrink-0 ${location === item.url ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : ""}`}
            data-testid={`nav-activity-${item.id}`}
          >
            <item.icon className="w-3 h-3 mr-1 sidebar-icon-gold" />
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
