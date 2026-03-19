import React, { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { ParticipantType } from "@shared/schema";

interface MultiSelectParticipantTypeProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

function isLightColor(hex: string): boolean {
    if (!hex) return true;
    const c = hex.replace("#", "");
    if (c.length !== 6) return true;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
}

function getColorStyle(color: string | null | undefined): React.CSSProperties {
    if (!color) return { backgroundColor: '#dbeafe', color: '#1e40af' }; // blue-100/blue-800 default
    return {
        backgroundColor: color,
        borderColor: color,
        color: isLightColor(color) ? "#000" : "#fff",
    };
}

export function MultiSelectParticipantType({ value, onChange, className }: MultiSelectParticipantTypeProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: dbTypes = [] } = useQuery<ParticipantType[]>({
        queryKey: ["/api/client-categories"],
    });

    // Convert comma-separated string to array
    const selectedValues = value ? value.split(",").map(v => v.trim()).filter(Boolean) : [];

    const handleSelect = (selectedValue: string) => {
        let newSelected;
        if (selectedValues.includes(selectedValue)) {
            newSelected = selectedValues.filter((v) => v !== selectedValue);
        } else {
            newSelected = [...selectedValues, selectedValue];
        }
        onChange(newSelected.join(", "));
    };

    const handleRemove = (valueToRemove: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = selectedValues.filter((v) => v !== valueToRemove);
        onChange(newSelected.join(", "));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-auto min-h-10 px-3 py-2 bg-white",
                        selectedValues.length === 0 && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1 items-center overflow-x-hidden">
                        {selectedValues.length === 0 ? (
                            <span className="truncate">Seleziona...</span>
                        ) : (
                            selectedValues.map((val) => {
                                // Precedenza al database o fallback stringa
                                const dbMatch = dbTypes.find(p => p.name.toLowerCase() === val.toLowerCase());
                                const label = dbMatch?.name || val;
                                const style = getColorStyle(dbMatch?.color);

                                return (
                                    <Badge
                                        key={val}
                                        variant="secondary"
                                        className="mr-1 mb-1 font-normal border text-xs flex items-center gap-1 shadow-sm"
                                        style={style}
                                    >
                                        {label}
                                        <X
                                            className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                                            onClick={(e) => handleRemove(val, e)}
                                        />
                                    </Badge>
                                );
                            })
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Cerca tipo..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList className="max-h-60 overflow-y-auto w-[var(--radix-popover-trigger-width)]">
                        <CommandEmpty>Nessun risultato.</CommandEmpty>
                        <CommandGroup>
                            {dbTypes.filter(pt => pt.name.toLowerCase().includes(searchQuery.toLowerCase())).map((type) => (
                                <CommandItem
                                    key={type.id}
                                    value={type.name}
                                    onSelect={(currentValue) => {
                                        handleSelect(type.name);
                                    }}
                                    className="cursor-pointer flex items-center gap-2"
                                >
                                    <div className="flex items-center flex-1">
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedValues.some(v => v.toLowerCase() === type.name.toLowerCase()) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div
                                            className="w-3 h-3 rounded-full mr-2 shadow-sm border border-black/10"
                                            style={{ backgroundColor: type.color || '#ccc' }}
                                        />
                                        {type.name}
                                    </div>
                                </CommandItem>
                            ))}

                            {/* Opzione personalizzata se il testo non esiste nel db e si sta cercando */}
                            {searchQuery && !dbTypes.some(pt => pt.name.toLowerCase() === searchQuery.toLowerCase()) && (
                                <CommandItem
                                    value={searchQuery}
                                    onSelect={(currentValue) => {
                                        handleSelect(searchQuery);
                                        setSearchQuery("");
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer text-muted-foreground italic"
                                >
                                    <Check className="mr-2 h-4 w-4 opacity-0" />
                                    + Aggiungi "{searchQuery}"
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
