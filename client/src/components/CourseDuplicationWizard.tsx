import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, Instructor, Studio } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSeasonLabel } from "@/lib/utils";
interface CourseDuplicationWizardProps {
  currentSeasonId: string;
}

export function CourseDuplicationWizard({ currentSeasonId }: CourseDuplicationWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetSeasonId, setTargetSeasonId] = useState<string>("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(new Set());
  const [courseOverrides, setCourseOverrides] = useState<Record<number, any>>({});
  const [targetCourses, setTargetCourses] = useState<Course[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [globalStartDate, setGlobalStartDate] = useState("");
  const [globalEndDate, setGlobalEndDate] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: seasons } = useQuery<any[]>({ queryKey: ["/api/seasons"] });
  const activeSeasonFallbackId = seasons?.find(s => s.active)?.id?.toString() || "";
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

  const filteredSourceCourses = useMemo(() => {
    if (!searchFilter.trim()) return sourceCourses;
    const lowerFilter = searchFilter.toLowerCase().trim();
    return sourceCourses.filter(c => {
        const matchName = c.name?.toLowerCase().includes(lowerFilter);
        const matchDay = c.dayOfWeek?.toLowerCase().includes(lowerFilter);
        const matchInstructor = (instructors?.find(i => i.id === c.instructorId)?.lastName || "").toLowerCase().includes(lowerFilter);
        return matchName || matchDay || matchInstructor;
    });
  }, [sourceCourses, searchFilter, instructors]);

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

  // Fetch target season courses per anti-duplicazione
  React.useEffect(() => {
    if (targetSeasonId) {
        fetch(`/api/courses?seasonId=${targetSeasonId}`)
            .then(r => r.json())
            .then(data => setTargetCourses(data))
            .catch(() => setTargetCourses([]));
    }
  }, [targetSeasonId]);

  const toggleCourse = (courseId: number) => {
    const next = new Set(selectedCourseIds);
    if (next.has(courseId)) next.delete(courseId);
    else next.add(courseId);
    setSelectedCourseIds(next);
  };

  const toggleAll = () => {
    if (selectedCourseIds.size === filteredSourceCourses.length && filteredSourceCourses.length > 0) {
      setSelectedCourseIds(new Set());
    } else {
      setSelectedCourseIds(new Set(filteredSourceCourses.map(c => c.id)));
    }
  };

  const handleApplyGlobalDates = () => {
    if (!globalStartDate && !globalEndDate) return;
    setCourseOverrides(prev => {
        const next = { ...prev };
        filteredSourceCourses.forEach(c => {
            if (!next[c.id]) next[c.id] = {};
            if (globalStartDate) next[c.id].startDate = globalStartDate;
            if (globalEndDate) next[c.id].endDate = globalEndDate;
        });
        return next;
    });
    toast({ title: "Date applicate", description: `Le date sono state copiate su ${filteredSourceCourses.length} corsi visibili.` });
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

    // Validazione pre-invio
    for (const id of Array.from(selectedCourseIds)) {
        const overrides = courseOverrides[id] || {};
        const originalCourse = sourceCourses.find(c => c.id === id);
        
        const effectiveStartDate = overrides.startDate || (originalCourse?.startDate ? new Date(originalCourse.startDate).toISOString().split('T')[0] : null);
        const effectiveEndDate = overrides.endDate || (originalCourse?.endDate ? new Date(originalCourse.endDate).toISOString().split('T')[0] : null);

        if (!effectiveStartDate || !effectiveEndDate) {
           toast({ title: "Dati Mancanti", description: `Inserisci Data Inizio e Data Fine per il corso: ${originalCourse?.name}`, variant: "destructive" });
           return;
        }
        const duplicateCheck = targetCourses.find(tc => 
            tc.name === (overrides.name ?? originalCourse?.name) &&
            tc.dayOfWeek === originalCourse?.dayOfWeek &&
            tc.startTime === originalCourse?.startTime &&
            tc.studioId === (overrides.studioId !== undefined ? overrides.studioId : originalCourse?.studioId)
        );
        if (duplicateCheck) {
            toast({ title: "Attenzione: Corso già presente", description: `Stai duplicando lo stesso corso per errore. Il corso ${duplicateCheck.name} (${duplicateCheck.dayOfWeek} ${duplicateCheck.startTime}) esiste già nella stagione target.`, variant: "destructive" });
            return;
        }
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
                startDate: overrides.startDate || (originalCourse.startDate ? new Date(originalCourse.startDate).toISOString().split('T')[0] : undefined), // Data Inizio Obbligatoria (verificata)
                endDate: overrides.endDate || (originalCourse.endDate ? new Date(originalCourse.endDate).toISOString().split('T')[0] : undefined), // Data Fine Obbligatoria (verificata)

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

  const handleSingleDuplicate = async (id: number) => {
    if (!targetSeasonId) {
        toast({ title: "Errore", description: "Seleziona la stagione di destinazione.", variant: "destructive" });
        return;
    }
    const overrides = courseOverrides[id] || {};
    const originalCourse = sourceCourses.find(c => c.id === id);

    const effectiveStartDate = overrides.startDate || (originalCourse?.startDate ? new Date(originalCourse.startDate).toISOString().split('T')[0] : null);
    const effectiveEndDate = overrides.endDate || (originalCourse?.endDate ? new Date(originalCourse.endDate).toISOString().split('T')[0] : null);

    if (!effectiveStartDate || !effectiveEndDate) {
        toast({ title: "Dati Mancanti", description: `Inserisci Data Inizio e Data Fine per il corso: ${originalCourse?.name}`, variant: "destructive" });
        return;
    }

    const duplicateCheck = targetCourses.find(tc => 
        tc.name === (overrides.name ?? originalCourse?.name) &&
        tc.dayOfWeek === originalCourse?.dayOfWeek &&
        tc.startTime === originalCourse?.startTime &&
        tc.studioId === (overrides.studioId !== undefined ? overrides.studioId : originalCourse?.studioId)
    );
    if (duplicateCheck) {
        toast({ title: "Attenzione: Corso già presente", description: `Il corso ${duplicateCheck.name} (${duplicateCheck.dayOfWeek} ${duplicateCheck.startTime}) esiste già nella stagione target.`, variant: "destructive" });
        return;
    }

    if (!originalCourse) return;

    const newCourse = {
        name: overrides.name ?? originalCourse.name,
        categoryId: originalCourse.categoryId,
        instructorId: overrides.instructorId !== undefined ? overrides.instructorId : originalCourse.instructorId,
        dayOfWeek: overrides.dayOfWeek ?? originalCourse.dayOfWeek,
        startTime: overrides.startTime ?? originalCourse.startTime,
        endTime: overrides.endTime ?? originalCourse.endTime,
        studioId: overrides.studioId !== undefined ? overrides.studioId : originalCourse.studioId,
        seasonId: parseInt(targetSeasonId),
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        currentEnrollment: 0, 
        statusTags: [], 
        googleEventId: null, 
        quoteId: null, 
        sku: null, 
        price: "0",
        active: true,
        maxCapacity: originalCourse.maxCapacity
    };

    try {
        await createMutation.mutateAsync(newCourse);
        queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
        toast({ title: "Operazione completata", description: `Corso duplicato con successo.` });
        
        // Remove from selection so it's not re-duplicated by accident
        const next = new Set(selectedCourseIds);
        next.delete(id);
        setSelectedCourseIds(next);
        
        // Update local targetCourses so immediate second clicks are caught
        setTargetCourses(prev => [...prev, newCourse as any]);

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
      <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between gap-6 pe-4 border-b pb-4">
          <div className="w-[180px] shrink-0">
            <DialogTitle className="text-base text-left">Duplicazione Massiva Corsi</DialogTitle>
            <DialogDescription className="text-[10px] leading-tight mt-1 text-left">
              Copia i corsi della stagione attualmente selezionata verso una nuova stagione.
            </DialogDescription>
          </div>
          <div className="flex items-center justify-end gap-4 flex-1">
            <div className="text-[10px] sm:text-xs text-yellow-700 bg-yellow-50 px-3 py-2 rounded-md border border-yellow-200 max-w-[600px] text-left leading-snug">
              <strong className="mr-1">Sicurezza:</strong> I corsi selezionati verranno clonati vergini (no pagamenti/iscritti). La logica oraria originale verrà mantenuta, con nuove date inizio/fine limitate alla stagione considerata.
            </div>
            <Button onClick={handleDuplicate} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[180px] whitespace-nowrap h-11" disabled={createMutation.isPending || selectedCourseIds.size === 0}>
                {createMutation.isPending ? "Elaborazione..." : `Duplica Selezione (${selectedCourseIds.size})`}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
            <div className="flex items-center gap-4 border p-4 rounded-lg bg-slate-50 flex-wrap">
                <div className="space-y-1.5 w-[250px]">
                    <Label className="font-semibold text-slate-800">Stagione Destinazione</Label>
                    <Select value={targetSeasonId} onValueChange={setTargetSeasonId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Seleziona la stagione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {targetSeasons.map((s: any) => (
                                <SelectItem key={s.id} value={s.id.toString()}>{getSeasonLabel(s, seasons)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                    <Label className="font-semibold text-slate-800">Cerca (Es: LUN)</Label>
                    <Input placeholder="Filtra corsi..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="bg-white" />
                </div>
                <div className="space-y-1.5 min-w-[130px]">
                     <Label className="font-semibold text-slate-800">Data Inizio globale</Label>
                     <Input type="date" value={globalStartDate} onChange={e => setGlobalStartDate(e.target.value)} className="bg-white" />
                </div>
                <div className="space-y-1.5 min-w-[130px]">
                     <Label className="font-semibold text-slate-800">Data Fine globale</Label>
                     <Input type="date" value={globalEndDate} onChange={e => setGlobalEndDate(e.target.value)} className="bg-white" />
                </div>
                <div className="space-y-1.5 self-end">
                     <Button type="button" variant="secondary" onClick={handleApplyGlobalDates}>Applica a tutti</Button>
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
                                       : selectedCourseIds.size === filteredSourceCourses.length && filteredSourceCourses.length > 0 
                                            ? true 
                                            : "indeterminate"
                                   } 
                                   onCheckedChange={toggleAll}
                                />
                            </TableHead>
                            <TableHead>Corso Originale</TableHead>
                            <TableHead>Date / Stagione *</TableHead>
                            <TableHead>Nuovo Nome <span className="text-xs text-muted-foreground font-normal">(opz.)</span></TableHead>
                            <TableHead>Sala <span className="text-xs text-muted-foreground font-normal">(opz.)</span></TableHead>
                            <TableHead>Insegnante <span className="text-xs text-muted-foreground font-normal">(opz.)</span></TableHead>
                            <TableHead className="w-12 text-center"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSourceCourses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Nessun corso presente nella stagione corrente.
                                </TableCell>
                            </TableRow>
                        ) : filteredSourceCourses.map(course => {
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
                                        <div className="flex gap-2 mb-1">
                                            <Input
                                                type="date"
                                                disabled={!isSelected}
                                                className={`h-8 text-xs ${isSelected && !(courseOverrides[course.id]?.startDate || course.startDate) ? "border-red-400 bg-red-50" : ""}`}
                                                value={courseOverrides[course.id]?.startDate || (course.startDate ? new Date(course.startDate).toISOString().split('T')[0] : "")}
                                                onChange={(e) => updateOverride(course.id, "startDate", e.target.value)}
                                            />
                                            <Input
                                                type="date"
                                                disabled={!isSelected}
                                                className={`h-8 text-xs ${isSelected && !(courseOverrides[course.id]?.endDate || course.endDate) ? "border-red-400 bg-red-50" : ""}`}
                                                value={courseOverrides[course.id]?.endDate || (course.endDate ? new Date(course.endDate).toISOString().split('T')[0] : "")}
                                                onChange={(e) => updateOverride(course.id, "endDate", e.target.value)}
                                            />
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
                                            value={courseOverrides[course.id]?.studioId?.toString() || course.studioId?.toString() || "none"}
                                            onValueChange={(val) => updateOverride(course.id, "studioId", val === "none" ? null : parseInt(val))}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-white">
                                                <SelectValue placeholder="Seleziona Sala..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" className="text-muted-foreground italic">Nessuna sala</SelectItem>
                                                {studios?.map(s => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            disabled={!isSelected}
                                            value={courseOverrides[course.id]?.instructorId?.toString() || course.instructorId?.toString() || "none"}
                                            onValueChange={(val) => updateOverride(course.id, "instructorId", val === "none" ? null : parseInt(val))}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-white">
                                                <SelectValue placeholder="Seleziona Insegnante..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none" className="text-muted-foreground italic">Nessun insegnante</SelectItem>
                                                {instructors?.map(i => (
                                                    <SelectItem key={i.id} value={i.id.toString()}>{i.lastName} {i.firstName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-center align-middle">
                                        <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-8 w-8 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800"
                                            onClick={() => handleSingleDuplicate(course.id)}
                                            title="Duplica solo questo corso"
                                            disabled={createMutation.isPending}
                                        >
                                            <Save className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}
