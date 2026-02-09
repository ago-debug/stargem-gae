import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { Link } from "wouter";

interface CategoryInfo {
  id: string;
  label: string;
  icon: typeof Calendar;
  color: string;
  url: string;
  apiEndpoint: string;
}

const categoryPages: CategoryInfo[] = [
  { id: "corsi", label: "Categorie Corsi", icon: Calendar, color: "bg-blue-500", url: "/categorie", apiEndpoint: "/api/categories" },
  { id: "workshop", label: "Categorie Workshop", icon: Sparkles, color: "bg-purple-500", url: "/categorie-workshop", apiEndpoint: "/api/workshop-categories" },
  { id: "domeniche", label: "Categorie Domeniche in Movimento", icon: Sun, color: "bg-yellow-500", url: "/categorie-domeniche", apiEndpoint: "/api/sunday-categories" },
  { id: "allenamenti", label: "Categorie Allenamenti/Affitti", icon: Dumbbell, color: "bg-red-500", url: "/categorie-allenamenti", apiEndpoint: "/api/training-categories" },
  { id: "lezioni", label: "Categorie Lezioni Individuali", icon: UserCheck, color: "bg-indigo-500", url: "/categorie-lezioni-individuali", apiEndpoint: "/api/individual-lesson-categories" },
  { id: "campus", label: "Categorie Campus", icon: Users, color: "bg-teal-500", url: "/categorie-campus", apiEndpoint: "/api/campus-categories" },
  { id: "saggi", label: "Categorie Saggi", icon: Award, color: "bg-pink-500", url: "/categorie-saggi", apiEndpoint: "/api/recital-categories" },
  { id: "vacanze", label: "Categorie Vacanze Studio", icon: Music, color: "bg-amber-500", url: "/categorie-vacanze-studio", apiEndpoint: "/api/vacation-categories" },
];

type AnyCategory = { id: number; name: string; parentId?: number | null };

function CategoryCard({ info }: { info: CategoryInfo }) {
  const { data: categories } = useQuery<AnyCategory[]>({
    queryKey: [info.apiEndpoint],
  });

  const total = categories?.length || 0;
  const parents = categories?.filter(c => !c.parentId).length || 0;
  const subs = total - parents;

  return (
    <Link href={info.url}>
      <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-category-${info.id}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-md ${info.color} flex items-center justify-center flex-shrink-0`}>
              <info.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">{info.label}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{total} totali</Badge>
                {parents > 0 && (
                  <Badge variant="outline" className="text-xs">{parents} principali</Badge>
                )}
                {subs > 0 && (
                  <Badge variant="outline" className="text-xs">{subs} sotto</Badge>
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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2" data-testid="text-page-title">
          Categorie Attivit&agrave;
        </h1>
        <p className="text-muted-foreground">
          Gestisci le categorie per ogni tipo di attivit&agrave;
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categoryPages.map((info) => (
          <CategoryCard key={info.id} info={info} />
        ))}
      </div>
    </div>
  );
}
