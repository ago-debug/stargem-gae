import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, User, Loader2 } from "lucide-react";
import type { Member } from "@shared/schema";

interface MemberSearchProps {
  members?: Member[];
  onSelect: (member: Member) => void;
  placeholder?: string;
  useServerSearch?: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function MemberSearch({ members = [], onSelect, placeholder = "Cerca partecipante (min 3 caratteri)...", useServerSearch = false }: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [serverResults, setServerResults] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Server-side search effect
  useEffect(() => {
    if (!useServerSearch || debouncedQuery.length < 3) {
      setServerResults([]);
      return;
    }
    
    const searchServer = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", pageSize: "10", search: debouncedQuery });
        const res = await fetch(`/api/members?${params}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setServerResults(data.members || []);
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    searchServer();
  }, [debouncedQuery, useServerSearch]);

  const filteredMembers = useServerSearch 
    ? serverResults 
    : (query.length >= 3
      ? members.filter(member => {
          const searchLower = query.toLowerCase();
          const searchableFields = [
            member.firstName,
            member.lastName,
            member.fiscalCode,
            member.email,
            member.phone,
            member.mobile,
            member.cardNumber,
            (member as any).address,
            member.placeOfBirth,
          ];
          return searchableFields.some(field => 
            field?.toLowerCase().includes(searchLower)
          );
        }).slice(0, 10)
      : []);

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
    onSelect(member);
    setQuery("");
    setIsOpen(false);
  };

  const getDisplayInfo = (member: Member) => {
    const parts = [];
    if (member.fiscalCode) parts.push(member.fiscalCode);
    if (member.email) parts.push(member.email);
    if (member.mobile) parts.push(member.mobile);
    return parts.join(" • ");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10"
          data-testid="input-member-search"
        />
      </div>

      {isOpen && query.length >= 3 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-80 overflow-auto">
          {filteredMembers.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Nessun risultato trovato
            </div>
          ) : (
            <ul className="py-1">
              {filteredMembers.map((member) => (
                <li
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="px-3 py-2 cursor-pointer hover-elevate flex items-start gap-3"
                  data-testid={`search-result-member-${member.id}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {member.lastName} {member.firstName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getDisplayInfo(member)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isOpen && query.length > 0 && query.length < 3 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            Digita almeno 3 caratteri per cercare
          </p>
        </div>
      )}
    </div>
  );
}
