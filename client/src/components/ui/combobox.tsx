import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
}

export function Combobox({
  options = [],
  value,
  onValueChange,
  placeholder = "Seleziona un'opzione...",
  emptyText = "Nessun risultato trovato.",
  name,
  className,
  required
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  // Internal state fallback if not controlled
  const [internalValue, setInternalValue] = React.useState(value || "")

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
      <Popover open={open} onOpenChange={setOpen}>
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
            <CommandInput placeholder="Cerca digitando..." />
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
