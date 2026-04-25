import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types
import type { Course } from "@shared/schema";
import { getSeasonLabel } from "@/lib/utils";

interface Props {
  course: Course | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newCourse: any) => void;
}

const WEEKDAYS = [
    { id: "LUN", label: "Lunedì" },
    { id: "MAR", label: "Martedì" },
    { id: "MER", label: "Mercoledì" },
    { id: "GIO", label: "Giovedì" },
    { id: "VEN", label: "Venerdì" },
    { id: "SAB", label: "Sabato" },
    { id: "DOM", label: "Domenica" }
];

const timeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
    return parts[0] * 60 + parts[1];
};


function getFirstDateForDay(fromDate: string, dayOfWeek: string): string {
  if (!fromDate || !dayOfWeek) return '';
  const dayMap: Record<string, number> = { 'LUN':1,'MAR':2,'MER':3,'GIO':4,'VEN':5,'SAB':6,'DOM':0 };
  const target = dayMap[dayOfWeek];
  const d = new Date(fromDate);
  while (d.getDay() !== target) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split('T')[0];
}

function getLastDateForDay(toDate: string, dayOfWeek: string): string {
  if (!toDate || !dayOfWeek) return '';
  const dayMap: Record<string, number> = { 'LUN':1,'MAR':2,'MER':3,'GIO':4,'VEN':5,'SAB':6,'DOM':0 };
  const target = dayMap[dayOfWeek];
  const d = new Date(toDate);
  while (d.getDay() !== target) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().split('T')[0];
}

