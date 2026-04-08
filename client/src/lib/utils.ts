import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseStatusTags = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val !== "string") return [];
  try {
    let parsed = JSON.parse(val);
    // Gestisce doppia serializzazione
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function formatSeasonName(name?: string): string {
  if (!name) return "";
  // Transforms "Stagione 2025/2026" into "Stagione 25-26" or "2025/2026" into "25-26"
  return name.replace(/20(\d{2})\/20(\d{2})/, "$1-$2");
}

export function getSeasonLabel(s: any, seasonsArray?: any[]): string {
  if (!s || !s.name) return "";
  const shortName = formatSeasonName(s.name).replace(/Stagione\s*/i, "").trim();
  
  if (s.active) {
    return `${shortName} (Stagione Attuale)`;
  }
  
  if (seasonsArray && seasonsArray.length > 0) {
    const activeSeason = seasonsArray.find(x => x.active) || seasonsArray[0];
    if (activeSeason) {
      if (new Date(s.startDate) > new Date(activeSeason.startDate)) {
        return `${shortName} (Stagione Successiva)`;
      } else if (new Date(s.startDate) < new Date(activeSeason.startDate)) {
        return `${shortName} (Stagione Precedente)`;
      }
    }
  }
  
  return `Stagione ${shortName}`;
}
