import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, Instructor, Studio } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSeasonLabel } from "@/lib/utils";

function getFirstDateForDay(fromDate: string, dayOfWeek: string): string {
  if (!fromDate || !dayOfWeek) return "";
  const dayMap: Record<string, number> = {
    LUN: 1,
    MAR: 2,
    MER: 3,
    GIO: 4,
    VEN: 5,
    SAB: 6,
    DOM: 0,
  };
  const target = dayMap[dayOfWeek];
  const d = new Date(fromDate);
  while (d.getDay() !== target) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().split("T")[0];
}

function getLastDateForDay(toDate: string, dayOfWeek: string): string {
  if (!toDate || !dayOfWeek) return "";
  const dayMap: Record<string, number> = {
    LUN: 1,
    MAR: 2,
    MER: 3,
    GIO: 4,
    VEN: 5,
    SAB: 6,
    DOM: 0,
  };
  const target = dayMap[dayOfWeek];
  const d = new Date(toDate);
  while (d.getDay() !== target) {
    d.setDate(d.getDate() - 1);
  }
  return d.toISOString().split("T")[0];
}

function countOccurrences(
  startDate: string,
  endDate: string,
  dayOfWeek: string,
  closedDays: string[],
): number {
  if (!startDate || !endDate || !dayOfWeek) return 0;
  const dayMap: Record<string, number> = {
    LUN: 1,
    MAR: 2,
    MER: 3,
    GIO: 4,
    VEN: 5,
    SAB: 6,
    DOM: 0,
  };
  const target = dayMap[dayOfWeek];
  const closedSet = new Set(closedDays);
  let count = 0;
  const d = new Date(startDate);
  const end = new Date(endDate);
  while (d <= end) {
    if (
      d.getDay() === target &&
      !closedSet.has(d.toISOString().split("T")[0])
    ) {
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return count;
}

const DAY_ALIASES: Record<string, string[]> = {
  LUN: ["lun", "lunedì", "lunedi", "monday", "mon"],
  MAR: ["mar", "martedì", "martedi", "tuesday", "tue"],
  MER: ["mer", "mercoledì", "mercoledi", "wednesday", "wed"],
  GIO: ["gio", "giovedì", "giovedi", "thursday", "thu"],
  VEN: ["ven", "venerdì", "venerdi", "friday", "fri"],
  SAB: ["sab", "sabato", "saturday", "sat"],
  DOM: ["dom", "domenica", "sunday", "sun"],
};

function matchesFilter(
  course: any,
  filter: string,
  instructors: any[],
): boolean {
  const f = filter.toLowerCase().trim();
  if (!f) return true;
  if (course.name?.toLowerCase().includes(f)) return true;
  const dayCode = course.dayOfWeek?.toUpperCase();
  const aliases = DAY_ALIASES[dayCode] || [];
  if (aliases.some((a) => a.includes(f) || f.includes(a))) return true;
  const instructorName =
    instructors?.find((i) => i.id === course.instructorId)?.lastName || "";
  if (instructorName.toLowerCase().includes(f)) return true;
  return false;
}

interface CourseDuplicationWizardProps {
  currentSeasonId: string;
  preSelectedCourseIds?: Set<number>;
  triggerElement?: React.ReactNode;
  openState?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CourseDuplicationWizard({
  currentSeasonId,
  preSelectedCourseIds,
  triggerElement,
  openState,
  onOpenChange,
}: CourseDuplicationWizardProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = openState !== undefined ? openState : internalIsOpen;

  const handleOpenChange = (open: boolean) => {
    setInternalIsOpen(open);
    if (onOpenChange) onOpenChange(open);
  };

  const [targetSeasonId, setTargetSeasonId] = useState<string>("");
  const [tableSourceSeasonId, setTableSourceSeasonId] = useState<string>("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<number>>(
    new Set(),
  );

  React.useEffect(() => {
    if (isOpen) {
      if (preSelectedCourseIds && preSelectedCourseIds.size > 0) {
        setSelectedCourseIds(new Set(preSelectedCourseIds));
      }
      const fallbackId = currentSeasonId === "active" ? "" : currentSeasonId;
      if (fallbackId && fallbackId !== tableSourceSeasonId) {
        setTableSourceSeasonId(fallbackId);
      }
    }
  }, [isOpen, preSelectedCourseIds, currentSeasonId]);

  const [courseOverrides, setCourseOverrides] = useState<Record<number, any>>(
    {},
  );
  const [targetCourses, setTargetCourses] = useState<Course[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [globalStartDate, setGlobalStartDate] = useState("");
  const [globalEndDate, setGlobalEndDate] = useState("");
  const [userModifiedStartDate, setUserModifiedStartDate] = useState(false);
  const [closedDays, setClosedDays] = useState<string[]>([]);

  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const [deleteInfo, setDeleteInfo] = useState<{
    cancellabili: Course[];
    protetti: Course[];
  }>({ cancellabili: [], protetti: [] });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: seasons } = useQuery<any[]>({ queryKey: ["/api/seasons"] });
  const activeSeasonFallbackId =
    seasons?.find((s) => s.active)?.id?.toString() || "";
  const initialSourceSeasonId =
    currentSeasonId === "active" ? activeSeasonFallbackId : currentSeasonId;
  const effectiveSourceSeasonId = tableSourceSeasonId || initialSourceSeasonId;

  React.useEffect(() => {
    if (!targetSeasonId || !globalStartDate || !globalEndDate) return;
    fetch(
      `/api/strategic-events/closed-days?from=${globalStartDate}&to=${globalEndDate}&seasonId=${targetSeasonId}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.closedDays) setClosedDays(d.closedDays);
      })
      .catch(console.error);
  }, [targetSeasonId, globalStartDate, globalEndDate]);

  const { data: courses, isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: [
      effectiveSourceSeasonId
        ? `/api/courses?seasonId=${effectiveSourceSeasonId}&activityType=course`
        : "/api/courses?activityType=course",
    ],
    enabled: !!effectiveSourceSeasonId,
  });
  const { data: instructors } = useQuery<Instructor[]>({
    queryKey: ["/api/instructors"],
  });
  const { data: studios } = useQuery<Studio[]>({ queryKey: ["/api/studios"] });
  const { data: categoriesData } = useQuery<any>({
    queryKey: ["/api/custom-lists/categorie"],
  });
  const categories = categoriesData?.items || [];

  // Filtra solo i corsi della stagione di partenza corrente (e per sicurezza in RAM)
  const sourceCourses = useMemo(() => {
    if (!courses || !effectiveSourceSeasonId) return [];
    return courses.filter((c) => {
      const cSeasonId = c.seasonId?.toString() || activeSeasonFallbackId;
      // FILTRO DATI SPORCHI: Ignoriamo i corsi "fantasma" senza una programmazione valida
      const hasSchedule = !!c.dayOfWeek && !!c.startTime;
      return cSeasonId === effectiveSourceSeasonId && hasSchedule;
    });
  }, [courses, effectiveSourceSeasonId, activeSeasonFallbackId]);

  const filteredSourceCourses = useMemo(() => {
    if (!searchFilter.trim()) return sourceCourses;
    return sourceCourses.filter((c) =>
      matchesFilter(c, searchFilter, instructors || []),
    );
  }, [sourceCourses, searchFilter, instructors]);

  const targetSeasons = useMemo(() => {
    if (!seasons || !seasons.length) return [];
    return seasons.filter((s) => s.id.toString() !== effectiveSourceSeasonId);
  }, [seasons, effectiveSourceSeasonId]);

  React.useEffect(() => {
    // Auto-select next season ("26-27") by default
    if (targetSeasons.length > 0 && !targetSeasonId) {
      // find the first season ID greater than source, or fallback to the first available target
      const nextSeason =
        targetSeasons.find(
          (s) => Number(s.id) > Number(effectiveSourceSeasonId),
        ) || targetSeasons[0];
      if (nextSeason) {
        setTargetSeasonId(nextSeason.id.toString());
      }
    }
  }, [targetSeasons, targetSeasonId, effectiveSourceSeasonId]);

  // Fetch target season courses per anti-duplicazione e auto-fill date
  React.useEffect(() => {
    if (targetSeasonId) {
      fetch(`/api/courses?seasonId=${targetSeasonId}&activityType=course`)
        .then((r) => r.json())
        .then((data) => setTargetCourses(data))
        .catch(() => setTargetCourses([]));

      const selectedSeason = seasons?.find(
        (s) => s.id?.toString() === targetSeasonId,
      );
      if (selectedSeason?.startDate && selectedSeason?.endDate) {
        const startYear = new Date(selectedSeason.startDate).getFullYear();
        const endYear = new Date(selectedSeason.endDate).getFullYear();
        const minStr = `${startYear}-09-01`;
        const maxStr = `${endYear}-06-30`;
        setGlobalStartDate(minStr);
        setGlobalEndDate(maxStr);
        setUserModifiedStartDate(false);

        // Auto applica a tutte le source courses per convenienza UX
        setCourseOverrides((prev) => {
          const next = { ...prev };
          sourceCourses.forEach((c) => {
            if (!next[c.id]) next[c.id] = {};
            next[c.id].startDate = minStr;
            next[c.id].endDate = maxStr;
          });
          return next;
        });
      }
    }
  }, [targetSeasonId, seasons, sourceCourses]);

  React.useEffect(() => {
    if (!searchFilter.trim() || !globalStartDate || userModifiedStartDate)
      return;

    const DAY_ALIASES: Record<string, string[]> = {
      LUN: ["lun", "lunedì", "lunedi"],
      MAR: ["mar", "martedì", "martedi"],
      MER: ["mer", "mercoledì", "mercoledi"],
      GIO: ["gio", "giovedì", "giovedi"],
      VEN: ["ven", "venerdì", "venerdi"],
      SAB: ["sab", "sabato"],
      DOM: ["dom", "domenica"],
    };

    const detectedDay = Object.entries(DAY_ALIASES).find(([code, aliases]) =>
      aliases.some((a) => searchFilter.toLowerCase().includes(a)),
    )?.[0];

    if (detectedDay) {
      const selectedSeason = seasons?.find(
        (s: any) => s.id?.toString() === targetSeasonId,
      );
      if (selectedSeason?.startDate) {
        const startYear = new Date(selectedSeason.startDate).getFullYear();
        const minStr = `${startYear}-09-01`;

        const getFirstDateForDay = (
          baseDateStr: string,
          targetDayCode: string,
        ) => {
          const d = new Date(baseDateStr);
          const dayMap: Record<string, number> = {
            DOM: 0,
            LUN: 1,
            MAR: 2,
            MER: 3,
            GIO: 4,
            VEN: 5,
            SAB: 6,
          };
          const target = dayMap[targetDayCode];
          if (target === undefined) return baseDateStr;
          const currentDay = d.getDay();
          let diff = target - currentDay;
          if (diff < 0) diff += 7;
          d.setDate(d.getDate() + diff);
          return d.toISOString().split("T")[0];
        };

        const firstMatchingDate = getFirstDateForDay(minStr, detectedDay);
        if (globalStartDate !== firstMatchingDate) {
          setGlobalStartDate(firstMatchingDate);
        }
      }
    }
  }, [
    searchFilter,
    targetSeasonId,
    seasons,
    userModifiedStartDate,
    globalStartDate,
  ]);

  const toggleCourse = (courseId: number) => {
    const next = new Set(selectedCourseIds);
    if (next.has(courseId)) next.delete(courseId);
    else next.add(courseId);
    setSelectedCourseIds(next);
  };

  const toggleAll = () => {
    if (
      selectedCourseIds.size === filteredSourceCourses.length &&
      filteredSourceCourses.length > 0
    ) {
      setSelectedCourseIds(new Set());
    } else {
      setSelectedCourseIds(new Set(filteredSourceCourses.map((c) => c.id)));
    }
  };

  const handleApplyGlobalDates = () => {
    if (!globalStartDate && !globalEndDate) return;
    setCourseOverrides((prev) => {
      const next = { ...prev };
      filteredSourceCourses.forEach((c) => {
        if (!next[c.id]) next[c.id] = {};
        if (globalStartDate) next[c.id].startDate = globalStartDate;
        if (globalEndDate) next[c.id].endDate = globalEndDate;
      });
      return next;
    });
    toast({
      title: "Date applicate",
      description: `Le date sono state copiate su ${filteredSourceCourses.length} corsi visibili.`,
    });
  };

  const updateOverride = (courseId: number, field: string, value: any) => {
    setCourseOverrides((prev) => ({
      ...prev,
      [courseId]: {
        ...(prev[courseId] || {}),
        [field]: value,
      },
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      await apiRequest("POST", "/api/courses", payload);
    },
  });

  const generateSKUForCourse = (courseData: any, tgSeasonId: string) => {
    let codeA = "XXXX";
    const season = seasons?.find((s: any) => s.id?.toString() === tgSeasonId);
    if (season?.name) {
      const parts = season.name.match(/\d+/g);
      if (parts && parts.length >= 2) {
        codeA = `${parts[0].slice(-2) || "XX"}${parts[1].slice(-2) || "XX"}`;
      } else if (parts && parts.length === 1 && parts[0].length === 4) {
        codeA = parts[0];
      }
    }
    let codeB = "XXX";
    const inst = instructors?.find(
      (i) => i.id?.toString() === courseData.instructorId?.toString(),
    );
    if (inst?.lastName)
      codeB = String(inst.lastName)
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 10);

    const codeC = courseData.dayOfWeek
      ? String(courseData.dayOfWeek).toUpperCase().slice(0, 3)
      : "XXX";
    const codeD = courseData.startTime
      ? String(courseData.startTime).split(":")[0]
      : "XX";

    return `${codeA}${codeB}${codeC}${codeD}`;
  };

  const handleBulkDeleteRequest = () => {
    const cancellabili: Course[] = [];
    const protetti: Course[] = [];

    Array.from(selectedCourseIds).forEach((id) => {
      const c = sourceCourses.find((x) => x.id === id);
      if (c) {
        if ((c.currentEnrollment || 0) > 0) protetti.push(c);
        else cancellabili.push(c);
      }
    });

    setDeleteInfo({ cancellabili, protetti });
    setDeleteConfirmStep(1);
  };

  const handleDuplicate = async () => {
    if (!targetSeasonId) {
      toast({
        title: "Errore",
        description: "Seleziona la stagione di destinazione.",
        variant: "destructive",
      });
      return;
    }
    if (selectedCourseIds.size === 0) {
      toast({
        title: "Errore",
        description: "Seleziona almeno un corso da duplicare.",
        variant: "destructive",
      });
      return;
    }

    // Validazione pre-invio
    for (const id of Array.from(selectedCourseIds)) {
      const overrides = courseOverrides[id] || {};
      const originalCourse = sourceCourses.find((c) => c.id === id);

      const effectiveStartDate =
        overrides.startDate ||
        (originalCourse?.startDate
          ? new Date(originalCourse.startDate).toISOString().split("T")[0]
          : null);
      const effectiveEndDate =
        overrides.endDate ||
        (originalCourse?.endDate
          ? new Date(originalCourse.endDate).toISOString().split("T")[0]
          : null);

      if (!effectiveStartDate || !effectiveEndDate) {
        toast({
          title: "Dati Mancanti",
          description: `Inserisci Data Inizio e Data Fine per il corso: ${originalCourse?.name}`,
          variant: "destructive",
        });
        return;
      }
      const selectedSeason = seasons?.find(
        (s: any) => s.id?.toString() === targetSeasonId,
      );
      if (selectedSeason?.startDate && selectedSeason?.endDate) {
        const minStr = new Date(selectedSeason.startDate)
          .toISOString()
          .split("T")[0];
        const maxStr = new Date(selectedSeason.endDate)
          .toISOString()
          .split("T")[0];
        if (
          effectiveStartDate < minStr ||
          effectiveStartDate > maxStr ||
          effectiveEndDate < minStr ||
          effectiveEndDate > maxStr
        ) {
          toast({
            title: "Date fuori stagione",
            description: `Hai sfasato le date per ${originalCourse?.name}. Devono rientrare tra ${new Date(minStr).toLocaleDateString()} e ${new Date(maxStr).toLocaleDateString()} per la stagione ${selectedSeason.name}!`,
            variant: "destructive",
            duration: 7000,
          });
          return;
        }
      }
      const duplicateCheck = targetCourses.find(
        (tc) =>
          tc.name === (overrides.name ?? originalCourse?.name) &&
          tc.dayOfWeek === originalCourse?.dayOfWeek &&
          tc.startTime === originalCourse?.startTime &&
          tc.studioId ===
            (overrides.studioId !== undefined
              ? overrides.studioId
              : originalCourse?.studioId),
      );
      if (duplicateCheck) {
        toast({
          title: "Attenzione: Corso già presente",
          description: `Stai duplicando lo stesso corso per errore. Il corso ${duplicateCheck.name} (${duplicateCheck.dayOfWeek} ${duplicateCheck.startTime}) esiste già nella stagione target.`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const promises = Array.from(selectedCourseIds)
        .map((id) => {
          const originalCourse = sourceCourses.find((c) => c.id === id);
          if (!originalCourse) return null;
          const overrides = courseOverrides[id] || {};

          const newCourse = {
            // CAMPI ESPLICITAMENTE COPIATI (Come da ref. AG-018)
            name: overrides.name ?? originalCourse.name, // Genere/Nome
            activityType: originalCourse.activityType || "course",
            categoryId: originalCourse.categoryId, // Genere (id di categoria)
            instructorId:
              overrides.instructorId !== undefined
                ? overrides.instructorId
                : originalCourse.instructorId, // Insegnante
            dayOfWeek: overrides.dayOfWeek ?? originalCourse.dayOfWeek, // Giorno
            startTime: overrides.startTime ?? originalCourse.startTime, // Orario Inizio
            endTime: overrides.endTime ?? originalCourse.endTime, // Orario Fine
            studioId:
              overrides.studioId !== undefined
                ? overrides.studioId
                : originalCourse.studioId, // Studio
            seasonId: parseInt(targetSeasonId), // Nuova Stagione
            startDate:
              overrides.startDate ||
              (originalCourse.startDate
                ? new Date(originalCourse.startDate).toISOString().split("T")[0]
                : undefined), // Data Inizio Obbligatoria (verificata)
            endDate:
              overrides.endDate ||
              (originalCourse.endDate
                ? new Date(originalCourse.endDate).toISOString().split("T")[0]
                : undefined), // Data Fine Obbligatoria (verificata)
            recurrenceType:
              overrides.recurrenceType ??
              originalCourse.recurrenceType ??
              "weekly", // <-- Mantiene la ricorrenza originale (o da override)

            // CAMPI PROIBITI O RE-INIZIALIZZATI VUOTI
            currentEnrollment: 0,
            statusTags: [],
            googleEventId: null,
            quoteId: null,
            sku: null as any,
            price: "0", // Il prezzo stringa se null spacca l'inseritore, usiamo stringa "0" nominalistica
            active: true,
            maxCapacity: originalCourse.maxCapacity, // E' una metrica fisica della sala, conviene trapiantarla
          };

          newCourse.sku = generateSKUForCourse(newCourse, targetSeasonId);

          // Nota: I pagamenti storici risiedono nella tabella 'payments' e
          // legati alle tessere/transazioni (members), non vengono duplicati inviando il corso.
          return createMutation.mutateAsync(newCourse);
        })
        .filter(Boolean);

      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/activities-unified-preview"],
      });

      const targetName =
        targetSeasons.find((s) => s.id.toString() === targetSeasonId)?.name ||
        "la nuova stagione";
      toast({
        title: "Operazione completata",
        description: `${selectedCourseIds.size} corsi duplicati con successo nella stagione ${targetName}.`,
      });
      handleOpenChange(false);
      setSelectedCourseIds(new Set());
      setCourseOverrides({});
    } catch (error: any) {
      toast({
        title: "Errore di duplicazione",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSingleDuplicate = async (id: number) => {
    if (!targetSeasonId) {
      toast({
        title: "Errore",
        description: "Seleziona la stagione di destinazione.",
        variant: "destructive",
      });
      return;
    }
    const overrides = courseOverrides[id] || {};
    const originalCourse = sourceCourses.find((c) => c.id === id);

    const effectiveStartDate =
      overrides.startDate ||
      (originalCourse?.startDate
        ? new Date(originalCourse.startDate).toISOString().split("T")[0]
        : null);
    const effectiveEndDate =
      overrides.endDate ||
      (originalCourse?.endDate
        ? new Date(originalCourse.endDate).toISOString().split("T")[0]
        : null);

    if (!effectiveStartDate || !effectiveEndDate) {
      toast({
        title: "Dati Mancanti",
        description: `Inserisci Data Inizio e Data Fine per il corso: ${originalCourse?.name}`,
        variant: "destructive",
      });
      return;
    }

    const selectedSeason = seasons?.find(
      (s: any) => s.id?.toString() === targetSeasonId,
    );
    if (selectedSeason?.startDate && selectedSeason?.endDate) {
      const minStr = new Date(selectedSeason.startDate)
        .toISOString()
        .split("T")[0];
      const maxStr = new Date(selectedSeason.endDate)
        .toISOString()
        .split("T")[0];
      if (
        effectiveStartDate < minStr ||
        effectiveStartDate > maxStr ||
        effectiveEndDate < minStr ||
        effectiveEndDate > maxStr
      ) {
        toast({
          title: "Date fuori stagione",
          description: `Hai sfasato le date. Devono rientrare tra ${new Date(minStr).toLocaleDateString()} e ${new Date(maxStr).toLocaleDateString()} per la stagione ${selectedSeason.name}!`,
          variant: "destructive",
          duration: 7000,
        });
        return;
      }
    }

    const duplicateCheck = targetCourses.find(
      (tc) =>
        tc.name === (overrides.name ?? originalCourse?.name) &&
        tc.dayOfWeek === originalCourse?.dayOfWeek &&
        tc.startTime === originalCourse?.startTime &&
        tc.studioId ===
          (overrides.studioId !== undefined
            ? overrides.studioId
            : originalCourse?.studioId),
    );
    if (duplicateCheck) {
      toast({
        title: "Attenzione: Corso già presente",
        description: `Il corso ${duplicateCheck.name} (${duplicateCheck.dayOfWeek} ${duplicateCheck.startTime}) esiste già nella stagione target.`,
        variant: "destructive",
      });
      return;
    }

    if (!originalCourse) return;

    const newCourse = {
      name: overrides.name ?? originalCourse.name,
      activityType: originalCourse.activityType || "course",
      categoryId: originalCourse.categoryId,
      instructorId:
        overrides.instructorId !== undefined
          ? overrides.instructorId
          : originalCourse.instructorId,
      dayOfWeek: overrides.dayOfWeek ?? originalCourse.dayOfWeek,
      startTime: overrides.startTime ?? originalCourse.startTime,
      endTime: overrides.endTime ?? originalCourse.endTime,
      studioId:
        overrides.studioId !== undefined
          ? overrides.studioId
          : originalCourse.studioId,
      seasonId: parseInt(targetSeasonId),
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
      recurrenceType:
        overrides.recurrenceType ?? originalCourse.recurrenceType ?? "weekly", // <-- Mantiene la ricorrenza originale (o da override)
      currentEnrollment: 0,
      statusTags: [],
      googleEventId: null,
      quoteId: null,
      sku: null as any,
      price: "0",
      active: true,
      maxCapacity: originalCourse.maxCapacity,
    };

    newCourse.sku = generateSKUForCourse(newCourse, targetSeasonId);

    try {
      await createMutation.mutateAsync(newCourse);
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/activities-unified-preview"],
      });
      toast({
        title: "Operazione completata",
        description: `Corso duplicato con successo.`,
      });

      // Remove from selection so it's not re-duplicated by accident
      const next = new Set(selectedCourseIds);
      next.delete(id);
      setSelectedCourseIds(next);

      // Update local targetCourses so immediate second clicks are caught
      setTargetCourses((prev) => [...prev, newCourse as any]);
    } catch (error: any) {
      toast({
        title: "Errore di duplicazione",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {triggerElement || (
            <Button
              variant="outline"
              className="h-10 gap-2 border-indigo-200 bg-indigo-50 font-medium text-indigo-700 transition-colors hover:bg-indigo-100/80"
            >
              <Copy className="size-4" />
              <span className="hidden sm:inline">Duplica Corsi</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-[1400px] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between gap-6 border-b pb-4 pe-4">
            <div className="w-[300px] shrink-0 sm:w-[380px]">
              <DialogTitle className="text-left text-lg">
                Duplicazione Massiva Corsi
              </DialogTitle>
              <DialogDescription className="mt-1 text-left text-xs leading-tight">
                Copia i corsi della stagione attualmente selezionata verso una
                nuova stagione.
              </DialogDescription>
            </div>
            <div className="flex flex-1 items-center justify-end gap-4">
              <div className="max-w-[600px] rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-left text-xxs leading-snug text-yellow-700 sm:text-xs">
                <strong className="mr-1">Sicurezza:</strong> I corsi selezionati
                verranno clonati vergini (no pagamenti/iscritti). La logica
                oraria originale verrà mantenuta, con nuove date inizio/fine
                limitate alla stagione considerata.
              </div>
              <Button
                onClick={handleBulkDeleteRequest}
                variant="outline"
                className="h-11 min-w-[150px] border-red-500 text-red-600 hover:bg-red-50 dark:bg-red-950/20"
                disabled={selectedCourseIds.size === 0}
              >
                Elimina Selezione
              </Button>
              <Button
                onClick={handleDuplicate}
                className="h-11 min-w-[180px] whitespace-nowrap bg-indigo-600 text-white hover:bg-indigo-700"
                disabled={
                  createMutation.isPending || selectedCourseIds.size === 0
                }
              >
                {createMutation.isPending
                  ? "Elaborazione..."
                  : `Duplica Selezione (${selectedCourseIds.size})`}
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted p-4">
              <div className="w-[250px] space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Stagione Origine
                </Label>
                <Select
                  value={effectiveSourceSeasonId}
                  onValueChange={setTableSourceSeasonId}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleziona la stagione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {getSeasonLabel(s, seasons)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[250px] space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Stagione Destinazione
                </Label>
                <Select
                  value={targetSeasonId}
                  onValueChange={setTargetSeasonId}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleziona la stagione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {targetSeasons.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {getSeasonLabel(s, seasons)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[150px] flex-1 space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Cerca (Es: LUN)
                </Label>
                <Input
                  placeholder="Filtra corsi..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="min-w-[130px] space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Data Inizio globale
                </Label>
                <Input
                  type="date"
                  value={globalStartDate}
                  onChange={(e) => {
                    setGlobalStartDate(e.target.value);
                    setUserModifiedStartDate(true);
                  }}
                  className="bg-background"
                />
              </div>
              <div className="min-w-[130px] space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Data Fine globale
                </Label>
                <Input
                  type="date"
                  value={globalEndDate}
                  onChange={(e) => setGlobalEndDate(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5 self-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleApplyGlobalDates}
                >
                  Applica a tutti
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-background">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={
                          selectedCourseIds.size === 0
                            ? false
                            : selectedCourseIds.size ===
                                  filteredSourceCourses.length &&
                                filteredSourceCourses.length > 0
                              ? true
                              : "indeterminate"
                        }
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>
                      Corso Orig.{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Vis. SKU)
                      </span>
                    </TableHead>
                    <TableHead>
                      Nome{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        & Ricor.
                      </span>
                    </TableHead>
                    <TableHead>
                      Pianificazione{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Giorno/Ora)
                      </span>
                    </TableHead>
                    <TableHead>
                      Risorse{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Sala/Staff)
                      </span>
                    </TableHead>
                    <TableHead>Date Stagione *</TableHead>
                    <TableHead className="w-12 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSourceCourses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Nessun corso presente nella stagione corrente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSourceCourses.map((course) => {
                      const isSelected = selectedCourseIds.has(course.id);
                      return (
                        <TableRow
                          key={course.id}
                          className={isSelected ? "bg-indigo-50/30" : ""}
                        >
                          <TableCell className="pt-4 text-center align-top">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleCourse(course.id)}
                            />
                          </TableCell>
                          <TableCell className="pt-4 align-top">
                            <div
                              className="line-clamp-1 truncate font-semibold text-foreground"
                              title={course.name}
                            >
                              {course.name}
                            </div>
                            {(() => {
                              const instructor = instructors?.find(
                                (i) => i.id === course.instructorId,
                              );
                              if (instructor) {
                                return (
                                  <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                    {instructor.lastName} {instructor.firstName}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            <div className="mt-1 inline-block w-fit rounded bg-slate-100 p-0.5 px-1.5 font-mono text-xxs text-muted-foreground dark:bg-slate-800">
                              {course.sku || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="pt-3 align-top">
                            <div className="min-w-[120px] space-y-1.5">
                              <Input
                                disabled={!isSelected}
                                placeholder={course.name}
                                value={courseOverrides[course.id]?.name || ""}
                                onChange={(e) =>
                                  updateOverride(
                                    course.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="h-7 bg-background text-xs"
                              />
                              <Select
                                disabled={!isSelected}
                                value={
                                  courseOverrides[course.id]?.recurrenceType ||
                                  course.recurrenceType ||
                                  "weekly"
                                }
                                onValueChange={(val) =>
                                  updateOverride(
                                    course.id,
                                    "recurrenceType",
                                    val,
                                  )
                                }
                              >
                                <SelectTrigger className="h-7 bg-background text-xxs text-muted-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="weekly">
                                    Settimanale
                                  </SelectItem>
                                  <SelectItem value="bimonthly">
                                    Bi-mensile
                                  </SelectItem>
                                  <SelectItem value="monthly">
                                    Mensile
                                  </SelectItem>
                                  <SelectItem value="single">
                                    Singolo Evento
                                  </SelectItem>
                                  <SelectItem value="daily">
                                    Tutti i giorni
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="pt-3 align-top">
                            <div className="min-w-[140px] space-y-1.5">
                              <Select
                                disabled={!isSelected}
                                value={
                                  courseOverrides[course.id]?.dayOfWeek ||
                                  course.dayOfWeek ||
                                  "none"
                                }
                                onValueChange={(val) =>
                                  updateOverride(course.id, "dayOfWeek", val)
                                }
                              >
                                <SelectTrigger className="h-7 bg-background text-xxs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LUN">Lunedì</SelectItem>
                                  <SelectItem value="MAR">Martedì</SelectItem>
                                  <SelectItem value="MER">Mercoledì</SelectItem>
                                  <SelectItem value="GIO">Giovedì</SelectItem>
                                  <SelectItem value="VEN">Venerdì</SelectItem>
                                  <SelectItem value="SAB">Sabato</SelectItem>
                                  <SelectItem value="DOM">Domenica</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex gap-1">
                                <Input
                                  disabled={!isSelected}
                                  type="time"
                                  className="h-7 w-[65px] bg-background px-1 text-xxs"
                                  value={
                                    courseOverrides[course.id]?.startTime ||
                                    course.startTime ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateOverride(
                                      course.id,
                                      "startTime",
                                      e.target.value,
                                    )
                                  }
                                />
                                <Input
                                  disabled={!isSelected}
                                  type="time"
                                  className="h-7 w-[65px] bg-background px-1 text-xxs"
                                  value={
                                    courseOverrides[course.id]?.endTime ||
                                    course.endTime ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateOverride(
                                      course.id,
                                      "endTime",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="pt-3 align-top">
                            <div className="min-w-[130px] space-y-1.5">
                              <Select
                                disabled={!isSelected}
                                value={
                                  courseOverrides[
                                    course.id
                                  ]?.studioId?.toString() ||
                                  course.studioId?.toString() ||
                                  "none"
                                }
                                onValueChange={(val) =>
                                  updateOverride(
                                    course.id,
                                    "studioId",
                                    val === "none" ? null : parseInt(val),
                                  )
                                }
                              >
                                <SelectTrigger className="h-7 bg-background text-xxs">
                                  <SelectValue placeholder="Sala" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value="none"
                                    className="italic text-muted-foreground"
                                  >
                                    Nessuna sala
                                  </SelectItem>
                                  {studios?.map((s: any) => (
                                    <SelectItem
                                      key={s.id}
                                      value={s.id.toString()}
                                    >
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                disabled={!isSelected}
                                value={
                                  courseOverrides[
                                    course.id
                                  ]?.instructorId?.toString() ||
                                  course.instructorId?.toString() ||
                                  "none"
                                }
                                onValueChange={(val) =>
                                  updateOverride(
                                    course.id,
                                    "instructorId",
                                    val === "none" ? null : parseInt(val),
                                  )
                                }
                              >
                                <SelectTrigger className="h-7 bg-background text-xxs">
                                  <SelectValue placeholder="Insegnante" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem
                                    value="none"
                                    className="italic text-muted-foreground"
                                  >
                                    Nessun ins.
                                  </SelectItem>
                                  {instructors?.map((i: any) => (
                                    <SelectItem
                                      key={i.id}
                                      value={i.id.toString()}
                                    >
                                      {i.lastName} {i.firstName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="pt-3 align-top">
                            <div className="min-w-[120px] space-y-1.5">
                              <Input
                                type="date"
                                disabled={!isSelected}
                                className={`h-7 px-2 text-xxs ${isSelected && !(courseOverrides[course.id]?.startDate || course.startDate) ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "bg-background"}`}
                                value={
                                  courseOverrides[course.id]?.startDate ||
                                  (course.startDate
                                    ? new Date(course.startDate)
                                        .toISOString()
                                        .split("T")[0]
                                    : "")
                                }
                                onChange={(e) =>
                                  updateOverride(
                                    course.id,
                                    "startDate",
                                    e.target.value,
                                  )
                                }
                              />
                              <Input
                                type="date"
                                disabled={!isSelected}
                                className={`h-7 px-2 text-xxs ${isSelected && !(courseOverrides[course.id]?.endDate || course.endDate) ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "bg-background"}`}
                                value={
                                  courseOverrides[course.id]?.endDate ||
                                  (course.endDate
                                    ? new Date(course.endDate)
                                        .toISOString()
                                        .split("T")[0]
                                    : "")
                                }
                                onChange={(e) =>
                                  updateOverride(
                                    course.id,
                                    "endDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-middle">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800"
                              onClick={() => handleSingleDuplicate(course.id)}
                              title="Duplica solo questo corso"
                              disabled={createMutation.isPending}
                            >
                              <Save className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmStep > 0}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmStep(0);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminazione Massiva</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {deleteConfirmStep === 1 && (
              <div className="space-y-4">
                <p>
                  Sei sicuro di voler eliminare{" "}
                  <strong>{deleteInfo.cancellabili.length}</strong> corsi?
                </p>
                {deleteInfo.protetti.length > 0 && (
                  <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    ⚠️ <strong>{deleteInfo.protetti.length} corsi</strong> hanno
                    iscritti e NON verranno eliminati:
                    <div className="mt-1 text-xs">
                      {deleteInfo.protetti.map((c) => c.name).join(", ")}
                    </div>
                  </div>
                )}
                <p className="text-sm font-semibold text-red-600">
                  Questa operazione è IRREVERSIBILE.
                </p>
              </div>
            )}
            {deleteConfirmStep === 2 && (
              <div className="space-y-4">
                <p className="font-semibold text-red-600">ULTIMA CONFERMA</p>
                <p>
                  Elimino definitivamente{" "}
                  <strong>{deleteInfo.cancellabili.length}</strong> corsi senza
                  iscritti.
                </p>
                <div className="space-y-2">
                  <Label>Scrivi ELIMINA per confermare</Label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="ELIMINA"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmStep(0)}>
              Annulla
            </Button>
            {deleteConfirmStep === 1 && (
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  if (deleteInfo.cancellabili.length === 0) {
                    toast({
                      title: "Nessun corso cancellabile",
                      variant: "destructive",
                    });
                    setDeleteConfirmStep(0);
                    return;
                  }
                  setDeleteConfirmText("");
                  setDeleteConfirmStep(2);
                }}
              >
                CONFERMA
              </Button>
            )}
            {deleteConfirmStep === 2 && (
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deleteConfirmText !== "ELIMINA"}
                onClick={async () => {
                  try {
                    for (const course of deleteInfo.cancellabili) {
                      await apiRequest("DELETE", `/api/courses/${course.id}`);
                    }
                    queryClient.invalidateQueries({
                      queryKey: ["/api/courses"],
                      exact: false,
                    });
                    toast({
                      title: `${deleteInfo.cancellabili.length} corsi eliminati`,
                    });
                    setSelectedCourseIds(new Set());
                    setDeleteConfirmStep(0);
                  } catch (error: any) {
                    toast({
                      title: "Errore durante l'eliminazione",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
              >
                Sì, elimina definitivamente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
