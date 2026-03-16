import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Sparkles,
  Sun,
  Dumbbell,
  UserCheck,
  Users,
  Award,
  Music,
  FolderTree,
  ArrowLeft,
  Database,
  CreditCard,
  Gift,
  BookOpen,
  Building2,
  ShoppingBag,
} from "lucide-react";
import { Link } from "wouter";
import { getActiveActivities } from "@/config/activities";
// Interfaccia definita storicamente qui eliminata per favorire la Single Source of Truth

type AnyCategory = { id: number; name: string; parentId?: number | null };

function CategoryCard({ info }: { info: any }) {
  const { data: categories } = useQuery<AnyCategory[]>({
    queryKey: [info.apiEndpoint],
  });

  const total = categories?.length || 0;
  const parents = categories?.filter(c => !c.parentId).length || 0;
  const subs = total - parents;

  return (
    <Link href={info.url}>
      <Card className="hover-elevate cursor-pointer h-full border-border/60 shadow-sm" data-testid={`card-category-${info.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg ${info.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <info.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-foreground leading-tight mb-2">{info.label}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] h-5 px-2 font-bold bg-muted/60">
                  {total} totali
                </Badge>
                {parents > 0 && (
                  <Badge variant="outline" className="text-[10px] h-5 px-2 font-bold border-muted-foreground/30">
                    {parents} principali
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ActivityCategories() {
  return (
    <div className="p-6 md:p-8 space-y-8 mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">
              Categorie Attivit&agrave;
            </h1>
            <p className="text-muted-foreground text-sm">
              Gestisci le categorie per ogni tipo di attivit&agrave;
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getActiveActivities()
          .filter(a => a.visibility.categoriePanel)
          .map((a) => (
            <CategoryCard key={a.id} info={{
              id: a.id,
              label: `Categorie ${a.labelUI}`,
              icon: a.design.icon,
              color: a.design.colorClass,
              url: a.categoryManagementUrl || a.routeUrl,
              apiEndpoint: a.apiEndpoint || ""
            }} />
        ))}
      </div>
    </div>
  );
}
