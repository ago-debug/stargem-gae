import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
  ArrowLeft,
  Database,
  Plus,
  Building2,
  Globe,
  ShoppingBag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import { useCustomList } from "@/hooks/use-custom-list";
import { ActivityNavMenu } from "@/components/activity-nav-menu";
import { ActivityColorLegend } from "@/components/ActivityColorLegend";
import type {
  Course, Category, WorkshopCategory, Instructor, Studio,
  SundayCategory, TrainingCategory, IndividualLessonCategory,
  CampusCategory, RecitalCategory, VacationCategory,
} from "@shared/schema";
import { getActiveActivities } from "../config/activities";

const WEEKDAYS: Record<string, string> = {
  LUN: "Lunedì",
  MAR: "Martedì",
  MER: "Mercoledì",
  GIO: "Giovedì",
  VEN: "Venerdì",
  SAB: "Sabato",
  DOM: "Domenica",
};

export interface ActivitySection {
  id: string;
  label: string;
  icon: any;
  description: string;
  type: "corsi" | "workshop" | "other";
  color: string;
  categoryApiEndpoint?: string;
  categoryManagementUrl?: string;
  managementUrl?: string;
}

const activitySections: ActivitySection[] = getActiveActivities()
    .filter(a => a.visibility.hubAttivita)
    .map(a => ({
      id: a.id,
      label: a.labelUI,
      icon: a.design.icon,
      description: a.design.description,
      type: (a.id === "corsi" ? "corsi" : (a.id === "workshop" ? "workshop" : "other")) as "corsi" | "workshop" | "other",
      color: a.design.colorClass,
      categoryApiEndpoint: a.apiEndpoint,
      categoryManagementUrl: a.categoryManagementUrl,
      managementUrl: a.routeUrl
    }));

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
              <Badge variant="outline" className="status-badge-gold text-xs">
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
                  {instructor.lastName} {instructor.firstName}
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

