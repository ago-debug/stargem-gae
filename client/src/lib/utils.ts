import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseStatusTags(tags: any): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function formatSeasonName(name?: string): string {
  if (!name) return "";
  // Transforms "Stagione 2025/2026" into "Stagione 25-26" or "2025/2026" into "25-26"
  return name.replace(/20(\d{2})\/20(\d{2})/, "$1-$2");
}
