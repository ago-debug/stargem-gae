import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CityResult {
  id: number;
  name: string;
  provinceId: number | null;
  postalCode: string | null;
  province?: {
    id: number;
    code: string;
    name: string;
    region: string | null;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCitySelect?: (city: CityResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  onCitySelect,
  placeholder = "Cerca città (min 3 caratteri)...",
  disabled = false,
  className = "",
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [cities, setCities] = useState<CityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (search.length < 3) {
      setCities([]);
      setOpen(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await apiRequest("GET", `/api/locations/cities/search?q=${encodeURIComponent(search)}&limit=15`);
        setCities(data);
        setOpen(data.length > 0);
      } catch (error) {
        console.error("Error searching cities:", error);
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    onChange(newValue);
  };

  const handleCitySelect = (city: CityResult) => {
    setSearch(city.name);
    onChange(city.name);
    setOpen(false);
    if (onCitySelect) {
      onCitySelect(city);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={`relative ${className}`}>
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={search}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pl-10 pr-10"
            data-testid="input-city-search"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {cities.length === 0 && !isLoading && (
              <CommandEmpty>Nessuna città trovata</CommandEmpty>
            )}
            {cities.length > 0 && (
              <CommandGroup>
                {cities.map((city) => (
                  <CommandItem
                    key={city.id}
                    value={city.name}
                    onSelect={() => handleCitySelect(city)}
                    className="cursor-pointer"
                    data-testid={`city-option-${city.id}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{city.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {city.province ? `${city.province.name} (${city.province.code})` : ""}
                        {city.postalCode ? ` - CAP: ${city.postalCode}` : ""}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
