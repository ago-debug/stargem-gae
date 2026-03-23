import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
        .map(item => item.value)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/**
 * Hook to quickly add a new value to a specific custom list by system name.
 */
export function useQuickAddCustomList(systemName: string) {
    const queryClient = useQueryClient();
    const { data: list } = useCustomList(systemName);

    return useMutation({
        mutationFn: async (value: string) => {
            if (!list?.id) throw new Error("List not loaded yet");
            const maxOrder = list.items?.reduce((max, i) => Math.max(max, i.sortOrder || 0), 0) || 0;
            // Eseguiamo la post direttamente al core API
            const res = await apiRequest("POST", `/api/custom-lists/${list.id}/items`, {
                value,
                sortOrder: maxOrder + 1,
                active: true
            });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/custom-lists/${systemName}`] });
            queryClient.invalidateQueries({ queryKey: ["/api/custom-lists"] });
        }
    });
}
