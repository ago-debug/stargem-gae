import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EnrollmentDetail } from "@shared/schema";

function getDetailStyle(color: string | null | undefined): React.CSSProperties {
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

export function EnrollmentDetailBadge({ name, color, className = "" }: { name: string; color?: string | null; className?: string }) {
  if (color) {
    return (
      <Badge
        variant="outline"
        className={`text-xs border ${className}`}
        style={getDetailStyle(color)}
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

interface MultiSelectEnrollmentDetailsProps {
  selectedDetails: string[];
  onChange: (details: string[]) => void;
  testIdPrefix?: string;
}

export function MultiSelectEnrollmentDetails({ selectedDetails, onChange, testIdPrefix = "enrollment-detail" }: MultiSelectEnrollmentDetailsProps) {
  const [, setLocation] = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: details } = useQuery<EnrollmentDetail[]>({
    queryKey: ["/api/enrollment-details"],
  });

  const queryClient = useQueryClient();
  const addDetailMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string, color: string }) => {
      await apiRequest("POST", "/api/enrollment-details", { name, color, active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-details"] });
    }
  });

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#9ca3af");

  const toggleDetail = (detailName: string) => {
    if (selectedDetails.includes(detailName)) {
      onChange(selectedDetails.filter(d => d !== detailName));
    } else {
      onChange([...selectedDetails, detailName]);
    }
  };

  const filteredDetails = details?.filter(d => d.active)?.filter(d =>
    !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDetailColor = (detailName: string): string | null => {
    if (!details) return null;
    const found = details.find(d => d.name === detailName);
    return found?.color || null;
  };

  return (
    <div className="space-y-1">
      {testIdPrefix !== "inline" && (
        <div className="flex items-center gap-2">
          <Label>Dettaglio Iscrizione</Label>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50">
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-white border shadow-md z-[60]" side="right">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-yellow-700">Nuovo Dettaglio Iscrizione</h4>
                <div className="flex gap-2">
                  <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome voce..." className="h-8 text-sm" />
                  <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-8 h-8 p-0 cursor-pointer border rounded flex-shrink-0" />
                </div>
                <Button size="sm" className="w-full h-8 gold-3d-button" onClick={() => {
                  const trimmed = newName.trim();
                  if (!trimmed) return;
                  if (details?.some(d => d.name.toLowerCase() === trimmed.toLowerCase())) {
                    alert("Questa voce esiste già!");
                    return;
                  }
                  addDetailMutation.mutate({ name: trimmed, color: newColor });
                  setPopoverOpen(false);
                  setNewName("");
                }} disabled={addDetailMutation.isPending}>Aggiungi</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="relative">
        <div
          className="min-h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm cursor-pointer flex items-center flex-wrap gap-1"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          data-testid={`select-${testIdPrefix}-trigger`}
        >
          {selectedDetails.length === 0 ? (
            <span className="text-muted-foreground">Seleziona dettaglio...</span>
          ) : (
            selectedDetails.map((detailName) => {
              const color = getDetailColor(detailName);
              return (
                <EnrollmentDetailBadge
                  key={detailName}
                  name={detailName}
                  color={color}
                  className="flex items-center gap-1"
                />
              );
            })
          )}
        </div>

        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
            <div className="p-2 border-b border-input">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  placeholder="Cerca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-xs pl-7"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`input-${testIdPrefix}-search`}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              <div
                className="px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate text-muted-foreground italic"
                onClick={() => {
                  onChange([]);
                  setIsDropdownOpen(false);
                }}
                data-testid={`option-${testIdPrefix}-empty`}
              >
                (Nessun dettaglio)
              </div>
              {filteredDetails?.map((detail) => {
                const isSelected = selectedDetails.includes(detail.name);
                return (
                  <div
                    key={detail.id}
                    className={`px-3 py-1.5 text-sm cursor-pointer rounded hover-elevate flex items-center justify-between gap-2 ${isSelected ? "bg-accent/50 font-medium" : ""}`}
                    onClick={() => toggleDetail(detail.name)}
                    data-testid={`option-${testIdPrefix}-${detail.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {detail.color && (
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0 border border-black/10"
                          style={{ backgroundColor: detail.color }}
                        />
                      )}
                      <span>{detail.name}</span>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-muted-foreground">
                        #{selectedDetails.indexOf(detail.name) + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setIsDropdownOpen(false); setSearchQuery(""); }}
        />
      )}
    </div>
  );
}
