import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Course, Instructor, Category, Studio } from "@shared/schema";

const DAYS = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
];

const DAY_MAP: Record<string, number> = {
    "DOM": 0, "LUN": 1, "MAR": 2, "MER": 3, "GIO": 4, "VEN": 5, "SAB": 6
};

const getDayLabel = (day: string | null | undefined) => {
    if (!day) return "";
    const cleanDay = day.toUpperCase().trim();
    if (DAY_MAP[cleanDay] !== undefined) return DAYS[DAY_MAP[cleanDay]];
    // If it's already a number in string form
    const idx = parseInt(cleanDay);
    if (!isNaN(idx) && DAYS[idx]) return DAYS[idx];
    return day;
};

interface CourseSelectorProps {
    courses: Course[];
    instructors: Instructor[];
    categories: Category[];
    studios: Studio[];
    onSelect: (courseId: string) => void;
    selectedCourseId?: string;
    excludeCourseIds?: number[];
    disabled?: boolean;
}

export function CourseSelector({
    courses,
    instructors,
    categories,
    studios,
    onSelect,
    selectedCourseId,
    excludeCourseIds = [],
    disabled = false,
}: CourseSelectorProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filters
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterDay, setFilterDay] = useState<string>("all");
    const [filterInstructor, setFilterInstructor] = useState<string>("all");
    const [filterStudio, setFilterStudio] = useState<string>("all");

    const [expandedFilters, setExpandedFilters] = useState(false);

    // Mappers
    const getInstructorName = (id: number | null) => {
        if (!id) return "";
        const instructor = instructors.find((i) => i.id === id);
        return instructor ? `${instructor.firstName} ${instructor.lastName}` : "";
    };

    const getCategoryName = (id: number | null) => {
        if (!id) return "";
        return categories.find((c) => c.id === id)?.name || "";
    };

    const getStudioName = (id: number | null) => {
        if (!id) return "";
        return studios.find((s) => s.id === id)?.name || "";
    };

    const filteredCourses = useMemo(() => {
        return courses
            .filter((course) => {
                // Exclude already enrolled
                if (excludeCourseIds.includes(course.id)) return false;
                // Only active
                if (!course.active) return false;

                // Search Query (Name, SKU, Instructor)
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const matchesName = course.name.toLowerCase().includes(query);
                    const matchesSku = course.sku?.toLowerCase().includes(query) || false;
                    const instructorName = getInstructorName(course.instructorId).toLowerCase();
                    const matchesInstructor = instructorName.includes(query);

                    if (!matchesName && !matchesSku && !matchesInstructor) return false;
                }

                // Filter Category
                if (filterCategory !== "all" && course.categoryId?.toString() !== filterCategory) {
                    return false;
                }

                // Filter Day
                if (filterDay !== "all" && course.dayOfWeek?.toString() !== filterDay) {
                    return false;
                }

                // Filter Instructor
                if (filterInstructor !== "all" && course.instructorId?.toString() !== filterInstructor) {
                    return false;
                }

                // Filter Studio
                if (filterStudio !== "all" && course.studioId?.toString() !== filterStudio) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [
        courses,
        searchQuery,
        filterCategory,
        filterDay,
        filterInstructor,
        filterStudio,
        excludeCourseIds,
        instructors, // dep for getInstructorName inside effect? No, handled by helper but instructors array changes
    ]);

    const selectedCourse = courses.find((c) => c.id.toString() === selectedCourseId);

    const resetFilters = () => {
        setSearchQuery("");
        setFilterCategory("all");
        setFilterDay("all");
        setFilterInstructor("all");
        setFilterStudio("all");
    };

    const activeFiltersCount = [
        filterCategory !== "all",
        filterDay !== "all",
        filterInstructor !== "all",
        filterStudio !== "all",
    ].filter(Boolean).length;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between min-w-[300px]"
                    disabled={disabled}
                >
                    {selectedCourse ? (
                        <span className="truncate">
                            {selectedCourse.name}
                            <span className="text-muted-foreground ml-2">
                                ({getDayLabel(selectedCourse.dayOfWeek).substring(0, 3)} {selectedCourse.startTime})
                            </span>
                        </span>
                    ) : (
                        "Seleziona corso da aggiungere..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] p-0" align="start">
                <div className="p-4 space-y-4">
                    {/* Search Bar */}
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Cerca per nome, codice o insegnante..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            variant={expandedFilters || activeFiltersCount > 0 ? "secondary" : "outline"}
                            size="icon"
                            onClick={() => setExpandedFilters(!expandedFilters)}
                            title="Filtri avanzati"
                        >
                            <Filter className="w-4 h-4" />
                            {activeFiltersCount > 0 && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full translate-x-1/4 -translate-y-1/4" />
                            )}
                        </Button>
                    </div>

                    {/* Filters Section */}
                    {(expandedFilters || activeFiltersCount > 0) && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Categoria</label>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Tutte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tutte</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">Giorno</label>
                                <Select value={filterDay} onValueChange={setFilterDay}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Tutti" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tutti</SelectItem>
                                        {DAYS.map((day, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                                {day}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">Insegnante</label>
                                <Select value={filterInstructor} onValueChange={setFilterInstructor}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Tutti" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tutti</SelectItem>
                                        {instructors.map((i) => (
                                            <SelectItem key={i.id} value={i.id.toString()}>
                                                {i.firstName} {i.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium">Sala/Studio</label>
                                <Select value={filterStudio} onValueChange={setFilterStudio}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Tutti" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tutte</SelectItem>
                                        {studios.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {(activeFiltersCount > 0 || searchQuery) && (
                                <div className="col-span-2 flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetFilters}
                                        className="h-6 text-xs text-muted-foreground"
                                    >
                                        <X className="w-3 h-3 mr-1" /> Azzera filtri
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results List */}
                    <div className="border rounded-md">
                        <ScrollArea className="h-[300px]">
                            {filteredCourses.length > 0 ? (
                                <div className="p-1">
                                    {filteredCourses.map((course) => (
                                        <div
                                            key={course.id}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                                                selectedCourseId === course.id.toString() && "bg-accent"
                                            )}
                                            onClick={() => {
                                                onSelect(course.id.toString());
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium truncate">{course.name}</span>
                                                    {course.sku && (
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1 py-0">{course.sku}</Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                                    <span className="flex items-center">
                                                        {getDayLabel(course.dayOfWeek) || "N/D"} • {course.startTime} - {course.endTime}
                                                    </span>
                                                    {course.instructorId && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 self-center" />
                                                            <span>{getInstructorName(course.instructorId)}</span>
                                                        </>
                                                    )}
                                                    {course.studioId && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 self-center" />
                                                            <span>{getStudioName(course.studioId)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedCourseId === course.id.toString() && (
                                                <Check className="w-4 h-4 text-primary ml-2 flex-shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                                    <span className="mb-1">Nessun corso trovato</span>
                                    <span className="text-xs opacity-70">Prova a modificare i filtri ricerca</span>
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <div className="text-xs text-muted-foreground text-right px-1">
                        {filteredCourses.length} risultati trovati
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
