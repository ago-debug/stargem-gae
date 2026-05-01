import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, X, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: number;
  name: string;
  description?: string | null;
}

interface SearchableSelectProps {
  options: Option[];
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  minSearchLength?: number;
  isLoading?: boolean;
  allowCreate?: boolean;
  onCreateNew?: (name: string) => void;
  className?: string;
  "data-testid"?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Cerca...",
  minSearchLength = 3,
  isLoading = false,
  allowCreate = false,
  onCreateNew,
  className,
  "data-testid": dataTestId,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const filteredOptions = searchText.length >= minSearchLength
    ? options.filter((opt) =>
        opt.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : [];

  const showResults = isOpen && searchText.length >= minSearchLength;
  const showMinCharsMessage = isOpen && searchText.length > 0 && searchText.length < minSearchLength;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setSearchText("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchText("");
  };

  const handleCreateNew = () => {
    if (onCreateNew && searchText.length >= minSearchLength) {
      onCreateNew(searchText);
      setSearchText("");
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {selectedOption ? (
        <div
          className="flex items-center justify-between h-9 px-3 py-1 border rounded-md bg-background cursor-pointer hover-elevate"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          data-testid={dataTestId}
        >
          <span className="text-sm truncate">{selectedOption.name}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={handleClear}
              data-testid={`${dataTestId}-clear`}
            >
              <X className="h-3 w-3" />
            </Button>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      ) : (
        <div className="relative">
          <Input
            ref={inputRef}
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pr-8"
            data-testid={dataTestId}
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {selectedOption && (
            <div className="p-2 border-b">
              <Input
                ref={inputRef}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={`Cerca (min ${minSearchLength} caratteri)...`}
                className="h-8"
                autoFocus
                data-testid={`${dataTestId}-search`}
              />
            </div>
          )}

          {isLoading && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Caricamento...
            </div>
          )}

          {showMinCharsMessage && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Inserisci almeno {minSearchLength} caratteri per cercare
            </div>
          )}

          {showResults && filteredOptions.length === 0 && !isLoading && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              {allowCreate && searchText.length >= minSearchLength ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleCreateNew}
                  data-testid={`${dataTestId}-create`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crea "{searchText}"
                </Button>
              ) : (
                "Nessun risultato trovato"
              )}
            </div>
          )}

          {showResults && filteredOptions.length > 0 && (
            <ul className="py-1">
              {filteredOptions.map((option) => (
                <li
                  key={option.id}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer hover-elevate flex items-center justify-between",
                    option.id === value && "bg-accent"
                  )}
                  onClick={() => handleSelect(option)}
                  data-testid={`${dataTestId}-option-${option.id}`}
                >
                  <div>
                    <div className="font-medium">{option.name}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    )}
                  </div>
                  {option.id === value && <Check className="h-4 w-4 text-primary" />}
                </li>
              ))}
              {allowCreate && searchText.length >= minSearchLength && (
                <li
                  className="px-3 py-2 text-sm cursor-pointer hover-elevate border-t"
                  onClick={handleCreateNew}
                  data-testid={`${dataTestId}-create`}
                >
                  <div className="flex items-center text-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Crea "{searchText}"
                  </div>
                </li>
              )}
            </ul>
          )}

          {!showResults && !showMinCharsMessage && !isLoading && !selectedOption && (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Inserisci almeno {minSearchLength} caratteri per cercare
            </div>
          )}
        </div>
      )}
    </div>
  );
}
