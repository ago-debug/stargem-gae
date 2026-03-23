import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  name?: string; // For form integration
  className?: string;
  required?: boolean;
  onQuickAdd?: (value: string) => void;
  isQuickAddPending?: boolean;
}

export function Combobox({
  options = [],
  value,
  onValueChange,
  placeholder = "Seleziona un'opzione...",
  emptyText = "Nessun risultato trovato.",
  name,
  className,
  required,
  onQuickAdd,
  isQuickAddPending
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  // Internal state fallback if not controlled
  const [internalValue, setInternalValue] = React.useState(value || "")
  const [searchValue, setSearchValue] = React.useState("")

  const currentValue = value !== undefined ? value : internalValue;

  const handleSelect = (currentVal: string) => {
    const newVal = currentVal === currentValue ? "" : currentVal;
    setInternalValue(newVal);
    onValueChange?.(newVal);
    setOpen(false);
  }

  // Pre-calculate label to show
  const selectedLabel = options.find((opt) => opt.value === currentValue)?.label;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", !currentValue && "text-muted-foreground", className)}
          >
            <span className="truncate flex-1 text-left">
              {currentValue ? selectedLabel || currentValue : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Cerca digitando..." value={searchValue} onValueChange={setSearchValue} />
            <CommandList className="max-h-[250px] overflow-y-auto">
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentValue === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                
                {onQuickAdd && searchValue && !options.some(o => o.label.toLowerCase() === searchValue.trim().toLowerCase()) && (
                  <CommandItem 
                    key="quick-add-new-auto" 
                    onSelect={() => { 
                      onQuickAdd(searchValue.trim()); 
                      setSearchValue(""); 
                    }}
                    className="text-amber-700 bg-amber-50 cursor-pointer border-t font-semibold mt-1"
                    disabled={isQuickAddPending}
                  >
                    <Plus className="mr-2 h-4 w-4" /> 
                    {isQuickAddPending ? "Avvio Creazione..." : `Crea nuova voce: "${searchValue.trim()}"`}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {/* Hidden input to support native FormData submissions */}
      {name && (
        <input 
          type="hidden" 
          name={name} 
          value={currentValue} 
          required={required && !currentValue}
        />
      )}
    </>
  )
}
