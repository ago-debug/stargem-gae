import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface CheckoutItem {
  type: "corso" | "carnet" | "affitto" | "lezione_spot";
  category: string;
  courseCount?: number;
  walletTypeId?: number;
  quantity: number;
  groupSize?: number;
  locationType?: string;
}

export function useCheckoutCalculator() {
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [includeMembership, setIncludeMembership] = useState(false);

  const calculation = useQuery({
    queryKey: ["checkout-calculate", items, promoCode, includeMembership],
    queryFn: () => fetch("/api/checkout/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, promoCode, includeMembership })
    }).then(r => r.json()),
    enabled: items.length > 0
  });

  return {
    items, setItems,
    promoCode, setPromoCode,
    includeMembership, setIncludeMembership,
    result: calculation.data,
    isLoading: calculation.isLoading
  };
}
