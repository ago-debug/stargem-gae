import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_OPTIONS = [
  { id: 1, name: "APERTO", color: "#22c55e", sortOrder: 1, active: true },
  { id: 2, name: "CHIUDERE", color: "#f97316", sortOrder: 2, active: true },
  { id: 3, name: "COMPLETO", color: "#ef4444", sortOrder: 3, active: true }
];

const COLOR_OPTIONS = [
  { value: "", label: "Nessun colore" },
  { value: "#ef4444", label: "Rosso" },
  { value: "#f97316", label: "Arancione" },
  { value: "#eab308", label: "Giallo" },
  { value: "#fbbf24", label: "Ambra" },
  { value: "#84cc16", label: "Lime" },
  { value: "#22c55e", label: "Verde chiaro" },
  { value: "#16a34a", label: "Verde" },
  { value: "#4ade80", label: "Verde menta" },
  { value: "#3b82f6", label: "Blu" },
  { value: "#8b5cf6", label: "Viola" },
  { value: "#ec4899", label: "Rosa" },
  { value: "#9ca3af", label: "Grigio" },
  { value: "#1a1a1a", label: "Nero" },
];

function getStatusStyle(color: string | null | undefined): React.CSSProperties {
  if (!color) return {};
  return {
    backgroundColor: color,
    borderColor: color,
    color: isLightColor(color) ? "#000" : "#fff",
  };
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export function getStatusColor(statusName: string, statuses: any[] | undefined): string | null {
  if (!statuses) return null;
  const found = statuses.find(s => s.name === statusName);
  return found?.color || null;
}

export function StatusBadge({ name, color, className = "" }: { name: string; color?: string | null; className?: string }) {
  if (color) {
    return (
      <Badge
        variant="outline"
        className={`text-xs border ${className}`}
        style={getStatusStyle(color)}
      >
        {name}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`status-badge-gold text-xs ${className}`}>
      {name}
    </Badge>
  );
}

interface MultiSelectStatusProps {
  selectedStatuses: string[];
  onChange: (statuses: string[]) => void;
  testIdPrefix?: string;
}

export function MultiSelectStatus({ selectedStatuses, onChange, testIdPrefix = "status" }: MultiSelectStatusProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const { data: customList } = useQuery<any>({
    queryKey: ["/api/custom-lists/stato_corso"],
  });

  const statuses = customList?.items?.length > 0
    ? customList.items.map((i: any) => ({ id: i.id, name: i.value, color: i.color, sortOrder: i.sortOrder, active: i.active }))
    : STATUS_OPTIONS;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleStatus = (statusName: string) => {
    if (selectedStatuses.includes(statusName)) {
      onChange(selectedStatuses.filter((s) => s !== statusName));
    } else {
      onChange([...selectedStatuses, statusName]);
    }
  };

  const removeStatus = (statusName: string) => {
    onChange(selectedStatuses.filter((s) => s !== statusName));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Stato</Label>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-5 w-5"
          onClick={() => setLocation('/elenchi?tab=status')}
          data-testid={`button-${testIdPrefix}-edit-statuses`}
        >
          <Edit className="w-3 h-3 sidebar-icon-gold" />
        </Button>
      </div>

      <div className="relative" ref={containerRef}>
        <div
          className="min-h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm cursor-pointer flex items-center flex-wrap gap-1"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          data-testid={`select-${testIdPrefix}-trigger`}
        >
          {selectedStatuses.length === 0 ? (
            <span className="text-muted-foreground">Seleziona stato...</span>
          ) : (
            selectedStatuses.map((statusName) => {
              const color = getStatusColor(statusName, statuses);
              return (
                <StatusBadge
                  key={statusName}
                  name={statusName}
                  color={color}
                  className="flex items-center gap-1"
                />
              );
            })
          )}
          {selectedStatuses.length > 0 && (
            <div className="flex items-center ml-auto">
              {selectedStatuses.map((statusName) => (
                <button
                  key={statusName}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStatus(statusName);
                  }}
                  className="ml-0.5 hover:text-destructive hidden"
                  data-testid={`button-${testIdPrefix}-remove-${statusName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
            <div className="max-h-48 overflow-y-auto p-1">
              <div
                className="px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate text-muted-foreground italic"
                onClick={() => {
                  onChange([]);
                  setIsDropdownOpen(false);
                }}
                data-testid={`option-${testIdPrefix}-empty`}
              >
                (Nessuno stato)
              </div>
              {[...(statuses?.filter((s: any) => s.active) || [])]
                .sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { numeric: true }))
                .map((status: any) => {
                  const isSelected = selectedStatuses.includes(status.name);
                  return (
                    <div
                      key={status.id}
                      className={`px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate flex items-center justify-between gap-2 ${isSelected ? "bg-accent/50 font-medium" : ""}`}
                      onClick={() => toggleStatus(status.name)}
                      data-testid={`option-${testIdPrefix}-${status.id}`}
                    >
                      <div className="flex items-center gap-2">
                        {status.color && (
                          <span
                            className="w-3 h-3 rounded-sm flex-shrink-0 border border-black/10"
                            style={{ backgroundColor: status.color }}
                          />
                        )}
                        <span>{status.name}</span>
                      </div>
                      {isSelected && (
                        <span className="text-xs text-muted-foreground">
                          #{selectedStatuses.indexOf(status.name) + 1}
                        </span>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
