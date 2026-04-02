import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, Instructor, Studio } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatSeasonName } from "@/lib/utils";
interface CourseDuplicationWizardProps {
  currentSeasonId: string;
}

export function CourseDuplicationWizard({ currentSeasonId }: CourseDuplicationWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetSeasonId, setTargetSeasonId] = useState<string>("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());
  const [courseOverrides, setCourseOverrides] = useState<Record<number, any>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: seasons } = useQuery<any[]>({ queryKey: ["/api/seasons"] });
  const activeSeasonFallbackId = seasons?.find(s => s.status === "active")?.id?.toString() || "";
  const effectiveSourceSeasonId = currentSeasonId === "active" ? activeSeasonFallbackId : currentSeasonId;

  const { data: courses, isLoading: loadingCourses } = useQuery<Course[]>({ 
      queryKey: [effectiveSourceSeasonId ? `/api/courses?seasonId=${effectiveSourceSeasonId}` : "/api/courses"],
      enabled: !!effectiveSourceSeasonId
  });
  const { data: instructors } = useQuery<Instructor[]>({ queryKey: ["/api/instructors"] });
  const { data: studios } = useQuery<Studio[]>({ queryKey: ["/api/studios"] });

  // Filtra solo i corsi della stagione di partenza corrente
  const sourceCourses = useMemo(() => {
    if (!courses || !effectiveSourceSeasonId) return [];
    return courses.filter(c => {
      const cSeasonId = c.seasonId?.toString() || activeSeasonFallbackId;
      return cSeasonId === effectiveSourceSeasonId;
    });
  }, [courses, effectiveSourceSeasonId, activeSeasonFallbackId]);

  const targetSeasons = useMemo(() => {
    if (!seasons) return [];
    return seasons.filter(s => s.id.toString() !== effectiveSourceSeasonId);
  }, [seasons, effectiveSourceSeasonId]);

  React.useEffect(() => {
      // Auto-select next season ("26-27") by default
      if (targetSeasons.length > 0 && !targetSeasonId) {
          // find the first season ID greater than source, or fallback to the first available target
          const nextSeason = targetSeasons.find(s => Number(s.id) > Number(effectiveSourceSeasonId)) || targetSeasons[0];
          if (nextSeason) {
              setTargetSeasonId(nextSeason.id.toString());
          }
      }
  }, [targetSeasons, targetSeasonId, effectiveSourceSeasonId]);

  const toggleCourse = (courseId: number) => {
    const next = new Set(selectedCourseIds);
    if (next.has(courseId)) next.delete(courseId);
    else next.add(courseId);
    setSelectedCourseIds(next);
  };

  const toggleAll = () => {
    if (selectedCourseIds.size === sourceCourses.length) {
      setSelectedCourseIds(new Set());
    } else {
      setSelectedCourseIds(new Set(sourceCourses.map(c => c.id)));
    }
  };

  const updateOverride = (courseId: number, field: string, value: any) => {
    setCourseOverrides(prev => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || {}),
        [field]: value
      }
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiRequest("POST", "/api/courses", payload);
    }
  });

  const handleDuplicate = async () => {
    if (!targetSeasonId) {
       toast({ title: "Errore", description: "Seleziona la stagione di destinazione.", variant: "destructive" });
       return;
    }
    if (selectedCourseIds.size === 0) {
       toast({ title: "Errore", description: "Seleziona almeno un corso da duplicare.", variant: "destructive" });
       return;
    }

    try {
        const promises = Array.from(selectedCourseIds).map(id => {
            const originalCourse = sourceCourses.find(c => c.id === id);
            if (!originalCourse) return null;
            const overrides = courseOverrides[id] || {};
            
            const newCourse = {
                // CAMPI ESPLICITAMENTE COPIATI (Come da ref. AG-018)
                name: overrides.name ?? originalCourse.name, // Genere/Nome
                categoryId: originalCourse.categoryId, // Genere (id di categoria)
                instructorId: overrides.instructorId !== undefined ? overrides.instructorId : originalCourse.instructorId, // Insegnante
                dayOfWeek: overrides.dayOfWeek ?? originalCourse.dayOfWeek, // Giorno
                startTime: overrides.startTime ?? originalCourse.startTime, // Orario Inizio
                endTime: overrides.endTime ?? originalCourse.endTime, // Orario Fine
                studioId: overrides.studioId !== undefined ? overrides.studioId : originalCourse.studioId, // Studio
                seasonId: parseInt(targetSeasonId), // Nuova Stagione

                // CAMPI PROIBITI O RE-INIZIALIZZATI VUOTI
                currentEnrollment: 0, 
                statusTags: [], 
                googleEventId: null, 
                quoteId: null, 
                sku: null, 
                price: "0", // Il prezzo stringa se null spacca l'inseritore, usiamo stringa "0" nominalistica
                active: true,
                maxCapacity: originalCourse.maxCapacity // E' una metrica fisica della sala, conviene trapiantarla
            };
            
            // Nota: I pagamenti storici risiedono nella tabella 'payments' e 
            // legati alle tessere/transazioni (members), non vengono duplicati inviando il corso.
            return createMutation.mutateAsync(newCourse);
        }).filter(Boolean);

        await Promise.all(promises);
        queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
        
        const targetName = targetSeasons.find(s => s.id.toString() === targetSeasonId)?.name || 'la nuova stagione';
        toast({ title: "Operazione completata", description: `${selectedCourseIds.size} corsi duplicati con successo nella stagione ${targetName}.` });
        setIsOpen(false);
        setSelectedCourseIds(new Set());
        setCourseOverrides({});
    } catch (error: any) {
        toast({ title: "Errore di duplicazione", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 font-medium bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/80 transition-colors">
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">Duplica Corsi</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Duplicazione Massiva Corsi</DialogTitle>
          <DialogDescription>
            Copia i corsi della stagione attualmente selezionata verso una nuova stagione.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 border p-4 rounded-lg bg-slate-50">
                <div className="space-y-1.5 w-[250px]">
                    <Label className="font-semibold text-slate-800">Stagione Destinazione</Label>
                    <Select value={targetSeasonId} onValueChange={setTargetSeasonId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Seleziona la stagione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {targetSeasons.map((s: any) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{formatSeasonName(s.name)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center mt-6 text-sm text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                    <strong>Nota Sicurezza:</strong> I corsi selezionati verranno clonati interamente vergini. Tutte le anagrafiche, iscritti (enrollments) e transazioni collegate NON verranno in alcun modo trasferite per ragioni di coerenza contabile.
                </div>
            </div>

            <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-12 text-center">
                                <Checkbox 
                                   checked={
                                       selectedCourseIds.size === 0 
                                       ? false 
                                       : selectedCourseIds.size === sourceCourses.length 
                                            ? true 
                                            : "indeterminate"
                                   } 
                                   onCheckedChange={toggleAll}
                                />
                            </TableHead>
                            <TableHead>Corso Originale</TableHead>
                            <TableHead>Nuovo Nome <span className="text-xs text-muted-foreground font-normal">(opzionale)</span></TableHead>
                            <TableHead>Nuovo Insegnante</TableHead>
                            <TableHead>Nuova Sala</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sourceCourses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nessun corso presente nella stagione corrente.
                                </TableCell>
                            </TableRow>
                        ) : sourceCourses.map(course => {
                            const isSelected = selectedCourseIds.has(course.id);
                            return (
                                <TableRow key={course.id} className={isSelected ? 'bg-indigo-50/30' : ''}>
                                    <TableCell className="text-center">
                                        <Checkbox 
                                           checked={isSelected}
                                           onCheckedChange={() => toggleCourse(course.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-slate-900 line-clamp-1 truncate" title={course.name}>{course.name}</div>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                           <span>{course.dayOfWeek} {course.startTime}-{course.endTime}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                           disabled={!isSelected}
                                           placeholder={course.name}
                                           value={courseOverrides[course.id]?.name || ""}
                                           onChange={(e) => updateOverride(course.id, "name", e.target.value)}
                                           className="h-8 text-sm"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            disabled={!isSelected}
                                            value={courseOverrides[course.id]?.instructorId?.toString() || course.instructorId?.toString() || "none"}
                                            onValueChange={(val) => updateOverride(course.id, "instructorId", val === "none" ? null : parseInt(val))}
                                        >
                                            <SelectTrigger className="h-8 text-sm bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nessuno</SelectItem>
                                                {instructors?.map(i => (
                                                    <SelectItem key={i.id} value={i.id.toString()}>{i.lastName} {i.firstName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            disabled={!isSelected}
                                            value={courseOverrides[course.id]?.studioId?.toString() || course.studioId?.toString() || "none"}
                                            onValueChange={(val) => updateOverride(course.id, "studioId", val === "none" ? null : parseInt(val))}
                                        >
                                            <SelectTrigger className="h-8 text-sm bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nessuna</SelectItem>
                                                {studios?.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Annulla</Button>
          <Button onClick={handleDuplicate} disabled={selectedCourseIds.size === 0 || createMutation.isPending} className="gold-3d-button text-black font-semibold">
              {createMutation.isPending ? "Duplicazione in corso..." : `Duplica ${selectedCourseIds.size} selezionati`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