function countOccurrences(startDate: string, endDate: string, dayOfWeek: string, closedDays: string[]): number {
  if (!startDate || !endDate || !dayOfWeek) return 0;
  const dayMap: Record<string,number> = { 'LUN':1,'MAR':2,'MER':3,'GIO':4,'VEN':5,'SAB':6,'DOM':0 };
  const target = dayMap[dayOfWeek];
  const closedSet = new Set(closedDays);
  let count = 0;
  const d = new Date(startDate);
  const end = new Date(endDate);
  while (d <= end) {
    if (d.getDay() === target && !closedSet.has(d.toISOString().split('T')[0])) {
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function CourseSingleDuplicateModal({ course, isOpen, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [seasonId, setSeasonId] = useState<string>("");
  const [sku, setSku] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [totalOccurrences, setTotalOccurrences] = useState<number>(0);

  const { data: seasons } = useQuery<any[]>({ queryKey: ["/api/seasons"] });
  const { data: instructors } = useQuery<any[]>({ queryKey: ["/api/instructors"] });
  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/custom-lists/categorie"] });
  
  // Precarica i corsi della stagione di destinazione per tracciare i conflitti!
  const { data: targetSeasonEvents } = useQuery<any[]>({
      queryKey: [`/api/activities-unified-preview?seasonId=${seasonId}`],
      enabled: !!seasonId
  });

  // Initialize defaults safely inside a try-catch to prevent ANY render crash
  useEffect(() => {
    try {
      if (isOpen && course) {
        setDayOfWeek(course.dayOfWeek || "");
        setStartTime(course.startTime || "");
        setEndTime(course.endTime || "");

        if (seasons && seasons.length > 0) {
            const nextSeason = seasons.find(s => Number(s?.id || 0) > Number(course?.seasonId || 0)) || seasons[0];
            if (nextSeason && nextSeason.id) {
               setSeasonId(nextSeason.id.toString());
            }
        }
      }
    } catch (e) {
      console.error("Init Error", e);
    }
  }, [isOpen, course, seasons]);

  // Fetch closed days when season or dates change
  useEffect(() => {
    if (!seasonId || !startDate || !endDate) return;
    fetch(`/api/strategic-events/closed-days?from=${startDate}&to=${endDate}&seasonId=${seasonId}`)
      .then(r => r.json())
      .then(d => {
         if (d.closedDays) setClosedDays(d.closedDays);
      })
      .catch(console.error);
  }, [seasonId, startDate, endDate]);

  
  useEffect(() => {
     if (dayOfWeek && seasonId) {
         const selectedSeason = seasons?.find(s => s?.id?.toString() === seasonId);
         if (selectedSeason?.startDate) {
             const seasonStartYear = new Date(selectedSeason.startDate).getFullYear();
             setStartDate(getFirstDateForDay(`${seasonStartYear}-09-01`, dayOfWeek));
         }
         if (selectedSeason?.endDate) {
             const seasonEndYear = new Date(selectedSeason.endDate).getFullYear();
             setEndDate(getLastDateForDay(`${seasonEndYear}-06-30`, dayOfWeek));
         }
     }
  }, [dayOfWeek]);

  // Recalculate occurrences
  useEffect(() => {
    if (startDate && endDate && dayOfWeek) {
        setTotalOccurrences(countOccurrences(startDate, endDate, dayOfWeek, closedDays));
    } else {
        setTotalOccurrences(0);
    }
  }, [startDate, endDate, dayOfWeek, closedDays]);

  // Recalculate values when season changes
  useEffect(() => {
    try {
      if (!seasonId || !course || !isOpen || !seasons) return;
      
      const selectedSeason = seasons.find(s => s?.id?.toString() === seasonId);
      if (selectedSeason?.startDate && dayOfWeek) {
          const seasonStartYear = new Date(selectedSeason.startDate).getFullYear();
          setStartDate(getFirstDateForDay(`${seasonStartYear}-09-01`, dayOfWeek));
      }
      if (selectedSeason?.endDate && dayOfWeek) {
          const seasonEndYear = new Date(selectedSeason.endDate).getFullYear();
          setEndDate(getLastDateForDay(`${seasonEndYear}-06-30`, dayOfWeek));
      }

      // SKU Generation
      let codeA = "XXXX";
      if (selectedSeason?.name) {
         const numbers = selectedSeason.name.match(/\d+/g);
         if (numbers && numbers.length >= 2) {
             const p1 = numbers[0] ? numbers[0].slice(-2) : "XX";
             const p2 = numbers[1] ? numbers[1].slice(-2) : "XX";
             codeA = p1 + p2;
         } else if (numbers && numbers.length === 1 && numbers[0].length === 4) {
             codeA = numbers[0];
         }
      }

      let codeB = "XXX";
      if (course?.instructorId && Array.isArray(instructors)) {
          const inst = instructors.find(i => i?.id === course.instructorId);
          if (inst && inst.lastName) {
              codeB = String(inst.lastName).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 10);
          }
      }

      let codeC = "XXX";
      if (dayOfWeek) {
          codeC = String(dayOfWeek).toUpperCase().slice(0, 3);
      }

      let codeD = "XX";
      if (startTime) {
          codeD = String(startTime).split(":")[0] || "XX";
      }

      const calculatedSku = `${codeA}${codeB}${codeC}${codeD}`;
      setSku(calculatedSku);

    } catch (e) {
      console.error("SKU error", e);
    }
  }, [seasonId, course, dayOfWeek, startTime, isOpen, seasons, instructors, categories]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/courses", payload);
      return res; // Ritorna l'oggetto direttamente senza chiamare .json() poichè ci pensa già apiRequest
    },
    onSuccess: (newRecord) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses?seasonId=${seasonId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities-unified-preview"] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities-unified-preview?seasonId=${seasonId}`] });
      onSuccess(newRecord); 
      onOpenChange(false);
      toast({ title: "Copia creata", description: "Il corso è stato duplicato con successo." });
    },
    onError: (err: any) => {
      toast({ title: "Errore di duplicazione", description: err.message, variant: "destructive" });
    }
  });

  const handleDuplicate = () => {
     if (!seasonId) return toast({ title: "Seleziona", description: "Seleziona una stagione", variant: "destructive"});
     if (!course) return;

     // 0. Controllo Congruenza Data Inizio e Giorno Settimana
     if (startDate && dayOfWeek && dayOfWeek !== "none") {
         const dObj = new Date(`${startDate}T12:00:00`);
         const dayIdx = dObj.getDay() === 0 ? 6 : dObj.getDay() - 1;
         const isMatchingDay = WEEKDAYS[dayIdx].id === dayOfWeek;
         
         if (!isMatchingDay) {
             const chosenDayObj = WEEKDAYS.find(w => w.id === dayOfWeek);
             const wrongDayObj = WEEKDAYS[dayIdx];
             return toast({
                 title: "Data di Inizio incompatibile",
                 description: `La ricorrenza è impostata di ${chosenDayObj?.label}, ma la Data Inizio inserita cade di ${wrongDayObj?.label}. Seleziona la data corretta sul calendario!`,
                 variant: "destructive",
                 duration: 6000
             });
         }
     }

     // 0.5 Controllo Limiti Temporali della Stagione
     const selectedSeason = seasons?.find(s => s?.id?.toString() === seasonId);
     if (selectedSeason?.startDate && selectedSeason?.endDate && startDate && endDate) {
         const minStr = new Date(selectedSeason.startDate).toISOString().split("T")[0];
         const maxStr = new Date(selectedSeason.endDate).toISOString().split("T")[0];
         
         if (startDate < minStr || startDate > maxStr || endDate < minStr || endDate > maxStr) {
             return toast({
                 title: "Date fuori stagione",
                 description: `Hai sfasato le date. Devono rientrare tra ${new Date(minStr).toLocaleDateString()} e ${new Date(maxStr).toLocaleDateString()} per la stagione ${selectedSeason.name}!`,
                 variant: "destructive",
                 duration: 6000
             });
         }
     }

     // 1. Controllo Conflitti pre-duplicazione
     if (targetSeasonEvents && targetSeasonEvents.length > 0 && startTime) {
        const newStart = timeToMinutes(startTime);
        const newEnd = endTime ? timeToMinutes(endTime) : (newStart + 60);

        for (const evt of targetSeasonEvents) {
            // Se sono in un'altra sala, non c'è conflitto
            if (evt.studioId !== course.studioId) continue;
            
            // Check sul giorno della settimana
            let matchDay = false;
            if (evt.sourceType === "course" || evt.sourceType === "courses") {
                matchDay = evt.dayOfWeek === dayOfWeek; // Corsi su corsi
            } else {
                matchDay = evt.dayOfWeek === dayOfWeek; // Approssimazione per workshop o booking ricorrenti nello stesso giorno
            }

            if (!matchDay) continue;

            const oldStart = timeToMinutes(evt.startTime);
            const oldEnd = evt.endTime ? timeToMinutes(evt.endTime) : (oldStart + 60);

            // Se gli orari si sormontano/sovrappongono
            if (newStart < oldEnd && newEnd > oldStart) {
                return toast({ 
                    title: "Spazio Occupato", 
                    description: `La ${course.studioId ? "Sala" : "risorsa"} è già occupata da "${evt.title}" (dalle ${evt.startTime} alle ${evt.endTime}). Manca o sposta l'orario.`,
                    variant: "destructive"
                });
            }
        }
     }

     const payload = {
        name: course.name,
        activityType: course.activityType || "course",
        categoryId: course.categoryId,
        instructorId: course.instructorId,
        dayOfWeek: dayOfWeek,
        startTime: startTime,
        endTime: endTime,
        recurrenceType: course.recurrenceType || "weekly", // <-- Mantiene la ricorrenza originale o usa weekly di default
        studioId: course.studioId,
        seasonId: parseInt(seasonId),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        sku: sku,
        currentEnrollment: 0, 
        statusTags: [], 
        googleEventId: null, 
        quoteId: undefined, 
        price: course.price?.toString() || "0",
        active: true,
        maxCapacity: course.maxCapacity
     };

     createMutation.mutate(payload);
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Duplica Singolo Corso</DialogTitle>
          <DialogDescription>
             Crea una copia di "{course?.name || "sconosciuto"}" in un'altra stagione.
          </DialogDescription>
        </DialogHeader>
          {totalOccurrences > 0 && (<div className="bg-blue-50 text-blue-700 text-sm font-semibold p-2 rounded flex items-center gap-2">📅 {totalOccurrences} lezioni previste ({totalOccurrences} settimane operative al netto delle festività)</div>)}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>1. Cambio Stagione <span className="text-red-500 ml-1">*</span></Label>
            <Select value={seasonId} onValueChange={setSeasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona stagione..." />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(seasons) && seasons
                  .filter(s => {
                    const sourceSeasonId = course?.seasonId || (course as any)?.rawPayload?.seasonId;
                    const sourceSeason = seasons.find(os => os.id === sourceSeasonId);
                    if (!sourceSeason) return s.id !== sourceSeasonId; // fallback se non troviamo la sorgente
                    return s.id !== sourceSeasonId && new Date(s.startDate) > new Date(sourceSeason.startDate);
                  })
                  .map(s => s && s.id ? (
                  <SelectItem key={s.id} value={s.id.toString()}>{getSeasonLabel(s, seasons)}</SelectItem>
                ) : null)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>2. Codice / SKU</Label>
            <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="Es. 2627CRUZMAR13.F" />
            <p className="text-xs text-muted-foreground">Generato automaticamente in base al nome e orario.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>3. Data Inizio <span className="text-red-500 ml-1">*</span></Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Data Fine <span className="text-red-500 ml-1">*</span></Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 bg-muted/50 p-3 rounded-md">
             <div className="space-y-2 col-span-3 pb-1 border-b">
                 <Label className="text-xs text-muted-foreground uppercase">Ricorrenza</Label>
             </div>
             <div className="space-y-1">
                 <Label className="text-xs">Giorno <span className="text-red-500 ml-1">*</span></Label>
                 <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map(d => <SelectItem key={d.id} value={d.id} className="text-xs">{d.label}</SelectItem>)}
                    </SelectContent>
                 </Select>
             </div>
             <div className="space-y-1">
                 <Label className="text-xs">Orario Inizio <span className="text-red-500 ml-1">*</span></Label>
                 <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-8 text-xs p-1" />
             </div>
             <div className="space-y-1">
                 <Label className="text-xs">Orario Fine <span className="text-red-500 ml-1">*</span></Label>
                 <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-8 text-xs p-1" />
             </div>
          </div>

        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
           <div className="text-xs text-slate-500">
              <span className="text-red-500 font-bold mr-1">*</span> Campi obbligatori
           </div>
           <div className="flex gap-2">
             <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
             <Button onClick={handleDuplicate} disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createMutation.isPending ? "Salvataggio..." : "Crea Copia"}
             </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
