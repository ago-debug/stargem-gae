import { useQuery } from "@tanstack/react-query";
import type { CustomList, CustomListItem } from "@shared/schema";

/**
 * Hook to fetch a specific custom list and its items by its system name.
 * 
 * @param systemName The unique system name of the custom list (e.g. "nomi_corsi").
 * @returns The custom list data including its active sorted items.
 */
export function useCustomList(systemName: string) {
    return useQuery<(CustomList & { items: CustomListItem[] }) | null>({
        queryKey: [`/api/custom-lists/${systemName}`],
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    });
}

/**
 * Hook to easily fetch just the string values of a custom list for a dropdown.
 * 
 * @param systemName The unique system name of the custom list.
 * @returns Array of string values, or an empty array if loading/not found.
 */
export function useCustomListValues(systemName: string): string[] {
    const { data } = useCustomList(systemName);

    if (!data || !data.items) {
        return [];
    }

    return data.items
        .filter(item => item.active !== false)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(item => item.value);
}
