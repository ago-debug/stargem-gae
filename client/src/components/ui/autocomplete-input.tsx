import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import type { Member } from "@shared/schema";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onMemberSelect?: (member: Member) => void;
  members: Member[];
  field: "firstName" | "lastName" | "fiscalCode" | "phone" | "mobile" | "email";
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  onMemberSelect,
  members,
  field,
  placeholder,
  className,
  "data-testid": testId,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredMembers = value.length >= 3
    ? members.filter(member => {
        const fieldValue = member[field];
        if (!fieldValue) return false;
        return fieldValue.toLowerCase().includes(value.toLowerCase());
      }).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (member: Member) => {
    if (onMemberSelect) {
      onMemberSelect(member);
    } else {
      const fieldValue = member[field];
      if (fieldValue) {
        onChange(fieldValue);
      }
    }
    setIsOpen(false);
  };

  const getDisplayText = (member: Member) => {
    return `${member.lastName} ${member.firstName}`;
  };

  const getFieldValue = (member: Member) => {
    return member[field] || "";
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
        data-testid={testId}
      />

      {isOpen && filteredMembers.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {filteredMembers.map((member) => (
              <li
                key={member.id}
                onClick={() => handleSelect(member)}
                className="px-3 py-2 cursor-pointer hover-elevate text-sm"
                data-testid={`autocomplete-option-${member.id}`}
              >
                <div className="font-medium">{getDisplayText(member)}</div>
                <div className="text-xs text-muted-foreground">
                  {getFieldValue(member)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