// @ts-ignore // TODO: STI-cleanup
function WorkshopCard({ workshop, categories, instructors }: { workshop: Workshop; categories?: WorkshopCategory[]; instructors?: Instructor[] }) {
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
              <Badge variant="outline" className="status-badge-gold text-xs">
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
                  {instructor.lastName} {instructor.firstName}
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

type AnyCategory = { id: number; name: string; description?: string | null; parentId?: number | null; color?: string | null };

function ActivitySectionTab({ section }: { section: ActivitySection }) {
  const { data: sectionCategories } = useQuery<AnyCategory[]>({
    queryKey: [section.categoryApiEndpoint],
    enabled: !!section.categoryApiEndpoint,
  });

  const parentCategories = sectionCategories?.filter(c => !c.parentId) || [];
  const subCategories = sectionCategories?.filter(c => c.parentId) || [];

  return (
    <TabsContent value={section.id} className="space-y-6 mt-6">
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
        {section.categoryManagementUrl && (
          <Link href={section.categoryManagementUrl}>
            <Button variant="outline" data-testid={`button-goto-${section.id}-categories`}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Gestione Categorie {section.label}
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorie Configurate</CardTitle>
        </CardHeader>
        <CardContent>
          {sectionCategories && sectionCategories.length > 0 ? (
            <div className="space-y-4">
              {parentCategories.map((cat) => {
                const children = subCategories.filter(s => s.parentId === cat.id);
                return (
                  <div key={cat.id} data-testid={`category-group-${cat.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {cat.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      )}
                      <h3 className="text-sm font-semibold">{cat.name}</h3>
                      {children.length > 0 && (
                        <Badge variant="secondary" className="text-xs">{children.length} sotto</Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground ml-5 mb-2">{cat.description}</p>
                    )}
                    {children.length > 0 && (
                      <div className="ml-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {children.map((child) => (
                          <div key={child.id} className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md border" data-testid={`subcategory-${child.id}`}>
                            {child.color && (
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: child.color }} />
                            )}
                            <span className="truncate">{child.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {subCategories.filter(s => !parentCategories.some(p => p.id === s.parentId)).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Altre Sottocategorie</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {subCategories.filter(s => !parentCategories.some(p => p.id === s.parentId)).map((child) => (
                      <div key={child.id} className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md border">
                        {child.color && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: child.color }} />
                        )}
                        <span className="truncate">{child.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : section.categoryApiEndpoint ? (
            <div className="text-center py-8 text-muted-foreground">
              <section.icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-3">Nessuna categoria configurata per {section.label}</p>
              {section.categoryManagementUrl && (
                <Link href={section.categoryManagementUrl}>
                  <Button variant="outline" data-testid={`button-add-categories-${section.id}`}>
                    Configura Categorie
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <section.icon className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nessuna categoria dedicata per questa sezione</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
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
  const [, navigate] = useLocation();

  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  // @ts-ignore // TODO: STI-cleanup
  const { data: workshops } = useQuery<Workshop[]>({ queryKey: ["/api/workshops"] });
  const { data: categorieList } = useCustomList("categorie");
  const categories = categorieList?.items ? [...categorieList.items].filter((i: any) => i.active !== false).map((i: any) => ({ id: i.id, name: i.value, color: i.color } as Category)) : [];
  const { data: workshopCategories } = useQuery<WorkshopCategory[]>({ queryKey: ["/api/workshop-categories"] });
  const { data: instructors } = useQuery<Instructor[]>({ queryKey: ["/api/instructors"] });
  const { data: studios } = useQuery<Studio[]>({ queryKey: ["/api/studios"] });

  const { data: summary } = useQuery<Record<string, { total: number, active: number }>>({
    queryKey: ["/api/activities-summary"]
  });

  const activeCourses = courses?.filter(c => c.active) || [];
  const inactiveCourses = courses?.filter(c => !c.active) || [];
  const activeWorkshops = workshops?.filter(w => w.active) || [];
  const inactiveWorkshops = workshops?.filter(w => !w.active) || [];

  const coursesByCategory = categories?.map(cat => ({
    category: cat,
    courses: courses?.filter(c => c.categoryId === cat.id) || [],
  })).filter(g => g.courses.length > 0) || [];

  const uncategorizedCourses = courses?.filter(c => !c.categoryId) || [];

  const workshopsByCategory = workshopCategories?.map(cat => ({
    category: cat,
    workshops: workshops?.filter(w => w.categoryId === cat.id) || [],
  })).filter(g => g.workshops.length > 0) || [];

  const uncategorizedWorkshops = workshops?.filter(w => !w.categoryId) || [];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-muted/30 sticky top-0 z-10">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="icon-gold-bg rounded-md h-8 w-8 flex-shrink-0" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 text-white" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2" data-testid="text-page-title">
                  Attivit&agrave;
                </h1>
                <p className="text-muted-foreground text-sm">
                  Panoramica e gestione di tutte le attivit&agrave;
                </p>
              </div>
            </div>
          </div>
          <ActivityNavMenu />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Tabs value={activeTab} onValueChange={(value) => {
          const section = activitySections.find(s => s.id === value);
          if (section?.managementUrl) {
            navigate(section.managementUrl);
            return;
          }
          setActiveTab(value);
        }} className="w-full">
          <TabsContent value="panoramica" className="space-y-6 mt-6">
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
                    <Badge variant="outline" className="status-badge-gold">{activeCourses.length} attivi</Badge>
                    {inactiveCourses.length > 0 && (
                      <Badge variant="outline" className="status-badge-gold">{inactiveCourses.length} inattivi</Badge>
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
                    <Badge variant="outline" className="status-badge-gold">{activeWorkshops.length} attivi</Badge>
                    {inactiveWorkshops.length > 0 && (
                      <Badge variant="outline" className="status-badge-gold">{inactiveWorkshops.length} inattivi</Badge>
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
                    <Badge variant="outline">{instructors?.length || 0} staff/insegnanti</Badge>
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
                    const count = summary?.[section.id]?.total || 0;
                    const active = summary?.[section.id]?.active || 0;

                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          if (section.managementUrl) {
                            navigate(section.managementUrl);
                          } else {
                            setActiveTab(section.id);
                          }
                        }}
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
              <Link href="/attivita/corsi">
                <Button variant="outline" data-testid="button-goto-corsi-page">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Gestione Completa Corsi
                </Button>
              </Link>
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
                  <Link href="/attivita/corsi">
                    <Button data-testid="button-add-first-course">Vai a Riepilogo Corsi</Button>
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
              <Link href="/attivita/workshops">
                <Button variant="outline" data-testid="button-goto-workshop-page">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Gestione Completa Workshop
                </Button>
              </Link>
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
                          categories={workshopCategories}
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
                          categories={workshopCategories}
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
                  <Link href="/attivita/workshops">
                    <Button data-testid="button-add-first-workshop">Vai a Riepilogo Workshop</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {activitySections.filter(s => s.type === "other").map((section) => (
            <ActivitySectionTab key={section.id} section={section} />
          ))}
        </Tabs>
      </div>
    </div>
  );
}
