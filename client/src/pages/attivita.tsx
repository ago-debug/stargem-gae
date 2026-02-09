import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Sparkles,
  CreditCard,
  Gift,
  BookOpen,
  Dumbbell,
  Users,
  Sun,
  Award,
  Music,
  UserCheck,
  ExternalLink,
  Activity,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import type { Course, Workshop, Category, Instructor, Studio } from "@shared/schema";

const WEEKDAYS: Record<string, string> = {
  LUN: "Lunedì",
  MAR: "Martedì",
  MER: "Mercoledì",
  GIO: "Giovedì",
  VEN: "Venerdì",
  SAB: "Sabato",
  DOM: "Domenica",
};

interface ActivitySection {
  id: string;
  label: string;
  icon: typeof Calendar;
  description: string;
  type: "corsi" | "workshop" | "other";
  color: string;
}

const activitySections: ActivitySection[] = [
  { id: "corsi", label: "Corsi", icon: Calendar, description: "Corsi regolari settimanali", type: "corsi", color: "bg-blue-500" },
  { id: "workshop", label: "Workshop", icon: Sparkles, description: "Workshop ed eventi speciali", type: "workshop", color: "bg-purple-500" },
  { id: "prove-pagamento", label: "Prove a Pagamento", icon: CreditCard, description: "Lezioni di prova a pagamento", type: "other", color: "bg-orange-500" },
  { id: "prove-gratuite", label: "Prove Gratuite", icon: Gift, description: "Lezioni di prova gratuite", type: "other", color: "bg-green-500" },
  { id: "lezioni-singole", label: "Lezioni Singole", icon: BookOpen, description: "Lezioni singole o drop-in", type: "other", color: "bg-cyan-500" },
  { id: "domeniche-movimento", label: "Domeniche in Movimento", icon: Sun, description: "Attività domenicali speciali", type: "other", color: "bg-yellow-500" },
  { id: "allenamenti", label: "Allenamenti", icon: Dumbbell, description: "Sessioni di allenamento libero", type: "other", color: "bg-red-500" },
  { id: "lezioni-individuali", label: "Lezioni Individuali", icon: UserCheck, description: "Lezioni private one-to-one", type: "other", color: "bg-indigo-500" },
  { id: "campus", label: "Campus", icon: Users, description: "Campus e programmi intensivi", type: "other", color: "bg-teal-500" },
  { id: "saggi", label: "Saggi", icon: Award, description: "Saggi e spettacoli", type: "other", color: "bg-pink-500" },
  { id: "vacanze-studio", label: "Vacanze Studio", icon: Music, description: "Vacanze studio e viaggi formativi", type: "other", color: "bg-amber-500" },
];

