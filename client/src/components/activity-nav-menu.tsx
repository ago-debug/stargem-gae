import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Calendar, Sparkles, CreditCard, Gift, BookOpen,
  Sun, Dumbbell, UserCheck, Users, Award, Music, Building2, Globe, ShoppingBag
} from "lucide-react";
import { ActivityColorLegend } from "@/components/ActivityColorLegend";

const activityMenuItems = [
  { id: "panoramica", label: "Panoramica", icon: Activity, url: "/attivita" },
  { id: "corsi", label: "Corsi", icon: Calendar, url: "/attivita/corsi" },
  { id: "workshop", label: "Workshop", icon: Sparkles, url: "/attivita/workshops" },

  { id: "domeniche-movimento", label: "Domeniche in Movimento", icon: Sun, url: "/attivita/domeniche-movimento" },
  { id: "lezioni-individuali", label: "Lezioni Individuali", icon: UserCheck, url: "/attivita/lezioni-individuali" },
  { id: "allenamenti", label: "Allenamenti", icon: Dumbbell, url: "/attivita/allenamenti" },
  { id: "affitti", label: "Affitti", icon: Building2, url: "/attivita/affitti" },
  { id: "campus", label: "Campus", icon: Users, url: "/attivita/campus" },
  { id: "saggi", label: "Saggi", icon: Award, url: "/attivita/saggi" },
  { id: "vacanze-studio", label: "Vacanze Studio", icon: Music, url: "/attivita/vacanze-studio" }
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
      <div className="ml-auto pl-2 flex-shrink-0">
        <ActivityColorLegend variant="popover" />
      </div>
    </div>
  );
}
