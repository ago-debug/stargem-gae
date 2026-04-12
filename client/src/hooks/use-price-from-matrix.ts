import { useQuery } from "@tanstack/react-query";

interface PriceSuggestParams {
  category: string;
  courseCount?: number;
  seasonId?: number | "active";
  groupSize?: number;
  locationType?: string;
  enabled?: boolean;
}

interface PriceSuggestion {
  basePrice: number;
  finalPrice: number;
  appliedRules: string[];
  monthIndex: number;
  note: string;
  isLoading: boolean;
}

export function usePriceFromMatrix(
  params: PriceSuggestParams
): PriceSuggestion {
  const query = useQuery({
    queryKey: ["price-suggest", params],
    queryFn: () => {
      const sp = new URLSearchParams({
        category: params.category || "",
        courseCount: String(params.courseCount ?? 1),
        seasonId: String(params.seasonId ?? "active"),
        groupSize: String(params.groupSize ?? 1),
        locationType: params.locationType ?? "in_sede"
      });
      return fetch(`/api/price-matrix/suggest?${sp.toString()}`).then(r => r.json());
    },
    enabled: params.enabled !== false && !!params.category,
    staleTime: 5 * 60 * 1000  // cache 5 minuti
  });

  return {
    basePrice: query.data?.basePrice ?? 0,
    finalPrice: query.data?.finalPrice ?? 0,
    appliedRules: query.data?.appliedRules ?? [],
    monthIndex: query.data?.monthIndex ?? 0,
    note: query.data?.note ?? "",
    isLoading: query.isLoading
  };
}