function CourseCard({ course, categories, instructors }: { course: Course; categories?: Category[]; instructors?: Instructor[] }) {
  const category = categories?.find(c => c.id === course.categoryId);
  const instructor = instructors?.find(i => i.id === course.instructorId);
  const dayLabel = course.dayOfWeek ? WEEKDAYS[course.dayOfWeek] || course.dayOfWeek : null;

  return (
    <Card className="hover-elevate" data-testid={`card-course-${course.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm truncate">{course.name}</h4>
              <Badge variant={course.active ? "default" : "secondary"} className="text-xs">
                {course.active ? "Attivo" : "Inattivo"}
              </Badge>
            </div>
            {course.sku && (
              <p className="text-xs text-muted-foreground mt-1">{course.sku}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {category && (
                <span className="text-xs text-muted-foreground">{category.name}</span>
              )}
              {instructor && (
                <span className="text-xs text-muted-foreground">
                  {instructor.firstName} {instructor.lastName}
                </span>
              )}
              {dayLabel && (
                <span className="text-xs text-muted-foreground">
                  {dayLabel} {course.startTime && `${course.startTime}`}{course.endTime && `-${course.endTime}`}
                </span>
              )}
            </div>
          </div>
          {course.price && (
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              &euro;{course.price}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkshopCard({ workshop, categories, instructors }: { workshop: Workshop; categories?: Category[]; instructors?: Instructor[] }) {
  const category = categories?.find(c => c.id === workshop.categoryId);
  const instructor = instructors?.find(i => i.id === workshop.instructorId);
  const dayLabel = workshop.dayOfWeek ? WEEKDAYS[workshop.dayOfWeek] || workshop.dayOfWeek : null;

  return (
    <Card className="hover-elevate" data-testid={`card-workshop-${workshop.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm truncate">{workshop.name}</h4>
              <Badge variant={workshop.active ? "default" : "secondary"} className="text-xs">
                {workshop.active ? "Attivo" : "Inattivo"}
              </Badge>
            </div>
            {workshop.sku && (
              <p className="text-xs text-muted-foreground mt-1">{workshop.sku}</p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {category && (
                <span className="text-xs text-muted-foreground">{category.name}</span>
              )}
              {instructor && (
                <span className="text-xs text-muted-foreground">
                  {instructor.firstName} {instructor.lastName}
                </span>
              )}
              {dayLabel && (
                <span className="text-xs text-muted-foreground">
                  {dayLabel} {workshop.startTime && `${workshop.startTime}`}{workshop.endTime && `-${workshop.endTime}`}
                </span>
              )}
            </div>
          </div>
          {workshop.price && (
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              &euro;{workshop.price}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStats({ label, count, active, icon: Icon, color }: { label: string; count: number; active: number; icon: typeof Calendar; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-md ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{count} totali, {active} attivi</p>
      </div>
    </div>
  );
}

export default function Attivita() {
  const [activeTab, setActiveTab] = useState("panoramica");

  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: categories } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: instructors } = useQuery<Instructor[]>({ queryKey: ["/api/instructors"] });
  const { data: studios } = useQuery<Studio[]>({ queryKey: ["/api/studios"] });

  const activeCourses = courses?.filter(c => c.active) || [];
  const inactiveCourses = courses?.filter(c => !c.active) || [];
  const activeWorkshops = workshops?.filter(w => w.active) || [];
  const inactiveWorkshops = workshops?.filter(w => !w.active) || [];

  const coursesByCategory = categories?.map(cat => ({
    category: cat,
    courses: courses?.filter(c => c.categoryId === cat.id) || [],
  })).filter(g => g.courses.length > 0) || [];

  const uncategorizedCourses = courses?.filter(c => !c.categoryId) || [];

  const workshopsByCategory = categories?.map(cat => ({
    category: cat,
    workshops: workshops?.filter(w => w.categoryId === cat.id) || [],
  })).filter(g => g.workshops.length > 0) || [];

  const uncategorizedWorkshops = workshops?.filter(w => !w.categoryId) || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2" data-testid="text-page-title">
            Programmazione Attivit&agrave;
          </h1>
          <p className="text-muted-foreground">
            Panoramica e gestione di tutte le attivit&agrave;
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1" data-testid="tabs-attivita">
          <TabsTrigger value="panoramica" className="text-xs" data-testid="tab-panoramica">
            <Activity className="w-3.5 h-3.5 mr-1" />
            Panoramica
          </TabsTrigger>
          {activitySections.map((section) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="text-xs"
              data-testid={`tab-${section.id}`}
            >
              <section.icon className="w-3.5 h-3.5 mr-1" />
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="panoramica" className="space-y-6 mt-6">
          <div className="flex items-center justify-end">
            <Button className="bg-red-600 hover:bg-red-700 text-white" data-testid="button-nuovo-panoramica">
              <Plus className="w-4 h-4 mr-1" />
              + Nuovo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card data-testid="card-stats-corsi">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Corsi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{courses?.length || 0}</span>
                  <span className="text-sm text-muted-foreground">totali</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="default">{activeCourses.length} attivi</Badge>
                  {inactiveCourses.length > 0 && (
                    <Badge variant="secondary">{inactiveCourses.length} inattivi</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stats-workshop">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Workshop</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{workshops?.length || 0}</span>
                  <span className="text-sm text-muted-foreground">totali</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="default">{activeWorkshops.length} attivi</Badge>
                  {inactiveWorkshops.length > 0 && (
                    <Badge variant="secondary">{inactiveWorkshops.length} inattivi</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-stats-categorie">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Categorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{categories?.length || 0}</span>
                  <span className="text-sm text-muted-foreground">configurate</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline">{instructors?.length || 0} insegnanti</Badge>
                  <Badge variant="outline">{studios?.length || 0} sale</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Riepilogo Attivit&agrave;</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activitySections.map((section) => {
                  let count = 0;
                  let active = 0;
                  if (section.type === "corsi") {
                    count = courses?.length || 0;
                    active = activeCourses.length;
                  } else if (section.type === "workshop") {
                    count = workshops?.length || 0;
                    active = activeWorkshops.length;
                  }
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className="text-left hover-elevate rounded-md p-3 transition-colors"
                      data-testid={`button-goto-${section.id}`}
                    >
                      <SummaryStats
                        label={section.label}
                        count={count}
                        active={active}
                        icon={section.icon}
                        color={section.color}
                      />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="corsi" className="space-y-6 mt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold" data-testid="text-corsi-title">Corsi</h2>
              <p className="text-sm text-muted-foreground">
                {courses?.length || 0} corsi totali &middot; {activeCourses.length} attivi
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button className="bg-red-600 hover:bg-red-700 text-white" data-testid="button-nuovo-corsi">
                <Plus className="w-4 h-4 mr-1" />
                + Nuovo
              </Button>
              <Link href="/corsi">
                <Button variant="outline" data-testid="button-goto-corsi-page">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Gestione Completa Corsi
                </Button>
              </Link>
            </div>
          </div>

          {coursesByCategory.length > 0 || uncategorizedCourses.length > 0 ? (
            <div className="space-y-6">
              {coursesByCategory.map(({ category, courses: catCourses }) => (
                <div key={category.id}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {category.name}
                    <Badge variant="secondary" className="text-xs">{catCourses.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        categories={categories}
                        instructors={instructors}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {uncategorizedCourses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    Senza Categoria
                    <Badge variant="secondary" className="text-xs">{uncategorizedCourses.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {uncategorizedCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        categories={categories}
                        instructors={instructors}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nessun corso configurato</p>
                <p className="text-sm mb-4">Vai alla pagina Corsi per aggiungerne uno</p>
                <Link href="/corsi">
                  <Button data-testid="button-add-first-course">Vai a Gestione Corsi</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workshop" className="space-y-6 mt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold" data-testid="text-workshop-title">Workshop</h2>
              <p className="text-sm text-muted-foreground">
                {workshops?.length || 0} workshop totali &middot; {activeWorkshops.length} attivi
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button className="bg-red-600 hover:bg-red-700 text-white" data-testid="button-nuovo-workshop">
                <Plus className="w-4 h-4 mr-1" />
                + Nuovo
              </Button>
              <Link href="/workshops">
                <Button variant="outline" data-testid="button-goto-workshop-page">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Gestione Completa Workshop
                </Button>
              </Link>
            </div>
          </div>

          {workshopsByCategory.length > 0 || uncategorizedWorkshops.length > 0 ? (
            <div className="space-y-6">
              {workshopsByCategory.map(({ category, workshops: catWorkshops }) => (
                <div key={category.id}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {category.name}
                    <Badge variant="secondary" className="text-xs">{catWorkshops.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catWorkshops.map((workshop) => (
                      <WorkshopCard
                        key={workshop.id}
                        workshop={workshop}
                        categories={categories}
                        instructors={instructors}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {uncategorizedWorkshops.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    Senza Categoria
                    <Badge variant="secondary" className="text-xs">{uncategorizedWorkshops.length}</Badge>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {uncategorizedWorkshops.map((workshop) => (
                      <WorkshopCard
                        key={workshop.id}
                        workshop={workshop}
                        categories={categories}
                        instructors={instructors}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nessun workshop configurato</p>
                <p className="text-sm mb-4">Vai alla pagina Workshop per aggiungerne uno</p>
                <Link href="/workshops">
                  <Button data-testid="button-add-first-workshop">Vai a Gestione Workshop</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {activitySections.filter(s => s.type === "other").map((section) => (
          <TabsContent key={section.id} value={section.id} className="space-y-6 mt-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2" data-testid={`text-${section.id}-title`}>
                  <div className={`w-8 h-8 rounded-md ${section.color} flex items-center justify-center`}>
                    <section.icon className="w-4 h-4 text-white" />
                  </div>
                  {section.label}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              </div>
              <Button className="bg-red-600 hover:bg-red-700 text-white" data-testid={`button-nuovo-${section.id}`}>
                <Plus className="w-4 h-4 mr-1" />
                + Nuovo
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurazione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Corsi e attivit&agrave; associati a <strong>{section.label}</strong>:
                  </p>
                  {courses && courses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {courses.filter(c => c.active).slice(0, 6).map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          categories={categories}
                          instructors={instructors}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <section.icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Nessuna attivit&agrave; configurata per questa sezione</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
